import { test, expect } from './fixtures'
import { iniciarSesion, crearCuaderno } from './helpers'

// Verifica en vivo el punto 4 de los riesgos abiertos: "elementos creados
// offline por encima del tope de prueba solo fallan en silencio
// (console.error) al sincronizar, sin aviso visible en la UI todavía".
//
// Para reproducir el rechazo real del trigger enforce_trial_limits hace
// falta una cuenta SIN suscripción (testUserTrial, no testUser — que la
// fixture marca activa a propósito para que otros tests no choquen con este
// límite) y un cuaderno con más de 1 elemento del mismo módulo. Un solo
// dispositivo no puede producir eso por sí solo (el guard local de
// useCuadernoStore ya bloquea un 2º horario en el mismo dispositivo) — se
// reproduce igual que en mergeCuaderno.spec.ts: dos dispositivos offline,
// cada uno crea 1 horario dentro de su propio límite local, y al fusionarse
// la suma supera el tope real.
test.describe('Aviso de sincronización bloqueada por el tope de prueba', () => {
  test('un cuaderno con más contenido del permitido durante la prueba muestra un aviso, no falla en silencio', async ({ page, context, browser, testUserTrial }) => {
    await crearCuaderno(page, testUserTrial, { centro: 'IES Tope de Prueba' })

    const contextB = await browser.newContext()
    const pageB = await contextB.newPage()
    await iniciarSesion(pageB, testUserTrial)
    await expect(pageB.getByRole('heading', { name: 'Horarios', level: 1 })).toBeVisible()

    await context.setOffline(true)
    await contextB.setOffline(true)

    // Dispositivo A (offline): crea un horario — dentro de su propio límite
    // local (0 horarios conocidos en este dispositivo).
    await page.getByRole('button', { name: '+ Nuevo horario' }).click()
    await page.getByPlaceholder('Ej: Horario 1º ESO A').fill('Horario A')
    const fechasA = page.locator('input[type="date"]')
    await fechasA.first().fill('')
    await fechasA.nth(1).fill('')
    await page.getByRole('button', { name: 'Crear' }).click()
    await expect(page.getByRole('heading', { name: 'Nuevo horario' })).not.toBeVisible()

    // Dispositivo B (offline): crea otro horario — también dentro de SU
    // propio límite local (tampoco conoce el de A todavía).
    await pageB.getByRole('button', { name: '+ Nuevo horario' }).click()
    await pageB.getByPlaceholder('Ej: Horario 1º ESO A').fill('Horario B')
    const fechasB = pageB.locator('input[type="date"]')
    await fechasB.first().fill('')
    await fechasB.nth(1).fill('')
    await pageB.getByRole('button', { name: 'Crear' }).click()
    await expect(pageB.getByRole('heading', { name: 'Nuevo horario' })).not.toBeVisible()

    // B recupera la conexión y sube su horario primero — un único horario,
    // todavía dentro del tope, sube sin problema.
    await contextB.setOffline(false)
    await pageB.reload()
    await expect(pageB.getByRole('heading', { name: 'Horarios', level: 1 })).toBeVisible()
    await expect(pageB.getByText(/Tienes más contenido del que permite la prueba gratuita/)).not.toBeVisible()

    // A recupera la conexión: su reconcile fusiona su horario local con el
    // de B ya subido — la suma (2) supera el tope de prueba (1), así que
    // Supabase rechaza la subida del cuaderno fusionado. Antes de este
    // arreglo, esto solo se veía en la consola del navegador; ahora debe
    // aparecer un aviso visible.
    await context.setOffline(false)
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Horarios', level: 1 })).toBeVisible()

    await expect(page.getByText(/Tienes más contenido del que permite la prueba gratuita/)).toBeVisible()

    // Los datos no se han perdido: siguen los dos horarios en este
    // dispositivo, solo que sin sincronizar entre sí.
    await expect(page.getByText(/Ver 2 horarios sin periodo asignado/)).toBeVisible()

    // El aviso lleva a suscribirse, no es un callejón sin salida.
    await page.getByRole('button', { name: 'Suscribirme' }).click()
    await expect(page.getByRole('heading', { name: /límite de la prueba/ })).toBeVisible()

    await contextB.close()
  })
})
