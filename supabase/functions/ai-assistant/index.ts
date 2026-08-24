// Asistente de IA para docentes (Fase 9).
// V1: solo Notas + Planificación. V2 (Agosto 2026): añade Horarios y
// Reuniones (los 4 módulos de la app tienen ya prompt propio), un límite
// diario de mensajes por cuenta (ver migración 0003_ai_usage_limit.sql) y
// un "contexto" opcional con lo que la docente está editando ahora mismo
// (ver src/stores/useEditorContextStore.ts en el cliente).
//
// Solo para cuentas con suscripción activa — comprueba profiles.has_paid
// igual que enforce_trial_limits lo hace en la base de datos, pero aquí
// bloqueando la llamada entera, no un alta concreta.
//
// Usa Groq (gratuita, sin tarjeta) en vez de una API de pago — decisión
// explícita del usuario. API compatible con el formato de chat de OpenAI.
// El modelo se ha tenido que cambiar ya una vez (24-08-2026) porque Groq
// retiró llama-3.3-70b-versatile para cuentas gratuitas/developer — si el
// asistente vuelve a devolver "no disponible", lo primero a comprobar es
// https://console.groq.com/docs/deprecations, no asumir que es otra cosa.
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

type Modulo = 'notas' | 'planificacion' | 'horarios' | 'reuniones' | 'general'

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
  horarios:
    'Eres un asistente para docentes españoles, especializado en horarios escolares: distribución de ' +
    'asignaturas a lo largo de la semana, equilibrio de carga por día, colocación de asignaturas que ' +
    'requieren más concentración a primera hora, y organización de recreos y tramos horarios. Responde ' +
    'siempre en español, con propuestas concretas, pensando en el sistema educativo español ' +
    '(Primaria/Secundaria).',
  reuniones:
    'Eres un asistente para docentes españoles, especializado en reuniones escolares (claustros, tutorías, ' +
    'equipos docentes, reuniones con familias): redacción de órdenes del día, resumen de acuerdos, actas, y ' +
    'sugerencias de puntos a tratar. Responde siempre en español, de forma breve, clara y profesional.',
  general:
    'Eres un asistente para docentes españoles que ayuda con la organización y planificación escolar en ' +
    'general (horarios, reuniones, tareas administrativas). Responde siempre en español, de forma breve y ' +
    'práctica.',
}

const HISTORIAL_MAXIMO = 10
const LIMITE_DIARIO = 30
// Tope generoso para el contexto (nota/semana en edición) — evita que un
// documento enorme dispare el límite de tokens de Groq o infle el coste;
// no hace falta más para dar contexto útil a la respuesta.
const CONTEXTO_MAXIMO = 4000

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
      return json({ error: 'El asistente de IA es solo para cuentas con suscripción activa.' }, 403)
    }

    // Atómico (upsert + RETURNING en una sola sentencia SQL) — evita que dos
    // peticiones concurrentes de la misma cuenta lean el mismo contador
    // antes de incrementarlo y se salten el límite entre las dos.
    const { data: dentroDelLimite, error: limiteError } = await supabaseAdmin.rpc('increment_ai_usage', {
      p_user_id: user.id,
      p_limite: LIMITE_DIARIO,
    })
    if (limiteError) {
      console.error('Error comprobando el límite diario de uso:', limiteError)
      return json({ error: 'Error inesperado. Inténtalo de nuevo.' }, 500)
    }
    if (!dentroDelLimite) {
      return json(
        { error: `Has alcanzado el límite de ${LIMITE_DIARIO} mensajes de hoy. El cupo se renueva mañana.` },
        429
      )
    }

    const body = await req.json()
    const mensaje: string = typeof body.mensaje === 'string' ? body.mensaje.trim() : ''
    const modulo: Modulo =
      body.modulo === 'notas' || body.modulo === 'planificacion' || body.modulo === 'horarios' || body.modulo === 'reuniones'
        ? body.modulo
        : 'general'
    const historialRecibido: { role: string; content: string }[] = Array.isArray(body.historial) ? body.historial : []
    const contexto: string = typeof body.contexto === 'string' ? body.contexto.trim().slice(0, CONTEXTO_MAXIMO) : ''

    if (!mensaje) {
      return json({ error: 'Falta el mensaje' }, 400)
    }

    const historial = historialRecibido
      .slice(-HISTORIAL_MAXIMO)
      .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')

    const messages = [{ role: 'system', content: SYSTEM_PROMPTS[modulo] }]
    if (contexto) {
      messages.push({
        role: 'system',
        content: `Esto es lo último que la docente ha editado en este módulo (puede estar incompleto o a medio escribir) — úsalo como contexto, pero responde solo a lo que te pregunte a continuación:\n\n${contexto}`,
      })
    }
    messages.push(...historial, { role: 'user', content: mensaje })

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('GROQ_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages,
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
