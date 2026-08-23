import { supabase } from '../lib/supabaseClient'
import { useAuthStore } from '../stores/useAuthStore'
import { useCuadernoStore } from '../stores/useCuadernoStore'

/**
 * Borra la cuenta de la usuaria activa: invoca la Edge Function (que cancela
 * la suscripción de Stripe si tiene una, y borra el usuario de Supabase Auth
 * — cascada a `profiles`/`cuadernos`), y si tiene éxito limpia también la
 * copia local de este dispositivo (Dexie, vía deleteCuaderno de cada
 * cuaderno de esta cuenta) y cierra la sesión — sin esto, la app seguiría
 * mostrando "cuenta eliminada" pero dejando ver y editar el cuaderno viejo
 * en este dispositivo, dando la impresión contraria a lo que se acaba de
 * pedir.
 */
export async function eliminarCuentaPropia(): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = useAuthStore.getState().user
  if (!user) return { ok: false, error: 'No has iniciado sesión' }

  const { error } = await supabase.functions.invoke('delete-account')
  if (error) {
    return { ok: false, error: 'No se pudo eliminar la cuenta. Inténtalo de nuevo.' }
  }

  const { getCuadernos, deleteCuaderno } = await import('../db/db')
  const cuadernos = await getCuadernos()
  for (const cuaderno of cuadernos.filter((c) => c.userId === user.id)) {
    await deleteCuaderno(cuaderno.id)
  }

  useCuadernoStore.setState({ cuadernoActual: null })
  try {
    await supabase.auth.signOut()
  } catch {
    // La cuenta ya no existe en el servidor — el signOut puede fallar de
    // forma inofensiva; el estado local se limpia igualmente a continuación.
  }
  useAuthStore.setState({ user: null, hasPaid: false })

  return { ok: true }
}
