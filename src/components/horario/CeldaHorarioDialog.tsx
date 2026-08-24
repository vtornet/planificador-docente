import type { CeldaHorario } from '../../types'
import { Dialog, DialogContent } from '../ui/dialog'
import { CeldaHorarioForm } from './CeldaHorarioForm'

interface CeldaHorarioDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  celda: CeldaHorario | undefined
  onGuardar: (celda: CeldaHorario) => void
}

// Envoltorio fino: el formulario en sí (asignatura/color/nota, modo Ver/Editar)
// vive en CeldaHorarioForm.tsx, compartido con Planificación (SemanaEditor.tsx/
// VistaSemanal.tsx) para que ambos sitios ofrezcan siempre las mismas
// opciones — ver "HORARIOS Y PLANIFICAR: MISMAS OPCIONES" en CLAUDE.md.
export function CeldaHorarioDialog({ open, onOpenChange, celda, onGuardar }: CeldaHorarioDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <CeldaHorarioForm
          celda={celda}
          onGuardar={(celdaActualizada) => {
            onGuardar(celdaActualizada)
            onOpenChange(false)
          }}
          onCerrar={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
