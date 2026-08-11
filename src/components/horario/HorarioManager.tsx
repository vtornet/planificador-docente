import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useCuadernoStore } from '../../stores/useCuadernoStore'
import { CONFIG_HORARIOS_PREDEFINIDOS, MESES } from '../../types/constants'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Input } from '../ui/input'
import { HorarioTable } from './HorarioTable'
import type { Horario, ConfigHorarios } from '../../types'
import { Calendar, Trash2, Clock, Edit2 } from 'lucide-react'

// Índice del mes dentro del curso escolar (0 = Septiembre ... 10 = Julio)
function indiceMesEscolar(fecha: Date): number {
  return ((fecha.getMonth() - 8) % 12 + 12) % 12
}

function formatRangoFechas(fechaInicio?: Date, fechaFin?: Date): string {
  if (!fechaInicio) return ''
  const inicio = new Date(fechaInicio)
  if (!fechaFin) return `Desde el ${format(inicio, "d 'de' MMMM 'de' yyyy", { locale: es })}`

  const fin = new Date(fechaFin)
  const mismoMes = inicio.getMonth() === fin.getMonth() && inicio.getFullYear() === fin.getFullYear()
  if (mismoMes) {
    return `Del ${format(inicio, 'd')} al ${format(fin, "d 'de' MMMM 'de' yyyy", { locale: es })}`
  }
  return `Del ${format(inicio, 'd MMM', { locale: es })} al ${format(fin, 'd MMM yyyy', { locale: es })}`
}

export function HorarioManager() {
  const { cuadernoActual, addHorario, updateHorario, deleteHorario } = useCuadernoStore()
  const horarios = cuadernoActual?.horarios || []
  const [showCrear, setShowCrear] = useState(false)
  const [showEditar, setShowEditar] = useState(false)
  const [horarioEditando, setHorarioEditando] = useState<Horario | null>(null)
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

  const handleAbrirCrear = () => {
    setNuevoNombre('')
    setNuevoTipo('docente')
    setConfigPersonalizada(false)
    setFechaInicio(format(new Date(), 'yyyy-MM-dd'))
    const [, anioFin] = (cuadernoActual?.metadata.cursoEscolar || '').split('-').map(Number)
    setFechaFin(anioFin ? `${anioFin}-07-31` : '')
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

    const nuevoHorario: Omit<Horario, 'id'> = {
      tipo: nuevoTipo,
      nombre: nuevoNombre,
      datos: Array(7).fill(null).map(() => Array(configHorarios.numPeriodos + (configHorarios.recreo ? 1 : 0)).fill(null).map(() => ({ contenido: '' }))),
      configHorarios,
      fechaInicio: fechaInicio ? new Date(fechaInicio) : undefined,
      fechaFin: fechaFin ? new Date(fechaFin) : undefined,
    }

    addHorario(nuevoHorario)
    setShowCrear(false)
  }

  const handleUpdate = (horario: Horario) => {
    updateHorario(horario.id, horario)
  }

  const handleDelete = (id: string) => {
    if (confirm('¿Eliminar este horario?')) {
      deleteHorario(id)
    }
  }

  const handleEditarClick = (horario: Horario) => {
    setHorarioEditando(horario)
    setNuevoNombre(horario.nombre)
    setNuevoTipo(horario.tipo)
    setFechaInicio(horario.fechaInicio ? format(new Date(horario.fechaInicio), 'yyyy-MM-dd') : '')
    setFechaFin(horario.fechaFin ? format(new Date(horario.fechaFin), 'yyyy-MM-dd') : '')

    if (horario.configHorarios) {
      setConfigPersonalizada(true)
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
    } else {
      setConfigPersonalizada(false)
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

    // Si la configuración cambió, necesitamos redimensionar la matriz de datos
    const nuevosDatos = configPersonalizada
      ? Array(7).fill(null).map(() => Array(configHorarios.numPeriodos + (configHorarios.recreo ? 1 : 0)).fill(null).map(() => ({ contenido: '' })))
      : horarioEditando.datos

    updateHorario(horarioEditando.id, {
      ...horarioEditando,
      nombre: nuevoNombre,
      tipo: nuevoTipo,
      datos: nuevosDatos,
      configHorarios,
      fechaInicio: fechaInicio ? new Date(fechaInicio) : undefined,
      fechaFin: fechaFin ? new Date(fechaFin) : undefined,
    })

    setShowEditar(false)
    setHorarioEditando(null)
  }

  const horariosSinFecha = horarios.filter((h) => !h.fechaInicio)
  const gruposPorMes = MESES.map((nombreMes, idx) => ({
    nombreMes,
    horarios: horarios
      .filter((h) => h.fechaInicio && indiceMesEscolar(new Date(h.fechaInicio)) === idx)
      .sort((a, b) => new Date(a.fechaInicio!).getTime() - new Date(b.fechaInicio!).getTime()),
  })).filter((grupo) => grupo.horarios.length > 0)

  const renderHorarioCard = (horario: Horario) => (
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
              onClick={() => handleEditarClick(horario)}
              className="text-primary hover:text-primary hover:bg-primary/10"
              title="Editar horario"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(horario.id)}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              title="Eliminar horario"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <HorarioTable horario={horario} onUpdate={handleUpdate} onDuplicate={addHorario} />
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Horarios</h2>
        <Button onClick={handleAbrirCrear}>+ Nuevo horario</Button>
      </div>

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

      {horarios.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Calendar className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            No hay horarios creados
          </h3>
          <p className="text-muted-foreground mb-6">
            Crea tu primer horario para empezar a planificar
          </p>
          <Button onClick={handleAbrirCrear}>Crear horario</Button>
        </div>
      ) : (
        <div className="space-y-8">
          {horariosSinFecha.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 pb-2 border-b border-border">
                Sin periodo asignado
              </h3>
              <div className="space-y-6">{horariosSinFecha.map(renderHorarioCard)}</div>
            </section>
          )}

          {gruposPorMes.map((grupo) => (
            <section key={grupo.nombreMes}>
              <h3 className="text-sm font-semibold text-primary uppercase tracking-wide mb-3 pb-2 border-b border-border">
                {grupo.nombreMes}
              </h3>
              <div className="space-y-6">{grupo.horarios.map(renderHorarioCard)}</div>
            </section>
          ))}
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
