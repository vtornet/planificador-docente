import { useState, useMemo } from 'react'
import { format, isWithinInterval, startOfMonth, endOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import { useCuadernoStore } from '../../stores/useCuadernoStore'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent } from '../ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { ReunionForm } from './ReunionForm'

const TIPOS_FILTRO = [
  { value: 'todos', label: 'Todas' },
  { value: 'claustro', label: 'Claustro' },
  { value: 'departamento', label: 'Departamento' },
  { value: 'ciclo', label: 'Ciclo' },
  { value: 'tutoria', label: 'Tutoría' },
  { value: 'otra', label: 'Otra' },
] as const

export function ReunionList() {
  const { cuadernoActual, deleteReunion } = useCuadernoStore()
  const [showCrear, setShowCrear] = useState(false)
  const [editingReunion, setEditingReunion] = useState<string | null>(null)
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')
  const [busqueda, setBusqueda] = useState('')
  const [filtroMes, setFiltroMes] = useState<string | null>(null)

  const reuniones = cuadernoActual?.reuniones || []

  // Filtrar reuniones
  const reunionesFiltradas = useMemo(() => {
    let filtradas = [...reuniones]

    // Filtro por tipo
    if (filtroTipo !== 'todos') {
      filtradas = filtradas.filter((r) => r.tipo === filtroTipo)
    }

    // Filtro por búsqueda
    if (busqueda.trim()) {
      const termino = busqueda.toLowerCase()
      filtradas = filtradas.filter(
        (r) =>
          r.titulo.toLowerCase().includes(termino) ||
          r.asistentes.some((a) => a.toLowerCase().includes(termino)) ||
          r.asuntosTratados.toLowerCase().includes(termino)
      )
    }

    // Filtro por mes
    if (filtroMes) {
      const [year, month] = filtroMes.split('-').map(Number)
      const inicio = startOfMonth(new Date(year, month - 1))
      const fin = endOfMonth(new Date(year, month - 1))
      filtradas = filtradas.filter((r) =>
        isWithinInterval(new Date(r.fecha), { start: inicio, end: fin })
      )
    }

    // Ordenar por fecha descendente
    return filtradas.sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    )
  }, [reuniones, filtroTipo, busqueda, filtroMes])

  const handleEliminar = (id: string, titulo: string) => {
    if (confirm(`¿Eliminar la reunión "${titulo}"?`)) {
      deleteReunion(id)
    }
  }

  const getTipoLabel = (tipo: string) => {
    return TIPOS_FILTRO.find((t) => t.value === tipo)?.label || tipo
  }

  const getTipoColor = (tipo: string) => {
    const colors = {
      claustro: 'bg-purple-100 text-purple-800',
      departamento: 'bg-blue-100 text-blue-800',
      ciclo: 'bg-green-100 text-green-800',
      tutoria: 'bg-orange-100 text-orange-800',
      otra: 'bg-slate-100 text-slate-800',
    }
    return colors[tipo as keyof typeof colors] || colors.otra
  }

  if (reuniones.length === 0 && !showCrear) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">👥</div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">
          No hay reuniones registradas
        </h3>
        <p className="text-slate-600 mb-6">
          Crea tu primera reunión para empezar a documentar las actas
        </p>
        <Dialog open={showCrear} onOpenChange={setShowCrear}>
          <DialogTrigger asChild>
            <Button>Crear reunión</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nueva Reunión</DialogTitle>
            </DialogHeader>
            <ReunionForm
              onSave={() => {
                setShowCrear(false)
              }}
              onCancel={() => setShowCrear(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Reuniones</h2>
        <Dialog open={showCrear || !!editingReunion} onOpenChange={(open) => {
          if (!open) {
            setShowCrear(false)
            setEditingReunion(null)
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setShowCrear(true)}>+ Nueva Reunión</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingReunion ? 'Editar Reunión' : 'Nueva Reunión'}</DialogTitle>
            </DialogHeader>
            {editingReunion ? (
              <ReunionForm
                reunion={reuniones.find((r) => r.id === editingReunion)}
                onSave={() => {
                  setEditingReunion(null)
                  setShowCrear(false)
                }}
                onCancel={() => {
                  setEditingReunion(null)
                  setShowCrear(false)
                }}
              />
            ) : (
              <ReunionForm
                onSave={() => {
                  setShowCrear(false)
                }}
                onCancel={() => setShowCrear(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Buscar
              </label>
              <Input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Título, asistentes..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tipo
              </label>
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {TIPOS_FILTRO.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Mes
              </label>
              <Input
                type="month"
                value={filtroMes || ''}
                onChange={(e) => setFiltroMes(e.target.value || null)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de reuniones */}
      <div className="space-y-4">
        {reunionesFiltradas.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            No se encontraron reuniones con los filtros aplicados
          </div>
        ) : (
          reunionesFiltradas.map((reunion) => (
            <Card
              key={reunion.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setEditingReunion(reunion.id)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {reunion.titulo}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${getTipoColor(
                          reunion.tipo
                        )}`}
                      >
                        {getTipoLabel(reunion.tipo)}
                      </span>
                    </div>
                    <div className="text-sm text-slate-600 mb-2">
                      📅 {format(new Date(reunion.fecha), 'EEEE, dd MMMM yyyy', {
                        locale: es,
                      })}
                    </div>
                    <div className="text-sm text-slate-600 mb-3">
                      👥 {reunion.asistentes.join(', ') || 'Sin asistentes'}
                    </div>
                    {reunion.asuntosTratados && (
                      <div className="text-sm text-slate-600 line-clamp-2">
                        📝 {reunion.asuntosTratados}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingReunion(reunion.id)
                      }}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEliminar(reunion.id, reunion.titulo)
                      }}
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="text-sm text-slate-500 text-center">
        {reunionesFiltradas.length} {reunionesFiltradas.length === 1 ? 'reunión' : 'reuniones'}
        {reunionesFiltradas.length !== reuniones.length && ` de ${reuniones.length} totales`}
      </div>
    </div>
  )
}
