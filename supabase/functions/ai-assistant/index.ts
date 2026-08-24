// Asistente de IA para docentes (Fase 9, V1: Notas + Planificación).
// Solo para cuentas con suscripción activa — comprueba profiles.has_paid
// igual que enforce_trial_limits lo hace en la base de datos, pero aquí
// bloqueando la llamada entera, no un alta concreta.
//
// Usa Groq (gratuita, sin tarjeta) en vez de una API de pago — decisión
// explícita del usuario. API compatible con el formato de chat de OpenAI.
//
// Despliegue recomendado por CLI, no por "Via Editor" del panel (ese editor
// asignó slugs aleatorios a create-checkout-session/stripe-webhook la vez
// anterior, ver CLAUDE.md):
//   npx supabase functions deploy ai-assistant --project-ref <tu-project-ref>
//
// Secrets necesarios, configúralos tú mismo (nunca los pegues en el chat):
//   GROQ_API_KEY   desde console.groq.com, gratis, sin tarjeta.
// SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY los inyecta Supabase automáticamente.
//
// Recuerda desactivar "Enforce JWT Verification" para esta función en el
// panel — el preflight OPTIONS del navegador nunca lleva JWT, así que si se
// deja activada, el propio gateway de Supabase bloquea la petición antes de
// que este código llegue a ejecutarse (mismo problema que ya se resolvió
// para create-checkout-session y stripe-webhook).

import { createClient } from 'npm:@supabase/supabase-js@2'

const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type Modulo = 'notas' | 'planificacion' | 'general'

const SYSTEM_PROMPTS: Record<Modulo, string> = {
  notas:
    'Eres un asistente para docentes españoles, especializado en ayudar con notas y textos: corrección ' +
    'ortográfica y gramatical, mejora de redacción, e ideas de contenido para notas de clase (proyectos, ' +
    'actividades, recordatorios). Responde siempre en español, de forma breve y práctica, pensando en una ' +
    'docente con poco tiempo entre clases.',
  planificacion:
    'Eres un asistente para docentes españoles, especializado en planificación de actividades escolares: ' +
    'sugerencias de actividades por curso y asignatura, adaptaciones, dinámicas de aula, distribución de ' +
    'tiempo por sesión. Responde siempre en español, con propuestas concretas y aplicables, pensando en el ' +
    'sistema educativo español (Primaria/Secundaria).',
  general:
    'Eres un asistente para docentes españoles que ayuda con la organización y planificación escolar en ' +
    'general (horarios, reuniones, tareas administrativas). Responde siempre en español, de forma breve y ' +
    'práctica.',
}

const HISTORIAL_MAXIMO = 10

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

    const { data: profile } = await supabaseAdmin.from('profiles').select('has_paid').eq('id', user.id).single()
    if (!profile?.has_paid) {
      return json({ error: 'requiere_suscripcion' }, 403)
    }

    const body = await req.json()
    const mensaje: string = typeof body.mensaje === 'string' ? body.mensaje.trim() : ''
    const modulo: Modulo = body.modulo === 'notas' || body.modulo === 'planificacion' ? body.modulo : 'general'
    const historialRecibido: { role: string; content: string }[] = Array.isArray(body.historial) ? body.historial : []

    if (!mensaje) {
      return json({ error: 'Falta el mensaje' }, 400)
    }

    const historial = historialRecibido
      .slice(-HISTORIAL_MAXIMO)
      .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('GROQ_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [{ role: 'system', content: SYSTEM_PROMPTS[modulo] }, ...historial, { role: 'user', content: mensaje }],
        temperature: 0.7,
        max_tokens: 800,
      }),
    })

    if (!groqResponse.ok) {
      const detalle = await groqResponse.text()
      console.error(`Groq respondió ${groqResponse.status}:`, detalle)
      if (groqResponse.status === 429) {
        return json({ error: 'El asistente está muy solicitado ahora mismo. Inténtalo de nuevo en un momento.' }, 429)
      }
      return json({ error: 'El asistente no está disponible ahora mismo. Inténtalo de nuevo.' }, 502)
    }

    const data = await groqResponse.json()
    const respuesta: string = data.choices?.[0]?.message?.content?.trim() || ''

    return json({ respuesta })
  } catch (error) {
    console.error('Error en ai-assistant:', error)
    return json({ error: 'Error inesperado. Inténtalo de nuevo.' }, 500)
  }
})

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
