// Recibe los eventos del ciclo de vida de la suscripción de Stripe y
// mantiene profiles.subscription_status al día — has_paid se deriva de esa
// columna (ver supabase/migrations/0002_subscription.sql), así que aquí
// nunca se escribe has_paid directamente.
//
// Configura este endpoint en Stripe (Developers > Webhooks) escuchando:
//   checkout.session.completed
//   customer.subscription.updated
//   customer.subscription.deleted
// (los impagos ya se reflejan solos como customer.subscription.updated con
// status "past_due", no hace falta escuchar invoice.payment_failed aparte).
//
// Secrets necesarios, configúralos tú mismo (nunca los pegues en el chat):
//   STRIPE_SECRET_KEY
//   STRIPE_WEBHOOK_SECRET   el "signing secret" que da Stripe al crear el
//                           endpoint del webhook — es lo único que evita que
//                           cualquiera falsifique un pago llamando a esta URL.

import Stripe from 'npm:stripe@17'
import { createClient } from 'npm:@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-06-20',
})

const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return new Response('Falta la firma', { status: 400 })
  }

  const body = await req.text()
  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
  } catch (err) {
    console.error('Firma de Stripe inválida:', err)
    return new Response('Firma inválida', { status: 400 })
  }

  console.log(`Evento de Stripe recibido: ${event.type}`)

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        // client_reference_id debería venir siempre (lo pone
        // create-checkout-session), pero si por lo que sea faltara, se
        // resuelve igualmente por el customer de Stripe — mismo mecanismo
        // que ya usan los eventos de subscription.updated/deleted.
        const userId = session.client_reference_id || (await resolverUserIdPorCustomer(session.customer as string))
        console.log(`checkout.session.completed → userId=${userId}, subscription=${session.subscription}`)
        if (userId && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
          await actualizarSuscripcion(userId, subscription)
        } else {
          console.error('No se pudo resolver el usuario o falta la suscripción en la sesión de checkout')
        }
        break
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = await resolverUserIdPorCustomer(subscription.customer as string)
        console.log(`${event.type} → userId=${userId}, status=${subscription.status}`)
        if (userId) {
          await actualizarSuscripcion(userId, subscription)
        } else {
          console.error(`No se encontró ningún profile con stripe_customer_id=${subscription.customer}`)
        }
        break
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error procesando el evento de Stripe:', error)
    return new Response('Error interno', { status: 500 })
  }
})

async function resolverUserIdPorCustomer(customerId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle()
  if (error) console.error('Error buscando profile por stripe_customer_id:', error)
  return data?.id ?? null
}

async function actualizarSuscripcion(userId: string, subscription: Stripe.Subscription) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({
      stripe_subscription_id: subscription.id,
      subscription_status: subscription.status,
      subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      // Cancelar desde el Portal de Facturación no cambia subscription_status
      // de inmediato (sigue "active" hasta que el periodo ya pagado termina
      // de verdad) — sin este flag, "Mi Suscripción" no podría distinguir
      // "se renueva sola" de "termina el DD/MM y no se renovará".
      cancel_at_period_end: subscription.cancel_at_period_end,
    })
    .eq('id', userId)
    .select('id')

  if (error) {
    console.error(`Error actualizando profile ${userId}:`, error)
  } else if (!data || data.length === 0) {
    // update() no da error cuando no encuentra filas que coincidan — sin este
    // aviso, un userId equivocado fallaría en silencio (200 a Stripe, pero
    // sin escribir nada de verdad).
    console.error(`No existe ningún profile con id=${userId}, no se ha actualizado nada`)
  } else {
    console.log(`profile ${userId} actualizado: subscription_status=${subscription.status}`)
  }
}
