import { create } from 'zustand'

interface SyncStatusState {
  // true si el último intento de subir el cuaderno a Supabase falló por
  // superar el tope de la prueba gratuita (trigger enforce_trial_limits) —
  // no por un fallo de red normal, que es esperable estando offline y no
  // debe alarmar a la docente (ver syncCuaderno.ts).
  bloqueadoPorTope: boolean
  marcarBloqueado: () => void
  marcarDesbloqueado: () => void
}

export const useSyncStatusStore = create<SyncStatusState>((set) => ({
  bloqueadoPorTope: false,
  marcarBloqueado: () => set({ bloqueadoPorTope: true }),
  marcarDesbloqueado: () => set({ bloqueadoPorTope: false }),
}))
