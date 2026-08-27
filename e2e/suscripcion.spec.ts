import { test, expect } from './fixtures'
import { crearCuaderno } from './helpers'
import { getSupabaseAdmin } from './supabaseAdmin'

// "Mi Suscripción" (24-08-2026): las Edge Functions de Stripe (checkout y
// portal de facturación) se interceptan, igual que en asistente.spec.ts —
// no depende de Stripe real, y evita que un click siga navegando fuera del
// dominio del test interceptando también el destino simulado.
async function mockearRedirecciones(page: import('@playwright/test').Page) {
  await page.route('**/functions/v1/smart-worker', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ url: 'https://checkout.stripe.com/mock-session' }),
    })
  })
  await page.route('**/functions/v1/create-portal-session', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ url: 'https://billing.stripe.com/mock-portal' }),
    })
  })
  await page.route('https://checkout.stripe.com/**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'text/html', body: '<html>Checkout simulado</html>' })
  })
  await page.route('https://billing.stripe.com/**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'text/html', body: '<html>Portal simulado</html>' })
  })
}

test.describe('Mi Suscripción', () => {
  test('cuenta en prueba gratuita: muestra el aviso de límite y "Suscribirme" lleva al checkout', async ({
    page,
    testUserTrial,
  }) => {
    await crearCuaderno(page, testUserTrial)
    await mockearRedirecciones(page)

    await page.getByRole('button', { name: 'Mi Suscripción' }).click()
    await expect(page.getByRole('heading', { name: 'Mi Suscripción' })).toBeVisible()
    await expect(page.getByText('Prueba gratuita')).toBeVisible()
    await expect(page.getByText(/Puedes crear 1 elemento por módulo/)).toBeVisible()

    await page.getByRole('button', { name: 'Suscribirme' }).click()
    await page.waitForURL('https://checkout.stripe.com/**')
  })

  test('cuenta con suscripción activa: muestra Premium y "Gestionar suscripción" lleva al portal', async ({
    page,
    testUser,
  }) => {
    await crearCuaderno(page, testUser)
    await mockearRedirecciones(page)

    await page.getByRole('button', { name: 'Mi Suscripción' }).click()
    await expect(page.getByRole('heading', { name: 'Mi Suscripción' })).toBeVisible()
    await expect(page.getByText('Premium — acceso completo')).toBeVisible()

    await page.getByRole('button', { name: 'Gestionar suscripción' }).click()
    await page.waitForURL('https://billing.stripe.com/**')
  })

  test('con fecha de renovación: distingue "se renueva" de "termina y no se renueva"', async ({
    page,
    testUser,
  }) => {
    const admin = getSupabaseAdmin()
    const fechaFutura = new Date()
    fechaFutura.setDate(fechaFutura.getDate() + 30)

    await admin
      .from('profiles')
      .update({ subscription_current_period_end: fechaFutura.toISOString(), cancel_at_period_end: false })
      .eq('id', testUser.id)

    await crearCuaderno(page, testUser)
    await page.getByRole('button', { name: 'Mi Suscripción' }).click()
    await expect(page.getByText(/Se renueva automáticamente el/)).toBeVisible()
    await page.getByRole('button', { name: 'Cerrar' }).click()

    // Programada para cancelarse: mismo periodo, pero cancel_at_period_end=true.
    await admin.from('profiles').update({ cancel_at_period_end: true }).eq('id', testUser.id)
    // refreshProfile solo se llama tras iniciar sesión / volver de Stripe —
    // recargar la página fuerza a leer el estado ya actualizado en Supabase.
    // Timeout ampliado (igual que el test de offline, ver CLAUDE.md): bajo
    // carga pesada (suite completa en paralelo) el reload + refreshProfile
    // puede tardar más que los 5s por defecto del reintento de Playwright.
    await page.reload()
    await page.getByRole('button', { name: 'Mi Suscripción' }).click()
    await expect(page.getByText(/finaliza el .* y no se renovará/)).toBeVisible({ timeout: 15000 })
  })
})
