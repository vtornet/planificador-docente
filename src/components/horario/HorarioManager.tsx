import { useState } from 'react'
import { useCuadernoStore } from '../../stores/useCuadernoStore'
import { CONFIG_HORARIOS_PREDEFINIDOS } from '../../types/constants'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../ui/dialog'
import { Input } from '../ui/input'
import { HorarioTable } from './HorarioTable'
import type { Horario } from '../../types'

export function HorarioManager() {
  const { cuadernoActual, addHorario, updateHorario, deleteHorario } = useCuadernoStore()
  const horarios = cuadernoActual?.horarios || []
  const [showCrear, setShowCrear] = useState(false)
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoTipo, setNuevoTipo] = useState<'docente' | 'alumnado'>('docente')

  const handleCrear = () => {
    if (!nuevoNombre.trim()) return

    const nuevoHorario: Omit<Horario, 'id'> = {
      tipo: nuevoTipo,
      nombre: nuevoNombre,
      datos: Array(7).fill(null).map(() => Array(5).fill(null).map(() => ({ contenido: '' }))),
      configHorarios: CONFIG_HORARIOS_PREDEFINIDOS.secundaria,
    }

    addHorario(nuevoHorario)
    setNuevoNombre('')
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

  if (horarios.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📅</div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">
          No hay horarios creados
        </h3>
        <p className="text-slate-600 mb-6">
          Crea tu primer horario para empezar a planificar
        </p>
        <Dialog open={showCrear} onOpenChange={setShowCrear}>
          <DialogTrigger asChild>
            <Button>Crear horario</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo horario</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nombre del horario
                </label>
                <Input
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  placeholder="Ej: Horario 1º ESO A"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tipo
                </label>
                <select
                  value={nuevoTipo}
                  onChange={(e) => setNuevoTipo(e.target.value as 'docente' | 'alumnado')}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="docente">👨‍🏫 Docente</option>
                  <option value="alumnado">👨‍🎓 Alumnado</option>
                </select>
              </div>
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
        <h2 className="text-2xl font-bold text-slate-900">Horarios</h2>
        <Dialog open={showCrear} onOpenChange={setShowCrear}>
          <DialogTrigger asChild>
            <Button>+ Nuevo horario</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo horario</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nombre del horario
                </label>
                <Input
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  placeholder="Ej: Horario 1º ESO A"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tipo
                </label>
                <select
                  value={nuevoTipo}
                  onChange={(e) => setNuevoTipo(e.target.value as 'docente' | 'alumnado')}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="docente">👨‍🏫 Docente</option>
                  <option value="alumnado">👨‍🎓 Alumnado</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCrear}>Crear</Button>
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
                <button
                  onClick={() => handleDelete(horario.id)}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Eliminar
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <HorarioTable horario={horario} onUpdate={handleUpdate} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
