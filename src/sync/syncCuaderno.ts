import { supabase } from '../lib/supabaseClient'
import { useAuthStore } from '../stores/useAuthStore'
import { prepareCuadernoForExport, restoreCuadernoFromImport } from '../utils/export'
import type { CuadernoDocente } from '../types'

/**
 * Empuja un cuaderno a Supabase (siempre upsert, nunca insert — idempotente,
 * igual que db.cuadernos.put() en Dexie, por el mismo motivo que ya documenta
 * ensureConfig() en db.ts: dos escrituras concurrentes con el mismo id no
 * deben chocar). No-op si no hay sesión (no debería pasar, App.tsx exige
 * login antes de poder crear un cuaderno, pero es una defensa razonable).
 *
 * Se llama siempre en fire-and-forget (igual que el resto de persistencia de
 * useCuadernoStore.ts): un fallo aquí no debe bloquear la UI, que ya guardó
 * en Dexie primero y sigue siendo usable offline.
 */
export async function syncCuadernoToSupabase(cuaderno: CuadernoDocente): Promise<void> {
  const user = useAuthStore.getState().user
  if (!user) return

  const data = prepareCuadernoForExport(cuaderno)
  const { error } = await supabase.from('cuadernos').upsert({
    id: cuaderno.id,
    user_id: user.id,
    metadata: data.metadata,
    data,
    updated_at: new Date().toISOString(),
  })

  if (error) throw error
}

/**
 * Descarga los cuadernos remotos del usuario y los concilia con las copias
 * locales en Dexie: gana el más reciente por marca de tiempo. Se compara con
 * el `actualizado` del índice de Dexie (no con el `metadata.actualizado`
 * anidado dentro de `data`, que solo tocan updateCuaderno/updateMetadata —
 * ver comentario en saveCuadernoAsync) contra `updated_at` de la fila de
 * Supabase (siempre al día gracias al trigger touch_updated_at). Se llama
 * una vez, justo tras resolver la sesión y antes de que App.tsx decida qué
 * cuaderno cargar — así un dispositivo nuevo ya tiene los datos disponibles
 * antes de elegir cuál mostrar.
 */
export async function reconcileCuadernosConSupabase(): Promise<void> {
  const user = useAuthStore.getState().user
  if (!user) return

  const { data: filas, error } = await supabase
    .from('cuadernos')
    .select('id, data, updated_at')
    .eq('user_id', user.id)
  if (error) throw error
  if (!filas) return

  const { getCuaderno, saveCuaderno } = await import('../db/db')

  for (const fila of filas) {
    const remoto = restoreCuadernoFromImport(fila.data)
    const actualizadoRemoto = new Date(fila.updated_at).getTime()
    const local = await getCuaderno(fila.id)

    if (!local || actualizadoRemoto > local.metadata.actualizado) {
      // No existe localmente, o el remoto es más reciente: sobreescribe Dexie.
      await saveCuaderno({
        id: remoto.id,
        userId: user.id,
        metadata: {
          cursoEscolar: remoto.metadata.cursoEscolar,
          centro: remoto.metadata.centro,
          docente: remoto.metadata.docente,
          creado: remoto.metadata.creado.getTime(),
          actualizado: actualizadoRemoto,
        },
        data: remoto,
      })
    } else if (local.metadata.actualizado > actualizadoRemoto) {
      // La copia local es más reciente: la sube de vuelta.
      await syncCuadernoToSupabase(local.data as CuadernoDocente)
    }
  }
}

/**
 * Reclama un cuaderno local creado antes de existir cuentas (sin `userId`):
 * lo marca como propiedad de la cuenta activa en Dexie y lo sube a Supabase.
 * El marcado local se hace siempre, incluso si la subida falla (ej. supera
 * el tope de prueba y el trigger de Postgres la rechaza) — el cuaderno queda
 * asociado a la cuenta y sigue siendo usable offline, solo que sin
 * sincronizar hasta que se actualice a la suscripción. Nunca borra la copia
 * local (ver ClaimLocalDataDialog).
 */
export async function reclamarCuadernoLocal(
  cuaderno: CuadernoDocente
): Promise<{ subido: boolean; error?: string }> {
  const user = useAuthStore.getState().user
  if (!user) return { subido: false, error: 'No has iniciado sesión' }

  const { saveCuaderno } = await import('../db/db')
  await saveCuaderno({
    id: cuaderno.id,
    userId: user.id,
    metadata: {
      cursoEscolar: cuaderno.metadata.cursoEscolar,
      centro: cuaderno.metadata.centro,
      docente: cuaderno.metadata.docente,
      creado: cuaderno.metadata.creado.getTime(),
      actualizado: cuaderno.metadata.actualizado.getTime(),
    },
    data: cuaderno,
  })

  try {
    await syncCuadernoToSupabase(cuaderno)
    return { subido: true }
  } catch (e) {
    return { subido: false, error: e instanceof Error ? e.message : 'Error al sincronizar' }
  }
}
