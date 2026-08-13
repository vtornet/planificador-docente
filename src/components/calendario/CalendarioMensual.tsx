import { useState, useMemo } from 'react'
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay, startOfDay, endOfDay, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import './CalendarioMensual.css'
import { useCuadernoStore } from '../../stores/useCuadernoStore'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { VistaSemanal } from './VistaSemanal'
import { SemanaEditor } from './SemanaEditor'
import { FestivosDialog } from './FestivosDialog'
import { EventoDialog } from './EventoDialog'
import { HorarioSemanaDialog } from './HorarioSemanaDialog'
import { TIPOS_FESTIVO, COLOR_VACACIONES, COLORES_EVENTOS } from '../../types/constants'
import type { TipoFestivo, Evento } from '../../types'
import { Lightbulb, CalendarOff, Plus, CalendarDays } from 'lucide-react'

const locales = {
  'es': es,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

interface CalendarioEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource?: {
    tipo: 'semana' | 'festivo' | 'vacacion' | 'evento'
    semanaId?: string
    tipoFestivo?: TipoFestivo
    eventoId?: string
    color?: string
  }
}

export function CalendarioMensual() {
  const { cuadernoActual } = useCuadernoStore()
  const [calendarView, setCalendarView] = useState<View>('month')
  const [date, setDate] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState<CalendarioEvent | null>(null)
  const [creatingWeek, setCreatingWeek] = useState<Date | null>(null)
  const [showFestivos, setShowFestivos] = useState(false)
  const [eventoEditando, setEventoEditando] = useState<Evento | null>(null)
  const [showNuevoEvento, setShowNuevoEvento] = useState(false)
  const [selectorEvento, setSelectorEvento] = useState<{ evento: Evento; semana: { inicio: Date; fin: Date } } | null>(null)
  const [semanaHorario, setSemanaHorario] = useState<{ inicio: Date; fin: Date } | null>(null)
  const [showHorarioSemana, setShowHorarioSemana] = useState(false)

  // Obtener el año escolar actual desde la configuración
  const cursoEscolar = cuadernoActual?.configuracion.cursoEscolarActual || '2026-2027'

  // Generar eventos a partir de las semanas planificadas
  const events = useMemo<CalendarioEvent[]>(() => {
    if (!cuadernoActual) return []

    const semanas = cuadernoActual.planificacion?.semanal || []
    const festivos = cuadernoActual.configuracion?.festivos || []
    const vacaciones = cuadernoActual.configuracion?.vacaciones || []
    const eventosAgenda = cuadernoActual.eventos || []

    const eventos: CalendarioEvent[] = []

    // Eventos de semanas
    semanas.forEach((semana) => {
      eventos.push({
        id: semana.id,
        title: `Semana ${semana.numeroSemana}`,
        start: new Date(semana.fechaInicio),
        end: new Date(semana.fechaFin),
        resource: {
          tipo: 'semana',
          semanaId: semana.id,
        },
      })
    })

    // Eventos de festivos
    festivos.forEach((festivo) => {
      const fecha = new Date(festivo.fecha)
      eventos.push({
        id: `festivo-${festivo.id}`,
        title: festivo.nombre,
        start: fecha,
        end: endOfDay(fecha),
        resource: { tipo: 'festivo', tipoFestivo: festivo.tipo },
      })
    })

    // Eventos de vacaciones
    vacaciones.forEach((vacacion) => {
      eventos.push({
        id: `vacacion-${vacacion.id}`,
        title: vacacion.nombre,
        start: new Date(vacacion.inicio),
        end: new Date(vacacion.fin),
        resource: { tipo: 'vacacion' },
      })
    })

    // Eventos de la agenda (título, hora, todo el día, color, recordatorio)
    eventosAgenda.forEach((evento) => {
      const fecha = new Date(evento.fecha)
      let start = fecha
      let end = fecha

      if (!evento.todoElDia && evento.horaInicio) {
        const [hIni, mIni] = evento.horaInicio.split(':').map(Number)
        start = new Date(fecha)
        start.setHours(hIni, mIni, 0, 0)
        if (evento.horaFin) {
          const [hFin, mFin] = evento.horaFin.split(':').map(Number)
          end = new Date(fecha)
          end.setHours(hFin, mFin, 0, 0)
        } else {
          end = new Date(start.getTime() + 60 * 60 * 1000)
        }
        // Si la hora de fin cae ya en el día siguiente (o antes que la de
        // inicio), lo dejamos dentro del mismo día para que en la vista de
        // mes ocupe solo una celda, no dos.
        if (end <= start || end.getDate() !== start.getDate()) {
          end = endOfDay(start)
        }
      } else {
        // Un evento de todo el día debe ocupar solo la celda de ese día: si
        // "end" cae en la medianoche del día siguiente, react-big-calendar lo
        // interpreta como si abarcara también esa siguiente celda.
        end = endOfDay(fecha)
      }

      eventos.push({
        id: `evento-${evento.id}`,
        title: evento.todoElDia ? evento.titulo : `${evento.horaInicio} ${evento.titulo}`,
        start,
        end,
        resource: { tipo: 'evento', eventoId: evento.id, color: evento.color },
      })
    })

    return eventos
  }, [cuadernoActual])

  const handleSelectEvent = (event: CalendarioEvent) => {
    if (event.resource?.tipo === 'evento') {
      const evento = (cuadernoActual?.eventos || []).find((e) => e.id === event.resource?.eventoId)
      if (evento) {
        const lunes = startOfWeek(startOfDay(new Date(evento.fecha)), { weekStartsOn: 1 })
        setSelectorEvento({ evento, semana: { inicio: lunes, fin: addDays(lunes, 4) } })
      }
      return
    }
    setSelectedEvent(event)
  }

  const handleNavigate = (newDate: Date) => {
    setDate(newDate)
  }

  const handleSelectSlot = ({ start }: { start: Date }) => {
    // Encontrar el lunes de esa semana
    const lunes = startOfWeek(startOfDay(start), { weekStartsOn: 1 })

    // Verificar si ya existe una semana para esa fecha
    const semanaExistente = cuadernoActual?.planificacion?.semanal.find(
      (s) => {
        const semanaInicio = startOfDay(new Date(s.fechaInicio))
        return semanaInicio.getTime() === lunes.getTime()
      }
    )

    if (semanaExistente) {
      setSelectedEvent({
        id: semanaExistente.id,
        title: `Semana ${semanaExistente.numeroSemana}`,
        start: new Date(semanaExistente.fechaInicio),
        end: new Date(semanaExistente.fechaFin),
        resource: { tipo: 'semana', semanaId: semanaExistente.id },
      })
    } else {
      // Crear nueva semana
      setCreatingWeek(lunes)
    }
  }

  const eventPropGetter = (event: CalendarioEvent) => {
    if (event.resource?.tipo === 'festivo') {
      const color = TIPOS_FESTIVO.find((t) => t.id === event.resource?.tipoFestivo)?.color
      return { style: { backgroundColor: color || TIPOS_FESTIVO[0].color } }
    }
    if (event.resource?.tipo === 'vacacion') {
      return { style: { backgroundColor: COLOR_VACACIONES } }
    }
    if (event.resource?.tipo === 'evento') {
      const color = COLORES_EVENTOS.find((c) => c.id === event.resource?.color)?.color
      return { style: { backgroundColor: color || COLORES_EVENTOS[0].color } }
    }
    return {}
  }

  const handleCrearSemana = () => {
    setCreatingWeek(null)
    // Forzar re-render
    setDate(new Date(date))
  }

  const VistaSemanalDialog = () => {
    if (!selectedEvent || selectedEvent.resource?.tipo !== 'semana') return null

    const semana = cuadernoActual?.planificacion?.semanal.find(
      (s) => s.id === selectedEvent.resource?.semanaId
    )

    if (!semana) return null

    return (
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <VistaSemanal semana={semana} onClose={() => setSelectedEvent(null)} />
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Calendario Escolar</h2>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full self-start sm:self-auto">
            Curso {cursoEscolar}
          </div>
          <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => setShowFestivos(true)}>
            <CalendarOff className="w-4 h-4" />
            Festivos y vacaciones
          </Button>
          <Button size="sm" className="w-full sm:w-auto" onClick={() => setShowNuevoEvento(true)}>
            <Plus className="w-4 h-4" />
            Nuevo evento
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-[var(--shadow-soft)] p-4">
        <Calendar
          localizer={localizer}
          events={events}
          view={calendarView}
          date={date}
          onView={setCalendarView}
          onNavigate={handleNavigate}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          eventPropGetter={eventPropGetter}
          selectable
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          formats={{
            monthHeaderFormat: (date: Date) => format(date, 'MMMM yyyy', { locale: es }),
            dayFormat: (date: Date) => format(date, 'EEE', { locale: es }),
            weekdayFormat: (date: Date) => format(date, 'EEEEEE', { locale: es }),
          }}
          messages={{
            date: 'Fecha',
            time: 'Hora',
            event: 'Evento',
            allDay: 'Todo el día',
            month: 'Mes',
            week: 'Semana',
            day: 'Día',
            agenda: 'Agenda',
            today: 'Hoy',
            previous: '◀',
            next: '▶',
            noEventsInRange: 'No hay eventos en este rango',
            showMore: (count: number) => `+${count} más`,
          }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'hsl(var(--primary))' }} />
          Semana planificada
        </span>
        {TIPOS_FESTIVO.map((t) => (
          <span key={t.id} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
            Festivo {t.nombre.toLowerCase()}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLOR_VACACIONES }} />
          Vacaciones
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORES_EVENTOS[0].color }} />
          Evento (color a elegir)
        </span>
      </div>

      <VistaSemanalDialog />

      <FestivosDialog open={showFestivos} onOpenChange={setShowFestivos} />

      <EventoDialog
        open={showNuevoEvento}
        onOpenChange={setShowNuevoEvento}
        fechaInicial={date}
      />

      <EventoDialog
        open={eventoEditando !== null}
        onOpenChange={(open) => {
          if (!open) setEventoEditando(null)
        }}
        evento={eventoEditando || undefined}
      />

      {/* Al hacer click en un evento, elegir entre verlo o ver el horario de clase de esa semana */}
      <Dialog open={selectorEvento !== null} onOpenChange={() => setSelectorEvento(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{selectorEvento?.evento.titulo}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">¿Qué quieres ver?</p>
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => {
                if (selectorEvento) setEventoEditando(selectorEvento.evento)
                setSelectorEvento(null)
              }}
            >
              Ver evento
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (selectorEvento) {
                  setSemanaHorario(selectorEvento.semana)
                  setShowHorarioSemana(true)
                }
                setSelectorEvento(null)
              }}
            >
              <CalendarDays className="w-4 h-4" />
              Ver horario de esta semana
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <HorarioSemanaDialog
        open={showHorarioSemana}
        onOpenChange={setShowHorarioSemana}
        semana={semanaHorario}
      />

      {/* Dialog para crear nueva semana */}
      <Dialog open={!!creatingWeek} onOpenChange={() => setCreatingWeek(null)}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          {creatingWeek && (
            <SemanaEditor
              fechaInicio={creatingWeek}
              onSave={handleCrearSemana}
              onCancel={() => setCreatingWeek(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
        <h4 className="font-medium text-primary mb-2 flex items-center gap-2">
          <Lightbulb className="w-4 h-4" />
          Consejos
        </h4>
        <ul className="text-sm text-primary/90 space-y-1">
          <li>• "Nuevo evento" para citas, tareas o recordatorios puntuales (título, hora, color, aviso)</li>
          <li>• Click en un evento ya creado para verlo, o para ver el horario de clase de esa semana</li>
          <li>• Click en un día vacío para crear o editar la planificación semanal de periodos</li>
          <li>• Usa las flechas para navegar entre meses</li>
        </ul>
      </div>
    </div>
  )
}
