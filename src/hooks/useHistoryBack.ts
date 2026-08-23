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
}
