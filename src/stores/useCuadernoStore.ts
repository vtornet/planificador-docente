import { create } from 'zustand'
import type { CuadernoDocente, CuadernoMetadata, Horario, Semana, Reunion, Nota, Evento } from '../types'
import { parseFechaInput } from '../utils/fechas'
import { festivosNacionalesParaCursoEscolar, festivoAutonomicoParaCursoEscolar } from '../types/festivosOficiales'
import { useAuthStore } from './useAuthStore'
import { TRIAL_LIMIT_PER_MODULE } from '../constants/trial'

interface CuadernoState {
  // Estado
  cuadernoActual: CuadernoDocente | null
  isLoading: boolean
  error: string | null
  view: 'horario' | 'calendario' | 'reuniones' | 'notas'

  // Acciones - Cuaderno
  loadCuaderno: (id: string) => Promise<void>
  createCuaderno: (metadata: CuadernoDocente['metadata']) => Promise<void>
  updateCuaderno: (updates: Partial<CuadernoDocente>) => Promise<void>
  updateMetadata: (updates: Partial<CuadernoMetadata>) => void

  // Acciones - Horarios
  addHorario: (horario: Omit<Horario, 'id'>) => void
  updateHorario: (id: string, updates: Partial<Horario>) => void
  deleteHorario: (id: string) => void

  // Acciones - Planificación
  addSemana: (semana: Semana) => void
  updateSemana: (id: string, updates: Partial<Semana>) => void
  deleteSemana: (id: string) => void
  duplicateSemana: (semanaId: string, nuevaFechaInicio: Date) => void

  // Acciones - Reuniones
  addReunion: (reunion: Omit<Reunion, 'id' | 'creada'>) => void
  updateReunion: (id: string, updates: Partial<Reunion>) => void
  deleteReunion: (id: string) => void

  // Acciones - Notas
  addNota: (nota: Omit<Nota, 'id' | 'creado' | 'actualizado'>) => void
  updateNota: (id: string, updates: Partial<Nota>) => void
  deleteNota: (id: string) => void

  // Acciones - Eventos (agenda)
  addEvento: (evento: Omit<Evento, 'id' | 'creado'>) => void
  updateEvento: (id: string, updates: Partial<Evento>) => void
  deleteEvento: (id: string) => void

  // Acciones - Navegación
  setView: (view: CuadernoState['view']) => void
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

async function saveCuadernoAsync(cuaderno: CuadernoDocente) {
  try {
    const { saveCuaderno } = await import('../db/db')
    await saveCuaderno({
      id: cuaderno.id,
      userId: useAuthStore.getState().user?.id,
      metadata: {
        cursoEscolar: cuaderno.metadata.cursoEscolar,
        centro: cuaderno.metadata.centro,
        docente: cuaderno.metadata.docente,
        creado: cuaderno.metadata.creado.getTime(),
        actualizado: Date.now(),
      },
      data: cuaderno,
    })
  } catch (e) {
    console.error('Error guardando cuaderno:', e)
  }
  sincronizarConSupabase(cuaderno)
}

// Segunda pata de la persistencia, siempre después de Dexie y siempre
// fire-and-forget: Dexie es la fuente de verdad offline, Supabase es la
// sincronización best-effort por encima. Import dinámico para no incluir
// @supabase/supabase-js en el chunk principal fuera de cuando hace falta.
function sincronizarConSupabase(cuaderno: CuadernoDocente) {
  import('../sync/syncCuaderno')
    .then(({ syncCuadernoToSupabase }) => syncCuadernoToSupabase(cuaderno))
    .catch((e) => console.error('Error sincronizando con Supabase:', e))
}

export const useCuadernoStore = create<CuadernoState>((set, get) => ({
  // Estado inicial
  cuadernoActual: null,
  isLoading: false,
  error: null,
  view: 'horario',

  // Cargar cuaderno
  loadCuaderno: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      const { getCuaderno } = await import('../db/db')
      const cuaderno = await getCuaderno(id)
      if (cuaderno) {
        set({ cuadernoActual: cuaderno.data as CuadernoDocente, isLoading: false })
      } else {
        set({ error: 'Cuaderno no encontrado', isLoading: false })
      }
    } catch (e) {
      set({ error: 'Error al cargar cuaderno', isLoading: false })
    }
  },

  // Crear cuaderno nuevo
  createCuaderno: async (metadata) => {
    set({ isLoading: true, error: null })
    try {
      const ahora = Date.now()
      const nuevoCuaderno: CuadernoDocente = {
        id: generateId(),
        metadata: {
          ...metadata,
          creado: new Date(ahora),
          actualizado: new Date(ahora),
        },
        horarios: [],
        planificacion: { mensual: [], semanal: [] },
        reuniones: [],
        notas: [],
        eventos: [],
        configuracion: {
          id: 'config',
          cursoEscolarActual: metadata.cursoEscolar,
          fechaInicioCurso: parseFechaInput(`${metadata.cursoEscolar.split('-')[0]}-09-01`),
          fechaFinCurso: parseFechaInput(`${metadata.cursoEscolar.split('-')[1]}-06-30`),
          festivos: [
            ...festivosNacionalesParaCursoEscolar(metadata.cursoEscolar),
            // Si se eligió comunidad autónoma al crear el cuaderno (antes solo
            // se podía elegir después, desde Perfil), su festivo se carga ya
            // desde el principio, igual que los nacionales.
            ...(metadata.comunidadAutonoma
              ? festivoAutonomicoParaCursoEscolar(metadata.comunidadAutonoma, metadata.cursoEscolar)
              : []),
          ].map((f) => ({
            ...f,
            id: generateId(),
            origen: 'automatico' as const,
          })),
          vacaciones: [],
        },
      }
      const { saveCuaderno } = await import('../db/db')
      await saveCuaderno({
        id: nuevoCuaderno.id,
        userId: useAuthStore.getState().user?.id,
        metadata: {
          cursoEscolar: nuevoCuaderno.metadata.cursoEscolar,
          centro: nuevoCuaderno.metadata.centro,
          docente: nuevoCuaderno.metadata.docente,
          creado: ahora,
          actualizado: ahora,
        },
        data: nuevoCuaderno,
      })
      set({ cuadernoActual: nuevoCuaderno, isLoading: false })
      sincronizarConSupabase(nuevoCuaderno)
    } catch (e) {
      set({ error: 'Error al crear cuaderno', isLoading: false })
    }
  },

  // Actualizar cuaderno
  updateCuaderno: async (updates) => {
    const { cuadernoActual } = get()
    if (!cuadernoActual) return

    try {
      const actualizado = { ...cuadernoActual, ...updates, metadata: { ...cuadernoActual.metadata, actualizado: new Date() } }
      const { saveCuaderno } = await import('../db/db')
      await saveCuaderno({
        id: actualizado.id,
        userId: useAuthStore.getState().user?.id,
        metadata: {
          cursoEscolar: actualizado.metadata.cursoEscolar,
          centro: actualizado.metadata.centro,
          docente: actualizado.metadata.docente,
          creado: actualizado.metadata.creado.getTime(),
          actualizado: Date.now(),
        },
        data: actualizado,
      })
      set({ cuadernoActual: actualizado })
      sincronizarConSupabase(actualizado)
    } catch (e) {
      set({ error: 'Error al guardar cambios' })
    }
  },

  // Metadata / Perfil
  updateMetadata: (updates) => {
    const { cuadernoActual } = get()
    if (!cuadernoActual) return

    const actualizado = {
      ...cuadernoActual,
      metadata: { ...cuadernoActual.metadata, ...updates, actualizado: new Date() },
    }
    set({ cuadernoActual: actualizado })
    saveCuadernoAsync(actualizado)
  },

  // Horarios
  addHorario: (horario) => {
    const { cuadernoActual } = get()
    if (!cuadernoActual) {
      console.error('No hay cuaderno actual')
      return
    }
    // Respaldo del límite de prueba: la UI ya debería impedir llegar aquí
    // (ver PaywallDialog), pero el trigger de Postgres es la aplicación real
    // — esto solo evita una escritura local que luego el servidor rechazaría.
    if (!useAuthStore.getState().hasPaid && cuadernoActual.horarios.length >= TRIAL_LIMIT_PER_MODULE) {
      return
    }

    const nuevoHorario: Horario = { ...horario, id: generateId() }
    const actualizado = {
      ...cuadernoActual,
      horarios: [...cuadernoActual.horarios, nuevoHorario],
    }
    set({ cuadernoActual: actualizado })

    // Guardar en IndexedDB
    saveCuadernoAsync(actualizado)
  },

  updateHorario: (id, updates) => {
    const { cuadernoActual } = get()
    if (!cuadernoActual) return

    const actualizado = {
      ...cuadernoActual,
      horarios: cuadernoActual.horarios.map((h) =>
        h.id === id ? { ...h, ...updates } : h
      ),
    }
    set({ cuadernoActual: actualizado })
    saveCuadernoAsync(actualizado)
  },

  deleteHorario: (id) => {
    const { cuadernoActual } = get()
    if (!cuadernoActual) return

    const actualizado = {
      ...cuadernoActual,
      horarios: cuadernoActual.horarios.filter((h) => h.id !== id),
    }
    set({ cuadernoActual: actualizado })
    saveCuadernoAsync(actualizado)
  },

  // Semanas
  addSemana: (semana) => {
    const { cuadernoActual } = get()
    if (!cuadernoActual) return
    if (
      !useAuthStore.getState().hasPaid &&
      cuadernoActual.planificacion.semanal.length >= TRIAL_LIMIT_PER_MODULE
    ) {
      return
    }

    const actualizado = {
      ...cuadernoActual,
      planificacion: {
        ...cuadernoActual.planificacion,
        semanal: [...cuadernoActual.planificacion.semanal, semana],
      },
    }
    set({ cuadernoActual: actualizado })
    saveCuadernoAsync(actualizado)
  },

  updateSemana: (id, updates) => {
    const { cuadernoActual } = get()
    if (!cuadernoActual) return

    const actualizado = {
      ...cuadernoActual,
      planificacion: {
        ...cuadernoActual.planificacion,
        semanal: cuadernoActual.planificacion.semanal.map((s) =>
          s.id === id ? { ...s, ...updates } : s
        ),
      },
    }
    set({ cuadernoActual: actualizado })
    saveCuadernoAsync(actualizado)
  },

  deleteSemana: (id) => {
    const { cuadernoActual } = get()
    if (!cuadernoActual) return

    const actualizado = {
      ...cuadernoActual,
      planificacion: {
        ...cuadernoActual.planificacion,
        semanal: cuadernoActual.planificacion.semanal.filter((s) => s.id !== id),
      },
    }
    set({ cuadernoActual: actualizado })
    saveCuadernoAsync(actualizado)
  },

  duplicateSemana: (semanaId: string, nuevaFechaInicio: Date) => {
    const { cuadernoActual } = get()
    if (!cuadernoActual) return

    const semanaOriginal = cuadernoActual.planificacion.semanal.find(s => s.id === semanaId)
    if (!semanaOriginal) return

    // Calcular nuevo número de semana
    const maxNumero = Math.max(0, ...cuadernoActual.planificacion.semanal.map(s => s.numeroSemana))
    const nuevoNumero = maxNumero + 1

    // Crear duplicado
    const semanaDuplicada: Semana = {
      ...semanaOriginal,
      id: generateId(),
      fechaInicio: nuevaFechaInicio,
      fechaFin: new Date(new Date(nuevaFechaInicio).getTime() + 4 * 24 * 60 * 60 * 1000),
      numeroSemana: nuevoNumero,
      dias: semanaOriginal.dias.map((dia, idx) => ({
        ...dia,
        fecha: new Date(new Date(nuevaFechaInicio).getTime() + idx * 24 * 60 * 60 * 1000),
      })),
    }

    const actualizado = {
      ...cuadernoActual,
      planificacion: {
        ...cuadernoActual.planificacion,
        semanal: [...cuadernoActual.planificacion.semanal, semanaDuplicada],
      },
    }
    set({ cuadernoActual: actualizado })
    saveCuadernoAsync(actualizado)
  },

  // Reuniones
  addReunion: (reunion) => {
    const { cuadernoActual } = get()
    if (!cuadernoActual) return
    if (!useAuthStore.getState().hasPaid && cuadernoActual.reuniones.length >= TRIAL_LIMIT_PER_MODULE) {
      return
    }

    const nuevaReunion: Reunion = {
      ...reunion,
      id: generateId(),
      creada: new Date(),
    }
    const actualizado = {
      ...cuadernoActual,
      reuniones: [...cuadernoActual.reuniones, nuevaReunion],
    }
    set({ cuadernoActual: actualizado })
    saveCuadernoAsync(actualizado)
  },

  updateReunion: (id, updates) => {
    const { cuadernoActual } = get()
    if (!cuadernoActual) return

    const actualizado = {
      ...cuadernoActual,
      reuniones: cuadernoActual.reuniones.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
    }
    set({ cuadernoActual: actualizado })
    saveCuadernoAsync(actualizado)
  },

  deleteReunion: (id) => {
    const { cuadernoActual } = get()
    if (!cuadernoActual) return

    const actualizado = {
      ...cuadernoActual,
      reuniones: cuadernoActual.reuniones.filter((r) => r.id !== id),
    }
    set({ cuadernoActual: actualizado })
    saveCuadernoAsync(actualizado)
  },

  // Notas
  addNota: (nota) => {
    const { cuadernoActual } = get()
    if (!cuadernoActual) return
    if (!useAuthStore.getState().hasPaid && cuadernoActual.notas.length >= TRIAL_LIMIT_PER_MODULE) {
      return
    }

    const ahora = new Date()
    const nuevaNota: Nota = {
      ...nota,
      id: generateId(),
      creado: ahora,
      actualizado: ahora,
    }
    const actualizado = {
      ...cuadernoActual,
      notas: [...cuadernoActual.notas, nuevaNota],
    }
    set({ cuadernoActual: actualizado })
    saveCuadernoAsync(actualizado)
  },

  updateNota: (id, updates) => {
    const { cuadernoActual } = get()
    if (!cuadernoActual) return

    const actualizado = {
      ...cuadernoActual,
      notas: cuadernoActual.notas.map((n) =>
        n.id === id ? { ...n, ...updates, actualizado: new Date() } : n
      ),
    }
    set({ cuadernoActual: actualizado })
    saveCuadernoAsync(actualizado)
  },

  deleteNota: (id) => {
    const { cuadernoActual } = get()
    if (!cuadernoActual) return

    const actualizado = {
      ...cuadernoActual,
      notas: cuadernoActual.notas.filter((n) => n.id !== id),
    }
    set({ cuadernoActual: actualizado })
    saveCuadernoAsync(actualizado)
  },

  // Eventos (agenda)
  addEvento: (evento) => {
    const { cuadernoActual } = get()
    if (!cuadernoActual) return
    if (!useAuthStore.getState().hasPaid && (cuadernoActual.eventos || []).length >= TRIAL_LIMIT_PER_MODULE) {
      return
    }

    const nuevoEvento: Evento = { ...evento, id: generateId(), creado: new Date() }
    const actualizado = {
      ...cuadernoActual,
      eventos: [...(cuadernoActual.eventos || []), nuevoEvento],
    }
    set({ cuadernoActual: actualizado })
    saveCuadernoAsync(actualizado)
  },

  updateEvento: (id, updates) => {
    const { cuadernoActual } = get()
    if (!cuadernoActual) return

    const actualizado = {
      ...cuadernoActual,
      eventos: (cuadernoActual.eventos || []).map((e) =>
        e.id === id ? { ...e, ...updates } : e
      ),
    }
    set({ cuadernoActual: actualizado })
    saveCuadernoAsync(actualizado)
  },

  deleteEvento: (id) => {
    const { cuadernoActual } = get()
    if (!cuadernoActual) return

    const actualizado = {
      ...cuadernoActual,
      eventos: (cuadernoActual.eventos || []).filter((e) => e.id !== id),
    }
    set({ cuadernoActual: actualizado })
    saveCuadernoAsync(actualizado)
  },

  // Navegación
  setView: (view) => set({ view }),
}))
