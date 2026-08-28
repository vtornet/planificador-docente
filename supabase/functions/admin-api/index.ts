// Docenza · API del panel de administración.
//
// Una sola función para todo el panel: recibe { action, ...payload } por POST,
// verifica el JWT de quien llama, comprueba que profiles.is_admin sea true, y
// solo entonces opera con la service_role key (que salta RLS). Nunca confía en
// un user_id que mande el cliente para decidir QUIÉN llama — siempre se
// resuelve desde el token (mismo patrón que delete-account / create-portal-session).
//
// Acciones:
//   stats               -> números agregados para el resumen
//   list_users          -> { search?, page?, pageSize? } lista de usuarios + estado
//   user_detail         -> { targetUserId } cuadernos, uso de IA e historial de auditoría
//   set_manual_premium  -> { targetUserId, enabled, note? } concede/revoca premium manual
//   cancel_subscription -> { targetUserId, immediately? } cancela la suscripción de Stripe
//   delete_user         -> { targetUserId } borra la cuenta (cascada) + cancela Stripe
//
// Toda mutación queda registrada en admin_audit_log.
//
// Despliegue por CLI (para que el slug sea el nombre real de la carpeta):
//   npx supabase functions deploy admin-api --project-ref <tu-project-ref>
// Desactivar "Enforce JWT Verification" en el panel (el preflight OPTIONS no
// lleva JWT — mismo motivo que el resto de funciones).
//
// Secrets: ya configurados a nivel de proyecto — STRIPE_SECRET_KEY,
// SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY. No hace falta añadir nada.

import Stripe from 'npm:stripe@17'
import { createClient } from 'npm:@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-06-20',
})

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

// Precio anual de la suscripción, para la estimación de ingresos del resumen.
// (No se lee de Stripe en cada carga del panel para no añadir una llamada de
// red lenta a algo que cambia como mucho una vez al año.)
const PRECIO_ANUAL_EUR = 29.99

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'No autenticado' }, 401)

    const token = authHeader.replace('Bearer ', '')
    const {
      data: { user: actor },
      error: userError,
    } = await admin.auth.getUser(token)
    if (userError || !actor) return json({ error: 'No autenticado' }, 401)

    const { data: actorProfile } = await admin
      .from('profiles')
      .select('is_admin, email')
      .eq('id', actor.id)
      .single()

    if (!actorProfile?.is_admin) {
      return json({ error: 'Acceso restringido' }, 403)
    }

    const body = await req.json().catch(() => ({}))
    const action: string = body?.action

    switch (action) {
      case 'stats':
        return json(await getStats())
      case 'list_users':
        return json(await listUsers(body))
      case 'user_detail':
        return json(await userDetail(body))
      case 'set_manual_premium':
        return json(await setManualPremium(actor, actorProfile.email, body))
      case 'cancel_subscription':
        return json(await cancelSubscription(actor, actorProfile.email, body))
      case 'delete_user':
        return json(await deleteUser(actor, actorProfile.email, body))
      default:
        return json({ error: `Acción desconocida: ${action}` }, 400)
    }
  } catch (error) {
    console.error('Error en admin-api:', error)
    return json({ error: 'Error inesperado. Inténtalo de nuevo.' }, 500)
  }
})

// ============================================================================
// Datos auxiliares compartidos
// ============================================================================

/** Todos los perfiles (la tabla es pequeña: decenas de cuentas). */
async function getAllProfiles() {
  const { data, error } = await admin
    .from('profiles')
    .select(
      'id, email, is_admin, has_paid, manual_premium, manual_premium_note, manual_premium_at, manual_premium_by, subscription_status, subscription_current_period_end, cancel_at_period_end, stripe_subscription_id, stripe_customer_id, created_at'
    )
  if (error) throw error
  return data ?? []
}

/** Mapa user_id -> nº de cuadernos. */
async function getCuadernoCounts(): Promise<Record<string, number>> {
  const { data, error } = await admin.from('cuadernos').select('user_id')
  if (error) throw error
  const counts: Record<string, number> = {}
  for (const row of data ?? []) counts[row.user_id] = (counts[row.user_id] ?? 0) + 1
  return counts
}

/** Mapa user_id -> mensajes de IA hoy (UTC). */
async function getAiUsageToday(): Promise<Record<string, number>> {
  const today = new Date().toISOString().slice(0, 10)
  const { data, error } = await admin.from('ai_usage_daily').select('user_id, count').eq('day', today)
  if (error) throw error
  const usage: Record<string, number> = {}
  for (const row of data ?? []) usage[row.user_id] = (usage[row.user_id] ?? 0) + row.count
  return usage
}

/** Mapa user_id -> last_sign_in_at (de auth.users, vía Admin API). */
async function getAuthMeta(): Promise<Record<string, { lastSignInAt: string | null; createdAt: string }>> {
  const meta: Record<string, { lastSignInAt: string | null; createdAt: string }> = {}
  let page = 1
  // perPage 1000 es el máximo de la Admin API; el bucle cubre el caso (lejano)
  // de superar los 1000 usuarios sin cambiar nada.
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error
    for (const u of data.users) {
      meta[u.id] = { lastSignInAt: u.last_sign_in_at ?? null, createdAt: u.created_at }
    }
    if (data.users.length < 1000) break
    page += 1
  }
  return meta
}

// ============================================================================
// Acciones
// ============================================================================

async function getStats() {
  const [profiles, cuadernoCounts, aiToday] = await Promise.all([
    getAllProfiles(),
    getCuadernoCounts(),
    getAiUsageToday(),
  ])

  const now = Date.now()
  const dias = (d: number) => now - d * 24 * 60 * 60 * 1000

  const total = profiles.length
  const dePago = profiles.filter((p) => p.subscription_status === 'active' || p.subscription_status === 'trialing').length
  const trialing = profiles.filter((p) => p.subscription_status === 'trialing').length
  const manual = profiles.filter((p) => p.manual_premium).length
  const premiumTotal = profiles.filter((p) => p.has_paid).length
  const enPrueba = total - premiumTotal
  const pastDue = profiles.filter((p) => p.subscription_status === 'past_due' || p.subscription_status === 'unpaid').length
  const canceladas = profiles.filter((p) => p.subscription_status === 'canceled').length
  const programadasCancelar = profiles.filter((p) => p.cancel_at_period_end && p.has_paid).length

  const altas7 = profiles.filter((p) => new Date(p.created_at).getTime() >= dias(7)).length
  const altas30 = profiles.filter((p) => new Date(p.created_at).getTime() >= dias(30)).length

  // Ingreso anual estimado: suscripciones de pago realmente activas (no las
  // manuales, que no ingresan) por el precio anual.
  const suscripcionesQueIngresan = profiles.filter((p) => p.subscription_status === 'active').length
  const ingresoAnualEstimado = Math.round(suscripcionesQueIngresan * PRECIO_ANUAL_EUR)

  const cuadernosTotal = Object.values(cuadernoCounts).reduce((a, b) => a + b, 0)
  const aiMensajesHoy = Object.values(aiToday).reduce((a, b) => a + b, 0)

  // Uso de IA últimos 7 días + top usuarios.
  const desde7 = new Date(dias(7)).toISOString().slice(0, 10)
  const { data: aiRows } = await admin.from('ai_usage_daily').select('user_id, count, day').gte('day', desde7)
  const ai7PorUsuario: Record<string, number> = {}
  for (const r of aiRows ?? []) ai7PorUsuario[r.user_id] = (ai7PorUsuario[r.user_id] ?? 0) + r.count
  const aiMensajes7 = Object.values(ai7PorUsuario).reduce((a, b) => a + b, 0)
  const emailPorId = Object.fromEntries(profiles.map((p) => [p.id, p.email]))
  const topIaSemana = Object.entries(ai7PorUsuario)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count]) => ({ email: emailPorId[id] ?? id, count }))

  return {
    usuarios: { total, altas7, altas30 },
    premium: { total: premiumTotal, dePago, trialing, manual, enPrueba },
    suscripciones: { activas: suscripcionesQueIngresan, pastDue, canceladas, programadasCancelar },
    ingresoAnualEstimado,
    cuadernos: { total: cuadernosTotal, mediaPorUsuario: total ? Math.round((cuadernosTotal / total) * 10) / 10 : 0 },
    ia: { mensajesHoy: aiMensajesHoy, mensajes7: aiMensajes7, topSemana: topIaSemana },
  }
}

async function listUsers(body: { search?: string; page?: number; pageSize?: number }) {
  const search = (body.search ?? '').trim().toLowerCase()
  const page = Math.max(1, body.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, body.pageSize ?? 25))

  const [profiles, cuadernoCounts, aiToday, authMeta] = await Promise.all([
    getAllProfiles(),
    getCuadernoCounts(),
    getAiUsageToday(),
    getAuthMeta(),
  ])

  let rows = profiles.map((p) => ({
    id: p.id,
    email: p.email,
    isAdmin: p.is_admin,
    estado: estadoDe(p),
    hasPaid: p.has_paid,
    manualPremium: p.manual_premium,
    manualPremiumNote: p.manual_premium_note ?? null,
    subscriptionStatus: p.subscription_status ?? null,
    cancelAtPeriodEnd: p.cancel_at_period_end,
    subscriptionCurrentPeriodEnd: p.subscription_current_period_end ?? null,
    tieneStripe: !!p.stripe_subscription_id,
    cuadernos: cuadernoCounts[p.id] ?? 0,
    iaHoy: aiToday[p.id] ?? 0,
    createdAt: authMeta[p.id]?.createdAt ?? p.created_at,
    lastSignInAt: authMeta[p.id]?.lastSignInAt ?? null,
  }))

  if (search) rows = rows.filter((r) => r.email.toLowerCase().includes(search))
  rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const total = rows.length
  const start = (page - 1) * pageSize
  return { total, page, pageSize, users: rows.slice(start, start + pageSize) }
}

async function userDetail(body: { targetUserId?: string }) {
  const targetUserId = requireId(body.targetUserId)

  const [{ data: profile }, { data: cuadernos }, { data: aiRows }, { data: audit }] = await Promise.all([
    admin.from('profiles').select('*').eq('id', targetUserId).single(),
    admin
      .from('cuadernos')
      .select('id, metadata, updated_at, created_at')
      .eq('user_id', targetUserId)
      .order('updated_at', { ascending: false }),
    admin
      .from('ai_usage_daily')
      .select('day, count')
      .eq('user_id', targetUserId)
      .order('day', { ascending: false })
      .limit(30),
    admin
      .from('admin_audit_log')
      .select('*')
      .eq('target_user_id', targetUserId)
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  return {
    profile: profile
      ? {
          id: profile.id,
          email: profile.email,
          estado: estadoDe(profile),
          hasPaid: profile.has_paid,
          manualPremium: profile.manual_premium,
          manualPremiumNote: profile.manual_premium_note ?? null,
          manualPremiumAt: profile.manual_premium_at ?? null,
          manualPremiumBy: profile.manual_premium_by ?? null,
          subscriptionStatus: profile.subscription_status ?? null,
          subscriptionCurrentPeriodEnd: profile.subscription_current_period_end ?? null,
          cancelAtPeriodEnd: profile.cancel_at_period_end,
          tieneStripe: !!profile.stripe_subscription_id,
          createdAt: profile.created_at,
        }
      : null,
    cuadernos: (cuadernos ?? []).map((c) => ({
      id: c.id,
      centro: c.metadata?.centro ?? null,
      docente: c.metadata?.docente ?? null,
      cursoEscolar: c.metadata?.cursoEscolar ?? null,
      updatedAt: c.updated_at,
      createdAt: c.created_at,
    })),
    aiUsage: aiRows ?? [],
    audit: audit ?? [],
  }
}

async function setManualPremium(
  actor: { id: string },
  actorEmail: string | null,
  body: { targetUserId?: string; enabled?: boolean; note?: string }
) {
  const targetUserId = requireId(body.targetUserId)
  const enabled = !!body.enabled
  const note = (body.note ?? '').trim() || null

  const { data: target } = await admin.from('profiles').select('email').eq('id', targetUserId).single()

  const { data: updated, error } = await admin
    .from('profiles')
    .update({
      manual_premium: enabled,
      manual_premium_note: enabled ? note : null,
      manual_premium_at: enabled ? new Date().toISOString() : null,
      manual_premium_by: enabled ? actorEmail : null,
    })
    .eq('id', targetUserId)
    .select('id, manual_premium, has_paid, manual_premium_note')
    .single()
  if (error) throw error

  await logAction(actor.id, actorEmail, enabled ? 'grant_manual_premium' : 'revoke_manual_premium', targetUserId, target?.email, { note })

  return { ok: true, profile: updated }
}

async function cancelSubscription(
  actor: { id: string },
  actorEmail: string | null,
  body: { targetUserId?: string; immediately?: boolean }
) {
  const targetUserId = requireId(body.targetUserId)
  const immediately = !!body.immediately

  const { data: profile } = await admin
    .from('profiles')
    .select('email, stripe_subscription_id')
    .eq('id', targetUserId)
    .single()

  if (!profile?.stripe_subscription_id) {
    return { ok: false, error: 'Este usuario no tiene ninguna suscripción de Stripe.' }
  }

  try {
    if (immediately) {
      await stripe.subscriptions.cancel(profile.stripe_subscription_id)
    } else {
      await stripe.subscriptions.update(profile.stripe_subscription_id, { cancel_at_period_end: true })
    }
  } catch (e) {
    console.error('Error cancelando la suscripción:', e)
    return { ok: false, error: 'Stripe rechazó la cancelación. Revísalo en el panel de Stripe.' }
  }

  // El webhook actualizará subscription_status / cancel_at_period_end cuando
  // Stripe emita el evento; se refleja de inmediato aquí para que el panel no
  // muestre datos viejos hasta entonces.
  await admin
    .from('profiles')
    .update(immediately ? { subscription_status: 'canceled' } : { cancel_at_period_end: true })
    .eq('id', targetUserId)

  await logAction(actor.id, actorEmail, 'cancel_subscription', targetUserId, profile.email, { immediately })

  return { ok: true }
}

async function deleteUser(
  actor: { id: string },
  actorEmail: string | null,
  body: { targetUserId?: string }
) {
  const targetUserId = requireId(body.targetUserId)
  if (targetUserId === actor.id) {
    return { ok: false, error: 'No puedes eliminar tu propia cuenta desde el panel. Usa Perfil > Eliminar mi cuenta.' }
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('email, stripe_subscription_id')
    .eq('id', targetUserId)
    .single()

  if (profile?.stripe_subscription_id) {
    try {
      await stripe.subscriptions.cancel(profile.stripe_subscription_id)
    } catch (e) {
      const err = e as { code?: string; message?: string }
      const yaCancelada =
        err.code === 'resource_missing' ||
        (typeof err.message === 'string' && err.message.toLowerCase().includes('already'))
      if (!yaCancelada) {
        console.error('No se pudo cancelar la suscripción, no se borra la cuenta:', e)
        return { ok: false, error: 'No se pudo cancelar su suscripción de Stripe. No se ha borrado la cuenta.' }
      }
    }
  }

  // El registro de auditoría se escribe ANTES del borrado: admin_audit_log no
  // tiene FK a auth.users, así que sobrevive, pero conviene tener el email a
  // mano antes de que desaparezca el perfil en cascada.
  await logAction(actor.id, actorEmail, 'delete_user', targetUserId, profile?.email, {})

  const { error } = await admin.auth.admin.deleteUser(targetUserId)
  if (error) {
    console.error('Error borrando el usuario:', error)
    return { ok: false, error: 'No se pudo eliminar la cuenta. Inténtalo de nuevo.' }
  }

  return { ok: true }
}

// ============================================================================
// Utilidades
// ============================================================================

function estadoDe(p: {
  has_paid: boolean
  manual_premium: boolean
  subscription_status: string | null
  cancel_at_period_end: boolean
}): string {
  if (p.manual_premium) return 'manual'
  if (p.subscription_status === 'active') return p.cancel_at_period_end ? 'cancela_al_final' : 'activa'
  if (p.subscription_status === 'trialing') return 'trial'
  if (p.subscription_status === 'past_due' || p.subscription_status === 'unpaid') return 'impago'
  if (p.subscription_status === 'canceled') return 'cancelada'
  return 'prueba'
}

function requireId(id?: string): string {
  if (!id || typeof id !== 'string') throw new Error('Falta targetUserId')
  return id
}

async function logAction(
  actorId: string,
  actorEmail: string | null,
  action: string,
  targetUserId: string,
  targetEmail: string | null | undefined,
  detail: Record<string, unknown>
) {
  const { error } = await admin.from('admin_audit_log').insert({
    actor_id: actorId,
    actor_email: actorEmail,
    action,
    target_user_id: targetUserId,
    target_email: targetEmail ?? null,
    detail,
  })
  if (error) console.error('No se pudo escribir en admin_audit_log:', error)
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
