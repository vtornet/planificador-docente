import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { useCuadernoStore } from '../../stores/useCuadernoStore'
import { COLORES_EVENTOS, COLOR_EVENTO_POR_DEFECTO, RECORDATORIOS } from '../../types/constants'
import { parseFechaInput } from '../../utils/fechas'
import type { Evento, RecordatorioEvento, RecurrenciaEvento } from '../../types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Trash2, Check } from 'lucide-react'
import { cn } from '../../utils/cn'

interface EventoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  evento?: Evento
  fechaInicial?: Date
}

export function EventoDialog({ open, onOpenChange, evento, fechaInicial }: EventoDialogProps) {
  const { addEvento, updateEvento, deleteEvento } = useCuadernoStore()

  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [fecha, setFecha] = useState('')
  const [todoElDia, setTodoElDia] = useState(true)
  const [horaInicio, setHoraInicio] = useState('09:00')
  const [horaFin, setHoraFin] = useState('')
  const [color, setColor] = useState<string>(COLOR_EVENTO_POR_DEFECTO)
  const [recordatorio, setRecordatorio] = useState<RecordatorioEvento>('ninguno')
  const [repetir, setRepetir] = useState<'nunca' | RecurrenciaEvento['frecuencia']>('nunca')
  const [repetirHasta, setRepetirHasta] = useState('')

  useEffect(() => {
    if (!open) return
    setTitulo(evento?.titulo || '')
    setDescripcion(evento?.descripcion || '')
    setFecha(format(evento?.fecha ? new Date(evento.fecha) : fechaInicial || new Date(), 'yyyy-MM-dd'))
    setTodoElDia(evento?.todoElDia ?? true)
    setHoraInicio(evento?.horaInicio || '09:00')
    setHoraFin(evento?.horaFin || '')
    setColor(evento?.color || COLOR_EVENTO_POR_DEFECTO)
    setRecordatorio(evento?.recordatorio || 'ninguno')
    setRepetir(evento?.recurrencia?.frecuencia || 'nunca')
    setRepetirHasta(evento?.recurrencia ? format(new Date(evento.recurrencia.hasta), 'yyyy-MM-dd') : '')
  }, [open, evento, fechaInicial])

  const handleGuardar = () => {
    if (!titulo.trim() || !fecha) return

    if (repetir !== 'nunca') {
      if (!repetirHasta) {
        alert('Elige hasta cuándo se repite el evento')
        return
      }
      if (parseFechaInput(repetirHasta) < parseFechaInput(fecha)) {
        alert('La fecha de "Repetir hasta" no puede ser anterior a la del evento')
        return
      }
    }

    if (recordatorio !== 'ninguno' && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    const datos = {
      titulo: titulo.trim(),
      descripcion: descripcion.trim() || undefined,
      fecha: parseFechaInput(fecha),
      todoElDia,
      horaInicio: todoElDia ? undefined : horaInicio,
      horaFin: todoElDia ? undefined : horaFin || undefined,
      color,
      recordatorio,
      recurrencia:
        repetir !== 'nunca' ? { frecuencia: repetir, hasta: parseFechaInput(repetirHasta) } : undefined,
    }

    if (evento) {
      updateEvento(evento.id, datos)
    } else {
      addEvento(datos)
    }
    onOpenChange(false)
  }

  const handleEliminar = () => {
    if (!evento) return
    const mensaje = evento.recurrencia
      ? '¿Eliminar este evento? Se eliminarán todas sus repeticiones, no solo esta.'
      : '¿Eliminar este evento?'
    if (confirm(mensaje)) {
      deleteEvento(evento.id)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{evento ? 'Editar evento' : 'Nuevo evento'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Título *</label>
            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: Reunión con familias"
              autoFocus
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="evento-todo-el-dia"
              checked={todoElDia}
              onChange={(e) => setTodoElDia(e.target.checked)}
              className="w-4 h-4 text-primary rounded border-input focus:ring-ring"
            />
            <label htmlFor="evento-todo-el-dia" className="text-sm font-medium text-foreground">
              Todo el día
            </label>
          </div>

          <div className={cn('grid gap-4', todoElDia ? 'grid-cols-1' : 'grid-cols-3')}>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Fecha *</label>
              <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </div>
            {!todoElDia && (
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Hora inicio</label>
                  <Input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Hora fin</label>
                  <Input type="time" value={horaFin} onChange={(e) => setHoraFin(e.target.value)} />
                </div>
              </>
            )}
          </div>

          <div className={cn('grid gap-4', repetir === 'nunca' ? 'grid-cols-1' : 'grid-cols-2')}>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Repetir</label>
              <select
                value={repetir}
                onChange={(e) => setRepetir(e.target.value as typeof repetir)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="nunca">No se repite</option>
                <option value="diaria">Cada día</option>
                <option value="semanal">Cada semana</option>
                <option value="mensual">Cada mes</option>
              </select>
            </div>
            {repetir !== 'nunca' && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Repetir hasta *</label>
                <Input type="date" value={repetirHasta} onChange={(e) => setRepetirHasta(e.target.value)} />
              </div>
            )}
          </div>
          {repetir !== 'nunca' && (
            <p className="text-xs text-muted-foreground -mt-2">
              Editar o eliminar este evento afecta a todas sus repeticiones, no solo a una.
            </p>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLORES_EVENTOS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColor(c.id)}
                  title={c.nombre}
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-transform',
                    color === c.id ? 'border-foreground scale-110' : 'border-transparent hover:scale-105'
                  )}
                  style={{ backgroundColor: c.color }}
                >
                  {color === c.id && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Recordatorio</label>
            <select
              value={recordatorio}
              onChange={(e) => setRecordatorio(e.target.value as RecordatorioEvento)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {RECORDATORIOS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nombre}
                </option>
              ))}
            </select>
            {recordatorio !== 'ninguno' && (
              <p className="text-xs text-muted-foreground mt-1">
                El recordatorio solo llega si la app está abierta en el navegador (o instalada) en ese momento — no hay
                notificaciones en segundo plano sin conexión a un servidor.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Descripción</label>
            <Textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Notas adicionales sobre el evento..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className={evento ? 'sm:justify-between' : undefined}>
          {evento && (
            <Button variant="outline" onClick={handleEliminar} className="text-destructive hover:text-destructive">
              <Trash2 className="w-4 h-4" />
              Eliminar
            </Button>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleGuardar}>Guardar</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
