import type { CuadernoDocente, Eliminacion, TipoEntidadEliminable } from '../types'

// `actualizado` puede faltar en objetos reales que vienen de antes de existir
// este campo (cuadernos ya en Dexie, o filas ya sincronizadas en Supabase) —
// aunque el tipo lo declare obligatorio para el código nuevo, hay que leerlo
// a la defensiva aquí. Se trata como "muy antiguo" para que nunca gane por
// error frente a una copia que sí lleva la marca de tiempo real.
function ts(fecha: Date | undefined): number {
  return fecha ? fecha.getTime() : 0
}

/**
 * Fusiona dos listas de la misma entidad (horarios, semanas, reuniones,
 * notas o eventos) por id: para cada id presente en cualquiera de los dos
 * lados, gana la copia con `actualizado` más reciente. Si un id solo existe
 * en un lado, se conserva — salvo que el otro lado lo haya borrado (ver
 * `eliminados`) más tarde de la última edición conocida de ese elemento, en
 * cuyo caso se descarta (el borrado gana sobre una edición anterior a él).
 *
 * Es fusión a nivel de ELEMENTO, no de campo: si los dos dispositivos editan
 * el mismo horario (aunque sean celdas distintas de su rejilla) mientras
 * ambos están offline, sigue ganando el más reciente de los dos por completo,
 * no una combinación de ambos cambios. Ir más fino que esto exigiría un
 * modelo tipo CRDT por campo, desproporcionado para el riesgo real de esta
 * app (una sola docente, rara vez editando el mismo elemento exacto desde dos
 * dispositivos en la misma ventana offline).
 */
function mergeLista<T extends { id: string; actualizado?: Date }>(
  locales: T[],
  remotas: T[],
  eliminados: Eliminacion[],
  tipo: TipoEntidadEliminable
): T[] {
  const porId = new Map<string, T>()
  for (const item of locales) porId.set(item.id, item)
  for (const item of remotas) {
    const existente = porId.get(item.id)
    if (!existente || ts(item.actualizado) > ts(existente.actualizado)) {
      porId.set(item.id, item)
    }
  }

  const ultimaEliminacion = new Map<string, number>()
  for (const e of eliminados) {
    if (e.tipo !== tipo) continue
    const actual = ultimaEliminacion.get(e.id) ?? 0
    ultimaEliminacion.set(e.id, Math.max(actual, ts(e.fecha)))
  }

  const resultado: T[] = []
  for (const item of porId.values()) {
    const fechaEliminacion = ultimaEliminacion.get(item.id)
    // Un borrado solo "gana" si es posterior a la última edición conocida del
    // elemento — así una edición hecha DESPUÉS del borrado en el otro
    // dispositivo (ej. se borró en el móvil, pero luego se siguió editando
    // en el portátil antes de sincronizar) no se pierde.
    if (fechaEliminacion !== undefined && fechaEliminacion >= ts(item.actualizado)) continue
    resultado.push(item)
  }
  return resultado
}

/** Une dos listas de tombstones, quedándose con la fecha más reciente por (tipo, id). */
function mergeEliminados(a: Eliminacion[], b: Eliminacion[]): Eliminacion[] {
  const porClave = new Map<string, Eliminacion>()
  for (const e of [...a, ...b]) {
    const clave = `${e.tipo}:${e.id}`
    const existente = porClave.get(clave)
    if (!existente || ts(e.fecha) > ts(existente.fecha)) porClave.set(clave, e)
  }
  return [...porClave.values()]
}

/**
 * Fusiona dos copias del mismo cuaderno (misma `id`) editadas offline en
 * dispositivos distintos, elemento a elemento en vez de sustituir uno por
 * otro entero (que es lo que hacía `reconcileCuadernosConSupabase` antes de
 * esto: "gana el cuaderno completo más reciente" — cualquier cambio hecho en
 * el dispositivo "perdedor" desde la última sincronización se perdía en
 * silencio, aunque fuera en un módulo totalmente distinto al que cambió el
 * "ganador"). Sigue habiendo dos partes que se comparan como bloque entero
 * (no por elemento), por decisión explícita de alcance, documentada donde
 * corresponde:
 * - `metadata` (centro, docente, curso escolar...): unos pocos campos de
 *   perfil que la docente rellena una vez y rara vez cambia a la vez en dos
 *   dispositivos sin sincronizar entre medias.
 * - `configuracion` (festivos, vacaciones, colores de asignatura...): se
 *   carga automáticamente en su mayoría, con ediciones manuales poco
 *   frecuentes.
 * Ambas se resuelven por la misma marca de tiempo (`metadata.actualizado`),
 * igual que hacía el cuaderno entero antes de este cambio.
 */
export function mergeCuadernos(local: CuadernoDocente, remoto: CuadernoDocente): CuadernoDocente {
  const eliminados = mergeEliminados(local.eliminados || [], remoto.eliminados || [])
  const localMasReciente = ts(local.metadata.actualizado) >= ts(remoto.metadata.actualizado)

  return {
    id: local.id,
    metadata: localMasReciente ? local.metadata : remoto.metadata,
    configuracion: localMasReciente ? local.configuracion : remoto.configuracion,
    horarios: mergeLista(local.horarios, remoto.horarios, eliminados, 'horario'),
    planificacion: {
      // Sin uso real en la app (siempre vacío, ver PlanificacionMensual) —
      // no hace falta fusión por elemento para una lista que nunca se llena.
      mensual: local.planificacion.mensual,
      semanal: mergeLista(local.planificacion.semanal, remoto.planificacion.semanal, eliminados, 'semana'),
    },
    reuniones: mergeLista(local.reuniones, remoto.reuniones, eliminados, 'reunion'),
    notas: mergeLista(local.notas, remoto.notas, eliminados, 'nota'),
    eventos: mergeLista(local.eventos || [], remoto.eventos || [], eliminados, 'evento'),
    eliminados,
  }
}
