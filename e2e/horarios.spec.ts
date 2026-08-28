import { test, expect } from './fixtures'
import { crearCuaderno } from './helpers'

test.describe('Horarios', () => {
  test('crear un horario, asignar una asignatura a una celda y que persista tras recargar', async ({ page, testUser }) => {
    await crearCuaderno(page, testUser)

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

  test('eliminar solo una semana de un horario de varias semanas no afecta a las demás', async ({ page, testUser }) => {
    await crearCuaderno(page, testUser)

    // Horario de 3 semanas exactas dentro de septiembre de 2026 (lunes a
    // viernes reales), para poder navegar Meses > Semanas sin depender de en
    // qué fecha se ejecute el test.
    await page.getByRole('button', { name: '+ Nuevo horario' }).click()
    await expect(page.getByRole('heading', { name: 'Nuevo horario' })).toBeVisible()

    await page.getByPlaceholder('Ej: Horario 1º ESO A').fill('Horario Trimestre E2E')
    const fechas = page.locator('input[type="date"]')
    await fechas.first().fill('2026-09-07')
    await fechas.nth(1).fill('2026-09-25')

    await page.getByRole('button', { name: 'Crear' }).click()
    await expect(page.getByRole('heading', { name: 'Nuevo horario' })).not.toBeVisible()

    // Entrar en la semana intermedia (14-18) — el horario la abarca junto con
    // la semana anterior y la posterior.
    await page.getByText('Septiembre', { exact: true }).click()
    await page.getByText('Del 14 al 18 de septiembre').click()
    await expect(page.getByRole('heading', { name: 'Horario Trimestre E2E' }).first()).toBeVisible()

    // Al abarcar más de esta semana, eliminar debe preguntar el alcance (igual
    // que ya pregunta "Guardar cambios").
    await page.getByRole('button', { name: 'Eliminar horario' }).click()
    await expect(page.getByRole('heading', { name: '¿Eliminar todo el periodo o solo esta semana?' })).toBeVisible()
    await page.getByRole('button', { name: 'Solo esta semana' }).click()

    // La semana intermedia se queda sin horario...
    await expect(page.getByText('No hay horario para esta semana')).toBeVisible()

    // ...pero la semana anterior y la posterior conservan el horario intacto.
    await page.getByRole('button', { name: 'Volver a Septiembre' }).click()
    await page.getByText('Del 7 al 11 de septiembre').click()
    await expect(page.getByRole('heading', { name: 'Horario Trimestre E2E' }).first()).toBeVisible()

    await page.getByRole('button', { name: 'Volver a Septiembre' }).click()
    await page.getByText('Del 21 al 25 de septiembre').click()
    await expect(page.getByRole('heading', { name: 'Horario Trimestre E2E' }).first()).toBeVisible()
  })

  test('el icono de descarga de un horario muestra vista previa y descarga solo ese horario', async ({ page, testUser }) => {
    await crearCuaderno(page, testUser)

    await page.getByRole('button', { name: '+ Nuevo horario' }).click()
    await page.getByPlaceholder('Ej: Horario 1º ESO A').fill('Horario Descarga E2E')
    const fechas = page.locator('input[type="date"]')
    await fechas.first().fill('')
    await fechas.nth(1).fill('')
    await page.getByRole('button', { name: 'Crear' }).click()
    await expect(page.getByRole('heading', { name: 'Nuevo horario' })).not.toBeVisible()

    await page.getByText(/Ver 1 horario sin periodo asignado/).click()
    await expect(page.getByRole('heading', { name: 'Horario Descarga E2E' }).first()).toBeVisible()

    await page.getByTitle('Descargar este horario en PDF').click()
    await expect(page.getByRole('heading', { name: 'Vista previa' })).toBeVisible()
    await expect(page.locator('canvas').first()).toBeVisible()

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Descargar', exact: true }).click(),
    ])
    expect(download.suggestedFilename()).toMatch(/^horario-.*\.pdf$/)
  })

  test('la etapa educativa del perfil elige la plantilla de intervalos por defecto al crear un horario', async ({ page, testUser }) => {
    // Cuaderno con etapa "Educación Primaria" desde el onboarding.
    await crearCuaderno(page, testUser, { etapaEducativa: 'Educación Primaria' })

    // Crear un horario sin tocar "Personalizar intervalos": debe usar la
    // plantilla de primaria (7 periodos + recreo = 8 filas), no la de
    // secundaria (6 + recreo = 7) que era el valor fijo anterior.
    await page.getByRole('button', { name: '+ Nuevo horario' }).click()
    await page.getByPlaceholder('Ej: Horario 1º ESO A').fill('Horario Primaria E2E')
    const fechas = page.locator('input[type="date"]')
    await fechas.first().fill('')
    await fechas.nth(1).fill('')
    await page.getByRole('button', { name: 'Crear' }).click()
    await expect(page.getByRole('heading', { name: 'Nuevo horario' })).not.toBeVisible()

    await page.getByText(/Ver 1 horario sin periodo asignado/).click()
    await expect(page.getByRole('heading', { name: 'Horario Primaria E2E' }).first()).toBeVisible()
    await expect(page.locator('table tbody tr')).toHaveCount(8)

    // Y al marcar "Personalizar intervalos" al crear otro, los campos vienen
    // sembrados con la plantilla de primaria (7 periodos), no con 6.
    await page.getByRole('button', { name: 'Volver a meses' }).click()
    await page.getByRole('button', { name: '+ Nuevo horario' }).click()
    await page.getByLabel('Personalizar intervalos horarios').check()
    await expect(page.getByText('Total: 8 periodos')).toBeVisible()
  })
})
