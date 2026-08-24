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

    // Los PDF del menú Exportar muestran una vista previa antes de descargar
    // (no el backup JSON, que sigue siendo descarga directa). Renderizada
    // con pdf.js a <canvas> (no un <iframe src="blob:...">: en móvil no hay
    // visor nativo de PDF fiable dentro de un iframe, la vista previa salía
    // en blanco — bug real reportado por el usuario) — basta con confirmar
    // que aparece al menos un <canvas> con contenido dibujado.
    await expect(page.getByRole('heading', { name: 'Vista previa' })).toBeVisible()
    const canvas = page.locator('canvas').first()
    await expect(canvas).toBeVisible()
    await expect
      .poll(async () => canvas.evaluate((el: HTMLCanvasElement) => el.width > 0 && el.height > 0))
      .toBe(true)

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
    await expect(page.locator('canvas').first()).toBeVisible()

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

  test.describe('vista previa en viewport móvil', () => {
    test.use({ viewport: { width: 390, height: 844 } })

    test('la vista previa se dibuja con contenido real, no en blanco', async ({ page, testUser }) => {
      // Playwright siempre corre sobre el motor de escritorio de Chromium
      // (que ya tenía visor de PDF nativo funcionando incluso con la versión
      // anterior basada en <iframe>), así que este test no puede reproducir
      // el bug real (específico de Safari iOS / Chrome Android) — pero sí
      // confirma que el cálculo del ancho responsive del <canvas> no rompe
      // en un viewport estrecho.
      await crearCuaderno(page, testUser)

      await page.getByRole('button', { name: 'Exportar' }).click()
      await page.getByRole('menuitem', { name: 'PDF completo' }).click()
      await expect(page.getByRole('heading', { name: 'Vista previa' })).toBeVisible()

      const canvas = page.locator('canvas').first()
      await expect(canvas).toBeVisible()

      // "En blanco" de verdad significa: sin dimensiones, o con toda la
      // superficie de un único color uniforme (ej. transparente/blanco sin
      // dibujar nada encima) — se comprueba que hay más de un color distinto
      // entre los píxeles, no solo que el <canvas> exista en el DOM.
      const tieneContenidoReal = await canvas.evaluate((el: HTMLCanvasElement) => {
        if (el.width === 0 || el.height === 0) return false
        const ctx = el.getContext('2d')
        if (!ctx) return false
        const { data } = ctx.getImageData(0, 0, el.width, el.height)
        const primerPixel = `${data[0]},${data[1]},${data[2]},${data[3]}`
        for (let i = 4; i < data.length; i += 4) {
          if (`${data[i]},${data[i + 1]},${data[i + 2]},${data[i + 3]}` !== primerPixel) return true
        }
        return false
      })
      expect(tieneContenidoReal).toBe(true)
    })
  })
})
