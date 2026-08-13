import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useCuadernoStore } from '../../stores/useCuadernoStore'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { HorarioTable } from '../horario/HorarioTable'
import { horarioActivoEnRango, horarioAbarcaMasDeLaSemana, dividirHorarioParaSemana } from '../../utils/horarios'
import type { Horario } from '../../types'
import { CalendarDays } from 'lucide-react'

interface HorarioSemanaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  semana: { inicio: Date; fin: Date } | null
}

export function HorarioSemanaDialog({ open, onOpenChange, semana }: HorarioSemanaDialogProps) {
  const { cuadernoActual, updateHorario, addHorario, setView } = useCuadernoStore()

  const horarios = semana
    ? (cuadernoActual?.horarios || []).filter((h) => horarioActivoEnRango(h, semana.inicio, semana.fin))
    : []

  const handleGuardarDatosHorario = (horario: Horario, datos: Horario['datos'], alcance?: 'periodo' | 'semana') => {
    if (!semana) return
    if (alcance === 'semana') {
      const { actualizacionOriginal, nuevos } = dividirHorarioParaSemana(horario, semana)
      nuevos[0] = { ...nuevos[0], datos }
      updateHorario(horario.id, actualizacionOriginal)
      nuevos.forEach((nuevo) => addHorario(nuevo))
    } else {
      updateHorario(horario.id, { ...horario, datos })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {semana
              ? `Horario de la semana del ${format(semana.inicio, 'd')} al ${format(semana.fin, "d 'de' MMMM", { locale: es })}`
              : 'Horario de la semana'}
          </DialogTitle>
        </DialogHeader>

        {horarios.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-primary/10 flex items-center justify-center">
              <CalendarDays className="w-7 h-7 text-primary" />
            </div>
            <p className="text-muted-foreground mb-4">No hay ningún horario de clase para esta semana.</p>
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false)
                setView('horario')
              }}
            >
              Ir a Horarios
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {horarios.map((horario) => {
              const preguntarAlcance = semana ? horarioAbarcaMasDeLaSemana(horario, semana) : false
              return (
                <div key={horario.id}>
                  {preguntarAlcance && semana && (
                    <p className="mb-3 text-sm text-muted-foreground">
                      Este horario abarca más de esta semana. Al guardar, podrás elegir si los cambios se aplican a
                      todo el periodo o solo a esta semana.
                    </p>
                  )}
                  <HorarioTable
                    horario={horario}
                    onGuardar={(datos, alcance) => handleGuardarDatosHorario(horario, datos, alcance)}
                    preguntarAlcance={preguntarAlcance}
                    semana={semana || undefined}
                  />
                </div>
              )
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
