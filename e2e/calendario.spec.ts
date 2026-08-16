import { test, expect } from './fixtures'
import { crearCuaderno, irASeccion } from './helpers'

test.describe('Calendario', () => {
  test('crear un evento y verlo en el calendario del mes actual', async ({ page, testUser }) => {
    await crearCuaderno(page, testUser)
    await irASeccion(page, 'Calendario')
    await expect(page.getByRole('heading', { name: 'Calendario Escolar' })).toBeVisible()

    await page.getByRole('button', { name: 'Nuevo evento' }).click()
    await expect(page.getByRole('heading', { name: 'Nuevo evento' })).toBeVisible()

    const titulo = 'Reunión de prueba E2E'
    await page.getByPlaceholder('Ej: Reunión con familias').fill(titulo)
    await page.getByRole('button', { name: 'Guardar' }).click()

    await expect(page.getByRole('heading', { name: 'Nuevo evento' })).not.toBeVisible()
    await expect(page.getByText(titulo)).toBeVisible()
  })

  test('un evento semanal recurrente se expande en varias ocurrencias', async ({ page, testUser }) => {
    await crearCuaderno(page, testUser)
    await irASeccion(page, 'Calendario')

    await page.getByRole('button', { name: 'Nuevo evento' }).click()
    await expect(page.getByRole('heading', { name: 'Nuevo evento' })).toBeVisible()

    const titulo = 'Tutoría semanal E2E'
    await page.getByPlaceholder('Ej: Reunión con familias').fill(titulo)

    // "Repetir" es el primer <select> del diálogo (el segundo es "Recordatorio").
    await page.locator('select').first().selectOption('semanal')

    const hasta = new Date()
    hasta.setDate(hasta.getDate() + 21)
    const hastaStr = hasta.toISOString().split('T')[0]
    // "Repetir hasta" es el segundo input de fecha del diálogo (el primero es "Fecha").
    await page.locator('input[type="date"]').nth(1).fill(hastaStr)

    await expect(page.getByText('Editar o eliminar este evento afecta a todas sus repeticiones')).toBeVisible()

    await page.getByRole('button', { name: 'Guardar' }).click()
    await expect(page.getByRole('heading', { name: 'Nuevo evento' })).not.toBeVisible()

    // La vista "Agenda" muestra los próximos 30 días desde hoy, así que las 4
    // ocurrencias semanales (día 0, 7, 14 y 21) caen siempre dentro, sin
    // depender de en qué día del mes se ejecute el test.
    await page.getByRole('button', { name: 'Agenda', exact: true }).click()
    await expect(page.getByText(titulo)).toHaveCount(4)
  })
})
