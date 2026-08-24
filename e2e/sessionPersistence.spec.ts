import { test, expect } from './fixtures'
import { crearCuaderno } from './helpers'

// La sesión de Supabase vive en localStorage (persistSession: true, ver
// src/lib/supabaseClient.ts) bajo una clave (`sb-<host>-auth-token`) que hay
// que replicar exactamente porque el cliente de Docenza está compuesto a
// mano (Auth+Postgrest+Functions por separado, no `createClient()` — ver
// "CLIENTE SUPABASE MÍNIMO..." en CLAUDE.md) — un error ahí dejaría
// "desconectadas" a las cuentas ya iniciadas sin ningún aviso. Los demás
// specs ya verifican esto de forma indirecta con `page.reload()` (varios
// tests recargan tras iniciar sesión y esperan seguir en la app, no en el
// login), pero un `reload()` reutiliza el mismo contexto de navegador — este
// test simula de verdad "cerrar el navegador y abrir uno nuevo más tarde":
// guarda el storageState y lo carga en un `BrowserContext` completamente
// nuevo, más fiel a lo que pregunta el usuario que un simple reload.
test.describe('Persistencia de sesión', () => {
  test('la sesión sobrevive a cerrar el navegador y abrir uno nuevo, no solo a recargar la página', async ({
    page,
    context,
    browser,
    testUser,
  }) => {
    await crearCuaderno(page, testUser)

    const storageState = await context.storageState()
    const contextNuevo = await browser.newContext({ storageState })
    const pageNueva = await contextNuevo.newPage()

    try {
      await pageNueva.goto('/')
      // Directo a la app ya autenticada — nunca pasa por AuthScreen.
      await expect(pageNueva.getByRole('heading', { name: 'Horarios', level: 1 })).toBeVisible()
      await expect(pageNueva.getByPlaceholder('tu@email.com')).not.toBeVisible()
    } finally {
      await contextNuevo.close()
    }
  })
})
