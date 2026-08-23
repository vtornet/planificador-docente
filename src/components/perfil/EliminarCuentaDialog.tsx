import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { AlertTriangle } from 'lucide-react'
import { eliminarCuentaPropia } from '../../sync/deleteAccount'

interface EliminarCuentaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const FRASE_CONFIRMACION = 'ELIMINAR'

/**
 * Borrado de cuenta con autoservicio, sin depender de escribir un email
 * (antes solo se podía pedir a contact@appstracta.app, ver
 * PoliticaPrivacidad.tsx). Acción irreversible — de ahí el "escribe X para
 * confirmar" en vez de un simple botón, igual de deliberado que el aviso ya
 * existente en ImportDialog.tsx para reemplazar todos los datos, pero un
 * paso más estricto porque esto no se puede deshacer reimportando un backup.
 */
export function EliminarCuentaDialog({ open, onOpenChange }: EliminarCuentaDialogProps) {
  const [confirmacion, setConfirmacion] = useState('')
  const [borrando, setBorrando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClose = (nextOpen: boolean) => {
    if (borrando) return
    if (!nextOpen) {
      setConfirmacion('')
      setError(null)
    }
    onOpenChange(nextOpen)
  }

  const handleEliminar = async () => {
    setBorrando(true)
    setError(null)
    const resultado = await eliminarCuentaPropia()
    if (!resultado.ok) {
      setError(resultado.error)
      setBorrando(false)
      return
    }
    // Éxito: App.tsx ya redirige sola a la pantalla de login en cuanto
    // useAuthStore.user pasa a null (ver eliminarCuentaPropia) — no hace
    // falta cerrar el diálogo a mano, el propio Layout deja de renderizarse.
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Eliminar cuenta
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            Se eliminará tu cuenta, tu suscripción (si tienes una, se cancela de inmediato) y todos
            tus cuadernos, tanto en la nube como en este dispositivo. <strong>Esta acción no se puede
            deshacer.</strong> Si solo quieres guardar una copia antes, expórtala primero desde
            Exportar.
          </p>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              Escribe <strong>{FRASE_CONFIRMACION}</strong> para confirmar
            </label>
            <Input
              value={confirmacion}
              onChange={(e) => setConfirmacion(e.target.value)}
              disabled={borrando}
              autoComplete="off"
            />
          </div>
          {error && (
            <p className="text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={borrando}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleEliminar}
            disabled={borrando || confirmacion !== FRASE_CONFIRMACION}
          >
            {borrando ? 'Eliminando…' : 'Eliminar mi cuenta'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
