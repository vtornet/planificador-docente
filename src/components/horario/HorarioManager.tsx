import { useMemo, useRef, useState } from 'react'
import { format, startOfMonth, endOfMonth, eachWeekOfInterval, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { useCuadernoStore } from '../../stores/useCuadernoStore'
import { useAuthStore } from '../../stores/useAuthStore'
import { TRIAL_LIMIT_PER_MODULE } from '../../constants/trial'
import { CONFIG_HORARIOS_PREDEFINIDOS, MESES } from '../../types/constants'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Input } from '../ui/input'
import { HorarioTable } from './HorarioTable'
import { PaywallDialog } from '../paywall/PaywallDialog'
import type { Horario, ConfigHorarios } from '../../types'
import { Calendar, Trash2, Clock, Edit2, ChevronRight, ChevronLeft, Download } from 'lucide-react'
import { horarioActivoEnRango, horarioAbarcaMasDeLaSemana, dividirHorarioParaSemana, formatRangoFechas } from '../../utils/horarios'
import { parseFechaInput } from '../../utils/fechas'
import { pushBackEntry, resolveBackEntry, type BackEntry } from '../../hooks/backNavigationStack'

// El curso escolar empieza en Septiembre (mes 8, 0-indexado). MESES: 0=Septiembre...10=Julio.
function anioYMesDe(indiceMes: number, anioInicio: number, anioFin: number): { anio: number; mes: number } {
  if (indiceMes <= 3) return { anio: anioInicio, mes: 8 + indiceMes } // Sept-Dic
  return { anio: anioFin, mes: indiceMes - 4 } // Ene-Jul
}

function semanasDelMes(anio: number, mes: number): { inicio: Date; fin: Date }[] {
  const inicioMes = startOfMonth(new Date(anio, mes, 1))
  const finMes = endOfMonth(inicioMes)
  const lunes = eachWeekOfInterval({ start: inicioMes, end: finMes }, { weekStartsOn: 1 })
    .filter((l) => l.getMonth() === mes)
  return lunes.map((inicio) => ({ inicio, fin: addDays(inicio, 4) }))
}

// ¿Coincide esta configuración de intervalos con la predefinida de secundaria
// (la que se usa cuando no se marca "Personalizar intervalos horarios")?
function esConfigPredefinidaSecundaria(config: ConfigHorarios): boolean {
  const base = CONFIG_HORARIOS_PREDEFINIDOS.secundaria
  return (
    config.numPeriodos === base.numPeriodos &&
    config.horaInicio === base.horaInicio &&
    config.duracionPeriodo === base.duracionPeriodo &&
    !!config.recreo === !!base.recreo &&
    (!config.recreo || (config.recreo.periodo === base.recreo?.periodo && config.recreo.duracion === base.recreo?.duracion))
  )
}

type Vista = 'meses' | 'semanas' | 'semana' | 'sinFecha'

export function HorarioManager() {
  const { cuadernoActual, addHorario, updateHorario, deleteHorario } = useCuadernoStore()
  const hasPaid = useAuthStore((s) => s.hasPaid)
  const horarios = cuadernoActual?.horarios || []

  // Navegación
  const [vista, setVista] = useState<Vista>('meses')
  const [mesSeleccionado, setMesSeleccionado] = useState<number | null>(null)
  const [semanaSeleccionada, setSemanaSeleccionada] = useState<{ inicio: Date; fin: Date } | null>(null)

  // Diálogos crear/editar
  const [showCrear, setShowCrear] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)
  const [showEditar, setShowEditar] = useState(false)
  const [horarioEditando, setHorarioEditando] = useState<Horario | null>(null)
  const [horarioEliminando, setHorarioEliminando] = useState<Horario | null>(null)
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoTipo, setNuevoTipo] = useState<'docente' | 'alumnado'>('docente')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')

  // Configuración de horarios personalizada
  const [configPersonalizada, setConfigPersonalizada] = useState(false)
  const [numPeriodos, setNumPeriodos] = useState(6)
  const [horaInicio, setHoraInicio] = useState('08:00')
  const [duracionPeriodo, setDuracionPeriodo] = useState(55)
  const [conRecreo, setConRecreo] = useState(true)
  const [recreoPeriodo, setRecreoPeriodo] = useState(3)
  const [recreoDuracion, setRecreoDuracion] = useState(30)

  const totalPeriodos = configPersonalizada
    ? numPeriodos + (conRecreo ? 1 : 0)
    : 6 + 1 // secundaria tiene 6 periodos + recreo

  const [anioInicio, anioFin] = useMemo(() => {
    const partes = (cuadernoActual?.metadata.cursoEscolar || '').split('-').map(Number)
    const hoy = new Date().getFullYear()
    return [partes[0] || hoy, partes[1] || hoy + 1]
  }, [cuadernoActual?.metadata.cursoEscolar])

  // Límites del curso escolar (1 de septiembre al 31 de julio) para saber si una
  // fecha cae fuera de los 11 meses navegables (ej. agosto, o un año distinto).
  const [inicioCursoEscolar, finCursoEscolar] = useMemo(() => {
    const primerMes = anioYMesDe(0, anioInicio, anioFin)
    const ultimoMes = anioYMesDe(MESES.length - 1, anioInicio, anioFin)
    return [
      startOfMonth(new Date(primerMes.anio, primerMes.mes, 1)),
      endOfMonth(new Date(ultimoMes.anio, ultimoMes.mes, 1)),
    ]
  }, [anioInicio, anioFin])

  const handleAbrirCrear = (rango?: { inicio: Date; fin: Date }) => {
    if (!hasPaid && horarios.length >= TRIAL_LIMIT_PER_MODULE) {
      setShowPaywall(true)
      return
    }
    setNuevoNombre('')
    setNuevoTipo('docente')
    setConfigPersonalizada(false)
    if (rango) {
      setFechaInicio(format(rango.inicio, 'yyyy-MM-dd'))
      setFechaFin(format(rango.fin, 'yyyy-MM-dd'))
    } else {
      setFechaInicio(format(new Date(), 'yyyy-MM-dd'))
      setFechaFin(`${anioFin}-07-31`)
    }
    setShowCrear(true)
  }

  const handleCrear = () => {
    if (!nuevoNombre.trim()) return

    const configHorarios: ConfigHorarios = configPersonalizada
      ? {
          numPeriodos,
          horaInicio,
          duracionPeriodo,
          recreo: conRecreo ? { periodo: recreoPeriodo, duracion: recreoDuracion } : undefined,
        }
      : CONFIG_HORARIOS_PREDEFINIDOS.secundaria

    const nuevoHorario: Omit<Horario, 'id' | 'actualizado'> = {
      tipo: nuevoTipo,
      nombre: nuevoNombre,
      datos: Array(7).fill(null).map(() => Array(configHorarios.numPeriodos + (configHorarios.recreo ? 1 : 0)).fill(null).map(() => ({ contenido: '' }))),
      configHorarios,
      fechaInicio: fechaInicio ? parseFechaInput(fechaInicio) : undefined,
      fechaFin: fechaFin ? parseFechaInput(fechaFin) : undefined,
    }

    addHorario(nuevoHorario)
    setShowCrear(false)
  }

  // Guarda los datos editados de un horario. Si abarca más de la semana que se
  // está viendo, `alcance` decide si se aplica a todo el periodo (misma fila,
  // se actualiza tal cual) o solo a esta semana (se independiza con un split).
  const handleGuardarDatosHorario = (
    horario: Horario,
    datos: Horario['datos'],
    alcance?: 'periodo' | 'semana'
  ) => {
    if (alcance === 'semana' && semanaSeleccionada) {
      const { actualizacionOriginal, nuevos } = dividirHorarioParaSemana(horario, semanaSeleccionada)
      nuevos[0] = { ...nuevos[0], datos }
      updateHorario(horario.id, actualizacionOriginal)
      nuevos.forEach((nuevo) => addHorario(nuevo))
    } else {
      updateHorario(horario.id, { ...horario, datos })
    }
  }

  // Si el horario abarca más semanas que la que se está viendo, pregunta el
  // alcance (mismo criterio y mismo diálogo que "Guardar cambios", ver
  // HorarioTable.tsx) en vez de borrar directamente todo el periodo.
  const handleDelete = (horario: Horario) => {
    if (vista === 'semana' && semanaSeleccionada && horarioAbarcaMasDeLaSemana(horario, semanaSeleccionada)) {
      setHorarioEliminando(horario)
      return
    }
    if (confirm('¿Eliminar este horario?')) {
      deleteHorario(horario.id)
    }
  }

  // "Todo el periodo": borra el horario entero, como siempre. "Solo esta
  // semana": reutiliza la misma división que separa una semana en una copia
  // independiente (dividirHorarioParaSemana), pero descarta esa copia en vez
  // de guardarla — el original queda recortado para excluir la semana, y el
  // resto del periodo (antes y/o después) sigue intacto.
  const confirmarEliminar = (alcance: 'periodo' | 'semana') => {
    if (!horarioEliminando) return

    if (alcance === 'periodo' || !semanaSeleccionada) {
      deleteHorario(horarioEliminando.id)
    } else {
      const { actualizacionOriginal, nuevos } = dividirHorarioParaSemana(horarioEliminando, semanaSeleccionada)
      updateHorario(horarioEliminando.id, actualizacionOriginal)
      nuevos.slice(1).forEach((nuevo) => addHorario(nuevo))
    }

    setHorarioEliminando(null)
  }

  const handleExportarPDF = async (horario: Horario) => {
    if (!cuadernoActual) return
    try {
      const { exportHorarioToPDF } = await import('../../utils/pdf.tsx')
      await exportHorarioToPDF(horario, cuadernoActual.metadata)
    } catch (error) {
      console.error('Error exportando horario a PDF:', error)
      alert('Error al exportar el horario a PDF. Inténtalo de nuevo.')
    }
  }

  const handleEditarClick = (horario: Horario) => {
    setHorarioEditando(horario)
    setNuevoNombre(horario.nombre)
    setNuevoTipo(horario.tipo)
    setFechaInicio(horario.fechaInicio ? format(new Date(horario.fechaInicio), 'yyyy-MM-dd') : '')
    setFechaFin(horario.fechaFin ? format(new Date(horario.fechaFin), 'yyyy-MM-dd') : '')

    // "Personalizar intervalos horarios" solo debe aparecer marcado si de verdad
    // se apartó de la configuración predefinida — configHorarios existe siempre
    // (no es opcional), así que comprobarlo con "if (horario.configHorarios)"
    // daba siempre true y marcaba la casilla en todos los horarios.
    setConfigPersonalizada(!esConfigPredefinidaSecundaria(horario.configHorarios))
    setNumPeriodos(horario.configHorarios.numPeriodos)
    setHoraInicio(horario.configHorarios.horaInicio)
    setDuracionPeriodo(horario.configHorarios.duracionPeriodo)
    if (horario.configHorarios.recreo) {
      setConRecreo(true)
      setRecreoPeriodo(horario.configHorarios.recreo.periodo)
      setRecreoDuracion(horario.configHorarios.recreo.duracion)
    } else {
      setConRecreo(false)
    }

    setShowEditar(true)
  }

  const handleGuardarEdicion = () => {
    if (!horarioEditando || !nuevoNombre.trim()) return

    const configHorarios: ConfigHorarios = configPersonalizada
      ? {
          numPeriodos,
          horaInicio,
          duracionPeriodo,
          recreo: conRecreo ? { periodo: recreoPeriodo, duracion: recreoDuracion } : undefined,
        }
      : CONFIG_HORARIOS_PREDEFINIDOS.secundaria

    // Solo hay que redimensionar (y por tanto vaciar) la matriz de datos si el
    // Nº de periodos cambia de verdad — no en cualquier guardado del diálogo de
    // edición (antes se comprobaba con "configPersonalizada", que a su vez
    // siempre estaba a true al editar, así que se perdían los datos aunque el
    // usuario solo ampliara las fechas o cambiara el nombre).
    const totalPeriodosNuevo = configHorarios.numPeriodos + (configHorarios.recreo ? 1 : 0)
    const totalPeriodosActual = horarioEditando.configHorarios.numPeriodos + (horarioEditando.configHorarios.recreo ? 1 : 0)
    const nuevosDatos = totalPeriodosNuevo !== totalPeriodosActual
      ? Array(7).fill(null).map(() => Array(totalPeriodosNuevo).fill(null).map(() => ({ contenido: '' })))
      : horarioEditando.datos

    updateHorario(horarioEditando.id, {
      ...horarioEditando,
      nombre: nuevoNombre,
      tipo: nuevoTipo,
      datos: nuevosDatos,
      configHorarios,
      fechaInicio: fechaInicio ? parseFechaInput(fechaInicio) : undefined,
      fechaFin: fechaFin ? parseFechaInput(fechaFin) : undefined,
    })

    setShowEditar(false)
    setHorarioEditando(null)
  }

  const irAMeses = () => {
    setVista('meses')
    setMesSeleccionado(null)
    setSemanaSeleccionada(null)
  }

  const irAMes = (idx: number) => {
    setMesSeleccionado(idx)
    setSemanaSeleccionada(null)
    setVista('semanas')
  }

  const irASemana = (semana: { inicio: Date; fin: Date }) => {
    setSemanaSeleccionada(semana)
    setVista('semana')
  }

  // Enganche con la pila compartida de historial (`backNavigationStack.ts`):
  // único sitio de la app con navegación por niveles (meses → semanas →
  // semana) fuera de un Dialog (el resto ya lo cubre el enganche en el
  // componente Dialog compartido, que usa la misma pila). Cada clic hacia
  // dentro apila una entrada con la función que debe deshacerla; cada clic
  // hacia fuera (breadcrumb, "Volver a...") la resuelve explícitamente. Al
  // ser una pila global compartida con los Dialog (en vez de un mecanismo
  // propio con su propio listener de popstate), un Dialog abierto sobre un
  // nivel de aquí se cierra sin interferir con la navegación de niveles.
  const entriesHistorialRef = useRef<BackEntry[]>([])

  const apilarNivel = (onBack: () => void) => {
    const entry = pushBackEntry(() => {
      onBack()
      entriesHistorialRef.current = entriesHistorialRef.current.filter((e) => e !== entry)
    })
    entriesHistorialRef.current.push(entry)
  }

  const desapilarUnNivel = () => {
    const entry = entriesHistorialRef.current.pop()
    if (entry) resolveBackEntry(entry)
  }

  const desapilarTodo = () => {
    while (entriesHistorialRef.current.length > 0) {
      resolveBackEntry(entriesHistorialRef.current.pop()!)
    }
  }

  const semanasMesActual = useMemo(() => {
    if (mesSeleccionado === null) return []
    const { anio, mes } = anioYMesDe(mesSeleccionado, anioInicio, anioFin)
    return semanasDelMes(anio, mes)
  }, [mesSeleccionado, anioInicio, anioFin])

  const horariosDeLaSemana = useMemo(() => {
    if (!semanaSeleccionada) return []
    return horarios.filter((h) => horarioActivoEnRango(h, semanaSeleccionada.inicio, semanaSeleccionada.fin))
  }, [horarios, semanaSeleccionada])

  // "Sin periodo asignado": sin fecha, o con una fecha que no cae en ninguno de
  // los 11 meses navegables (ej. agosto, o un curso escolar distinto al activo).
  // Así nunca se pierde de vista un horario, aunque su fecha no encaje en la navegación.
  const horariosSinFecha = horarios.filter((h) => {
    if (!h.fechaInicio) return true
    const fecha = new Date(h.fechaInicio)
    return fecha < inicioCursoEscolar || fecha > finCursoEscolar
  })

  const renderHorarioCard = (horario: Horario) => {
    const preguntarAlcance =
      vista === 'semana' && semanaSeleccionada
        ? horarioAbarcaMasDeLaSemana(horario, semanaSeleccionada)
        : false

    return (
      <Card key={horario.id}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{horario.nombre}</CardTitle>
              {horario.fechaInicio && (
                <p className="text-sm text-muted-foreground mt-1">
                  {formatRangoFechas(horario.fechaInicio, horario.fechaFin)}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleExportarPDF(horario)}
                className="text-muted-foreground hover:text-foreground"
                title="Descargar este horario en PDF"
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEditarClick(horario)}
                className="text-primary hover:text-primary hover:bg-primary/10"
                title="Editar horario"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(horario)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                title="Eliminar horario"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <HorarioTable
            horario={horario}
            onGuardar={(datos, alcance) => handleGuardarDatosHorario(horario, datos, alcance)}
            preguntarAlcance={preguntarAlcance}
            onDuplicate={addHorario}
            semana={vista === 'semana' && semanaSeleccionada ? semanaSeleccionada : undefined}
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <nav className="flex items-center gap-1 text-sm">
          <button
            onClick={() => { irAMeses(); desapilarTodo() }}
            className={vista === 'meses' ? 'font-bold text-foreground text-2xl tracking-tight' : 'text-primary hover:underline'}
          >
            Horarios
          </button>
          {mesSeleccionado !== null && (
            <>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <button
                onClick={() => {
                  const eraSemana = vista === 'semana'
                  irAMes(mesSeleccionado)
                  if (eraSemana) desapilarUnNivel()
                }}
                className={vista === 'semanas' ? 'font-bold text-foreground text-2xl tracking-tight' : 'text-primary hover:underline'}
              >
                {MESES[mesSeleccionado]}
              </button>
            </>
          )}
          {vista === 'semana' && semanaSeleccionada && (
            <>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <span className="font-bold text-foreground text-2xl tracking-tight">
                Semana del {format(semanaSeleccionada.inicio, 'd')} al{' '}
                {format(semanaSeleccionada.fin, "d 'de' MMMM", { locale: es })}
              </span>
            </>
          )}
          {vista === 'sinFecha' && (
            <>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <span className="font-bold text-foreground text-2xl tracking-tight">
                Sin periodo asignado
              </span>
            </>
          )}
        </nav>
        <Button onClick={() => handleAbrirCrear()}>+ Nuevo horario</Button>
      </div>

      <PaywallDialog open={showPaywall} onOpenChange={setShowPaywall} modulo="horarios" />

      <Dialog open={showCrear} onOpenChange={setShowCrear}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo horario</DialogTitle>
          </DialogHeader>
          <HorarioFormFields
            nombre={nuevoNombre}
            onNombreChange={setNuevoNombre}
            cursos={cuadernoActual?.metadata.cursos || []}
            tipo={nuevoTipo}
            onTipoChange={setNuevoTipo}
            fechaInicio={fechaInicio}
            onFechaInicioChange={setFechaInicio}
            fechaFin={fechaFin}
            onFechaFinChange={setFechaFin}
            configPersonalizada={configPersonalizada}
            onConfigPersonalizadaChange={setConfigPersonalizada}
            numPeriodos={numPeriodos}
            onNumPeriodosChange={setNumPeriodos}
            horaInicio={horaInicio}
            onHoraInicioChange={setHoraInicio}
            duracionPeriodo={duracionPeriodo}
            onDuracionPeriodoChange={setDuracionPeriodo}
            conRecreo={conRecreo}
            onConRecreoChange={setConRecreo}
            recreoPeriodo={recreoPeriodo}
            onRecreoPeriodoChange={setRecreoPeriodo}
            recreoDuracion={recreoDuracion}
            onRecreoDuracionChange={setRecreoDuracion}
            totalPeriodos={totalPeriodos}
            idPrefix="crear"
          />
          <DialogFooter>
            <Button onClick={handleCrear}>Crear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditar} onOpenChange={setShowEditar}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar horario</DialogTitle>
          </DialogHeader>
          <HorarioFormFields
            nombre={nuevoNombre}
            onNombreChange={setNuevoNombre}
            cursos={cuadernoActual?.metadata.cursos || []}
            tipo={nuevoTipo}
            onTipoChange={setNuevoTipo}
            fechaInicio={fechaInicio}
            onFechaInicioChange={setFechaInicio}
            fechaFin={fechaFin}
            onFechaFinChange={setFechaFin}
            configPersonalizada={configPersonalizada}
            onConfigPersonalizadaChange={setConfigPersonalizada}
            numPeriodos={numPeriodos}
            onNumPeriodosChange={setNumPeriodos}
            horaInicio={horaInicio}
            onHoraInicioChange={setHoraInicio}
            duracionPeriodo={duracionPeriodo}
            onDuracionPeriodoChange={setDuracionPeriodo}
            conRecreo={conRecreo}
            onConRecreoChange={setConRecreo}
            recreoPeriodo={recreoPeriodo}
            onRecreoPeriodoChange={setRecreoPeriodo}
            recreoDuracion={recreoDuracion}
            onRecreoDuracionChange={setRecreoDuracion}
            totalPeriodos={totalPeriodos}
            idPrefix="editar"
            mostrarAvisoReset
          />
          <DialogFooter>
            <Button onClick={handleGuardarEdicion}>Guardar cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={horarioEliminando !== null} onOpenChange={(open) => !open && setHorarioEliminando(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>¿Eliminar todo el periodo o solo esta semana?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Este horario abarca varias semanas. Elige si se elimina por completo o solo la semana
            que estás viendo ahora mismo (el resto del periodo seguirá intacto).
          </p>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => confirmarEliminar('semana')}
            >
              Solo esta semana
            </Button>
            <Button
              variant="destructive"
              className="w-full sm:w-auto"
              onClick={() => confirmarEliminar('periodo')}
            >
              Todo el periodo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {vista === 'meses' && horariosSinFecha.length > 0 && (
        <button
          onClick={() => { setVista('sinFecha'); apilarNivel(() => irAMeses()) }}
          className="w-full text-left text-sm text-muted-foreground hover:text-primary underline underline-offset-2"
        >
          Ver {horariosSinFecha.length} {horariosSinFecha.length === 1 ? 'horario' : 'horarios'} sin periodo asignado
        </button>
      )}

      {vista === 'meses' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {MESES.map((nombreMes, idx) => {
            const { anio, mes } = anioYMesDe(idx, anioInicio, anioFin)
            const desde = startOfMonth(new Date(anio, mes, 1))
            const hasta = endOfMonth(desde)
            const numHorarios = horarios.filter((h) => horarioActivoEnRango(h, desde, hasta)).length

            return (
              <Card
                key={nombreMes}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => { irAMes(idx); apilarNivel(() => irAMeses()) }}
              >
                <CardContent className="pt-6 flex flex-col items-center text-center gap-2">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                  <div className="font-semibold text-foreground">{nombreMes}</div>
                  <div className="text-xs text-muted-foreground">
                    {numHorarios === 0
                      ? 'Sin horarios'
                      : `${numHorarios} ${numHorarios === 1 ? 'horario' : 'horarios'}`}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {vista === 'semanas' && mesSeleccionado !== null && (
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={() => { irAMeses(); desapilarUnNivel() }} className="text-muted-foreground">
            <ChevronLeft className="w-4 h-4" /> Volver a meses
          </Button>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {semanasMesActual.map((semana) => {
              const horariosSemana = horarios.filter((h) => horarioActivoEnRango(h, semana.inicio, semana.fin))
              return (
                <Card
                  key={semana.inicio.toISOString()}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => {
                    irASemana(semana)
                    apilarNivel(() => { if (mesSeleccionado !== null) irAMes(mesSeleccionado) })
                  }}
                >
                  <CardContent className="pt-6">
                    <div className="font-semibold text-foreground mb-2">
                      Del {format(semana.inicio, 'd')} al {format(semana.fin, "d 'de' MMMM", { locale: es })}
                    </div>
                    {horariosSemana.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">Sin horario asignado</p>
                    ) : (
                      <ul className="space-y-1">
                        {horariosSemana.map((h) => (
                          <li key={h.id} className="text-sm text-primary truncate">
                            {h.nombre}
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {vista === 'semana' && semanaSeleccionada && (
        <div className="space-y-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { if (mesSeleccionado !== null) irAMes(mesSeleccionado); desapilarUnNivel() }}
            className="text-muted-foreground"
          >
            <ChevronLeft className="w-4 h-4" /> Volver a {mesSeleccionado !== null ? MESES[mesSeleccionado] : 'el mes'}
          </Button>

          {horariosDeLaSemana.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Calendar className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No hay horario para esta semana
              </h3>
              <p className="text-muted-foreground mb-6">
                Crea uno para esta semana, o ábrelo con un rango más amplio si va a durar varias semanas
              </p>
              <Button onClick={() => handleAbrirCrear(semanaSeleccionada)}>
                Crear horario para esta semana
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-6">
                {horariosDeLaSemana.map((horario) => {
                  const mostrarAviso = horarioAbarcaMasDeLaSemana(horario, semanaSeleccionada)

                  return (
                    <div key={horario.id}>
                      {mostrarAviso && (
                        <p className="mb-3 text-sm text-muted-foreground">
                          Este horario es del <strong>{formatRangoFechas(horario.fechaInicio, horario.fechaFin)}</strong>.
                          Al guardar, podrás elegir si los cambios se aplican a todo el periodo o solo a esta semana.
                        </p>
                      )}
                      {renderHorarioCard(horario)}
                    </div>
                  )
                })}
              </div>
              <Button variant="outline" onClick={() => handleAbrirCrear(semanaSeleccionada)}>
                + Añadir otro horario para esta semana
              </Button>
            </>
          )}
        </div>
      )}

      {vista === 'sinFecha' && (
        <div className="space-y-6">
          <Button variant="ghost" size="sm" onClick={() => { irAMeses(); desapilarUnNivel() }} className="text-muted-foreground">
            <ChevronLeft className="w-4 h-4" /> Volver a meses
          </Button>
          <p className="text-sm text-muted-foreground">
            Horarios creados sin un periodo de fechas. Edítalos para asignarles uno y que aparezcan en su mes correspondiente.
          </p>
          <div className="space-y-6">{horariosSinFecha.map(renderHorarioCard)}</div>
        </div>
      )}
    </div>
  )
}

interface HorarioFormFieldsProps {
  nombre: string
  onNombreChange: (value: string) => void
  cursos: string[]
  tipo: 'docente' | 'alumnado'
  onTipoChange: (value: 'docente' | 'alumnado') => void
  fechaInicio: string
  onFechaInicioChange: (value: string) => void
  fechaFin: string
  onFechaFinChange: (value: string) => void
  configPersonalizada: boolean
  onConfigPersonalizadaChange: (value: boolean) => void
  numPeriodos: number
  onNumPeriodosChange: (value: number) => void
  horaInicio: string
  onHoraInicioChange: (value: string) => void
  duracionPeriodo: number
  onDuracionPeriodoChange: (value: number) => void
  conRecreo: boolean
  onConRecreoChange: (value: boolean) => void
  recreoPeriodo: number
  onRecreoPeriodoChange: (value: number) => void
  recreoDuracion: number
  onRecreoDuracionChange: (value: number) => void
  totalPeriodos: number
  idPrefix: string
  mostrarAvisoReset?: boolean
}

function HorarioFormFields({
  nombre,
  onNombreChange,
  cursos,
  tipo,
  onTipoChange,
  fechaInicio,
  onFechaInicioChange,
  fechaFin,
  onFechaFinChange,
  configPersonalizada,
  onConfigPersonalizadaChange,
  numPeriodos,
  onNumPeriodosChange,
  horaInicio,
  onHoraInicioChange,
  duracionPeriodo,
  onDuracionPeriodoChange,
  conRecreo,
  onConRecreoChange,
  recreoPeriodo,
  onRecreoPeriodoChange,
  recreoDuracion,
  onRecreoDuracionChange,
  totalPeriodos,
  idPrefix,
  mostrarAvisoReset,
}: HorarioFormFieldsProps) {
  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
      <CampoNombreHorario value={nombre} onChange={onNombreChange} cursos={cursos} />

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Tipo</label>
        <select
          value={tipo}
          onChange={(e) => onTipoChange(e.target.value as 'docente' | 'alumnado')}
          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="docente">Docente</option>
          <option value="alumnado">Alumnado</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Vigente desde
          </label>
          <Input
            type="date"
            value={fechaInicio}
            onChange={(e) => onFechaInicioChange(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Hasta (opcional)
          </label>
          <Input
            type="date"
            value={fechaFin}
            onChange={(e) => onFechaFinChange(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <input
          type="checkbox"
          id={`${idPrefix}-configPersonalizada`}
          checked={configPersonalizada}
          onChange={(e) => onConfigPersonalizadaChange(e.target.checked)}
          className="w-4 h-4 text-primary rounded border-input focus:ring-ring"
        />
        <label htmlFor={`${idPrefix}-configPersonalizada`} className="text-sm font-medium text-foreground">
          Personalizar intervalos horarios
        </label>
      </div>

      {configPersonalizada && (
        <div className="space-y-4 pt-2 border-t border-border">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Número de periodos
              </label>
              <Input
                type="number"
                min="1"
                max="10"
                value={numPeriodos}
                onChange={(e) => onNumPeriodosChange(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Hora de inicio
              </label>
              <Input
                type="time"
                value={horaInicio}
                onChange={(e) => onHoraInicioChange(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Duración (minutos)
              </label>
              <Input
                type="number"
                min="30"
                max="90"
                step="5"
                value={duracionPeriodo}
                onChange={(e) => onDuracionPeriodoChange(Number(e.target.value))}
              />
            </div>
            <div className="flex items-end">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`${idPrefix}-conRecreo`}
                  checked={conRecreo}
                  onChange={(e) => onConRecreoChange(e.target.checked)}
                  className="w-4 h-4 text-primary rounded border-input focus:ring-ring"
                />
                <label htmlFor={`${idPrefix}-conRecreo`} className="text-sm font-medium text-foreground">
                  Con recreo
                </label>
              </div>
            </div>
          </div>

          {conRecreo && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Recreo después del periodo
                </label>
                <Input
                  type="number"
                  min="1"
                  max={numPeriodos}
                  value={recreoPeriodo}
                  onChange={(e) => onRecreoPeriodoChange(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Duración recreo (min)
                </label>
                <Input
                  type="number"
                  min="5"
                  max="60"
                  step="5"
                  value={recreoDuracion}
                  onChange={(e) => onRecreoDuracionChange(Number(e.target.value))}
                />
              </div>
            </div>
          )}

          <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
            <div className="flex items-center gap-2 text-primary">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">Total: {totalPeriodos} periodos</span>
            </div>
          </div>

          {mostrarAvisoReset && (
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg p-3">
              <p className="text-sm text-amber-800 dark:text-amber-300">
                ⚠️ Al modificar la configuración de intervalos, se reiniciará el contenido de las celdas.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function CampoNombreHorario({
  value,
  onChange,
  cursos,
}: {
  value: string
  onChange: (value: string) => void
  cursos: string[]
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1">
        Nombre del horario
      </label>
      {cursos.length > 0 && (
        <select
          value={cursos.includes(value) ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm mb-2"
        >
          <option value="">Elegir un curso del perfil...</option>
          {cursos.map((curso) => (
            <option key={curso} value={curso}>
              {curso}
            </option>
          ))}
        </select>
      )}
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Ej: Horario 1º ESO A"
      />
      {cursos.length === 0 && (
        <p className="text-xs text-muted-foreground mt-1">
          Tip: añade tus cursos en el perfil para elegirlos aquí directamente.
        </p>
      )}
    </div>
  )
}
