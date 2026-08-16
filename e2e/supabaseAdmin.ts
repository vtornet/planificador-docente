import { createClient } from '@supabase/supabase-js'

// Cliente con la service_role key (salta RLS), solo para el setup/teardown de
// la suite E2E. Nunca se importa desde src/ — si se hiciera, Vite lo
// incluiría en el bundle del cliente y expondría la clave.
export function getSupabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Faltan VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env — necesarios para autenticar ' +
        'usuarias de prueba en los tests E2E (ver .env.example).'
    )
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
