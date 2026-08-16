import { randomUUID } from 'node:crypto'
import { getSupabaseAdmin } from './supabaseAdmin'

export interface TestUser {
  id: string
  email: string
  password: string
}

/**
 * Crea una cuenta de prueba ya confirmada (sin pasar por el email real de
 * confirmación, ver Admin API de Supabase) y con la suscripción marcada como
 * activa, para que ningún test choque con el tope de la prueba gratuita sin
 * estar probando precisamente eso. Cada test crea la suya y la borra al
 * terminar (ver eliminarUsuarioPrueba) — nunca se reutiliza entre tests.
 */
export async function crearUsuarioPrueba(): Promise<TestUser> {
  const admin = getSupabaseAdmin()
  const email = `e2e-${randomUUID()}@docenza-e2e.test`
  const password = 'PruebaE2E123!'

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error || !data.user) {
    throw new Error(`No se pudo crear la usuaria de prueba: ${error?.message}`)
  }

  const { error: profileError } = await admin
    .from('profiles')
    .update({ subscription_status: 'active' })
    .eq('id', data.user.id)
  if (profileError) {
    throw new Error(`No se pudo activar la suscripción de la usuaria de prueba: ${profileError.message}`)
  }

  return { id: data.user.id, email, password }
}

/** Borra la cuenta de prueba — arrastra en cascada su perfil y sus cuadernos (ver 0001_init.sql). */
export async function eliminarUsuarioPrueba(userId: string) {
  const admin = getSupabaseAdmin()
  await admin.auth.admin.deleteUser(userId)
}
