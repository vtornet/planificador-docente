import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Button } from '../ui/button'
import { supabase } from '../../lib/supabaseClient'
import { useAuthStore } from '../../stores/useAuthStore'
import { CreditCard, Sparkles } from 'lucide-react'

interface MiSuscripcionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MiSuscripcionDialog({ open, onOpenChange }: MiSuscripcionDialogProps) {
  const hasPaid = useAuthStore((s) => s.hasPaid)
  const subscriptionCurrentPeriodEnd = useAuthStore((s) => s.subscriptionCurrentPeriodEnd)
  const cancelAtPeriodEnd = useAuthStore((s) => s.cancelAtPeriodEnd)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSuscribirse = async () => {
    setCargando(true)
    setError(null)
    try {
      // El panel de Supabase le asignó a esta función el slug "smart-worker"
      // en vez de "create-checkout-session" al crearla (ver PaywallDialog.tsx).
      const { data, error: fnError } = await supabase.functions.invoke('smart-worker')
      if (fnError) throw fnError
      if (!data?.url) throw new Error('No se ha podido iniciar el pago')
      window.location.href = data.url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al iniciar el pago. Inténtalo de nuevo.')
      setCargando(false)
    }
  }

  const handleGestionar = async () => {
    setCargando(true)
    setError(null)
    try {
      const { data, error: fnError } = await supabase.functions.invoke('create-portal-session')
      if (fnError) throw fnError
      if (!data?.url) throw new Error('No se ha podido abrir la gestión de la suscripción')
      window.location.href = data.url
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'No se ha podido abrir la gestión de la suscripción. Inténtalo de nuevo.'
      )
      setCargando(false)
    }
  }

  const fechaPeriodo = subscriptionCurrentPeriodEnd
    ? format(new Date(subscriptionCurrentPeriodEnd), "d 'de' MMMM 'de' yyyy", { locale: es })
    : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Mi Suscripción
          </DialogTitle>
        </DialogHeader>

        {hasPaid ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Sparkles className="w-4 h-4 text-primary" />
              Premium — acceso completo
            </div>
            {fechaPeriodo && (
              <p className="text-sm text-muted-foreground">
                {cancelAtPeriodEnd ? (
                  <>
                    Tu suscripción finaliza el <strong className="text-foreground">{fechaPeriodo}</strong> y no se
                    renovará.
                  </>
                ) : (
                  <>
                    Se renueva automáticamente el <strong className="text-foreground">{fechaPeriodo}</strong>.
                  </>
                )}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Prueba gratuita</p>
            <p className="text-sm text-muted-foreground">
              Puedes crear 1 elemento por módulo (Horarios, Reuniones, Notas, Planificación y Agenda). Suscríbete
              para desbloquearlo todo sin límite, con sincronización entre tus dispositivos y el asistente de IA.
            </p>
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <DialogFooter>
          {hasPaid ? (
            <Button onClick={handleGestionar} disabled={cargando}>
              {cargando ? 'Un momento…' : 'Gestionar suscripción'}
            </Button>
          ) : (
            <Button onClick={handleSuscribirse} disabled={cargando}>
              {cargando ? 'Un momento…' : 'Suscribirme'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
