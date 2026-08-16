import { test, expect } from './fixtures'
import { crearCuaderno } from './helpers'

test.describe('Asistente de IA', () => {
  test('exportar una respuesta del asistente como nota de una celda de horario', async ({ page, testUser }) => {
    await crearCuaderno(page, testUser)

    // Horario con "Lengua" en Lunes, primer periodo, para comprobar que
    // exportar añade la nota sin borrar la asignatura ya asignada.
    await page.getByRole('button', { name: '+ Nuevo horario' }).click()
    await page.getByPlaceholder('Ej: Horario 1º ESO A').fill('Horario para exportar E2E')
    const fechas = page.locator('input[type="date"]')
    await fechas.first().fill('')
    await fechas.nth(1).fill('')
    await page.getByRole('button', { name: 'Crear' }).click()
    await expect(page.getByRole('heading', { name: 'Nuevo horario' })).not.toBeVisible()

    await page.getByText(/Ver 1 horario sin periodo asignado/).click()
    const celdaLunes = page.locator('table tbody tr').first().locator('td').nth(1)
    await celdaLunes.click()
    await page.locator('select').first().selectOption({ label: 'Lengua' })
    await page.getByRole('button', { name: 'Guardar', exact: true }).click()
    await page.getByRole('button', { name: 'Guardar cambios' }).click()
    await expect(celdaLunes).toContainText('Lengua')

    // La Edge Function real depende de Groq — se intercepta para no depender
    // de una API externa en la suite E2E, igual que se hace con Stripe/Resend
    // en otras partes del proyecto (no probadas end-to-end en Playwright).
    await page.route('**/functions/v1/ai-assistant', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ respuesta: 'Actividad de prueba generada por el asistente.' }),
      })
    })

    await page.getByRole('button', { name: 'Abrir asistente de IA' }).click()
    await page.getByPlaceholder('Escribe tu pregunta…').fill('Dame una actividad')
    await page.keyboard.press('Enter')
    await expect(page.getByText('Actividad de prueba generada por el asistente.')).toBeVisible()

    await page.getByRole('button', { name: 'Exportar a un horario' }).click()
    await expect(page.getByRole('heading', { name: 'Exportar respuesta a un horario' })).toBeVisible()

    // El diálogo se abre en un portal al final del <body>: su tabla es la
    // última en orden de documento (la de Horarios sigue montada detrás).
    const celdaDialogo = page.locator('table').last().locator('tbody tr').first().locator('td').nth(1)
    await celdaDialogo.click()
    await expect(page.getByText('Se guardará como nota de esa celda:')).toBeVisible()
    await page.getByRole('button', { name: 'Guardar en el horario' }).click()
    await expect(page.getByText('Guardado en el horario')).toBeVisible()

    await page.getByRole('button', { name: 'Cerrar asistente' }).first().click()
    await expect(celdaLunes).toContainText('Lengua')
    await expect(celdaLunes).toContainText('Actividad de prueba generada por el asistente.')
  })
})
