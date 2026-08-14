import { test, expect } from '@playwright/test'
import { crearCuaderno, irASeccion } from './helpers'

test.describe('Offline (PWA)', () => {
  test('la app carga y funciona sin conexión tras la primera visita', async ({ page, context }) => {
    await crearCuaderno(page)

    // Esperar a que el Service Worker tome el control antes de desconectar,
    // y recargar una vez en línea para que sirva ya desde el precache.
    await page.evaluate(() => navigator.serviceWorker.ready)
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Horarios', level: 1 })).toBeVisible()

    await context.setOffline(true)
    await page.reload()

    await expect(page.getByRole('heading', { name: 'Horarios', level: 1 })).toBeVisible()

    // Navegar a otra sección (chunk cargado de forma perezosa) también debe
    // funcionar offline, porque el Service Worker precachea todos los assets.
    await irASeccion(page, 'Notas')
    await expect(page.getByRole('heading', { name: 'Notas', level: 1 })).toBeVisible()

    await context.setOffline(false)
  })
})
