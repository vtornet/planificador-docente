// Persistencia local (localStorage) del historial de chat del asistente de
// IA, uno por cuenta+módulo — cada módulo (Notas, Planificación, Horarios,
// Reuniones) recuerda su propia conversación, coherente con que cada uno
// tiene su propio prompt de sistema en el servidor. Deliberadamente NO
// sincronizado a Supabase: es un historial de chat, no contenido del
// cuaderno, y así se evita una tabla/migración nueva para algo que no
// necesita viajar entre dispositivos (mismo criterio que el tema
// claro/oscuro, que también vive solo en localStorage).
export interface Mensaje {
  role: 'user' | 'assistant'
  content: string
}

export type ModuloAsistente = 'notas' | 'planificacion' | 'horarios' | 'reuniones' | 'general'

// Tope de mensajes guardados por módulo — el servidor ya recorta a los
// últimos 10 al construir el prompt (ver ai-assistant/index.ts), esto solo
// evita que localStorage crezca sin límite en una conversación muy larga.
const MAXIMO_GUARDADO = 40

function claveHistorial(userId: string, modulo: ModuloAsistente): string {
  return `docenza-asistente-${userId}-${modulo}`
}

export function cargarHistorial(userId: string, modulo: ModuloAsistente): Mensaje[] {
  try {
    const raw = localStorage.getItem(claveHistorial(userId, modulo))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (m): m is Mensaje => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string'
    )
  } catch {
    return []
  }
}

export function guardarHistorial(userId: string, modulo: ModuloAsistente, mensajes: Mensaje[]): void {
  try {
    localStorage.setItem(claveHistorial(userId, modulo), JSON.stringify(mensajes.slice(-MAXIMO_GUARDADO)))
  } catch {
    // localStorage lleno o no disponible (modo privado...) — el chat sigue
    // funcionando en memoria, solo no persiste. No es un fallo que deba
    // interrumpir nada.
  }
}

export function limpiarHistorial(userId: string, modulo: ModuloAsistente): void {
  localStorage.removeItem(claveHistorial(userId, modulo))
}
