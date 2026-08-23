import { test, expect } from './fixtures'
import { crearCuaderno } from './helpers'
import { getSupabaseAdmin } from './supabaseAdmin'

// Verifica en vivo el punto 5: borrado de cuenta con autoservicio, contra la
// función Edge real (delete-account) desplegada en Supabase, no solo la UI.
test.describe('Eliminar cuenta', () => {
  test('escribir ELIMINAR y confirmar borra la cuenta de verdad y devuelve a la pantalla de login', async ({ page, testUser }) => {
    await crearCuaderno(page, testUser, { centro: 'IES Borrado de Cuenta' })

    await page.getByRole('button', { name: 'Perfil' }).click()
    await expect(page.getByRole('heading', { name: 'Perfil' })).toBeVisible()

    await page.getByRole('button', { name: 'Eliminar mi cuenta' }).click()
    await expect(page.getByRole('heading', { name: 'Eliminar cuenta' })).toBeVisible()

    // Acotado al propio diálogo: el enlace que lo abrió (dentro de Perfil,
    // que sigue montado detrás) comparte el mismo texto "Eliminar mi
    // cuenta" que el botón de confirmar, y ambos siguen en el DOM a la vez.
    const dialogoEliminar = page.locator('.fixed.inset-0').filter({ has: page.getByRole('heading', { name: 'Eliminar cuenta' }) })
    const botonConfirmar = dialogoEliminar.getByRole('button', { name: 'Eliminar mi cuenta', exact: true })
    const campoConfirmacion = dialogoEliminar.getByRole('textbox')

    // El botón de confirmar sigue deshabilitado hasta escribir la frase exacta.
    await expect(botonConfirmar).toBeDisabled()

    await campoConfirmacion.fill('borrar')
    await expect(botonConfirmar).toBeDisabled()
    await campoConfirmacion.fill('ELIMINAR')
    await expect(botonConfirmar).toBeEnabled()

    await botonConfirmar.click()

    // App.tsx redirige sola a la pantalla de login en cuanto useAuthStore.user
    // pasa a null — sin necesidad de recargar la página.
    await expect(page.getByPlaceholder('tu@email.com')).toBeVisible({ timeout: 15000 })

    // La cuenta se ha borrado de verdad en Supabase (Auth + cascada a
    // profiles/cuadernos), no solo en la UI local — comprobado con el
    // cliente admin, que salta RLS.
    const admin = getSupabaseAdmin()
    const { data: userData, error: userError } = await admin.auth.admin.getUserById(testUser.id)
    expect(userData?.user ?? null).toBeNull()
    expect(userError).not.toBeNull()

    const { data: cuadernos } = await admin.from('cuadernos').select('id').eq('user_id', testUser.id)
    expect(cuadernos).toHaveLength(0)
  })

  test('cancelar el diálogo no borra nada', async ({ page, testUser }) => {
    await crearCuaderno(page, testUser, { centro: 'IES No Borrar' })

    await page.getByRole('button', { name: 'Perfil' }).click()
    await page.getByRole('button', { name: 'Eliminar mi cuenta' }).click()
    await expect(page.getByRole('heading', { name: 'Eliminar cuenta' })).toBeVisible()

    // Acotado al propio diálogo: PerfilDialog (detrás) tiene su propio botón
    // "Cancelar" también en el DOM a la vez.
    const dialogoEliminar = page.locator('.fixed.inset-0').filter({ has: page.getByRole('heading', { name: 'Eliminar cuenta' }) })
    await dialogoEliminar.getByRole('button', { name: 'Cancelar' }).click()
    await expect(page.getByRole('heading', { name: 'Eliminar cuenta' })).not.toBeVisible()

    // Sigue con sesión iniciada y su cuaderno intacto.
    await expect(page.getByRole('heading', { name: 'Horarios', level: 1 })).toBeVisible()

    const admin = getSupabaseAdmin()
    const { data: userData } = await admin.auth.admin.getUserById(testUser.id)
    expect(userData?.user).not.toBeNull()
  })
})
