import { useEffect, useRef } from 'react'
import { pushBackEntry, resolveBackEntry, type BackEntry } from './backNavigationStack'

/**
 * Engancha un estado "abierto" (ej. un Dialog) a la pila compartida de
 * historial (ver `backNavigationStack.ts`) para que el botón/gesto físico de
 * "atrás" de Android lo cierre en vez de cerrar la app entera.
 *
 * `active`: true mientras el estado debe considerarse "una pantalla abierta".
 * `onBack`: se llama solo cuando el cierre lo dispara el botón atrás — si se
 * cierra por otro medio (X, click fuera, Escape), quien llama a este hook ya
 * ha actualizado su propio estado, y este hook solo sincroniza el historial.
 */
export function useHistoryBack(active: boolean, onBack: () => void) {
  const entryRef = useRef<BackEntry | null>(null)
  const onBackRef = useRef(onBack)
  onBackRef.current = onBack

  useEffect(() => {
    if (active && !entryRef.current) {
      entryRef.current = pushBackEntry(() => onBackRef.current())
    } else if (!active && entryRef.current) {
      resolveBackEntry(entryRef.current)
      entryRef.current = null
    }
  }, [active])

  // Si el componente desaparece de golpe sin que `active` pase antes por
  // `false` (ej. App.tsx cambia de pantalla entera al cerrar sesión o borrar
  // la cuenta, desmontando un Dialog que seguía abierto), el efecto de
  // arriba nunca llega a resolver la entrada — se quedaría huérfana en la
  // pila compartida para siempre, descuadrando la profundidad del historial
  // real de ahí en adelante. Este efecto de solo-montaje, con limpieza en el
  // desmontaje, cubre exactamente ese caso sin interferir con el resuelto
  // normal de arriba (si ya se resolvió, entryRef.current ya es null aquí).
  useEffect(() => {
    return () => {
      if (entryRef.current) {
        resolveBackEntry(entryRef.current)
        entryRef.current = null
      }
    }
  }, [])
}
