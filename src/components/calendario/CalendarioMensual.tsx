import { useState, useMemo } from 'react'
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import './CalendarioMensual.css'
import { useCuadernoStore } from '../../stores/useCuadernoStore'
import { Dialog, DialogContent } from '../ui/dialog'
import { Button } from '../ui/button'
import { VistaSemanal } from './VistaSemanal'
import { SemanaEditor } from './SemanaEditor'
import { FestivosDialog } from './FestivosDialog'
import { TIPOS_FESTIVO, COLOR_VACACIONES } from '../../types/constants'
import type { TipoFestivo } from '../../types'
import { Lightbulb, CalendarOff } from 'lucide-react'

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
    tipo: 'semana' | 'festivo' | 'vacacion'
    semanaId?: string
    tipoFestivo?: TipoFestivo
  }
}

export function CalendarioMensual() {
  const { cuadernoActual } = useCuadernoStore()
  const [calendarView, setCalendarView] = useState<View>('month')
  const [date, setDate] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState<CalendarioEvent | null>(null)
  const [creatingWeek, setCreatingWeek] = useState<Date | null>(null)
  const [showFestivos, setShowFestivos] = useState(false)

  // Obtener el año escolar actual desde la configuración
  const cursoEscolar = cuadernoActual?.configuracion.cursoEscolarActual || '2026-2027'

  // Generar eventos a partir de las semanas planificadas
  const events = useMemo<CalendarioEvent[]>(() => {
    if (!cuadernoActual) return []

    const semanas = cuadernoActual.planificacion?.semanal || []
    const festivos = cuadernoActual.configuracion?.festivos || []
    const vacaciones = cuadernoActual.configuracion?.vacaciones || []

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
        end: new Date(fecha.getTime() + 24 * 60 * 60 * 1000),
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

    return eventos
  }, [cuadernoActual])

  const handleSelectEvent = (event: CalendarioEvent) => {
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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Calendario Escolar</h2>
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
            Curso {cursoEscolar}
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowFestivos(true)}>
            <CalendarOff className="w-4 h-4" />
            Festivos y vacaciones
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
      </div>

      <VistaSemanalDialog />

      <FestivosDialog open={showFestivos} onOpenChange={setShowFestivos} />

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
          <li>• Click en un día para crear o editar una semana</li>
          <li>• Usa las flechas para navegar entre meses</li>
          <li>• Próximamente: sistema de plantillas y copia de semanas</li>
        </ul>
      </div>
    </div>
  )
}
