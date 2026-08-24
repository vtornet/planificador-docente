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
    await expect(page.getByText('Vinculada al horario "Horario de Prueba E2E"')).toBeVisible()

    const primeraCeldaLunes = page.locator('table tbody tr').first().locator('td').nth(1)
    await expect(primeraCeldaLunes).toContainText('Lengua')
  })
})

// Sincronización Planificación ↔ Horario (24-08-2026): cuando hay un horario
// vigente esa semana, la nota que se escribe en el Planificador se guarda en
// la celda del horario (fuente única, ver "PLANIFICACIÓN ↔ HORARIO" en
// CLAUDE.md) — y viceversa, un cambio hecho directamente en Horarios se ve
// reflejado al reabrir esa semana en el Planificador.
test.describe('Planificación ↔ Horario', () => {
  test('la nota escrita en el Planificador aparece en el Horario, y un cambio en el Horario aparece en el Planificador', async ({
    page,
    testUser,
  }) => {
    await crearCuaderno(page, testUser)

    // Horario de una sola semana exacta (7-11 de septiembre de 2026): sin
    // varias semanas de por medio, no hay que resolver la pregunta de alcance.
    await page.getByRole('button', { name: '+ Nuevo horario' }).click()
    await page.getByPlaceholder('Ej: Horario 1º ESO A').fill('Horario Sync E2E')
    const fechas = page.locator('input[type="date"]')
    await fechas.first().fill('2026-09-07')
    await fechas.nth(1).fill('2026-09-11')
    await page.getByRole('button', { name: 'Crear' }).click()
    await expect(page.getByRole('heading', { name: 'Nuevo horario' })).not.toBeVisible()

    await page.getByText('Septiembre', { exact: true }).click()
    await page.getByText('Del 7 al 11 de septiembre').click()
    const celdaLunesHorario = page.locator('table tbody tr').first().locator('td').nth(1)
    await celdaLunesHorario.click()
    await page.locator('select').first().selectOption({ label: 'Lengua' })
    await page.getByRole('button', { name: 'Guardar', exact: true }).click()
    await page.getByRole('button', { name: 'Guardar cambios' }).click()
    await expect(celdaLunesHorario).toContainText('Lengua')

    // Crear la semana de Planificación para esa misma semana y escribir una
    // nota en la celda del Lunes (primer periodo, la misma que ya tiene
    // "Lengua" como asignatura en el Horario).
    await irASeccion(page, 'Calendario')
    await page.getByRole('button', { name: '▶' }).click()
    const celdaDia7 = page.locator('.rbc-date-cell', { hasText: /^0?7$/ })
    const boxDia7 = await celdaDia7.boundingBox()
    if (!boxDia7) throw new Error('No se encontró la celda del día 7 en el calendario')
    await page.mouse.click(boxDia7.x + boxDia7.width / 2, boxDia7.y + boxDia7.height + 25)
    await expect(page.getByRole('heading', { name: 'Nueva Semana' })).toBeVisible()

    const celdaLunesPlanificador = page.locator('table tbody tr').first().locator('td').nth(1)
    await expect(celdaLunesPlanificador).toContainText('Lengua')
    await celdaLunesPlanificador.locator('textarea').fill('Ejercicios de repaso, página 12')
    await page.getByRole('button', { name: 'Guardar', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Nueva Semana' })).not.toBeVisible()

    // La nota debe verse ahora directamente en Horarios, sin tocar la
    // asignatura "Lengua" ya asignada.
    await irASeccion(page, 'Horarios')
    await page.getByText('Septiembre', { exact: true }).click()
    await page.getByText('Del 7 al 11 de septiembre').click()
    await expect(celdaLunesHorario).toContainText('Lengua')
    await expect(celdaLunesHorario).toContainText('Ejercicios de repaso, página 12')

    // Dirección inversa: cambiar la nota directamente desde Horarios (la celda
    // ya tiene contenido, así que se abre en modo Ver — hay que pulsar Editar).
    await celdaLunesHorario.click()
    await expect(page.getByRole('heading', { name: 'Lengua' })).toBeVisible()
    await page.getByRole('button', { name: 'Editar', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Editar celda' })).toBeVisible()
    await page.getByPlaceholder('Ej: Traer material de plástica...').fill('Cambiado desde Horarios')
    await page.getByRole('button', { name: 'Guardar', exact: true }).click()
    await page.getByRole('button', { name: 'Guardar cambios' }).click()
    await expect(celdaLunesHorario).toContainText('Cambiado desde Horarios')

    // ...y comprobar que se ve reflejado al reabrir esa semana en el Planificador.
    // (Calendario vuelve a arrancar en el mes actual al reentrar en la sección.)
    await irASeccion(page, 'Calendario')
    await page.getByRole('button', { name: '▶' }).click()
    await page.getByText('Semana 1', { exact: true }).click()
    await expect(page.getByRole('heading', { name: /^Semana \d+$/ })).toBeVisible()
    const celdaLunesVista = page.locator('table tbody tr').first().locator('td').nth(1)
    await expect(celdaLunesVista).toContainText('Lengua')
    await expect(celdaLunesVista.locator('textarea')).toHaveValue('Cambiado desde Horarios')
  })

  test('si el horario abarca varias semanas, guardar el Planificador pregunta el alcance', async ({ page, testUser }) => {
    await crearCuaderno(page, testUser)

    // Horario de 3 semanas exactas (7-11, 14-18 y 21-25 de septiembre de 2026).
    await page.getByRole('button', { name: '+ Nuevo horario' }).click()
    await page.getByPlaceholder('Ej: Horario 1º ESO A').fill('Horario Trimestre Planificación E2E')
    const fechas = page.locator('input[type="date"]')
    await fechas.first().fill('2026-09-07')
    await fechas.nth(1).fill('2026-09-25')
    await page.getByRole('button', { name: 'Crear' }).click()
    await expect(page.getByRole('heading', { name: 'Nuevo horario' })).not.toBeVisible()

    await page.getByText('Septiembre', { exact: true }).click()
    await page.getByText('Del 7 al 11 de septiembre').click()
    const celdaLunes = page.locator('table tbody tr').first().locator('td').nth(1)
    await celdaLunes.click()
    await page.locator('select').first().selectOption({ label: 'Matemáticas' })
    await page.getByRole('button', { name: 'Guardar', exact: true }).click()
    await page.getByRole('button', { name: 'Guardar cambios' }).click()
    // El horario abarca varias semanas: también aquí pregunta el alcance —
    // "Todo el periodo" para que las 3 semanas compartan la misma plantilla.
    await expect(page.getByRole('heading', { name: '¿Guardar todo el periodo o solo esta semana?' })).toBeVisible()
    await page.getByRole('button', { name: 'Todo el periodo' }).click()

    // Crear la semana de Planificación para la primera semana (7-11) y
    // guardar una nota — el horario abarca más de esa semana, así que debe
    // preguntar el alcance, igual que ya hace "Guardar cambios" en Horarios.
    await irASeccion(page, 'Calendario')
    await page.getByRole('button', { name: '▶' }).click()
    const celdaDia7 = page.locator('.rbc-date-cell', { hasText: /^0?7$/ })
    const boxDia7 = await celdaDia7.boundingBox()
    if (!boxDia7) throw new Error('No se encontró la celda del día 7 en el calendario')
    await page.mouse.click(boxDia7.x + boxDia7.width / 2, boxDia7.y + boxDia7.height + 25)
    await expect(page.getByRole('heading', { name: 'Nueva Semana' })).toBeVisible()

    const celdaLunesPlanificador = page.locator('table tbody tr').first().locator('td').nth(1)
    await celdaLunesPlanificador.locator('textarea').fill('Repaso para el examen')
    await page.getByRole('button', { name: 'Guardar', exact: true }).click()
    await expect(page.getByRole('heading', { name: '¿Guardar en todo el periodo o solo esta semana?' })).toBeVisible()
    await page.getByRole('button', { name: 'Solo esta semana' }).click()
    await expect(page.getByRole('heading', { name: 'Nueva Semana' })).not.toBeVisible()

    // La semana 1 (7-11) tiene la nota...
    await irASeccion(page, 'Horarios')
    await page.getByText('Septiembre', { exact: true }).click()
    await page.getByText('Del 7 al 11 de septiembre').click()
    const celdaLunesSemana1 = page.locator('table tbody tr').first().locator('td').nth(1)
    await expect(celdaLunesSemana1).toContainText('Matemáticas')
    await expect(celdaLunesSemana1).toContainText('Repaso para el examen')

    // ...pero la semana 2 (14-18), que compartía el mismo horario, no se ve afectada.
    await page.getByRole('button', { name: 'Volver a Septiembre' }).click()
    await page.getByText('Del 14 al 18 de septiembre').click()
    const celdaLunesSemana2 = page.locator('table tbody tr').first().locator('td').nth(1)
    await expect(celdaLunesSemana2).toContainText('Matemáticas')
    await expect(celdaLunesSemana2).not.toContainText('Repaso para el examen')
  })
})
