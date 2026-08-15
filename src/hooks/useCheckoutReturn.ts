import { useEffect, useState } from 'react'
import { useAuthStore } from '../stores/useAuthStore'

type EstadoCheckout = 'esperando' | 'confirmado' | 'timeout' | 'cancelado' | null

const INTENTOS = 6
const ESPERA_MS = 1500

/**
 * Detecta la vuelta desde Stripe Checkout (?checkout=success|cancel en la
 * URL) y, si fue con éxito, sondea has_paid unos segundos — el webhook de
 * Stripe puede tardar un instante en llegar tras la redirección, así que no
 * basta con confiar en la propia URL de retorno (que además se podría
 * falsificar a mano; la fuente de verdad real es siempre lo que escribe el
 * webhook firmado en la base de datos).
 */
export function useCheckoutReturn(): EstadoCheckout {
  const refreshProfile = useAuthStore((s) => s.refreshProfile)
  const hasPaid = useAuthStore((s) => s.hasPaid)
  const [estado, setEstado] = useState<EstadoCheckout>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const checkout = params.get('checkout')
    if (!checkout) return

    // Limpia el parámetro de la URL para no repetir el sondeo si se recarga.
    params.delete('checkout')
    const nuevaUrl = `${window.location.pathname}${params.toString() ? `?${params}` : ''}`
    window.history.replaceState({}, '', nuevaUrl)

    if (checkout === 'cancel') {
      setEstado('cancelado')
      return
    }

    if (checkout !== 'success') return

    setEstado('esperando')
    let intentos = 0
    const intervalo = setInterval(async () => {
      intentos++
      await refreshProfile()
      if (useAuthStore.getState().hasPaid) {
        setEstado('confirmado')
        clearInterval(intervalo)
      } else if (intentos >= INTENTOS) {
        setEstado('timeout')
        clearInterval(intervalo)
      }
    }, ESPERA_MS)

    return () => clearInterval(intervalo)
    // Solo debe ejecutarse una vez al montar (lee la URL una única vez).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return hasPaid && estado === 'esperando' ? 'confirmado' : estado
}
