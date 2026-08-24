import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Calendar, FileText, Users } from 'lucide-react'
import { cn } from '../../utils/cn'
import { PasoExportarHorario } from './PasoExportarHorario'
import { PasoExportarNota } from './PasoExportarNota'
import { PasoExportarReunion } from './PasoExportarReunion'
import type { ModuloAsistente } from '../../utils/asistenteHistorial'

interface ExportarRespuestaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  texto: string
  moduloActual: ModuloAsistente
  onExportado: () => void
}

type Destino = 'horario' | 'nota' | 'reunion'

const DESTINOS: { id: Destino; label: string; icon: typeof Calendar }[] = [
  { id: 'horario', label: 'Horario', icon: Calendar },
  { id: 'nota', label: 'Nota', icon: FileText },
  { id: 'reunion', label: 'Reunión', icon: Users },
]

// Módulo activo del asistente → destino más probable, para ordenar el
// selector con esa opción primero (solo un hint de orden, no se preselecciona
// nada: la docente siempre elige el destino explícitamente). Planificación no
// tiene su propio flujo de exportación — reutiliza el de Horario, que ya
// resuelve "fecha → semana → horario vigente esa semana".
function destinoSugerido(modulo: ModuloAsistente): Destino {
  if (modulo === 'notas') return 'nota'
  if (modulo === 'reuniones') return 'reunion'
  return 'horario'
}

// Diálogo único (sin anidar uno dentro de otro) con un selector de destino
// primero y, según lo elegido, el paso correspondiente — pedido explícito
// del usuario: antes el botón "Exportar" siempre iba a Horarios sin importar
// en qué módulo estuviera el asistente.
export function ExportarRespuestaDialog({ open, onOpenChange, texto, moduloActual, onExportado }: ExportarRespuestaDialogProps) {
  const [destino, setDestino] = useState<Destino | null>(null)

  useEffect(() => {
    if (open) setDestino(null)
  }, [open])

  const destinosOrdenados = [...DESTINOS].sort((a, b) =>
    a.id === destinoSugerido(moduloActual) ? -1 : b.id === destinoSugerido(moduloActual) ? 1 : 0
  )

  const cerrar = () => onOpenChange(false)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        {destino === null && (
          <>
            <DialogHeader>
              <DialogTitle>¿Dónde quieres exportar la respuesta?</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-3 gap-2">
              {destinosOrdenados.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setDestino(id)}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-lg border border-border p-4 text-sm font-medium text-foreground',
                    'hover:bg-accent/50 hover:border-primary/50 transition-colors'
                  )}
                >
                  <Icon className="w-5 h-5 text-primary" />
                  {label}
                </button>
              ))}
            </div>
          </>
        )}

        {destino === 'horario' && (
          <PasoExportarHorario texto={texto} onVolver={() => setDestino(null)} onCerrar={cerrar} onExportado={onExportado} />
        )}
        {destino === 'nota' && (
          <PasoExportarNota texto={texto} onVolver={() => setDestino(null)} onCerrar={cerrar} onExportado={onExportado} />
        )}
        {destino === 'reunion' && (
          <PasoExportarReunion texto={texto} onVolver={() => setDestino(null)} onCerrar={cerrar} onExportado={onExportado} />
        )}
      </DialogContent>
    </Dialog>
  )
}
