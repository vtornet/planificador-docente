// Genera un enlace al Portal de Facturación de Stripe para el usuario
// autenticado que la invoca: desde ahí puede cancelar/reactivar su
// suscripción, cambiar de tarjeta y ver sus facturas — todo resuelto por
// Stripe, sin construir nada de eso a mano en la app. Nunca confía en un
// user_id que mande el cliente — lo resuelve a partir del JWT de la
// petición, así que solo se puede gestionar la suscripción propia.
//
// Requiere tener el "Customer portal" activado y configurado en el panel de
// Stripe (Settings > Billing > Customer portal) — es una configuración
// independiente en modo test y en modo live, hay que hacerla en los dos.
// La cancelación debe configurarse ahí como "al final del periodo", no
// inmediata (decisión explícita del proyecto, ver CLAUDE.md).
//
// Despliegue por CLI (para que el slug de la URL sea el nombre real de la
// carpeta, no uno aleatorio — ver el aviso ya documentado para
// create-checkout-session/stripe-webhook):
//   npx supabase functions deploy create-portal-session --project-ref <tu-project-ref>
// Recuerda desactivar "Enforce JWT Verification" en el panel — el preflight
// OPTIONS del navegador nunca lleva JWT (mismo motivo que el resto).
//
// Secrets: ya configurados a nivel de proyecto (compartidos con el resto de
// funciones) — STRIPE_SECRET_KEY, SITE_URL, SUPABASE_URL,
// SUPABASE_SERVICE_ROLE_KEY. No hace falta añadir nada nuevo.

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
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_customer_id) {
      return json({ error: 'No se encontró ninguna suscripción asociada a esta cuenta' }, 400)
    }

    const siteUrl = Deno.env.get('SITE_URL') || 'http://localhost:5173'

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${siteUrl}/?portal=return`,
    })

    return json({ url: session.url })
  } catch (error) {
    console.error('Error creando sesión del portal de facturación:', error)
    return json({ error: 'No se ha podido abrir la gestión de la suscripción' }, 500)
  }
})

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
