import { test, expect } from './fixtures'
import { crearCuaderno, irASeccion } from './helpers'

test.describe('Exportación', () => {
  test('la opción "Agenda" está deshabilitada sin eventos y exporta un PDF al crear uno', async ({ page, testUser }) => {
    await crearCuaderno(page, testUser)

    await page.getByRole('button', { name: 'Exportar' }).click()
    await expect(page.getByRole('menuitem', { name: 'Agenda (eventos)' })).toBeDisabled()
    await page.keyboard.press('Escape')

    await irASeccion(page, 'Calendario')
    await page.getByRole('button', { name: 'Nuevo evento' }).click()
    await page.getByPlaceholder('Ej: Reunión con familias').fill('Evento de prueba E2E')
    await page.getByRole('button', { name: 'Guardar' }).click()

    await page.getByRole('button', { name: 'Exportar' }).click()
    await page.getByRole('menuitem', { name: 'Agenda (eventos)' }).click()

    // Los PDF del menú Exportar muestran una vista previa antes de
    // descargar (no el backup JSON, que sigue siendo descarga directa). No
    // se inspecciona el contenido del iframe: un PDF vía blob: URL lo
    // renderiza el visor nativo del navegador, no un documento HTML normal
    // accesible por Playwright — basta con confirmar que el iframe apunta a
    // un blob: real.
    await expect(page.getByRole('heading', { name: 'Vista previa' })).toBeVisible()
    await expect(page.locator('iframe[title="Vista previa del PDF"]')).toHaveAttribute('src', /^blob:/)

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Descargar' }).click(),
    ])

    expect(download.suggestedFilename()).toMatch(/^agenda-.*\.pdf$/)
  })

  test('exportar el PDF completo del cuaderno muestra vista previa y descarga al confirmar', async ({ page, testUser }) => {
    await crearCuaderno(page, testUser)

    await page.getByRole('button', { name: 'Exportar' }).click()
    await page.getByRole('menuitem', { name: 'PDF completo' }).click()

    await expect(page.getByRole('heading', { name: 'Vista previa' })).toBeVisible()

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Descargar' }).click(),
    ])

    expect(download.suggestedFilename()).toMatch(/^docenza-completo-.*\.pdf$/)
  })

  test('cancelar la vista previa no descarga nada', async ({ page, testUser }) => {
    await crearCuaderno(page, testUser)

    await page.getByRole('button', { name: 'Exportar' }).click()
    await page.getByRole('menuitem', { name: 'PDF completo' }).click()
    await expect(page.getByRole('heading', { name: 'Vista previa' })).toBeVisible()

    let downloadFired = false
    page.once('download', () => {
      downloadFired = true
    })

    await page.getByRole('button', { name: 'Cancelar' }).click()
    await expect(page.getByRole('heading', { name: 'Vista previa' })).not.toBeVisible()

    // Da tiempo a que un download() tardío (si lo hubiera) se dispare antes
    // de comprobar que no ha pasado nada.
    await page.waitForTimeout(500)
    expect(downloadFired).toBe(false)
  })

  test('exportar el backup en JSON descarga un archivo', async ({ page, testUser }) => {
    await crearCuaderno(page, testUser)

    await page.getByRole('button', { name: 'Exportar' }).click()
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('menuitem', { name: 'Backup (JSON)' }).click(),
    ])

    expect(download.suggestedFilename()).toMatch(/^docenza-.*\.json$/)
  })
})
