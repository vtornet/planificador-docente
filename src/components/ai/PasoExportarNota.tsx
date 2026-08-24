import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useCuadernoStore } from '../../stores/useCuadernoStore'
import { stripHtml, textoAHtml } from '../../utils/texto'
import { DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Check, ChevronLeft } from 'lucide-react'
import { cn } from '../../utils/cn'

interface PasoExportarNotaProps {
  texto: string
  onVolver: () => void
  onCerrar: () => void
  onExportado: () => void
}

// Elegir una nota existente (se añade al final de su contenido) o crear una
// nueva — mismo patrón de selección explícita que Horarios, adaptado a que
// Notas no tiene un equivalente a "fecha + periodo" con el que ubicar
// automáticamente un destino.
export function PasoExportarNota({ texto, onVolver, onCerrar, onExportado }: PasoExportarNotaProps) {
  const { cuadernoActual, addNota, updateNota } = useCuadernoStore()
  const notas = cuadernoActual?.notas || []

  const [notaId, setNotaId] = useState<string | 'nueva' | ''>('')
  const [tituloNuevo, setTituloNuevo] = useState('Respuesta del asistente')

  const notaSeleccionada = notas.find((n) => n.id === notaId)

  const handleGuardar = () => {
    if (notaId === 'nueva') {
      if (!tituloNuevo.trim()) return
      addNota({ titulo: tituloNuevo.trim(), categoria: 'Otro', contenido: textoAHtml(texto), tipo: 'texto', tags: [] })
    } else if (notaSeleccionada) {
      updateNota(notaSeleccionada.id, { contenido: notaSeleccionada.contenido + textoAHtml(texto) })
    } else {
      return
    }
    onCerrar()
    onExportado()
  }

  const puedeGuardar = notaId === 'nueva' ? !!tituloNuevo.trim() : !!notaSeleccionada

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
        <DialogTitle>Exportar respuesta a una nota</DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">¿A qué nota se añade?</label>
          <div className="space-y-1 max-h-56 overflow-y-auto">
            <button
              type="button"
              onClick={() => setNotaId('nueva')}
              className={cn(
                'w-full text-left px-3 py-2 rounded-md border text-sm font-medium transition-colors',
                notaId === 'nueva' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-accent/50 text-foreground'
              )}
            >
              + Crear una nota nueva
            </button>
            {notas.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => setNotaId(n.id)}
                className={cn(
                  'w-full flex items-center justify-between gap-2 text-left px-3 py-2 rounded-md border text-sm transition-colors',
                  notaId === n.id ? 'border-primary bg-primary/10' : 'border-border hover:bg-accent/50'
                )}
              >
                <span className="truncate text-foreground">{n.titulo}</span>
                <span className="text-muted-foreground text-xs flex-shrink-0">
                  {format(new Date(n.actualizado), "d MMM", { locale: es })}
                </span>
              </button>
            ))}
            {notas.length === 0 && (
              <p className="text-sm text-muted-foreground px-1 py-1">Todavía no tienes ninguna nota creada.</p>
            )}
          </div>
        </div>

        {notaId === 'nueva' && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Título de la nota</label>
            <Input value={tituloNuevo} onChange={(e) => setTituloNuevo(e.target.value)} placeholder="Título" />
          </div>
        )}

        {puedeGuardar && (
          <div className="text-sm">
            <p className="text-muted-foreground mb-1">
              {notaId === 'nueva' ? 'Contenido de la nota nueva:' : 'Se añadirá al final de esta nota:'}
            </p>
            <div className="bg-muted rounded-lg p-3 whitespace-pre-wrap text-foreground max-h-32 overflow-y-auto">
              {texto}
            </div>
            {notaSeleccionada && stripHtml(notaSeleccionada.contenido) && (
              <p className="text-xs text-muted-foreground mt-1">
                Esa nota ya tiene contenido — se añadirá a continuación del existente, sin borrarlo.
              </p>
            )}
          </div>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCerrar}>
          Cancelar
        </Button>
        <Button onClick={handleGuardar} disabled={!puedeGuardar}>
          <Check className="w-4 h-4" />
          {notaId === 'nueva' ? 'Crear nota' : 'Guardar en la nota'}
        </Button>
      </DialogFooter>
    </>
  )
}
