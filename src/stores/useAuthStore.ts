import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'

interface AuthState {
  user: User | null
  hasPaid: boolean
  isLoading: boolean
  error: string | null
  // true mientras la sesión viene de un enlace de "restablecer contraseña"
  // (evento PASSWORD_RECOVERY de Supabase) — con esto activo, App.tsx
  // muestra ResetPasswordScreen en vez de la app normal, aunque `user` ya
  // esté relleno (el enlace de recuperación sí crea una sesión temporal).
  passwordRecovery: boolean

  initAuth: () => Promise<void>
  signUp: (email: string, password: string) => Promise<{ needsConfirmation: boolean }>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  requestPasswordReset: (email: string) => Promise<void>
  completarNuevaPassword: (password: string) => Promise<void>
  refreshProfile: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  hasPaid: false,
  isLoading: true,
  error: null,
  passwordRecovery: false,

  // Se llama una única vez al arrancar la app (App.tsx), antes de cualquier
  // otra cosa relacionada con el cuaderno — igual que initDB() para Dexie.
  initAuth: async () => {
    set({ isLoading: true, error: null })
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      set({ user: session?.user ?? null, isLoading: false })
      if (session?.user) {
        await get().refreshProfile()
      }

      // Mantiene el store al día si el token se refresca, o si la sesión
      // cambia en otra pestaña (login/logout compartido vía localStorage).
      supabase.auth.onAuthStateChange((event, session) => {
        set({ user: session?.user ?? null })
        if (event === 'PASSWORD_RECOVERY') {
          set({ passwordRecovery: true })
        }
        if (session?.user) {
          get().refreshProfile()
        } else {
          set({ hasPaid: false })
        }
      })
    } catch (e) {
      set({ error: 'Error al comprobar la sesión', isLoading: false })
    }
  },

  // Supabase exige confirmación por email por defecto: si `data.session` viene
  // vacío, la cuenta se creó pero aún no puede usarse hasta confirmar — la
  // pantalla de registro necesita saberlo para no asumir que ya hay sesión.
  signUp: async (email, password) => {
    set({ error: null })
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) {
      set({ error: error.message })
      throw error
    }
    if (data.session) {
      set({ user: data.session.user })
    }
    return { needsConfirmation: !data.session }
  },

  signIn: async (email, password) => {
    set({ error: null })
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      set({ error: error.message })
      throw error
    }
    set({ user: data.user })
    await get().refreshProfile()
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, hasPaid: false })
  },

  requestPasswordReset: async (email) => {
    set({ error: null })
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) {
      set({ error: error.message })
      throw error
    }
  },

  // Se llama desde ResetPasswordScreen, con la sesión temporal que ya creó
  // el enlace del email. Al terminar, se desactiva passwordRecovery — la
  // sesión pasa a ser una sesión normal y App.tsx deja de mostrar esa
  // pantalla.
  completarNuevaPassword: async (password) => {
    set({ error: null })
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      set({ error: error.message })
      throw error
    }
    set({ passwordRecovery: false })
  },

  // Vuelve a leer el estado de pago — se llama tras iniciar sesión y tras
  // volver de Stripe (Fase D) para detectar el pago sin esperar a un reload.
  refreshProfile: async () => {
    const user = get().user
    if (!user) return
    const { data, error } = await supabase.from('profiles').select('has_paid').eq('id', user.id).single()
    if (!error && data) {
      set({ hasPaid: data.has_paid })
    }
  },
}))
