import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Button } from '../ui/button'
import { useAuthStore } from '../../stores/useAuthStore'
import { TRIAL_LIMIT_PER_MODULE } from '../../constants/trial'
import type { CuadernoDocente } from '../../types'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'

interface CuadernoLocalRow {
  id: string
  metadata: { cursoEscolar: string; centro: string; docente: string }
  data: unknown
}

interface ClaimLocalDataDialogProps {
  cuadernos: CuadernoLocalRow[]
  // Se llama tanto al confirmar como al declinar — en ambos casos deja de
  // bloquear la carga normal de la app (ver App.tsx).
  onResuelto: () => void
}

function contarModulos(cuaderno: CuadernoDocente) {
  return {
    horarios: cuaderno.horarios?.length || 0,
    reuniones: cuaderno.reuniones?.length || 0,
    notas: cuaderno.notas?.length || 0,
    semanas: cuaderno.planificacion?.semanal?.length || 0,
    eventos: (cuaderno.eventos || []).length,
  }
}

function superaTope(conteo: ReturnType<typeof contarModulos>): boolean {
  return Object.values(conteo).some((n) => n > TRIAL_LIMIT_PER_MODULE)
}

export function ClaimLocalDataDialog({ cuadernos, onResuelto }: ClaimLocalDataDialogProps) {
  const hasPaid = useAuthStore((s) => s.hasPaid)
  const [subiendo, setSubiendo] = useState(false)
  const [resultado, setResultado] = useState<Record<string, { subido: boolean; error?: string }> | null>(null)

  const handleSubir = async () => {
    setSubiendo(true)
    const { reclamarCuadernoLocal } = await import('../../sync/syncCuaderno')
    const nuevoResultado: Record<string, { subido: boolean; error?: string }> = {}
    for (const fila of cuadernos) {
      nuevoResultado[fila.id] = await reclamarCuadernoLocal(fila.data as CuadernoDocente)
    }
    setResultado(nuevoResultado)
    setSubiendo(false)
  }

  // Fase 2: resultado tras confirmar — qué se subió y qué se quedó pendiente.
  if (resultado) {
    return (
      <Dialog open onOpenChange={() => {}}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Cuadernos asociados a tu cuenta</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {cuadernos.map((fila) => {
              const r = resultado[fila.id]
              return (
                <div key={fila.id} className="flex items-start gap-2 text-sm">
                  {r?.subido ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="text-foreground">{fila.metadata.centro}</span>
                    {!r?.subido && (
                      <p className="text-xs text-muted-foreground">
                        Guardado en este dispositivo, pero necesita suscripción para sincronizarse del todo
                        (supera el límite de la prueba gratuita).
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          <DialogFooter>
            <Button onClick={onResuelto}>Continuar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  // Fase 1: vista previa, sin confirmar todavía.
  return (
    <Dialog open onOpenChange={() => {}}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Hemos encontrado {cuadernos.length === 1 ? 'un cuaderno' : `${cuadernos.length} cuadernos`} en este
            dispositivo
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Son de antes de tener cuenta — se guardaban solo en este navegador. ¿Quieres asociarlos a tu cuenta para
          que se sincronicen entre tus dispositivos y no se pierdan?
        </p>
        <div className="space-y-2 max-h-56 overflow-y-auto">
          {cuadernos.map((fila) => {
            const cuaderno = fila.data as CuadernoDocente
            const conteo = contarModulos(cuaderno)
            const avisar = !hasPaid && superaTope(conteo)
            return (
              <div key={fila.id} className="px-3 py-2 bg-muted rounded-lg text-sm">
                <div className="font-medium text-foreground">{fila.metadata.centro}</div>
                <div className="text-xs text-muted-foreground">
                  {fila.metadata.cursoEscolar} · {fila.metadata.docente} · {conteo.horarios} horarios,{' '}
                  {conteo.reuniones} reuniones, {conteo.notas} notas, {conteo.semanas} semanas, {conteo.eventos}{' '}
                  eventos
                </div>
                {avisar && (
                  <div className="text-xs text-amber-700 dark:text-amber-400 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                    Supera el límite de la prueba gratuita — necesitarás suscribirte para que se sincronice del todo
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onResuelto} disabled={subiendo}>
            No, empezar de cero
          </Button>
          <Button onClick={handleSubir} disabled={subiendo}>
            {subiendo ? 'Subiendo…' : 'Sí, subir mis datos'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
