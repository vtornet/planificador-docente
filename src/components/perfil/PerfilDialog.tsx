import { useEffect, useState } from 'react'
import { useCuadernoStore } from '../../stores/useCuadernoStore'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { X } from 'lucide-react'

interface PerfilDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PerfilDialog({ open, onOpenChange }: PerfilDialogProps) {
  const { cuadernoActual, updateMetadata } = useCuadernoStore()

  const [centro, setCentro] = useState('')
  const [docente, setDocente] = useState('')
  const [cursoEscolar, setCursoEscolar] = useState('')
  const [cursos, setCursos] = useState<string[]>([])
  const [nuevoCurso, setNuevoCurso] = useState('')

  useEffect(() => {
    if (open && cuadernoActual) {
      setCentro(cuadernoActual.metadata.centro)
      setDocente(cuadernoActual.metadata.docente)
      setCursoEscolar(cuadernoActual.metadata.cursoEscolar)
      setCursos(cuadernoActual.metadata.cursos || [])
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
    updateMetadata({
      centro: centro.trim(),
      docente: docente.trim(),
      cursoEscolar: cursoEscolar.trim(),
      cursos,
    })
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleGuardar}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
