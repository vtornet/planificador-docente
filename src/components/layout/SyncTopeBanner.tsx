import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useSyncStatusStore } from '../../stores/useSyncStatusStore'
import { PaywallDialog } from '../paywall/PaywallDialog'

/**
 * Aviso visible cuando el cuaderno tiene más contenido del que permite la
 * prueba gratuita y por eso no se puede sincronizar entre dispositivos —
 * antes de esto, ese fallo solo quedaba en `console.error` (ver
 * syncCuaderno.ts), invisible para la docente. No bloquea nada: los datos
 * siguen guardados y editables en este dispositivo con normalidad, solo
 * avisa de que no viajan a los demás hasta suscribirse.
 */
export function SyncTopeBanner() {
  const bloqueado = useSyncStatusStore((s) => s.bloqueadoPorTope)
  const [showPaywall, setShowPaywall] = useState(false)

  if (!bloqueado) return null

  return (
    <>
      <div className="mx-4 md:mx-6 mt-4 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1">
          Tienes más contenido del que permite la prueba gratuita — se ha guardado en este
          dispositivo, pero no se sincroniza con tus otros dispositivos hasta que te suscribas.
        </span>
        <button
          onClick={() => setShowPaywall(true)}
          className="font-medium underline underline-offset-2 hover:no-underline flex-shrink-0"
        >
          Suscribirme
        </button>
      </div>
      <PaywallDialog open={showPaywall} onOpenChange={setShowPaywall} modulo="tu cuaderno" />
    </>
  )
}
