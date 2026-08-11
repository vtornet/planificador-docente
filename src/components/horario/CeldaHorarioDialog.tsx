import { useEffect, useState } from 'react'
import { useCuadernoStore } from '../../stores/useCuadernoStore'
import { ASIGNATURAS_PREDEFINIDAS, COLORES_ASIGNATURAS_PREDEFINIDAS, PALETA_ASIGNATURAS } from '../../types/constants'
import type { CeldaHorario } from '../../types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { StickyNote, Check } from 'lucide-react'
import { cn } from '../../utils/cn'

const OTRA = '__otra__'

interface CeldaHorarioDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  celda: CeldaHorario | undefined
  onGuardar: (celda: CeldaHorario) => void
}

// Solo las clases de fondo (bg-... y dark:bg-...) de una entrada de la paleta,
// para pintar un círculo de muestra sin arrastrar también el color del texto.
function claseSwatch(colorId: string): string {
  const color = PALETA_ASIGNATURAS.find((c) => c.id === colorId)
  if (!color) return ''
  return color.clase
    .split(' ')
    .filter((clase) => clase.includes('bg-'))
    .join(' ')
}

export function CeldaHorarioDialog({ open, onOpenChange, celda, onGuardar }: CeldaHorarioDialogProps) {
  const { cuadernoActual, updateCuaderno } = useCuadernoStore()
  const coloresPersonalizados = cuadernoActual?.configuracion.coloresAsignaturas || {}

  const [modo, setModo] = useState<'ver' | 'editar'>('editar')
  const [asignatura, setAsignatura] = useState('')
  const [personalizada, setPersonalizada] = useState('')
  const [esPersonalizada, setEsPersonalizada] = useState(false)
  const [nota, setNota] = useState('')
  const [colorElegido, setColorElegido] = useState('')

  const coloresUsados = new Set([
    ...Object.values(COLORES_ASIGNATURAS_PREDEFINIDAS),
    ...Object.values(coloresPersonalizados),
  ])
  const coloresDisponibles = PALETA_ASIGNATURAS.filter((c) => !coloresUsados.has(c.id))
  const paletaParaElegir = coloresDisponibles.length > 0 ? coloresDisponibles : PALETA_ASIGNATURAS

  const nombrePersonalizada = personalizada.trim()
  const esAsignaturaNueva = esPersonalizada && nombrePersonalizada !== '' && !coloresPersonalizados[nombrePersonalizada]

  useEffect(() => {
    if (!open) return
    const contenidoActual = celda?.contenido || ''
    const esPredefinida = (ASIGNATURAS_PREDEFINIDAS as readonly string[]).includes(contenidoActual)

    if (contenidoActual && !esPredefinida) {
      setEsPersonalizada(true)
      setAsignatura(OTRA)
      setPersonalizada(contenidoActual)
    } else {
      setEsPersonalizada(false)
      setAsignatura(contenidoActual)
      setPersonalizada('')
    }
    setNota(celda?.nota || '')
    setColorElegido('')
    setModo(contenidoActual ? 'ver' : 'editar')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, celda])

  const handleChangeAsignatura = (valor: string) => {
    setAsignatura(valor)
    setEsPersonalizada(valor === OTRA)
  }

  const handleChangePersonalizada = (valor: string) => {
    setPersonalizada(valor)
    const trimmed = valor.trim()
    if (trimmed && !coloresPersonalizados[trimmed]) {
      setColorElegido((prev) => (prev && paletaParaElegir.some((c) => c.id === prev) ? prev : paletaParaElegir[0]?.id || ''))
    }
  }

  const handleGuardar = () => {
    const contenido = esPersonalizada ? nombrePersonalizada : asignatura
    let color: string | undefined

    if (!contenido) {
      color = undefined
    } else if (COLORES_ASIGNATURAS_PREDEFINIDAS[contenido]) {
      color = COLORES_ASIGNATURAS_PREDEFINIDAS[contenido]
    } else if (coloresPersonalizados[contenido]) {
      color = coloresPersonalizados[contenido]
    } else {
      color = colorElegido || paletaParaElegir[0]?.id
      if (cuadernoActual && color) {
        updateCuaderno({
          configuracion: {
            ...cuadernoActual.configuracion,
            coloresAsignaturas: { ...coloresPersonalizados, [contenido]: color },
          },
        })
      }
    }

    onGuardar({ ...celda, contenido, nota: nota.trim() || undefined, color })
    onOpenChange(false)
  }

  const handleVaciar = () => {
    onGuardar({ ...celda, contenido: '', nota: undefined, color: undefined })
    onOpenChange(false)
  }

  if (modo === 'ver') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {celda?.color && (
                <span className={cn('w-3 h-3 rounded-full flex-shrink-0', claseSwatch(celda.color))} />
              )}
              {celda?.contenido || 'Celda'}
            </DialogTitle>
          </DialogHeader>
          <div>
            {celda?.nota ? (
              <div className="flex items-start gap-2 text-sm text-foreground bg-muted rounded-lg p-3">
                <StickyNote className="w-4 h-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                <p className="whitespace-pre-wrap break-words">{celda.nota}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Sin nota</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
            <Button onClick={() => setModo('editar')}>Editar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar celda</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Asignatura
            </label>
            <select
              value={asignatura}
              onChange={(e) => handleChangeAsignatura(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Sin asignar</option>
              {ASIGNATURAS_PREDEFINIDAS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
              <option value={OTRA}>Otra (personalizada)...</option>
            </select>
          </div>

          {esPersonalizada && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Nombre de la asignatura
              </label>
              <Input
                value={personalizada}
                onChange={(e) => handleChangePersonalizada(e.target.value)}
                placeholder="Ej: Robótica"
                autoFocus
              />
            </div>
          )}

          {esAsignaturaNueva && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Color de la asignatura
              </label>
              <div className="flex flex-wrap gap-2">
                {paletaParaElegir.map((color) => (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => setColorElegido(color.id)}
                    title={color.id}
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-transform',
                      claseSwatch(color.id),
                      colorElegido === color.id
                        ? 'border-foreground scale-110'
                        : 'border-transparent hover:scale-105'
                    )}
                  >
                    {colorElegido === color.id && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </div>
              {coloresDisponibles.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Ya se han usado todos los colores disponibles, puedes repetir uno.
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Nota
            </label>
            <Textarea
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Ej: Traer material de plástica..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={handleVaciar}>
            Vaciar celda
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleGuardar}>Guardar</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
