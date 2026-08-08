import { useState } from 'react'
import { useCuadernoStore } from '../../stores/useCuadernoStore'
import { CONFIG_HORARIOS_PREDEFINIDOS } from '../../types/constants'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../ui/dialog'
import { Input } from '../ui/input'
import { HorarioTable } from './HorarioTable'
import type { Horario } from '../../types'
import type { ConfigHorarios } from '../../types'
import { Calendar, Trash2, Clock, Edit2 } from 'lucide-react'

export function HorarioManager() {
  const { cuadernoActual, addHorario, updateHorario, deleteHorario } = useCuadernoStore()
  const horarios = cuadernoActual?.horarios || []
  const [showCrear, setShowCrear] = useState(false)
  const [showEditar, setShowEditar] = useState(false)
  const [horarioEditando, setHorarioEditando] = useState<Horario | null>(null)
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoTipo, setNuevoTipo] = useState<'docente' | 'alumnado'>('docente')

  // Configuración de horarios personalizada
  const [configPersonalizada, setConfigPersonalizada] = useState(false)
  const [numPeriodos, setNumPeriodos] = useState(6)
  const [horaInicio, setHoraInicio] = useState('08:00')
  const [duracionPeriodo, setDuracionPeriodo] = useState(55)
  const [conRecreo, setConRecreo] = useState(true)
  const [recreoPeriodo, setRecreoPeriodo] = useState(3)
  const [recreoDuracion, setRecreoDuracion] = useState(30)

  const handleCrear = () => {
    if (!nuevoNombre.trim()) return

    let configHorarios: ConfigHorarios

    if (configPersonalizada) {
      configHorarios = {
        numPeriodos,
        horaInicio,
        duracionPeriodo,
        recreo: conRecreo ? { periodo: recreoPeriodo, duracion: recreoDuracion } : undefined,
      }
    } else {
      configHorarios = CONFIG_HORARIOS_PREDEFINIDOS.secundaria
    }

    const nuevoHorario: Omit<Horario, 'id'> = {
      tipo: nuevoTipo,
      nombre: nuevoNombre,
      datos: Array(7).fill(null).map(() => Array(configHorarios.numPeriodos + (configHorarios.recreo ? 1 : 0)).fill(null).map(() => ({ contenido: '' }))),
      configHorarios,
    }

    addHorario(nuevoHorario)
    setNuevoNombre('')
    setConfigPersonalizada(false)
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

    // Si tiene configHorarios, establecer los valores
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
    })

    setShowEditar(false)
    setHorarioEditando(null)
  }

  const totalPeriodos = configPersonalizada
    ? numPeriodos + (conRecreo ? 1 : 0)
    : 6 + 1 // secundaria tiene 6 periodos + recreo

  if (horarios.length === 0) {
    return (
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
        <Dialog open={showCrear} onOpenChange={setShowCrear}>
          <DialogTrigger asChild>
            <Button>Crear horario</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nuevo horario</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Nombre del horario
                </label>
                <Input
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  placeholder="Ej: Horario 1º ESO A"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Tipo
                </label>
                <select
                  value={nuevoTipo}
                  onChange={(e) => setNuevoTipo(e.target.value as 'docente' | 'alumnado')}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="docente">Docente</option>
                  <option value="alumnado">Alumnado</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="configPersonalizada"
                  checked={configPersonalizada}
                  onChange={(e) => setConfigPersonalizada(e.target.checked)}
                  className="w-4 h-4 text-primary rounded border-input focus:ring-ring"
                />
                <label htmlFor="configPersonalizada" className="text-sm font-medium text-foreground">
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
                        onChange={(e) => setNumPeriodos(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Hora de inicio
                      </label>
                      <Input
                        type="time"
                        value={horaInicio}
                        onChange={(e) => setHoraInicio(e.target.value)}
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
                        onChange={(e) => setDuracionPeriodo(Number(e.target.value))}
                      />
                    </div>
                    <div className="flex items-end">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="conRecreo"
                          checked={conRecreo}
                          onChange={(e) => setConRecreo(e.target.checked)}
                          className="w-4 h-4 text-primary rounded border-input focus:ring-ring"
                        />
                        <label htmlFor="conRecreo" className="text-sm font-medium text-foreground">
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
                          onChange={(e) => setRecreoPeriodo(Number(e.target.value))}
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
                          onChange={(e) => setRecreoDuracion(Number(e.target.value))}
                        />
                      </div>
                    </div>
                  )}

                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-primary">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        Total: {totalPeriodos} periodos
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={handleCrear}>Crear</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Horarios</h2>
        <Dialog open={showCrear} onOpenChange={setShowCrear}>
          <DialogTrigger asChild>
            <Button>+ Nuevo horario</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nuevo horario</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Nombre del horario
                </label>
                <Input
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  placeholder="Ej: Horario 1º ESO A"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Tipo
                </label>
                <select
                  value={nuevoTipo}
                  onChange={(e) => setNuevoTipo(e.target.value as 'docente' | 'alumnado')}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="docente">Docente</option>
                  <option value="alumnado">Alumnado</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="configPersonalizada"
                  checked={configPersonalizada}
                  onChange={(e) => setConfigPersonalizada(e.target.checked)}
                  className="w-4 h-4 text-primary rounded border-input focus:ring-ring"
                />
                <label htmlFor="configPersonalizada" className="text-sm font-medium text-foreground">
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
                        onChange={(e) => setNumPeriodos(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Hora de inicio
                      </label>
                      <Input
                        type="time"
                        value={horaInicio}
                        onChange={(e) => setHoraInicio(e.target.value)}
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
                        onChange={(e) => setDuracionPeriodo(Number(e.target.value))}
                      />
                    </div>
                    <div className="flex items-end">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="conRecreo"
                          checked={conRecreo}
                          onChange={(e) => setConRecreo(e.target.checked)}
                          className="w-4 h-4 text-primary rounded border-input focus:ring-ring"
                        />
                        <label htmlFor="conRecreo" className="text-sm font-medium text-foreground">
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
                          onChange={(e) => setRecreoPeriodo(Number(e.target.value))}
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
                          onChange={(e) => setRecreoDuracion(Number(e.target.value))}
                        />
                      </div>
                    </div>
                  )}

                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-primary">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        Total: {totalPeriodos} periodos
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={handleCrear}>Crear</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Diálogo de Editar Horario */}
        <Dialog open={showEditar} onOpenChange={setShowEditar}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Editar horario</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Nombre del horario
                </label>
                <Input
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  placeholder="Ej: Horario 1º ESO A"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Tipo
                </label>
                <select
                  value={nuevoTipo}
                  onChange={(e) => setNuevoTipo(e.target.value as 'docente' | 'alumnado')}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="docente">Docente</option>
                  <option value="alumnado">Alumnado</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="configPersonalizadaEdit"
                  checked={configPersonalizada}
                  onChange={(e) => setConfigPersonalizada(e.target.checked)}
                  className="w-4 h-4 text-primary rounded border-input focus:ring-ring"
                />
                <label htmlFor="configPersonalizadaEdit" className="text-sm font-medium text-foreground">
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
                        onChange={(e) => setNumPeriodos(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Hora de inicio
                      </label>
                      <Input
                        type="time"
                        value={horaInicio}
                        onChange={(e) => setHoraInicio(e.target.value)}
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
                        onChange={(e) => setDuracionPeriodo(Number(e.target.value))}
                      />
                    </div>
                    <div className="flex items-end">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="conRecreoEdit"
                          checked={conRecreo}
                          onChange={(e) => setConRecreo(e.target.checked)}
                          className="w-4 h-4 text-primary rounded border-input focus:ring-ring"
                        />
                        <label htmlFor="conRecreoEdit" className="text-sm font-medium text-foreground">
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
                          onChange={(e) => setRecreoPeriodo(Number(e.target.value))}
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
                          onChange={(e) => setRecreoDuracion(Number(e.target.value))}
                        />
                      </div>
                    </div>
                  )}

                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-primary">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        Total: {totalPeriodos} periodos
                      </span>
                    </div>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg p-3">
                    <p className="text-sm text-amber-800 dark:text-amber-300">
                      ⚠️ Al modificar la configuración de intervalos, se reiniciará el contenido de las celdas.
                    </p>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={handleGuardarEdicion}>Guardar cambios</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        {horarios.map((horario) => (
          <Card key={horario.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{horario.nombre}</CardTitle>
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
        ))}
      </div>
    </div>
  )
}
