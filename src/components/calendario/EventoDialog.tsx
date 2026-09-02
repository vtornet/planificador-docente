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

const MENSAJE_CERRAR_SIN_GUARDAR = '¿Cerrar sin guardar? Se perderán los cambios que no hayas guardado.'

interface EventoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  evento?: Evento
  fechaInicial?: Date
}

export function EventoDialog({ open, onOpenChange, evento, fechaInicial }: EventoDialogProps) {
  const { addEvento, updateEvento, deleteEvento } = useCuadernoStore()

  // id del evento que se está editando: puede empezar sin él (evento nuevo) y
  // pasar a tenerlo tras el primer "Guardar", para que los siguientes guardados
  // actualicen ese mismo evento en vez de crear duplicados.
  const [eventoId, setEventoId] = useState<string | undefined>(evento?.id)
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
  // Firma de los valores en el último guardado (o al abrir): si la actual
  // difiere, hay cambios sin guardar.
  const [firmaGuardada, setFirmaGuardada] = useState('')
  const [guardadoOk, setGuardadoOk] = useState(false)

  const firmaActual = JSON.stringify({
    titulo, descripcion, fecha, todoElDia, horaInicio, horaFin, color, recordatorio, repetir, repetirHasta,
  })
  const hayCambiosSinGuardar = firmaActual !== firmaGuardada

  useEffect(() => {
    if (!open) return
    const init = {
      titulo: evento?.titulo || '',
      descripcion: evento?.descripcion || '',
      fecha: format(evento?.fecha ? new Date(evento.fecha) : fechaInicial || new Date(), 'yyyy-MM-dd'),
      todoElDia: evento?.todoElDia ?? true,
      horaInicio: evento?.horaInicio || '09:00',
      horaFin: evento?.horaFin || '',
      color: evento?.color || COLOR_EVENTO_POR_DEFECTO,
      recordatorio: (evento?.recordatorio || 'ninguno') as RecordatorioEvento,
      repetir: (evento?.recurrencia?.frecuencia || 'nunca') as 'nunca' | RecurrenciaEvento['frecuencia'],
      repetirHasta: evento?.recurrencia ? format(new Date(evento.recurrencia.hasta), 'yyyy-MM-dd') : '',
    }
    setEventoId(evento?.id)
    setTitulo(init.titulo)
    setDescripcion(init.descripcion)
    setFecha(init.fecha)
    setTodoElDia(init.todoElDia)
    setHoraInicio(init.horaInicio)
    setHoraFin(init.horaFin)
    setColor(init.color)
    setRecordatorio(init.recordatorio)
    setRepetir(init.repetir)
    setRepetirHasta(init.repetirHasta)
    setFirmaGuardada(JSON.stringify(init))
    setGuardadoOk(false)
  }, [open, evento, fechaInicial])

  const cerrar = () => {
    if (hayCambiosSinGuardar && !window.confirm(MENSAJE_CERRAR_SIN_GUARDAR)) return
    onOpenChange(false)
  }

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

    if (eventoId) {
      updateEvento(eventoId, datos)
    } else {
      const nuevoId = addEvento(datos)
      if (!nuevoId) {
        alert('No se ha podido guardar el evento. Si estás en la versión de prueba, revisa el límite de eventos.')
        return
      }
      setEventoId(nuevoId)
    }
    setFirmaGuardada(firmaActual)
    setGuardadoOk(true)
  }

  const handleEliminar = () => {
    if (!eventoId) return
    const mensaje = repetir !== 'nunca'
      ? '¿Eliminar este evento? Se eliminarán todas sus repeticiones, no solo esta.'
      : '¿Eliminar este evento?'
    if (confirm(mensaje)) {
      deleteEvento(eventoId)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={cerrar}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{eventoId ? 'Editar evento' : 'Nuevo evento'}</DialogTitle>
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

        <DialogFooter className={eventoId ? 'sm:justify-between' : undefined}>
          {eventoId && (
            <Button variant="outline" onClick={handleEliminar} className="text-destructive hover:text-destructive">
              <Trash2 className="w-4 h-4" />
              Eliminar
            </Button>
          )}
          <div className="flex items-center gap-2">
            {guardadoOk && !hayCambiosSinGuardar && (
              <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                <Check className="w-4 h-4" />
                Guardado
              </span>
            )}
            <Button variant="outline" onClick={cerrar}>
              Cerrar
            </Button>
            <Button onClick={handleGuardar}>Guardar</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
