import { test, expect } from './fixtures'
import { crearCuaderno } from './helpers'

// Cubre el arreglo del botón/gesto físico de "atrás" de Android, que antes
// cerraba la app entera en vez de navegar hacia atrás dentro de ella (la app
// no enganchaba el History API). `page.goBack()` dispara el mismo evento
// `popstate` que ese botón físico, así que sirve para probarlo de verdad.
test.describe('Botón atrás (History API)', () => {
  test('el botón atrás cierra un Dialog sin salir de la sección', async ({ page, testUser }) => {
    await crearCuaderno(page, testUser)

    await page.getByRole('button', { name: '+ Nuevo horario' }).click()
    await expect(page.getByRole('heading', { name: 'Nuevo horario' })).toBeVisible()

    await page.goBack()

    await expect(page.getByRole('heading', { name: 'Nuevo horario' })).not.toBeVisible()
    await expect(page.getByRole('heading', { name: 'Horarios', level: 1 })).toBeVisible()
  })

  test('el botón atrás sube un nivel en Horarios (meses > semanas > semana) sin saltarse pasos', async ({ page, testUser }) => {
    await crearCuaderno(page, testUser)

    // meses -> semanas
    await page.getByText('Septiembre', { exact: true }).click()
    await expect(page.getByRole('button', { name: 'Volver a meses' })).toBeVisible()

    // semanas -> semana
    await page.getByText(/^Del \d+ al \d+ de septiembre$/).first().click()
    await expect(page.getByRole('button', { name: /Volver a Septiembre/ })).toBeVisible()

    // atrás: semana -> semanas (no directo a meses)
    await page.goBack()
    await expect(page.getByRole('button', { name: 'Volver a meses' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Volver a Septiembre/ })).not.toBeVisible()

    // atrás: semanas -> meses
    await page.goBack()
    await expect(page.getByRole('button', { name: 'Volver a meses' })).not.toBeVisible()
    await expect(page.getByText('Septiembre', { exact: true })).toBeVisible()
  })

  test('el botón atrás sube directo a meses desde el breadcrumb "Horarios" tras un salto de varios niveles', async ({ page, testUser }) => {
    await crearCuaderno(page, testUser)

    await page.getByText('Septiembre', { exact: true }).click()
    await page.getByText(/^Del \d+ al \d+ de septiembre$/).first().click()
    await expect(page.getByRole('button', { name: /Volver a Septiembre/ })).toBeVisible()

    // El breadcrumb "Horarios" salta directo de 'semana' a 'meses' (2 niveles
    // a la vez): las 2 entradas de historial apiladas (una por nivel) deben
    // consumirse las dos, ni una de más ni una de menos. Acotado a <main>
    // porque el Sidebar de escritorio (dentro de su propio <nav>) también
    // tiene un botón "Horarios".
    await page.locator('main').getByRole('button', { name: 'Horarios', exact: true }).click()
    await expect(page.getByText('Septiembre', { exact: true })).toBeVisible()

    // Repetir el ciclo completo (entrar 2 niveles, saltar de vuelta con el
    // breadcrumb) demuestra que no queda ninguna entrada residual de la vez
    // anterior: si sobrara o faltara una, el segundo ciclo desincronizaría el
    // nivel mostrado al entrar de nuevo en la semana.
    await page.getByText('Septiembre', { exact: true }).click()
    await page.getByText(/^Del \d+ al \d+ de septiembre$/).first().click()
    await expect(page.getByRole('button', { name: /Volver a Septiembre/ })).toBeVisible()
    await page.goBack()
    await expect(page.getByRole('button', { name: 'Volver a meses' })).toBeVisible()
    await page.goBack()
    await expect(page.getByText('Septiembre', { exact: true })).toBeVisible()
  })

  test('cerrar un Dialog con el botón atrás no salta niveles en HorarioManager (regresión)', async ({ page, testUser }) => {
    await crearCuaderno(page, testUser)

    // Horario sin fechas: aparece en "sin periodo asignado".
    await page.getByRole('button', { name: '+ Nuevo horario' }).click()
    await page.getByPlaceholder('Ej: Horario 1º ESO A').fill('Horario Back E2E')
    const fechas = page.locator('input[type="date"]')
    await fechas.first().fill('')
    await fechas.nth(1).fill('')
    await page.getByRole('button', { name: 'Crear' }).click()
    await expect(page.getByRole('heading', { name: 'Nuevo horario' })).not.toBeVisible()

    await page.getByText(/Ver 1 horario sin periodo asignado/).click()
    await expect(page.getByRole('heading', { name: 'Horario Back E2E' }).first()).toBeVisible()

    const celdaLunes = page.locator('table tbody tr').first().locator('td').nth(1)
    await celdaLunes.click()
    await expect(page.getByRole('heading', { name: 'Editar celda' })).toBeVisible()

    // El bug original: esto cerraba el Dialog Y saltaba HorarioManager de
    // vuelta a "meses" a la vez, porque dos mecanismos de historial
    // independientes reaccionaban al mismo popstate.
    await page.goBack()

    await expect(page.getByRole('heading', { name: 'Editar celda' })).not.toBeVisible()
    await expect(page.getByRole('heading', { name: 'Horario Back E2E' }).first()).toBeVisible()
  })

  test('pasar de "Ver nota" a "Editar" no deja el editor cerrado (regresión de condición de carrera)', async ({ page, testUser }) => {
    await crearCuaderno(page, testUser)
    await page.locator('aside').getByRole('button', { name: 'Notas', exact: true }).click()

    await page.getByRole('button', { name: 'Crear nota' }).click()
    const titulo = 'Nota Back E2E'
    await page.getByPlaceholder('Ej: Proyecto de fin de curso').fill(titulo)
    await page.locator('.ProseMirror').click()
    await page.keyboard.type('Contenido de prueba.')
    await page.getByRole('button', { name: 'Guardar' }).click()
    await expect(page.getByText(titulo)).toBeVisible()

    await page.getByText(titulo).click()
    const botonEditar = page.getByRole('button', { name: 'Editar', exact: true })
    await expect(botonEditar).toBeVisible()

    // Cambia de "Ver" a "Editar" en el mismo clic: un Dialog se cierra
    // mientras otro se abre. Si el historial no agrupa ambos cambios, el
    // editor recién abierto se cierra solo (bug real encontrado y arreglado).
    await botonEditar.click()
    await expect(page.getByRole('heading', { name: 'Editar Nota' })).toBeVisible()
  })
})
