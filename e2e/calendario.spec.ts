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

  test('la vista de mes empieza la semana en lunes, no en domingo', async ({ page, testUser }) => {
    await crearCuaderno(page, testUser)
    await irASeccion(page, 'Calendario')

    await expect(page.locator('.rbc-header').first()).toHaveText('lu')
  })

  test('crear una semana nueva la precarga con la asignatura del horario vigente esa semana', async ({ page, testUser }) => {
    await crearCuaderno(page, testUser)

    // Horario docente para el lunes 7 a viernes 11 de septiembre de 2026 —
    // dentro del curso escolar navegable (Septiembre-Julio, agosto queda
    // fuera, ver MESES en constants.ts).
    await page.getByRole('button', { name: '+ Nuevo horario' }).click()
    await expect(page.getByRole('heading', { name: 'Nuevo horario' })).toBeVisible()
    await page.getByPlaceholder('Ej: Horario 1º ESO A').fill('Horario de Prueba E2E')
    const fechas = page.locator('input[type="date"]')
    await fechas.first().fill('2026-09-07')
    await fechas.nth(1).fill('2026-09-11')
    await page.getByRole('button', { name: 'Crear' }).click()
    await expect(page.getByRole('heading', { name: 'Nuevo horario' })).not.toBeVisible()

    await page.getByText('Septiembre', { exact: true }).click()
    await page.getByText('Del 7 al 11 de septiembre').click()
    await expect(page.getByRole('heading', { name: 'Horario de Prueba E2E' }).first()).toBeVisible()

    const primeraFila = page.locator('table tbody tr').first()
    const celdaLunes = primeraFila.locator('td').nth(1)
    await celdaLunes.click()
    await expect(page.getByRole('heading', { name: 'Editar celda' })).toBeVisible()
    await page.locator('select').first().selectOption({ label: 'Lengua' })
    await page.getByRole('button', { name: 'Guardar', exact: true }).click()
    await expect(celdaLunes).toContainText('Lengua')

    const botonGuardarCambios = page.getByRole('button', { name: 'Guardar cambios' })
    await expect(botonGuardarCambios).toBeEnabled()
    await botonGuardarCambios.click()
    await expect(botonGuardarCambios).toBeDisabled()

    // Ir a Calendario, avanzar de agosto (mes actual en la fecha del sistema
    // de pruebas) a septiembre, y crear una semana nueva para el día 7. El
    // número del día en sí solo hace drill-down (deshabilitado en esta app),
    // así que hay que pulsar más abajo en la celda para disparar la
    // selección de slot real (onSelectSlot).
    await irASeccion(page, 'Calendario')
    await page.getByRole('button', { name: '▶' }).click()
    const celdaDia7 = page.locator('.rbc-date-cell', { hasText: /^0?7$/ })
    const box = await celdaDia7.boundingBox()
    if (!box) throw new Error('No se encontró la celda del día 7 en el calendario')
    await page.mouse.click(box.x + box.width / 2, box.y + box.height + 25)

    await expect(page.getByRole('heading', { name: 'Nueva Semana' })).toBeVisible()
    await expect(page.getByText('Precargada desde el horario "Horario de Prueba E2E"')).toBeVisible()

    const primerInputLunes = page.locator('table tbody tr').first().locator('td').nth(1).locator('input')
    await expect(primerInputLunes).toHaveValue('Lengua')
  })
})
