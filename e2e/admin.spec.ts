import { test, expect } from './fixtures'
import { crearCuaderno } from './helpers'
import { crearUsuarioPrueba, eliminarUsuarioPrueba } from './testUser'
import { getSupabaseAdmin } from './supabaseAdmin'

// Los tests de este fichero (salvo el de "usuario normal no ve el panel")
// necesitan:
//   1. La migración supabase/migrations/0005_admin.sql aplicada
//   2. La Edge Function admin-api desplegada
// Ver el punto de CLAUDE.md "PANEL DE ADMINISTRACIÓN".

test.describe('Panel de administración', () => {
  test('un usuario normal no ve el icono del panel', async ({ page, testUser }) => {
    await crearCuaderno(page, testUser)
    await expect(page.getByRole('button', { name: 'Panel de administración' })).toHaveCount(0)
  })

  test('un admin ve el panel, el resumen y la lista de usuarios', async ({ page, testAdmin }) => {
    await crearCuaderno(page, testAdmin)

    await page.getByRole('button', { name: 'Panel de administración' }).click()
    await expect(page.getByRole('heading', { name: 'Panel de administración' })).toBeVisible()

    // El resumen carga (tarjeta "Usuarios" con un número).
    await expect(page.getByText('Usuarios', { exact: true }).first()).toBeVisible()
    // El propio admin aparece en la tabla.
    await expect(page.getByRole('cell', { name: testAdmin.email })).toBeVisible({ timeout: 15000 })
  })

  test('el admin concede y retira premium manual a otro usuario', async ({ page, testAdmin }) => {
    const admin = getSupabaseAdmin()
    // Segundo usuario (sin suscripción) que aparecerá en la lista.
    const objetivo = await crearUsuarioPrueba({ suscripcion: 'trial' })

    try {
      await crearCuaderno(page, testAdmin)
      await page.getByRole('button', { name: 'Panel de administración' }).click()

      await page.getByPlaceholder('Buscar por email…').fill(objetivo.email)
      const fila = page.getByRole('row', { name: new RegExp(objetivo.email) })
      await expect(fila).toBeVisible({ timeout: 15000 })
      await fila.getByRole('button', { name: 'Ver' }).click()

      await expect(page.getByRole('heading', { name: objetivo.email })).toBeVisible()
      await page.getByPlaceholder(/Nota interna/).fill('beta tester E2E')
      await page.getByRole('button', { name: 'Conceder premium manual' }).click()

      // Botón cambia a "Retirar" -> la mutación se aplicó.
      await expect(page.getByRole('button', { name: 'Retirar premium manual' })).toBeVisible({ timeout: 15000 })

      // Verificación real contra la BBDD, no solo la UI.
      const { data: perfil } = await admin
        .from('profiles')
        .select('manual_premium, has_paid, manual_premium_note')
        .eq('id', objetivo.id)
        .single()
      expect(perfil?.manual_premium).toBe(true)
      expect(perfil?.has_paid).toBe(true)
      expect(perfil?.manual_premium_note).toBe('beta tester E2E')

      // Y se puede retirar.
      await page.getByRole('button', { name: 'Retirar premium manual' }).click()
      await expect(page.getByRole('button', { name: 'Conceder premium manual' })).toBeVisible({ timeout: 15000 })
      const { data: perfil2 } = await admin
        .from('profiles')
        .select('manual_premium, has_paid')
        .eq('id', objetivo.id)
        .single()
      expect(perfil2?.manual_premium).toBe(false)
      expect(perfil2?.has_paid).toBe(false)
    } finally {
      await eliminarUsuarioPrueba(objetivo.id)
    }
  })

  test('el admin elimina la cuenta de otro usuario desde la zona peligrosa', async ({ page, testAdmin }) => {
    const admin = getSupabaseAdmin()
    const objetivo = await crearUsuarioPrueba({ suscripcion: 'trial' })
    let borrado = false

    try {
      await crearCuaderno(page, testAdmin)
      await page.getByRole('button', { name: 'Panel de administración' }).click()

      await page.getByPlaceholder('Buscar por email…').fill(objetivo.email)
      const fila = page.getByRole('row', { name: new RegExp(objetivo.email) })
      await expect(fila).toBeVisible({ timeout: 15000 })
      await fila.getByRole('button', { name: 'Ver' }).click()

      await expect(page.getByRole('heading', { name: objetivo.email })).toBeVisible()
      // El botón está deshabilitado hasta escribir ELIMINAR.
      const botonBorrar = page.getByRole('button', { name: 'Eliminar cuenta' })
      await expect(botonBorrar).toBeDisabled()
      await page.getByPlaceholder('ELIMINAR').fill('ELIMINAR')
      await botonBorrar.click()

      // El diálogo se cierra al terminar.
      await expect(page.getByRole('heading', { name: objetivo.email })).not.toBeVisible({ timeout: 15000 })

      const { data: user } = await admin.auth.admin.getUserById(objetivo.id)
      expect(user.user).toBeNull()
      borrado = true
    } finally {
      if (!borrado) await eliminarUsuarioPrueba(objetivo.id)
    }
  })
})
