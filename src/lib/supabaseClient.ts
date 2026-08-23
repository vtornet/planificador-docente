import { AuthClient } from '@supabase/auth-js'
import { PostgrestClient } from '@supabase/postgrest-js'
import { FunctionsClient } from '@supabase/functions-js'

// Cliente mínimo, compuesto a mano con los mismos paquetes de bajo nivel que
// usa `@supabase/supabase-js` por dentro (Auth + Postgrest + Functions), en
// vez de `createClient()` del paquete umbrella — ese paquete instancia
// siempre, sin condición, también Storage y Realtime (con su dependencia
// `phoenix`) aunque nunca se usen en Docenza (no hay subida de ficheros a
// Supabase Storage, ni suscripciones en tiempo real — la sincronización es
// "pull" bajo demanda, ver src/sync/syncCuaderno.ts), ~260 KB sin minificar
// de código muerto en el chunk principal, que de paso arrastraban los
// polyfills de Node (Buffer/global) que si no solo harían falta en el chunk
// de exportación a PDF.
//
// La lógica replicada aquí (fetchWithAuth, la clave de localStorage de la
// sesión, flowType) está calcada del código fuente real de
// @supabase/supabase-js@2.112.3 (node_modules/@supabase/supabase-js/dist/index.mjs,
// función `fetchWithAuth` y constructor de `SupabaseClient`) — no adivinada.
// Si se actualiza la versión de estos paquetes, conviene revisar que ese
// archivo no haya cambiado esta lógica antes de dar por buena esta réplica.

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error(
    'Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copia .env.example a .env y rellena los valores de tu proyecto de Supabase.'
  )
}

const baseUrl = new URL(url.endsWith('/') ? url : `${url}/`)
const authUrl = new URL('auth/v1', baseUrl).href
const restUrl = new URL('rest/v1', baseUrl).href
const functionsUrl = new URL('functions/v1', baseUrl).href

// Misma clave que ya usaba `createClient()` (`sb-<primer-segmento-del-host>-auth-token`)
// — imprescindible mantenerla igual, o las sesiones ya guardadas en
// localStorage de quien ya había iniciado sesión antes de este cambio
// dejarían de encontrarse y parecerían "cerradas".
const storageKey = `sb-${baseUrl.hostname.split('.')[0]}-auth-token`

const headers = { 'X-Client-Info': 'docenza-thin-client' }

export const auth = new AuthClient({
  url: authUrl,
  headers: { Authorization: `Bearer ${anonKey}`, apikey: anonKey, ...headers },
  storageKey,
  autoRefreshToken: true,
  persistSession: true,
  detectSessionInUrl: true,
  flowType: 'implicit',
})

// Reinyecta el token de sesión vigente (o la clave anónima si no hay sesión)
// en cada petición a Postgrest/Functions — igual que `fetchWithAuth` dentro
// de `SupabaseClient`, pidiéndolo de nuevo en cada llamada (nunca cacheado)
// para que el refresco automático de `auth` se refleje sin más.
function fetchConAuth(): typeof fetch {
  return async (input, init) => {
    const {
      data: { session },
    } = await auth.getSession()
    const requestHeaders = new Headers(init?.headers)
    if (!requestHeaders.has('apikey')) requestHeaders.set('apikey', anonKey)
    if (!requestHeaders.has('Authorization')) {
      requestHeaders.set('Authorization', `Bearer ${session?.access_token ?? anonKey}`)
    }
    return fetch(input, { ...init, headers: requestHeaders })
  }
}

const rest = new PostgrestClient(restUrl, {
  headers,
  schema: 'public',
  fetch: fetchConAuth(),
})

const functionsFetch = fetchConAuth()

export const supabase = {
  auth,
  from: (relation: string) => rest.from(relation),
  get functions() {
    return new FunctionsClient(functionsUrl, { headers, customFetch: functionsFetch })
  },
}
