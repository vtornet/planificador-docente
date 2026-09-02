import { useEffect, useRef, useState } from 'react'
import { useCuadernoStore } from '../../stores/useCuadernoStore'
import { useAuthStore } from '../../stores/useAuthStore'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { X, LogOut, Trash2, Check } from 'lucide-react'
import { COMUNIDADES_AUTONOMAS, festivoAutonomicoParaCursoEscolar } from '../../types/festivosOficiales'
import { ETAPAS_EDUCATIVAS } from '../../types/constants'
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
  const [etapaEducativa, setEtapaEducativa] = useState('')
  const [asignaturas, setAsignaturas] = useState<string[]>([])
  const [nuevaAsignatura, setNuevaAsignatura] = useState('')
  const [showTerminos, setShowTerminos] = useState(false)
  const [showPrivacidad, setShowPrivacidad] = useState(false)
  const [showEliminarCuenta, setShowEliminarCuenta] = useState(false)
  const [firmaGuardada, setFirmaGuardada] = useState('')
  const [guardadoOk, setGuardadoOk] = useState(false)

  const firmaActual = JSON.stringify({
    centro, docente, cursoEscolar, cursos, comunidadAutonoma, etapaEducativa, asignaturas,
  })
  const hayCambiosSinGuardar = firmaActual !== firmaGuardada

  // Cargar el formulario una sola vez por apertura (esperando a que
  // cuadernoActual exista). Así un cambio de fondo en el cuaderno —por
  // ejemplo la sincronización— no pisa lo que la docente está editando ni
  // hace parpadear el "Guardado".
  const inicializado = useRef(false)
  useEffect(() => {
    if (!open) {
      inicializado.current = false
      return
    }
    if (inicializado.current || !cuadernoActual) return
    inicializado.current = true
    {
      const init = {
        centro: cuadernoActual.metadata.centro,
        docente: cuadernoActual.metadata.docente,
        cursoEscolar: cuadernoActual.metadata.cursoEscolar,
        cursos: cuadernoActual.metadata.cursos || [],
        comunidadAutonoma: cuadernoActual.metadata.comunidadAutonoma || '',
        etapaEducativa: cuadernoActual.metadata.etapaEducativa || '',
        asignaturas: cuadernoActual.metadata.asignaturas || [],
      }
      setCentro(init.centro)
      setDocente(init.docente)
      setCursoEscolar(init.cursoEscolar)
      setCursos(init.cursos)
      setComunidadAutonoma(init.comunidadAutonoma)
      setEtapaEducativa(init.etapaEducativa)
      setAsignaturas(init.asignaturas)
      setNuevoCurso('')
      setNuevaAsignatura('')
      setFirmaGuardada(JSON.stringify(init))
      setGuardadoOk(false)
    }
  }, [open, cuadernoActual])

  const cerrar = () => {
    if (
      hayCambiosSinGuardar &&
      !window.confirm('¿Cerrar sin guardar? Se perderán los cambios que no hayas guardado.')
    ) {
      return
    }
    onOpenChange(false)
  }

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

  const handleAgregarAsignatura = () => {
    const asignatura = nuevaAsignatura.trim()
    if (asignatura && !asignaturas.includes(asignatura)) {
      setAsignaturas([...asignaturas, asignatura])
    }
    setNuevaAsignatura('')
  }

  const handleEliminarAsignatura = (asignatura: string) => {
    setAsignaturas(asignaturas.filter((a) => a !== asignatura))
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
      etapaEducativa: etapaEducativa || undefined,
      asignaturas,
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

    setFirmaGuardada(firmaActual)
    setGuardadoOk(true)
  }

  return (
    <Dialog open={open} onOpenChange={cerrar}>
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
              Etapa educativa
            </label>
            <p className="text-xs text-muted-foreground mb-2">
              Se usa para elegir la plantilla de intervalos por defecto al crear un horario.
            </p>
            <select
              value={etapaEducativa}
              onChange={(e) => setEtapaEducativa(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Sin especificar</option>
              {ETAPAS_EDUCATIVAS.map((etapa) => (
                <option key={etapa.id} value={etapa.id}>
                  {etapa.nombre}
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

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Asignaturas que impartes
            </label>
            <p className="text-xs text-muted-foreground mb-2">
              Opcional. Sirven de referencia rápida al rellenar el horario y como contexto para el asistente.
            </p>
            <div className="flex gap-2 mb-2">
              <Input
                value={nuevaAsignatura}
                onChange={(e) => setNuevaAsignatura(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAgregarAsignatura()
                  }
                }}
                placeholder="Ej: Matemáticas"
              />
              <Button type="button" variant="outline" onClick={handleAgregarAsignatura}>
                Añadir
              </Button>
            </div>
            {asignaturas.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {asignaturas.map((asignatura) => (
                  <span
                    key={asignatura}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-primary/15 text-primary rounded-full text-sm"
                  >
                    {asignatura}
                    <button
                      type="button"
                      onClick={() => handleEliminarAsignatura(asignatura)}
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
        <DialogFooter className="sm:items-center">
          {guardadoOk && !hayCambiosSinGuardar && (
            <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400 sm:mr-auto">
              <Check className="w-4 h-4" />
              Guardado
            </span>
          )}
          <Button variant="outline" onClick={cerrar}>
            Cerrar
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
