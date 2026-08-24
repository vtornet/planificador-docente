import { test, expect } from './fixtures'
import { crearCuaderno, irASeccion } from './helpers'

// La Edge Function real depende de Groq — se intercepta para no depender de
// una API externa en la suite E2E, igual que se hace con Stripe/Resend en
// otras partes del proyecto (no probadas end-to-end en Playwright).
async function mockearAsistente(page: import('@playwright/test').Page, respuesta: string) {
  await page.route('**/functions/v1/ai-assistant', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ respuesta }),
    })
  })
}

async function preguntarAlAsistente(page: import('@playwright/test').Page, respuesta: string) {
  await mockearAsistente(page, respuesta)
  await page.getByRole('button', { name: 'Abrir asistente de IA' }).click()
  await page.getByPlaceholder('Escribe tu pregunta…').fill('Dame una actividad')
  await page.keyboard.press('Enter')
  await expect(page.getByText(respuesta)).toBeVisible()
  await page.getByRole('button', { name: 'Exportar a un horario' }).click()
  await expect(page.getByRole('heading', { name: 'Exportar respuesta a un horario' })).toBeVisible()
}

test.describe('Asistente de IA', () => {
  test('exportar a una fecha y celda concretas no borra la asignatura de otra celda del mismo horario', async ({ page, testUser }) => {
    await crearCuaderno(page, testUser)

    // Horario de una sola semana (lunes 7 a viernes 11 de septiembre de 2026)
    // con "Lengua" en Lunes, primer periodo.
    await page.getByRole('button', { name: '+ Nuevo horario' }).click()
    await page.getByPlaceholder('Ej: Horario 1º ESO A').fill('Horario para exportar E2E')
    const fechas = page.locator('input[type="date"]')
    await fechas.first().fill('2026-09-07')
    await fechas.nth(1).fill('2026-09-11')
    await page.getByRole('button', { name: 'Crear' }).click()
    await expect(page.getByRole('heading', { name: 'Nuevo horario' })).not.toBeVisible()

    await page.getByText('Septiembre', { exact: true }).click()
    await page.getByText('Del 7 al 11 de septiembre').click()
    const celdaLunes = page.locator('table tbody tr').first().locator('td').nth(1)
    await celdaLunes.click()
    await page.locator('select').first().selectOption({ label: 'Lengua' })
    await page.getByRole('button', { name: 'Guardar', exact: true }).click()
    await page.getByRole('button', { name: 'Guardar cambios' }).click()
    await expect(celdaLunes).toContainText('Lengua')

    await preguntarAlAsistente(page, 'Actividad de Educación Física para el martes.')

    // Fecha = martes de esa misma semana (día distinto al que ya tiene
    // asignatura), y el primer periodo disponible de ese día.
    await page.locator('input[type="date"]').last().fill('2026-09-08')
    await expect(page.getByRole('heading', { name: 'Exportar respuesta a un horario' })).toBeVisible()
    await page.getByText(/^Periodo del Martes/).waitFor()
    await page.locator('button', { hasText: 'Sin asignar' }).first().click()
    await expect(page.getByText('Se guardará como nota de esa celda:')).toBeVisible()
    await page.getByRole('button', { name: 'Guardar en el horario' }).click()
    await expect(page.getByText('Guardado en el horario')).toBeVisible()

    await page.getByRole('button', { name: 'Cerrar asistente' }).first().click()

    // La celda del lunes conserva "Lengua" intacta, sin nota.
    await expect(celdaLunes).toContainText('Lengua')
    await expect(celdaLunes).not.toContainText('Actividad de Educación Física')

    // La celda del martes (primer periodo) tiene la nota nueva, sin asignatura.
    const celdaMartes = page.locator('table tbody tr').first().locator('td').nth(2)
    await expect(celdaMartes).toContainText('Actividad de Educación Física para el martes.')
  })

  test('horario de varias semanas: exportar "solo esta semana" no afecta a las demás semanas', async ({ page, testUser }) => {
    await crearCuaderno(page, testUser)

    // Horario de 3 semanas exactas (7-11, 14-18 y 21-25 de septiembre de 2026).
    await page.getByRole('button', { name: '+ Nuevo horario' }).click()
    await page.getByPlaceholder('Ej: Horario 1º ESO A').fill('Horario Trimestre Asistente E2E')
    const fechas = page.locator('input[type="date"]')
    await fechas.first().fill('2026-09-07')
    await fechas.nth(1).fill('2026-09-25')
    await page.getByRole('button', { name: 'Crear' }).click()
    await expect(page.getByRole('heading', { name: 'Nuevo horario' })).not.toBeVisible()

    await preguntarAlAsistente(page, 'Planificación de Educación Física, 3º de Primaria.')

    // 8 de septiembre de 2026 (martes) cae en la primera semana del horario.
    await page.locator('input[type="date"]').last().fill('2026-09-08')
    await page.getByText(/^Periodo del Martes/).waitFor()
    await page.locator('button', { hasText: 'Sin asignar' }).first().click()
    await page.getByRole('button', { name: 'Guardar en el horario' }).click()

    // El horario abarca más de una semana: debe preguntar el alcance.
    await expect(page.getByRole('heading', { name: '¿Guardar en todo el periodo o solo esta semana?' })).toBeVisible()
    await page.getByRole('button', { name: 'Solo esta semana' }).click()
    await expect(page.getByText('Guardado en el horario')).toBeVisible()
    await page.getByRole('button', { name: 'Cerrar asistente' }).first().click()

    // La semana del 7-11 (donde cae el 8 de septiembre) tiene la nota...
    await page.getByText('Septiembre', { exact: true }).click()
    await page.getByText('Del 7 al 11 de septiembre').click()
    const celdaMartesSemana1 = page.locator('table tbody tr').first().locator('td').nth(2)
    await expect(celdaMartesSemana1).toContainText('Planificación de Educación Física, 3º de Primaria.')

    // ...pero la semana siguiente (14-18) no se ha visto afectada.
    await page.getByRole('button', { name: 'Volver a Septiembre' }).click()
    await page.getByText('Del 14 al 18 de septiembre').click()
    const celdaMartesSemana2 = page.locator('table tbody tr').first().locator('td').nth(2)
    await expect(celdaMartesSemana2).not.toContainText('Planificación de Educación Física')
  })
})

// V2 (Agosto 2026): historial persistente por módulo (localStorage) y
// contexto opcional con lo que la docente está editando (useEditorContextStore).
test.describe('Asistente de IA (V2)', () => {
  test('el historial de conversación persiste entre cierres del chat, y "Nueva conversación" lo vacía', async ({
    page,
    testUser,
  }) => {
    await crearCuaderno(page, testUser)
    await mockearAsistente(page, 'Respuesta de prueba para persistencia.')
    await page.getByRole('button', { name: 'Abrir asistente de IA' }).click()
    await page.getByPlaceholder('Escribe tu pregunta…').fill('Dame una actividad')
    await page.keyboard.press('Enter')
    await expect(page.getByText('Respuesta de prueba para persistencia.')).toBeVisible()

    // Cerrar y reabrir el chat: el mensaje sigue ahí (cargado de localStorage).
    await page.getByRole('button', { name: 'Cerrar asistente' }).first().click()
    await page.getByRole('button', { name: 'Abrir asistente de IA' }).click()
    await expect(page.getByText('Respuesta de prueba para persistencia.')).toBeVisible()

    // "Nueva conversación" la vacía, y sigue vacía tras cerrar y reabrir.
    await page.getByRole('button', { name: 'Nueva conversación' }).click()
    await expect(page.getByText('Respuesta de prueba para persistencia.')).not.toBeVisible()
    await page.getByRole('button', { name: 'Cerrar asistente' }).first().click()
    await page.getByRole('button', { name: 'Abrir asistente de IA' }).click()
    await expect(page.getByText('Respuesta de prueba para persistencia.')).not.toBeVisible()
  })

  test('cada módulo tiene su propio hilo: cambiar de sección no mezcla las conversaciones', async ({ page, testUser }) => {
    await crearCuaderno(page, testUser)

    await mockearAsistente(page, 'Respuesta sobre horarios.')
    await page.getByRole('button', { name: 'Abrir asistente de IA' }).click()
    await page.getByPlaceholder('Escribe tu pregunta…').fill('Pregunta de horarios')
    await page.keyboard.press('Enter')
    await expect(page.getByText('Respuesta sobre horarios.')).toBeVisible()
    await page.getByRole('button', { name: 'Cerrar asistente' }).first().click()

    await irASeccion(page, 'Notas')
    await page.getByRole('button', { name: 'Abrir asistente de IA' }).click()
    // Módulo distinto (Notas): no se ve la conversación de Horarios.
    await expect(page.getByText('Respuesta sobre horarios.')).not.toBeVisible()
    await expect(page.getByText('Pregúntame lo que necesites')).toBeVisible()
  })

  test('al editar una nota, el asistente ofrece incluir su contenido como contexto', async ({ page, testUser }) => {
    await crearCuaderno(page, testUser)
    await irASeccion(page, 'Notas')

    await page.getByRole('button', { name: 'Crear nota' }).click()
    await page.getByPlaceholder('Ej: Proyecto de fin de curso').fill('Reunión de padres')
    await page.locator('.ProseMirror').click()
    await page.keyboard.type('Recordar traer los boletines de notas el jueves.')
    // El editor vive dentro de un Dialog modal (bloquea el resto de la app,
    // incluido el botón del asistente) — se cierra sin guardar; el contexto
    // publicado sobrevive al cierre a propósito (ver useEditorContextStore).
    await page.getByRole('button', { name: 'Cancelar' }).click()

    let contextoRecibido: string | undefined
    await page.route('**/functions/v1/ai-assistant', async (route) => {
      contextoRecibido = route.request().postDataJSON()?.contexto
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ respuesta: 'OK' }) })
    })

    await page.getByRole('button', { name: 'Abrir asistente de IA' }).click()
    const checkbox = page.getByRole('checkbox', { name: /Incluir lo último que has editado/ })
    await expect(checkbox).toBeVisible()
    await expect(page.getByText('Reunión de padres')).toBeVisible()

    // Sin marcar la casilla, no se manda contexto.
    await page.getByPlaceholder('Escribe tu pregunta…').fill('Primera pregunta')
    await page.keyboard.press('Enter')
    await expect(page.getByText('OK', { exact: true })).toBeVisible()
    expect(contextoRecibido).toBeUndefined()

    // Marcada, sí se manda el contenido real de la nota.
    await checkbox.check()
    await page.getByPlaceholder('Escribe tu pregunta…').fill('Segunda pregunta')
    await page.keyboard.press('Enter')
    await expect(page.getByText('OK', { exact: true }).last()).toBeVisible()
    expect(contextoRecibido).toContain('boletines de notas')
  })
})
