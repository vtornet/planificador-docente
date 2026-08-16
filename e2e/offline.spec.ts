import { test, expect } from './fixtures'
import { crearCuaderno, irASeccion } from './helpers'

test.describe('Offline (PWA)', () => {
  test('la app carga y funciona sin conexión tras la primera visita', async ({ page, context, testUser }) => {
    await crearCuaderno(page, testUser)

    // Esperar a que el Service Worker tome el control antes de desconectar,
    // y recargar una vez en línea para que sirva ya desde el precache.
    await page.evaluate(() => navigator.serviceWorker.ready)
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Horarios', level: 1 })).toBeVisible()

    await context.setOffline(true)
    await page.reload()

    // Timeout más generoso que el resto de la suite: al arrancar sin conexión,
    // la app intenta conciliar con Supabase antes de leer los datos locales
    // (ver App.tsx) y el fetch tarda unos segundos en fallar de verdad, no es
    // instantáneo. No bloquea la carga (falla en su propio try/catch), pero sí
    // la retrasa un poco.
    await expect(page.getByRole('heading', { name: 'Horarios', level: 1 })).toBeVisible({ timeout: 15000 })

    // Navegar a otra sección (chunk cargado de forma perezosa) también debe
    // funcionar offline, porque el Service Worker precachea todos los assets.
    await irASeccion(page, 'Notas')
    await expect(page.getByRole('heading', { name: 'Notas', level: 1 })).toBeVisible()

    await context.setOffline(false)
  })
})
