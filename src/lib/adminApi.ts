import { FunctionsHttpError } from '@supabase/functions-js'
import { supabase } from './supabaseClient'

// Cliente del panel de administración: una sola Edge Function (admin-api) que
// enruta por `action`. Verifica el JWT y profiles.is_admin en el servidor —
// esto es solo la comodidad de tipos y el desempaquetado del error.

export type AdminAction =
  | 'stats'
  | 'list_users'
  | 'user_detail'
  | 'set_manual_premium'
  | 'cancel_subscription'
  | 'delete_user'

export interface AdminStats {
  usuarios: { total: number; altas7: number; altas30: number }
  premium: { total: number; dePago: number; trialing: number; manual: number; enPrueba: number }
  suscripciones: { activas: number; pastDue: number; canceladas: number; programadasCancelar: number }
  ingresoAnualEstimado: number
  cuadernos: { total: number; mediaPorUsuario: number }
  ia: { mensajesHoy: number; mensajes7: number; topSemana: { email: string; count: number }[] }
}

export type EstadoUsuario =
  | 'manual'
  | 'activa'
  | 'cancela_al_final'
  | 'trial'
  | 'impago'
  | 'cancelada'
  | 'prueba'

export interface AdminUser {
  id: string
  email: string
  isAdmin: boolean
  estado: EstadoUsuario
  hasPaid: boolean
  manualPremium: boolean
  manualPremiumNote: string | null
  subscriptionStatus: string | null
  cancelAtPeriodEnd: boolean
  subscriptionCurrentPeriodEnd: string | null
  tieneStripe: boolean
  cuadernos: number
  iaHoy: number
  createdAt: string
  lastSignInAt: string | null
}

export interface AdminUsersPage {
  total: number
  page: number
  pageSize: number
  users: AdminUser[]
}

export interface AdminUserDetail {
  profile: {
    id: string
    email: string
    estado: EstadoUsuario
    hasPaid: boolean
    manualPremium: boolean
    manualPremiumNote: string | null
    manualPremiumAt: string | null
    manualPremiumBy: string | null
    subscriptionStatus: string | null
    subscriptionCurrentPeriodEnd: string | null
    cancelAtPeriodEnd: boolean
    tieneStripe: boolean
    createdAt: string
  } | null
  cuadernos: {
    id: string
    centro: string | null
    docente: string | null
    cursoEscolar: string | null
    updatedAt: string
    createdAt: string
  }[]
  aiUsage: { day: string; count: number }[]
  audit: {
    id: number
    actor_email: string | null
    action: string
    target_email: string | null
    detail: Record<string, unknown>
    created_at: string
  }[]
}

async function mensajeDeError(e: unknown): Promise<string> {
  if (e instanceof FunctionsHttpError) {
    try {
      const body = await e.context.json()
      if (typeof body?.error === 'string') return body.error
    } catch {
      // cuerpo no era JSON
    }
  }
  return 'No se ha podido contactar con el servidor. Inténtalo de nuevo.'
}

export async function callAdmin<T>(action: AdminAction, payload: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.functions.invoke('admin-api', {
    body: { action, ...payload },
  })
  if (error) throw new Error(await mensajeDeError(error))
  // Algunas acciones devuelven { ok: false, error } sin código HTTP de error
  // (fallos "de negocio" recuperables, ej. Stripe rechaza la cancelación).
  if (data && typeof data === 'object' && 'ok' in data && data.ok === false) {
    throw new Error((data as { error?: string }).error || 'La operación no se pudo completar.')
  }
  return data as T
}
