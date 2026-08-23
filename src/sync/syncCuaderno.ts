import { supabase } from '../lib/supabaseClient'
import { useAuthStore } from '../stores/useAuthStore'
import { useSyncStatusStore } from '../stores/useSyncStatusStore'
import { prepareCuadernoForExport, restoreCuadernoFromImport } from '../utils/export'
import { mergeCuadernos } from './mergeCuaderno'
import type { CuadernoDocente } from '../types'

// El trigger enforce_trial_limits (0001_init.sql) rechaza el upsert entero con
// este mensaje cuando algún módulo supera el tope de la prueba gratuita — se
// distingue así de un fallo de red normal (esperable offline, no debe
// alarmar a la docente) para decidir si mostrar el aviso de "sin sincronizar
// por el límite de prueba" en la UI (ver SyncTopeBanner.tsx).
function esErrorTopeDePrueba(error: unknown): boolean {
  const mensaje = error instanceof Error ? error.message : (error as { message?: string } | null)?.message
  return typeof mensaje === 'string' && mensaje.includes('trial_limit_exceeded')
}

/**
 * Empuja un cuaderno a Supabase (siempre upsert, nunca insert — idempotente,
 * igual que db.cuadernos.put() en Dexie, por el mismo motivo que ya documenta
 * ensureConfig() en db.ts: dos escrituras concurrentes con el mismo id no
 * deben chocar). No-op si no hay sesión (no debería pasar, App.tsx exige
 * login antes de poder crear un cuaderno, pero es una defensa razonable).
 *
 * Se llama siempre en fire-and-forget (igual que el resto de persistencia de
 * useCuadernoStore.ts): un fallo aquí no debe bloquear la UI, que ya guardó
 * en Dexie primero y sigue siendo usable offline. Sí que se refleja en
 * `useSyncStatusStore`, único punto por el que pasan las tres formas de
 * llegar aquí (el fire-and-forget de cada mutación, reconcileCuadernosConSupabase
 * y reclamarCuadernoLocal), para que un fallo por tope de prueba dé al menos
 * un aviso visible en vez de quedarse solo en `console.error`.
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

  if (error) {
    if (esErrorTopeDePrueba(error)) {
      useSyncStatusStore.getState().marcarBloqueado()
    }
    throw error
  }

  useSyncStatusStore.getState().marcarDesbloqueado()
}

/**
 * Descarga los cuadernos remotos del usuario y los concilia con las copias
 * locales en Dexie fusionándolos elemento a elemento (ver `mergeCuaderno.ts`)
 * en vez de sustituir un cuaderno entero por otro según cuál se guardó en
 * último lugar — así, si dos dispositivos editan offline módulos distintos
 * (o incluso elementos distintos del mismo módulo) antes de sincronizar,
 * ningún cambio se pierde en silencio. Se llama una vez, justo tras resolver
 * la sesión y antes de que App.tsx decida qué cuaderno cargar — así un
 * dispositivo nuevo ya tiene los datos disponibles antes de elegir cuál
 * mostrar.
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

  const { getCuaderno, saveCuaderno, getCuadernos } = await import('../db/db')

  for (const fila of filas) {
    const remoto = restoreCuadernoFromImport(fila.data)
    const local = await getCuaderno(fila.id)

    if (!local) {
      // No existe localmente: coge el remoto tal cual, nada que fusionar.
      await saveCuaderno({
        id: remoto.id,
        userId: user.id,
        metadata: {
          cursoEscolar: remoto.metadata.cursoEscolar,
          centro: remoto.metadata.centro,
          docente: remoto.metadata.docente,
          creado: remoto.metadata.creado.getTime(),
          actualizado: new Date(fila.updated_at).getTime(),
        },
        data: remoto,
      })
      continue
    }

    const merged = mergeCuadernos(local.data as CuadernoDocente, remoto)
    const actualizadoMerged = Math.max(local.metadata.actualizado, new Date(fila.updated_at).getTime())

    await saveCuaderno({
      id: merged.id,
      userId: user.id,
      metadata: {
        cursoEscolar: merged.metadata.cursoEscolar,
        centro: merged.metadata.centro,
        docente: merged.metadata.docente,
        creado: merged.metadata.creado.getTime(),
        actualizado: actualizadoMerged,
      },
      data: merged,
    })

    // Solo se vuelve a subir si la fusión aportó algo que el remoto no tenía
    // (evita una escritura de red en cada arranque de la app cuando no hay
    // nada que fusionar de verdad, el caso más común con un solo dispositivo).
    const cambioFrenteARemoto =
      JSON.stringify(prepareCuadernoForExport(merged)) !== JSON.stringify(prepareCuadernoForExport(remoto))
    if (cambioFrenteARemoto) {
      try {
        await syncCuadernoToSupabase(merged)
      } catch (e) {
        console.error('No se pudo subir el cuaderno fusionado:', e)
      }
    }
  }

  // Cuadernos locales de este usuario que todavía no existen en Supabase
  // (creados 100% offline, sin que ninguna mutación posterior haya logrado
  // sincronizar todavía) — se suben proactivamente para que no se queden
  // huérfanos hasta la siguiente edición.
  const idsRemotos = new Set(filas.map((f) => f.id))
  const pendientes = (await getCuadernos()).filter((c) => c.userId === user.id && !idsRemotos.has(c.id))
  for (const cuaderno of pendientes) {
    try {
      await syncCuadernoToSupabase(cuaderno.data as CuadernoDocente)
    } catch (e) {
      console.error('No se pudo subir el cuaderno local pendiente:', e)
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
