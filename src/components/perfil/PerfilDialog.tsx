import { useEffect, useState } from 'react'
import { useCuadernoStore } from '../../stores/useCuadernoStore'
import { useAuthStore } from '../../stores/useAuthStore'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { X, LogOut, Trash2 } from 'lucide-react'
import { COMUNIDADES_AUTONOMAS, festivoAutonomicoParaCursoEscolar } from '../../types/festivosOficiales'
import { TerminosUso } from '../legal/TerminosUso'
import { PoliticaPrivacidad } from '../legal/PoliticaPrivacidad'
import { EliminarCuentaDialog } from './EliminarCuentaDialog'

interface PerfilDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

export function PerfilDialog({ open, onOpenChange }: PerfilDialogProps) {
  const { cuadernoActual, updateMetadata, updateCuaderno } = useCuadernoStore()
  const { user, signOut } = useAuthStore()

  const [centro, setCentro] = useState('')
  const [docente, setDocente] = useState('')
  const [cursoEscolar, setCursoEscolar] = useState('')
  const [cursos, setCursos] = useState<string[]>([])
  const [nuevoCurso, setNuevoCurso] = useState('')
  const [comunidadAutonoma, setComunidadAutonoma] = useState('')
  const [showTerminos, setShowTerminos] = useState(false)
  const [showPrivacidad, setShowPrivacidad] = useState(false)
  const [showEliminarCuenta, setShowEliminarCuenta] = useState(false)

  useEffect(() => {
    if (open && cuadernoActual) {
      setCentro(cuadernoActual.metadata.centro)
      setDocente(cuadernoActual.metadata.docente)
      setCursoEscolar(cuadernoActual.metadata.cursoEscolar)
      setCursos(cuadernoActual.metadata.cursos || [])
      setComunidadAutonoma(cuadernoActual.metadata.comunidadAutonoma || '')
      setNuevoCurso('')
    }
  }, [open, cuadernoActual])

  const handleAgregarCurso = () => {
    const curso = nuevoCurso.trim()
    if (curso && !cursos.includes(curso)) {
      setCursos([...cursos, curso])
    }
    setNuevoCurso('')
  }

  const handleEliminarCurso = (curso: string) => {
    setCursos(cursos.filter((c) => c !== curso))
  }

  const handleGuardar = () => {
    const comunidadAnterior = cuadernoActual?.metadata.comunidadAutonoma
    const comunidadNueva = comunidadAutonoma || undefined

    updateMetadata({
      centro: centro.trim(),
      docente: docente.trim(),
      cursoEscolar: cursoEscolar.trim(),
      cursos,
      comunidadAutonoma: comunidadNueva,
    })

    // Si cambia la comunidad autónoma, sustituir el festivo autonómico
    // cargado automáticamente por el de la nueva comunidad (los festivos
    // añadidos a mano, o el resto de tipos, no se tocan).
    if (cuadernoActual && comunidadNueva !== comunidadAnterior) {
      const festivosSinAutonomicoAutomatico = (cuadernoActual.configuracion.festivos || []).filter(
        (f) => !(f.tipo === 'autonomico' && f.origen === 'automatico')
      )
      const nuevoFestivoAutonomico = comunidadNueva
        ? festivoAutonomicoParaCursoEscolar(comunidadNueva, cuadernoActual.metadata.cursoEscolar).map((f) => ({
            ...f,
            id: generateId(),
            origen: 'automatico' as const,
          }))
        : []
      updateCuaderno({
        configuracion: {
          ...cuadernoActual.configuracion,
          festivos: [...festivosSinAutonomicoAutomatico, ...nuevoFestivoAutonomico],
        },
      })
    }

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Perfil</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Centro
            </label>
            <Input
              value={centro}
              onChange={(e) => setCentro(e.target.value)}
              placeholder="Ej: IES Mi Instituto"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Docente
            </label>
            <Input
              value={docente}
              onChange={(e) => setDocente(e.target.value)}
              placeholder="Tu nombre"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Curso escolar
            </label>
            <Input
              value={cursoEscolar}
              onChange={(e) => setCursoEscolar(e.target.value)}
              placeholder="Ej: 2026-2027"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Comunidad autónoma
            </label>
            <p className="text-xs text-muted-foreground mb-2">
              Al elegirla, se carga automáticamente su festivo autonómico en Calendario.
            </p>
            <select
              value={comunidadAutonoma}
              onChange={(e) => setComunidadAutonoma(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Sin especificar</option>
              {COMUNIDADES_AUTONOMAS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Cursos / Grupos
            </label>
            <p className="text-xs text-muted-foreground mb-2">
              Añádelos para poder elegirlos directamente al crear un horario.
            </p>
            <div className="flex gap-2 mb-2">
              <Input
                value={nuevoCurso}
                onChange={(e) => setNuevoCurso(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAgregarCurso()
                  }
                }}
                placeholder="Ej: 1º ESO A"
              />
              <Button type="button" variant="outline" onClick={handleAgregarCurso}>
                Añadir
              </Button>
            </div>
            {cursos.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {cursos.map((curso) => (
                  <span
                    key={curso}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-primary/15 text-primary rounded-full text-sm"
                  >
                    {curso}
                    <button
                      type="button"
                      onClick={() => handleEliminarCurso(curso)}
                      className="hover:text-primary/70"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground truncate">{user?.email}</div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onOpenChange(false)
                signOut()
              }}
            >
              <LogOut className="w-4 h-4" />
              Cerrar sesión
            </Button>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <button type="button" onClick={() => setShowTerminos(true)} className="underline hover:text-foreground">
              Términos de Uso
            </button>
            <button type="button" onClick={() => setShowPrivacidad(true)} className="underline hover:text-foreground">
              Política de Privacidad
            </button>
          </div>

          <div className="pt-2 border-t border-border">
            <button
              type="button"
              onClick={() => setShowEliminarCuenta(true)}
              className="flex items-center gap-1.5 text-xs text-destructive/80 hover:text-destructive underline"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Eliminar mi cuenta
            </button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleGuardar}>Guardar</Button>
        </DialogFooter>
      </DialogContent>

      <TerminosUso open={showTerminos} onOpenChange={setShowTerminos} />
      <PoliticaPrivacidad open={showPrivacidad} onOpenChange={setShowPrivacidad} />
      <EliminarCuentaDialog open={showEliminarCuenta} onOpenChange={setShowEliminarCuenta} />
    </Dialog>
  )
}
