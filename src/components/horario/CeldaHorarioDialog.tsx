import { useEffect, useState } from 'react'
import { ASIGNATURAS_PREDEFINIDAS } from '../../types/constants'
import type { CeldaHorario } from '../../types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'

const OTRA = '__otra__'

interface CeldaHorarioDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  celda: CeldaHorario | undefined
  onGuardar: (celda: CeldaHorario) => void
}

export function CeldaHorarioDialog({ open, onOpenChange, celda, onGuardar }: CeldaHorarioDialogProps) {
  const [asignatura, setAsignatura] = useState('')
  const [personalizada, setPersonalizada] = useState('')
  const [esPersonalizada, setEsPersonalizada] = useState(false)
  const [nota, setNota] = useState('')

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
  }, [open, celda])

  const handleChangeAsignatura = (valor: string) => {
    setAsignatura(valor)
    setEsPersonalizada(valor === OTRA)
  }

  const handleGuardar = () => {
    const contenido = esPersonalizada ? personalizada.trim() : asignatura
    onGuardar({
      ...celda,
      contenido,
      nota: nota.trim() || undefined,
    })
    onOpenChange(false)
  }

  const handleVaciar = () => {
    onGuardar({ ...celda, contenido: '', nota: undefined })
    onOpenChange(false)
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
                onChange={(e) => setPersonalizada(e.target.value)}
                placeholder="Ej: Robótica"
                autoFocus
              />
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
