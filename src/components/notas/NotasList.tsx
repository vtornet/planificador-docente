import { useState, useMemo } from 'react'
import { useCuadernoStore } from '../../stores/useCuadernoStore'
import { useAuthStore } from '../../stores/useAuthStore'
import { TRIAL_LIMIT_PER_MODULE } from '../../constants/trial'
import { CATEGORIAS_NOTAS } from '../../types/constants'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent } from '../ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { PaywallDialog } from '../paywall/PaywallDialog'
import { NotaEditor } from './NotaEditor'
import { NotaViewer } from './NotaViewer'
import { Search, Grid, List, Trash2, Edit, FileText, Download } from 'lucide-react'

const VISTAS = ['grid', 'list'] as const

export function NotasList() {
  const { cuadernoActual, deleteNota } = useCuadernoStore()
  const hasPaid = useAuthStore((s) => s.hasPaid)
  const [showCrear, setShowCrear] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)
  const [editingNota, setEditingNota] = useState<string | null>(null)
  const [viewingNota, setViewingNota] = useState<string | null>(null)
  const [vista, setVista] = useState<(typeof VISTAS)[number]>('grid')
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todos')
  const [busqueda, setBusqueda] = useState('')
  const [filtroTag, setFiltroTag] = useState<string | null>(null)

  const notas = cuadernoActual?.notas || []
  const enTope = !hasPaid && notas.length >= TRIAL_LIMIT_PER_MODULE
  const handleClickNueva = () => {
    if (enTope) setShowPaywall(true)
    else setShowCrear(true)
  }

  // Obtener todos los tags únicos
  const todosTags = useMemo(() => {
    const tags = new Set<string>()
    notas.forEach((nota) => nota.tags?.forEach((tag) => tags.add(tag)))
    return Array.from(tags).sort()
  }, [notas])

  // Filtrar notas
  const notasFiltradas = useMemo(() => {
    let filtradas = [...notas]

    // Filtro por categoría
    if (filtroCategoria !== 'todos') {
      filtradas = filtradas.filter((n) => n.categoria === filtroCategoria)
    }

    // Filtro por tag
    if (filtroTag) {
      filtradas = filtradas.filter((n) => n.tags?.includes(filtroTag))
    }

    // Filtro por búsqueda
    if (busqueda.trim()) {
      const termino = busqueda.toLowerCase()
      filtradas = filtradas.filter(
        (n) =>
          n.titulo.toLowerCase().includes(termino) ||
          n.contenido.toLowerCase().includes(termino) ||
          n.tags?.some((t) => t.toLowerCase().includes(termino))
      )
    }

    // Ordenar por fecha de actualización descendente
    return filtradas.sort(
      (a, b) => new Date(b.actualizado).getTime() - new Date(a.actualizado).getTime()
    )
  }, [notas, filtroCategoria, filtroTag, busqueda])

  const handleEliminar = (id: string, titulo: string) => {
    if (confirm(`¿Eliminar la nota "${titulo}"?`)) {
      deleteNota(id)
    }
  }

  const handleExportarPDF = async (nota: (typeof notas)[number]) => {
    if (!cuadernoActual) return
    try {
      const { exportNotaToPDF } = await import('../../utils/pdf.tsx')
      await exportNotaToPDF(nota, cuadernoActual.metadata)
    } catch (error) {
      console.error('Error exportando nota a PDF:', error)
      alert('Error al exportar la nota a PDF. Inténtalo de nuevo.')
    }
  }

  const getCategoriaEmoji = (categoria: string) => {
    const emojis: Record<string, string> = {
      Proyectos: '📁',
      'Salidas escolares': '🚌',
      'Planos de clase': '📋',
      Ideas: '💡',
      Recursos: '🔗',
      Otro: '📝',
    }
    return emojis[categoria] || '📝'
  }

  const getCategoriaColor = (categoria: string) => {
    const colors: Record<string, string> = {
      Proyectos: 'bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300',
      'Salidas escolares': 'bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300',
      'Planos de clase': 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300',
      Ideas: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-300',
      Recursos: 'bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300',
      Otro: 'bg-muted text-muted-foreground',
    }
    return colors[categoria] || colors.Otro
  }

  const stripHtml = (html: string) => {
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  }

  if (notas.length === 0 && !showCrear) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
          <FileText className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          No hay notas creadas
        </h3>
        <p className="text-muted-foreground mb-6">
          Crea tu primera nota para empezar a organizar tus ideas
        </p>
        <Button onClick={handleClickNueva}>Crear nota</Button>
        <Dialog open={showCrear} onOpenChange={setShowCrear}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nueva Nota</DialogTitle>
            </DialogHeader>
            <NotaEditor
              onSave={() => {
                setShowCrear(false)
              }}
              onCancel={() => setShowCrear(false)}
            />
          </DialogContent>
        </Dialog>
        <PaywallDialog open={showPaywall} onOpenChange={setShowPaywall} modulo="notas" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Notas</h2>
        <Button onClick={handleClickNueva}>+ Nueva Nota</Button>
        <Dialog open={showCrear || !!editingNota} onOpenChange={(open) => {
          setShowCrear(open)
          if (!open) setEditingNota(null)
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingNota ? 'Editar Nota' : 'Nueva Nota'}</DialogTitle>
            </DialogHeader>
            {editingNota ? (
              <NotaEditor
                nota={notas.find((n) => n.id === editingNota)}
                onSave={() => {
                  setEditingNota(null)
                  setShowCrear(false)
                }}
                onCancel={() => {
                  setEditingNota(null)
                  setShowCrear(false)
                }}
              />
            ) : (
              <NotaEditor
                onSave={() => {
                  setShowCrear(false)
                }}
                onCancel={() => setShowCrear(false)}
              />
            )}
          </DialogContent>
        </Dialog>
        <Dialog open={!!viewingNota} onOpenChange={(open) => !open && setViewingNota(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="sr-only">Ver nota</DialogTitle>
            </DialogHeader>
            {(() => {
              const notaViendo = notas.find((n) => n.id === viewingNota)
              if (!notaViendo) return null
              return (
                <NotaViewer
                  nota={notaViendo}
                  onCerrar={() => setViewingNota(null)}
                  onEditar={() => {
                    setEditingNota(notaViendo.id)
                    setViewingNota(null)
                  }}
                />
              )
            })()}
          </DialogContent>
        </Dialog>
        <PaywallDialog open={showPaywall} onOpenChange={setShowPaywall} modulo="notas" />
      </div>

      {/* Filtros y búsqueda */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar en título, contenido o etiquetas..."
                  className="pl-10"
                />
              </div>
              <div className="flex gap-1">
                <Button
                  variant={vista === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  title="Vista de cuadrícula"
                  onClick={() => setVista('grid')}
                >
                  <Grid size={18} />
                </Button>
                <Button
                  variant={vista === 'list' ? 'default' : 'outline'}
                  size="sm"
                  title="Vista de lista"
                  onClick={() => setVista('list')}
                >
                  <List size={18} />
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                <option value="todos">Todas las categorías</option>
                {CATEGORIAS_NOTAS.map((c) => (
                  <option key={c} value={c}>
                    {getCategoriaEmoji(c)} {c}
                  </option>
                ))}
              </select>

              {todosTags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {filtroTag ? (
                    <button
                      onClick={() => setFiltroTag(null)}
                      className="px-2 py-1 bg-primary/15 text-primary rounded text-sm flex items-center gap-1"
                    >
                      #{filtroTag}
                      <span className="hover:text-primary/70">×</span>
                    </button>
                  ) : (
                    todosTags.slice(0, 5).map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setFiltroTag(tag)}
                        className="px-2 py-1 bg-muted text-muted-foreground rounded text-sm hover:bg-accent"
                      >
                        #{tag}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de notas */}
      {notasFiltradas.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No se encontraron notas con los filtros aplicados
        </div>
      ) : vista === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notasFiltradas.map((nota) => (
            <Card
              key={nota.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setViewingNota(nota.id)}
            >
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-foreground line-clamp-1">
                      {nota.titulo}
                    </h3>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${getCategoriaColor(
                          nota.categoria
                        )}`}
                      >
                        {getCategoriaEmoji(nota.categoria)}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-7 h-7 text-muted-foreground hover:text-foreground"
                        title="Descargar esta nota en PDF"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleExportarPDF(nota)
                        }}
                      >
                        <Download size={14} />
                      </Button>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {stripHtml(nota.contenido)}
                  </p>

                  {nota.tags && nota.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {nota.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-muted text-muted-foreground rounded text-xs"
                        >
                          #{tag}
                        </span>
                      ))}
                      {nota.tags.length > 3 && (
                        <span className="px-2 py-0.5 text-muted-foreground text-xs">
                          +{nota.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    {new Date(nota.actualizado).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {notasFiltradas.map((nota) => (
            <Card
              key={nota.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setViewingNota(nota.id)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-foreground">
                        {nota.titulo}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${getCategoriaColor(
                          nota.categoria
                        )}`}
                      >
                        {getCategoriaEmoji(nota.categoria)} {nota.categoria}
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {stripHtml(nota.contenido)}
                    </p>

                    {nota.tags && nota.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {nota.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-muted text-muted-foreground rounded text-xs"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground">
                      Actualizada: {new Date(nota.actualizado).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      title="Descargar esta nota en PDF"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleExportarPDF(nota)
                      }}
                    >
                      <Download size={16} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      title="Editar esta nota"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingNota(nota.id)
                      }}
                    >
                      <Edit size={16} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      title="Eliminar esta nota"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEliminar(nota.id, nota.titulo)
                      }}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="text-sm text-muted-foreground text-center">
        {notasFiltradas.length} {notasFiltradas.length === 1 ? 'nota' : 'notas'}
        {notasFiltradas.length !== notas.length && ` de ${notas.length} totales`}
      </div>
    </div>
  )
}
