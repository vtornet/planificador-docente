import { useState } from 'react'
import { addDays, format, getDay, startOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'
import { useCuadernoStore } from '../../stores/useCuadernoStore'
import { DIAS_SEMANA } from '../../types/constants'
import type { ConfigHorarios, Horario } from '../../types'
import { horarioActivoEnRango, horarioAbarcaMasDeLaSemana, dividirHorarioParaSemana } from '../../utils/horarios'
import { parseFechaInput } from '../../utils/fechas'
import { esDiaFestivo, esDiaVacaciones, festivoDelDia, vacacionDelDia } from '../../utils/festivos'
import { DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Button } from '../ui/button'
import { Check, ChevronLeft, AlertTriangle } from 'lucide-react'
import { cn } from '../../utils/cn'

interface PasoExportarHorarioProps {
  texto: string
  onVolver: () => void
  onCerrar: () => void
  onExportado: () => void
}

// Exporta `texto` como nota de un periodo concreto, de un día concreto — no
// de la plantilla genérica del horario (Lunes/Martes/...), sino de la fecha
// real que elija la docente (ej. "8 de septiembre"). Reutiliza el mismo
// modelo que el resto de la app (horarioActivoEnRango/dividirHorarioParaSemana,
// ver HorarioManager.tsx/HorarioSemanaDialog.tsx): con la fecha se calcula la
// semana lunes-viernes que la contiene, se busca el horario vigente esa
// semana, y si ese horario abarca más semanas que la elegida se pregunta el
// mismo "¿todo el periodo o solo esta semana?" ya usado en Horarios, en vez
// de escribir siempre en la plantilla completa (eso hacía ambiguo a qué
// instancia real se estaba escribiendo cuando un horario ya se había dividido
// por semanas, y daba la impresión de que la asignatura "desaparecía").
export function PasoExportarHorario({ texto, onVolver, onCerrar, onExportado }: PasoExportarHorarioProps) {
  const { cuadernoActual, updateHorario, addHorario } = useCuadernoStore()
  const horarios = cuadernoActual?.horarios || []

  const [fecha, setFecha] = useState('')
  const [horarioId, setHorarioId] = useState('')
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<number | null>(null)
  const [mostrarAlcance, setMostrarAlcance] = useState(false)

  const fechaDate = fecha ? parseFechaInput(fecha) : null
  const diaSemanaISO = fechaDate ? getDay(fechaDate) : null // 0=domingo … 6=sábado
  const diaLaborable = diaSemanaISO !== null && diaSemanaISO >= 1 && diaSemanaISO <= 5
  const columna = diaLaborable ? diaSemanaISO! - 1 : null // 0=Lunes … 4=Viernes

  // Un día festivo/de vacaciones ya bloquea la edición de esa celda en
  // Horarios y en Planificar (ver HorarioTable.tsx/SemanaEditor.tsx) — si el
  // asistente escribiera ahí de todos modos, la nota quedaría atrapada: nunca
  // más se podría editar ni borrar desde la UI normal. En vez de avisar y
  // dejar continuar, se bloquea aquí también, con el mismo criterio.
  const configuracion = cuadernoActual?.configuracion
  const festivoInfo = fechaDate && diaLaborable && configuracion ? festivoDelDia(fechaDate, configuracion.festivos) : undefined
  const vacacionInfo = fechaDate && diaLaborable && configuracion ? vacacionDelDia(fechaDate, configuracion.vacaciones) : undefined
  const diaNoLectivo = fechaDate && diaLaborable && configuracion
    ? esDiaFestivo(fechaDate, configuracion.festivos) || esDiaVacaciones(fechaDate, configuracion.vacaciones)
    : false

  const semana = fechaDate && diaLaborable && !diaNoLectivo
    ? { inicio: startOfWeek(fechaDate, { weekStartsOn: 1 }), fin: addDays(startOfWeek(fechaDate, { weekStartsOn: 1 }), 4) }
    : null

  const horariosVigentes: Horario[] = semana
    ? horarios.filter((h) => horarioActivoEnRango(h, semana.inicio, semana.fin))
    : []

  const horario = horariosVigentes.find((h) => h.id === horarioId) || horariosVigentes[0]
  const periodos = horario ? generarPeriodos(horario.configHorarios) : []

  const celda = horario && periodoSeleccionado !== null && columna !== null
    ? horario.datos[periodoSeleccionado]?.[columna]
    : undefined
  const notaExistente = celda?.nota?.trim()

  const escribirNota = (datos: Horario['datos'], fila: number, col: number) => {
    const notaActual = datos[fila]?.[col]?.nota?.trim()
    const nuevaNota = notaActual ? `${notaActual}\n\n${texto}` : texto
    const nuevosDatos = datos.map((f) => [...f])
    nuevosDatos[fila] = [...nuevosDatos[fila]]
    nuevosDatos[fila][col] = { ...nuevosDatos[fila][col], nota: nuevaNota }
    return nuevosDatos
  }

  const guardarConAlcance = (alcance: 'periodo' | 'semana') => {
    if (!horario || periodoSeleccionado === null || columna === null || !semana) return

    if (alcance === 'periodo') {
      const nuevosDatos = escribirNota(horario.datos, periodoSeleccionado, columna)
      updateHorario(horario.id, { datos: nuevosDatos })
    } else {
      const { actualizacionOriginal, nuevos } = dividirHorarioParaSemana(horario, semana)
      const [piezaSemana, ...resto] = nuevos
      updateHorario(horario.id, actualizacionOriginal)
      addHorario({ ...piezaSemana, datos: escribirNota(piezaSemana.datos, periodoSeleccionado, columna) })
      resto.forEach((n) => addHorario(n))
    }

    setMostrarAlcance(false)
    onCerrar()
    onExportado()
  }

  const handleGuardar = () => {
    if (!horario || periodoSeleccionado === null || !semana) return
    if (horarioAbarcaMasDeLaSemana(horario, semana)) {
      setMostrarAlcance(true)
    } else {
      guardarConAlcance('periodo')
    }
  }

  // Mismo contenido, dos pantallas posibles (como el modo Ver/Editar de
  // CeldaHorarioDialog.tsx), en vez de un <Dialog> anidado dentro de otro.
  if (mostrarAlcance) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>¿Guardar en todo el periodo o solo esta semana?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Este horario abarca varias semanas. Elige si la nota se añade a todas ellas o solo a la
          semana del {fechaDate && format(fechaDate, "d 'de' MMMM", { locale: es })} (se independizará del resto).
        </p>
        <DialogFooter className="flex-col sm:flex-row gap-2 sm:justify-between">
          <Button variant="ghost" className="w-full sm:w-auto" onClick={() => setMostrarAlcance(false)}>
            Volver
          </Button>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => guardarConAlcance('semana')}>
              Solo esta semana
            </Button>
            <Button className="w-full sm:w-auto" onClick={() => guardarConAlcance('periodo')}>
              Todo el periodo
            </Button>
          </div>
        </DialogFooter>
      </>
    )
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
        <DialogTitle>Exportar respuesta a un horario</DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            ¿Para qué día es esta planificación?
          </label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => {
              setFecha(e.target.value)
              setHorarioId('')
              setPeriodoSeleccionado(null)
            }}
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
          />
        </div>

        {fecha && !diaLaborable && (
          <p className="text-sm text-muted-foreground">
            Elige un día de lunes a viernes — los horarios solo cubren días lectivos de la semana.
          </p>
        )}

        {fecha && diaLaborable && diaNoLectivo && (
          <div className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg p-3">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              Ese día es {festivoInfo ? `festivo (${festivoInfo.nombre})` : `de vacaciones (${vacacionInfo?.nombre})`}.
              No se puede planificar contenido ahí, igual que en Horarios y Planificar — nadie podría editarlo
              después. Elige otro día.
            </span>
          </div>
        )}

        {semana && horariosVigentes.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No hay ningún horario que cubra esa fecha. Crea uno primero en la sección Horarios.
          </p>
        )}

        {semana && horariosVigentes.length > 1 && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Horario</label>
            <select
              value={horario?.id || ''}
              onChange={(e) => {
                setHorarioId(e.target.value)
                setPeriodoSeleccionado(null)
              }}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              {horariosVigentes.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.nombre}
                </option>
              ))}
            </select>
          </div>
        )}

        {horario && columna !== null && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Periodo del {DIAS_SEMANA[columna]} {fechaDate && format(fechaDate, "d 'de' MMMM", { locale: es })}
            </label>
            <div className="space-y-1 max-h-56 overflow-y-auto">
              {periodos.map((periodo, fila) => {
                if (periodo.esRecreo) return null
                const c = horario.datos[fila]?.[columna]
                const seleccionado = periodoSeleccionado === fila
                return (
                  <button
                    key={fila}
                    type="button"
                    onClick={() => setPeriodoSeleccionado(fila)}
                    className={cn(
                      'w-full flex items-center justify-between gap-2 text-left px-3 py-2 rounded-md border text-sm transition-colors',
                      seleccionado ? 'border-primary bg-primary/10' : 'border-border hover:bg-accent/50'
                    )}
                  >
                    <span className="text-muted-foreground">{periodo.inicio} - {periodo.fin}</span>
                    <span className="truncate text-foreground">{c?.contenido || 'Sin asignar'}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {periodoSeleccionado !== null && (
          <div className="text-sm">
            <p className="text-muted-foreground mb-1">Se guardará como nota de esa celda:</p>
            <div className="bg-muted rounded-lg p-3 whitespace-pre-wrap text-foreground max-h-32 overflow-y-auto">
              {texto}
            </div>
            {notaExistente && (
              <p className="text-xs text-muted-foreground mt-1">
                Esa celda ya tiene una nota — se añadirá a continuación de la existente, sin borrarla.
              </p>
            )}
          </div>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCerrar}>
          Cancelar
        </Button>
        <Button onClick={handleGuardar} disabled={periodoSeleccionado === null}>
          <Check className="w-4 h-4" />
          Guardar en el horario
        </Button>
      </DialogFooter>
    </>
  )
}

function generarPeriodos(config: ConfigHorarios) {
  const periodos: { inicio: string; fin: string; esRecreo?: boolean }[] = []
  let [hora, minuto] = config.horaInicio.split(':').map(Number)

  for (let i = 0; i < config.numPeriodos; i++) {
    const inicio = `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`
    minuto += config.duracionPeriodo
    if (minuto >= 60) {
      hora += Math.floor(minuto / 60)
      minuto = minuto % 60
    }
    const fin = `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`

    periodos.push({ inicio, fin })

    if (config.recreo && config.recreo.periodo === i + 1) {
      const inicioRecreo = fin
      minuto += config.recreo.duracion
      if (minuto >= 60) {
        hora += Math.floor(minuto / 60)
        minuto = minuto % 60
      }
      const finRecreo = `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`

      periodos.push({ inicio: inicioRecreo, fin: finRecreo, esRecreo: true })
    }
  }

  return periodos
}
