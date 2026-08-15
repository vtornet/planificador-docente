import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Button } from '../ui/button'
import { supabase } from '../../lib/supabaseClient'
import { Sparkles } from 'lucide-react'

interface PaywallDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  // Nombre del módulo en plural, para el mensaje (ej. "horarios", "notas").
  modulo: string
}

export function PaywallDialog({ open, onOpenChange, modulo }: PaywallDialogProps) {
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSuscribirse = async () => {
    setCargando(true)
    setError(null)
    try {
      // El panel de Supabase le asignó a la función el slug "smart-worker" en
      // vez de "create-checkout-session" al crearla (el nombre que se
      // escribe al crearla es solo una etiqueta, no la URL) — si algún día
      // se borra y se vuelve a crear con el nombre bien puesto, cambiar esto.
      const { data, error: fnError } = await supabase.functions.invoke('smart-worker')
      if (fnError) throw fnError
      if (!data?.url) throw new Error('No se ha podido iniciar el pago')
      window.location.href = data.url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al iniciar el pago. Inténtalo de nuevo.')
      setCargando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Has llegado al límite de la prueba
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Durante la prueba gratuita puedes crear 1 elemento en {modulo}. Suscríbete para
          desbloquear todos los módulos sin límite, con sincronización entre tus dispositivos.
        </p>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={cargando}>
            Ahora no
          </Button>
          <Button onClick={handleSuscribirse} disabled={cargando}>
            {cargando ? 'Un momento…' : 'Suscribirme'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
