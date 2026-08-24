import { test, expect } from './fixtures'
import { crearCuaderno } from './helpers'

// Planificar en móvil (24-08-2026): el usuario reportó cuatro problemas
// reales, verificados uno a uno contra la app real antes de arreglarlos
// (ver "PLANIFICAR EN MÓVIL" en CLAUDE.md):
//   1) Un toque normal en el número del día cambiaba en silencio la vista
//      interna de react-big-calendar a "Día" (sin estilo propio en esta
//      app) — confirmado comparando las clases rbc-month-view/rbc-time-view
//      antes y después del toque.
//   2) Abrir un día sin eventos exigía mantener pulsado (long-press) en
//      pantallas táctiles — un toque normal no hacía nada.
//   3) Un día CON eventos apenas dejaba hueco "vacío" donde mantener
//      pulsado, bloqueando de hecho el acceso a ese día.
//   4) El calendario tenía una altura fija de 600px sin importar la
//      pantalla, con columnas de ~46px de ancho en móvil.
test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })

test.describe('Planificar en móvil', () => {
  test('el calendario ocupa más alto que una altura fija, y ya no hay botones de Semana/Día rotos', async ({
    page,
    testUser,
  }) => {
    await crearCuaderno(page, testUser)
    await page.getByRole('button', { name: 'Planificar', exact: true }).click()

    const calBox = await page.locator('.rbc-calendar').boundingBox()
    // Antes: 600px fijos. Ahora: min(85vh, 900px) — con 844px de viewport,
    // bastante más que 600.
    expect(calBox?.height ?? 0).toBeGreaterThan(650)

    // Semana/Día no tienen estilo propio en esta app — solo deben quedar
    // los botones de Mes y Agenda en la barra de vistas.
    const botonesVista = await page.locator('.rbc-btn-group').last().locator('button').allTextContents()
    expect(botonesVista).toEqual(['Mes', 'Agenda'])
  })

  test('tocar el número de un día abre ese día con un toque normal, sin cambiar a una vista rota', async ({
    page,
    testUser,
  }) => {
    await crearCuaderno(page, testUser)
    await page.getByRole('button', { name: 'Planificar', exact: true }).click()
    await page.getByRole('button', { name: '▶' }).click()

    const celdaDia8 = page.locator('.rbc-date-cell', { hasText: /^0?8$/ })
    const box = await celdaDia8.boundingBox()
    if (!box) throw new Error('No se encontró la celda del día 8')

    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2)

    await expect(page.getByRole('heading', { name: 'Nueva Semana' })).toBeVisible()
    // react-big-calendar no debe haber cambiado en silencio a su vista de
    // "Día" (sin estilo propio, confusa) — sigue en la de Mes.
    await expect(page.locator('.rbc-time-view')).toHaveCount(0)
    await expect(page.locator('.rbc-month-view')).toHaveCount(1)
  })

  test('tocar una zona vacía de un día con eventos también lo abre, sin mantener pulsado', async ({ page, testUser }) => {
    await crearCuaderno(page, testUser)
    await page.getByRole('button', { name: 'Planificar', exact: true }).click()
    await page.getByRole('button', { name: '▶' }).click()

    await page.getByRole('button', { name: 'Nuevo evento' }).click()
    await page.getByPlaceholder('Ej: Reunión con familias').fill('Evento móvil E2E')
    await page.locator('input[type="date"]').first().fill('2026-09-07')
    await page.getByRole('button', { name: 'Guardar' }).click()

    // Zona alta de la columna del día 7, lejos del chip del evento (que
    // queda pegado a la parte baja de la celda, junto al número).
    const dayBg7 = page.locator('.rbc-row-bg .rbc-day-bg').first()
    const box = await dayBg7.boundingBox()
    if (!box) throw new Error('No se encontró el fondo del día 7')

    await page.touchscreen.tap(box.x + box.width / 2, box.y + 5)

    await expect(page.getByRole('heading', { name: 'Nueva Semana' })).toBeVisible()
  })

  test('tocar el evento en sí sigue ofreciendo el selector de "ver evento"', async ({ page, testUser }) => {
    await crearCuaderno(page, testUser)
    await page.getByRole('button', { name: 'Planificar', exact: true }).click()
    await page.getByRole('button', { name: '▶' }).click()

    const titulo = 'Evento móvil E2E'
    await page.getByRole('button', { name: 'Nuevo evento' }).click()
    await page.getByPlaceholder('Ej: Reunión con familias').fill(titulo)
    await page.locator('input[type="date"]').first().fill('2026-09-07')
    await page.getByRole('button', { name: 'Guardar' }).click()

    const eventoChip = page.locator('.rbc-event', { hasText: titulo }).first()
    const box = await eventoChip.boundingBox()
    if (!box) throw new Error('No se encontró el chip del evento')

    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2)

    await expect(page.getByRole('heading', { name: titulo })).toBeVisible()
    await expect(page.getByText('¿Qué quieres ver?')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Ver evento' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Ver horario de esta semana' })).toBeVisible()
  })
})
