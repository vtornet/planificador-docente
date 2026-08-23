// Borra la cuenta del usuario autenticado que la invoca: cancela su
// suscripción de Stripe de inmediato (si tiene una) y borra el usuario de
// Supabase Auth, que arrastra en cascada su fila de `profiles` y todos sus
// `cuadernos` (FK on delete cascade, 0001_init.sql). Nunca confía en un
// user_id que mande el cliente — lo resuelve a partir del JWT de la
// petición, así que solo se puede borrar la cuenta propia.
//
// Decisión explícita del usuario: cancelar la suscripción de inmediato, no
// al final del periodo pagado — si la cancelación falla por un motivo real
// (no por estar ya cancelada), se aborta SIN borrar la cuenta, para no
// dejar nunca a una docente pagando sin ninguna cuenta desde la que
// gestionarlo.
//
// Despliegue por CLI (no por "Via Editor" del panel, ver CLAUDE.md):
//   npx supabase functions deploy delete-account --project-ref <tu-project-ref>
// Recuerda desactivar "Enforce JWT Verification" para esta función en el
// panel — el preflight OPTIONS del navegador nunca lleva JWT (mismo motivo
// que create-checkout-session/stripe-webhook/ai-assistant).
//
// Secrets: ya configurados a nivel de proyecto (compartidos con el resto de
// funciones) — STRIPE_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
// No hace falta añadir nada nuevo.

import Stripe from 'npm:stripe@17'
import { createClient } from 'npm:@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-06-20',
})

const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

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
    if (!authHeader) {
      return json({ error: 'No autenticado' }, 401)
    }

    const token = authHeader.replace('Bearer ', '')
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token)
    if (userError || !user) {
      return json({ error: 'No autenticado' }, 401)
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_subscription_id')
      .eq('id', user.id)
      .single()

    if (profile?.stripe_subscription_id) {
      try {
        await stripe.subscriptions.cancel(profile.stripe_subscription_id)
      } catch (e) {
        const stripeError = e as { code?: string; message?: string }
        // "Ya estaba cancelada" (ej. un impago ya la había cerrado antes) no
        // es un fallo real — el objetivo (que no se siga cobrando) ya está
        // conseguido, así que se continúa borrando la cuenta. Cualquier otro
        // fallo (red, Stripe caído...) SÍ aborta: mejor no borrar la cuenta
        // todavía que dejarla borrada con la suscripción activa y sin nadie
        // que pueda gestionarla.
        const yaCancelada =
          stripeError.code === 'resource_missing' ||
          (typeof stripeError.message === 'string' && stripeError.message.toLowerCase().includes('already'))
        if (!yaCancelada) {
          console.error('No se pudo cancelar la suscripción de Stripe, no se borra la cuenta:', e)
          return json({ error: 'No se pudo cancelar tu suscripción. Inténtalo de nuevo o contacta con soporte.' }, 500)
        }
      }
    }

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
    if (deleteError) {
      console.error('Error borrando el usuario:', deleteError)
      return json({ error: 'No se pudo eliminar la cuenta. Inténtalo de nuevo.' }, 500)
    }

    return json({ ok: true })
  } catch (error) {
    console.error('Error en delete-account:', error)
    return json({ error: 'Error inesperado. Inténtalo de nuevo.' }, 500)
  }
})

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
