import { test, expect } from '@playwright/test'
import { crearCuaderno } from './helpers'

test.describe('Horarios', () => {
  test('crear un horario, asignar una asignatura a una celda y que persista tras recargar', async ({ page }) => {
    await crearCuaderno(page)

    // Crear un horario sin fechas (así aparece siempre en "sin periodo
    // asignado", sin depender de en qué mes del curso escolar caiga "hoy").
    await page.getByRole('button', { name: '+ Nuevo horario' }).click()
    await expect(page.getByRole('heading', { name: 'Nuevo horario' })).toBeVisible()

    await page.getByPlaceholder('Ej: Horario 1º ESO A').fill('Horario de Prueba E2E')

    const fechas = page.locator('input[type="date"]')
    await fechas.first().fill('')
    await fechas.nth(1).fill('')

    await page.getByRole('button', { name: 'Crear' }).click()
    await expect(page.getByRole('heading', { name: 'Nuevo horario' })).not.toBeVisible()

    // Entrar en "sin periodo asignado" para ver la tabla del horario recién creado.
    await page.getByText(/Ver 1 horario sin periodo asignado/).click()
    // El nombre del horario aparece dos veces (cabecera de la tarjeta y de la tabla).
    await expect(page.getByRole('heading', { name: 'Horario de Prueba E2E' }).first()).toBeVisible()

    // Editar la primera celda (lunes, primer periodo).
    const primeraFila = page.locator('table tbody tr').first()
    const celdaLunes = primeraFila.locator('td').nth(1)
    await celdaLunes.click()

    await expect(page.getByRole('heading', { name: 'Editar celda' })).toBeVisible()
    await page.locator('select').first().selectOption({ label: 'Lengua' })
    await page.getByRole('button', { name: 'Guardar', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Editar celda' })).not.toBeVisible()

    await expect(celdaLunes).toContainText('Lengua')

    // Guardar cambios en la tabla y verificar que persiste tras recargar.
    const botonGuardarCambios = page.getByRole('button', { name: 'Guardar cambios' })
    await expect(botonGuardarCambios).toBeEnabled()
    await botonGuardarCambios.click()
    await expect(botonGuardarCambios).toBeDisabled()

    await page.reload()
    await expect(page.getByRole('heading', { name: 'Horarios', level: 1 })).toBeVisible()
    await page.getByText(/Ver 1 horario sin periodo asignado/).click()
    await expect(page.locator('table tbody tr').first().locator('td').nth(1)).toContainText('Lengua')
  })
})
