import { useState } from 'react'
import { useCuadernoStore } from '../../stores/useCuadernoStore'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

export function CompletarPerfilScreen() {
  const { cuadernoActual, updateMetadata } = useCuadernoStore()
  const [centro, setCentro] = useState(cuadernoActual?.metadata.centro || '')
  const [docente, setDocente] = useState(cuadernoActual?.metadata.docente || '')
  const [cursoEscolar, setCursoEscolar] = useState(cuadernoActual?.metadata.cursoEscolar || '')

  const puedeGuardar = !!(centro.trim() && docente.trim() && cursoEscolar.trim())

  const handleGuardar = () => {
    if (!puedeGuardar) return
    updateMetadata({
      centro: centro.trim(),
      docente: docente.trim(),
      cursoEscolar: cursoEscolar.trim(),
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
      <div className="bg-card text-card-foreground rounded-2xl shadow-[var(--shadow-strong)] border border-border p-8 max-w-lg w-full animate-scale-in">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-3xl shadow-lg">
            👋
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2 tracking-tight">
            Completa tu perfil para continuar
          </h1>
          <p className="text-muted-foreground text-sm">
            Necesitamos estos datos antes de que puedas crear horarios, reuniones o notas.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Centro
            </label>
            <Input
              value={centro}
              onChange={(e) => setCentro(e.target.value)}
              placeholder="Ej: IES Mi Instituto"
              autoFocus
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

          <Button size="lg" className="w-full" onClick={handleGuardar} disabled={!puedeGuardar}>
            Guardar y continuar
          </Button>
        </div>
      </div>
    </div>
  )
}
