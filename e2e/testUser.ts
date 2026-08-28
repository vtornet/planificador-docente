import { randomUUID } from 'node:crypto'
import { getSupabaseAdmin } from './supabaseAdmin'

export interface TestUser {
  id: string
  email: string
  password: string
}

/**
 * Crea una cuenta de prueba ya confirmada (sin pasar por el email real de
 * confirmación, ver Admin API de Supabase). Por defecto con la suscripción
 * marcada como activa, para que ningún test choque con el tope de la prueba
 * gratuita sin estar probando precisamente eso — pasar `suscripcion: 'trial'`
 * para el caso contrario (deja `subscription_status` sin fijar, tal y como
 * lo deja `handle_new_user()` en un alta real, así que `has_paid` es `false`).
 * Cada test crea la suya y la borra al terminar (ver eliminarUsuarioPrueba)
 * — nunca se reutiliza entre tests.
 */
export async function crearUsuarioPrueba(
  opts: { suscripcion?: 'active' | 'trial'; admin?: boolean } = {}
): Promise<TestUser> {
  const { suscripcion = 'active', admin: esAdmin = false } = opts
  const admin = getSupabaseAdmin()
  const email = `e2e-${randomUUID()}@docenza-e2e.test`
  // Generada por cuenta, no fija: evita tener una contraseña en texto plano
  // en el repositorio (GitGuardian la marcó como "Generic Password" el
  // 23-08-2026, aunque no protegía nada de valor real — cuentas efímeras con
  // email aleatorio, borradas al terminar cada test). El sufijo garantiza
  // mayúscula/minúscula/dígito/símbolo por si la política de contraseñas del
  // proyecto lo exige alguna vez, aunque un UUID ya sería suficiente hoy.
  const password = `E2E-${randomUUID()}-Aa1!`

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error || !data.user) {
    throw new Error(`No se pudo crear la usuaria de prueba: ${error?.message}`)
  }

  const updates: Record<string, unknown> = {}
  if (suscripcion === 'active') updates.subscription_status = 'active'
  // Requiere la migración 0005 (columna is_admin) aplicada en el proyecto.
  if (esAdmin) updates.is_admin = true
  if (Object.keys(updates).length > 0) {
    const { error: profileError } = await admin.from('profiles').update(updates).eq('id', data.user.id)
    if (profileError) {
      throw new Error(`No se pudo preparar el perfil de la usuaria de prueba: ${profileError.message}`)
    }
  }

  return { id: data.user.id, email, password }
}

/** Borra la cuenta de prueba — arrastra en cascada su perfil y sus cuadernos (ver 0001_init.sql). */
export async function eliminarUsuarioPrueba(userId: string) {
  const admin = getSupabaseAdmin()
  await admin.auth.admin.deleteUser(userId)
}
