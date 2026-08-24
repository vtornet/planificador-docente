import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useCuadernoStore } from '../../stores/useCuadernoStore'
import { DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Button } from '../ui/button'
import { Check, ChevronLeft } from 'lucide-react'
import { cn } from '../../utils/cn'

interface PasoExportarReunionProps {
  texto: string
  onVolver: () => void
  onCerrar: () => void
  onExportado: () => void
}

type Campo = 'asuntosTratados' | 'acuerdos'

// Elegir una reunión existente y, dentro de ella, a qué campo se añade la
// respuesta — no hay "crear una reunión nueva" aquí (a diferencia de
// Notas): una reunión necesita fecha/tipo/asistentes propios que no tiene
// sentido rellenar a ciegas desde el asistente, así que si no hay ninguna
// creada se pide crearla primero en la sección Reuniones.
export function PasoExportarReunion({ texto, onVolver, onCerrar, onExportado }: PasoExportarReunionProps) {
  const { cuadernoActual, updateReunion } = useCuadernoStore()
  const reuniones = cuadernoActual?.reuniones || []

  const [reunionId, setReunionId] = useState('')
  const [campo, setCampo] = useState<Campo | null>(null)

  const reunion = reuniones.find((r) => r.id === reunionId)
  const valorActual = reunion && campo ? reunion[campo] : ''

  const handleGuardar = () => {
    if (!reunion || !campo) return
    const nuevoValor = valorActual.trim() ? `${valorActual}\n\n${texto}` : texto
    updateReunion(reunion.id, { [campo]: nuevoValor })
    onCerrar()
    onExportado()
  }

  return (
    <>
      <DialogHeader>
        <button
          type="button"
          onClick={onVolver}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-1 -ml-1"
        >
          <ChevronLeft className="w-4 h-4" /> Cambiar destino
        </button>
        <DialogTitle>Exportar respuesta a una reunión</DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">¿A qué reunión se añade?</label>
          <div className="space-y-1 max-h-56 overflow-y-auto">
            {reuniones.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  setReunionId(r.id)
                  setCampo(null)
                }}
                className={cn(
                  'w-full flex items-center justify-between gap-2 text-left px-3 py-2 rounded-md border text-sm transition-colors',
                  reunionId === r.id ? 'border-primary bg-primary/10' : 'border-border hover:bg-accent/50'
                )}
              >
                <span className="truncate text-foreground">{r.titulo}</span>
                <span className="text-muted-foreground text-xs flex-shrink-0">
                  {format(new Date(r.fecha), 'd MMM', { locale: es })}
                </span>
              </button>
            ))}
            {reuniones.length === 0 && (
              <p className="text-sm text-muted-foreground px-1 py-1">
                No hay ninguna reunión creada. Crea una primero en la sección Reuniones.
              </p>
            )}
          </div>
        </div>

        {reunion && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">¿En qué campo?</label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={campo === 'asuntosTratados' ? 'default' : 'outline'}
                onClick={() => setCampo('asuntosTratados')}
                className="flex-1"
              >
                Asuntos tratados
              </Button>
              <Button
                type="button"
                variant={campo === 'acuerdos' ? 'default' : 'outline'}
                onClick={() => setCampo('acuerdos')}
                className="flex-1"
              >
                Acuerdos
              </Button>
            </div>
          </div>
        )}

        {reunion && campo && (
          <div className="text-sm">
            <p className="text-muted-foreground mb-1">Se añadirá al final de ese campo:</p>
            <div className="bg-muted rounded-lg p-3 whitespace-pre-wrap text-foreground max-h-32 overflow-y-auto">
              {texto}
            </div>
            {valorActual.trim() && (
              <p className="text-xs text-muted-foreground mt-1">
                Ese campo ya tiene contenido — se añadirá a continuación del existente, sin borrarlo.
              </p>
            )}
          </div>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCerrar}>
          Cancelar
        </Button>
        <Button onClick={handleGuardar} disabled={!reunion || !campo}>
          <Check className="w-4 h-4" />
          Guardar en la reunión
        </Button>
      </DialogFooter>
    </>
  )
}
