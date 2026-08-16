import { useEffect, useState } from 'react'
import { useCuadernoStore } from '../../stores/useCuadernoStore'
import { DIAS_SEMANA, PALETA_ASIGNATURAS } from '../../types/constants'
import type { ConfigHorarios } from '../../types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Button } from '../ui/button'
import { Check } from 'lucide-react'
import { cn } from '../../utils/cn'

interface ExportarAHorarioDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  texto: string
  onExportado: () => void
}

// Deja elegir un horario y una celda concreta (día + periodo) para guardar
// `texto` como nota de esa celda — reutiliza la misma matriz [periodo][día]
// que HorarioTable.tsx, pero como selector de destino, no como editor: al
// hacer click en una celda no se abre CeldaHorarioDialog, solo se marca como
// seleccionada.
export function ExportarAHorarioDialog({ open, onOpenChange, texto, onExportado }: ExportarAHorarioDialogProps) {
  const { cuadernoActual, updateHorario } = useCuadernoStore()
  const horarios = cuadernoActual?.horarios || []

  const [horarioId, setHorarioId] = useState('')
  const [celdaSeleccionada, setCeldaSeleccionada] = useState<{ fila: number; columna: number } | null>(null)

  useEffect(() => {
    if (open) {
      setHorarioId(horarios[0]?.id || '')
      setCeldaSeleccionada(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const horario = horarios.find((h) => h.id === horarioId)
  const periodos = horario ? generarPeriodos(horario.configHorarios) : []
  const celda = horario && celdaSeleccionada ? horario.datos[celdaSeleccionada.fila]?.[celdaSeleccionada.columna] : undefined
  const notaExistente = celda?.nota?.trim()

  const handleGuardar = () => {
    if (!horario || !celdaSeleccionada) return
    const { fila, columna } = celdaSeleccionada
    const nuevaNota = notaExistente ? `${notaExistente}\n\n${texto}` : texto

    const nuevosDatos = horario.datos.map((f) => [...f])
    nuevosDatos[fila] = [...nuevosDatos[fila]]
    nuevosDatos[fila][columna] = { ...nuevosDatos[fila][columna], nota: nuevaNota }

    updateHorario(horario.id, { datos: nuevosDatos })
    onOpenChange(false)
    onExportado()
  }

  if (horarios.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Exportar a un horario</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Todavía no tienes ningún horario creado. Crea uno primero en la sección Horarios.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Exportar respuesta a un horario</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Horario</label>
            <select
              value={horarioId}
              onChange={(e) => {
                setHorarioId(e.target.value)
                setCeldaSeleccionada(null)
              }}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              {horarios.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.nombre}
                </option>
              ))}
            </select>
          </div>

          {horario && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Elige la celda donde guardar la nota
              </label>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full border-collapse table-fixed text-xs">
                  <thead>
                    <tr className="bg-muted">
                      <th className="border border-border p-1 w-14 text-muted-foreground">Hora</th>
                      {DIAS_SEMANA.map((dia) => (
                        <th key={dia} className="border border-border p-1 text-foreground">
                          {dia}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {periodos.map((periodo, fila) => (
                      <tr key={fila}>
                        <td className="border border-border p-1 text-center text-muted-foreground">
                          {periodo.esRecreo ? '☕' : periodo.inicio}
                        </td>
                        {DIAS_SEMANA.map((_, columna) => {
                          if (periodo.esRecreo) {
                            return <td key={columna} className="border border-border p-1 bg-muted/60" />
                          }
                          const c = horario.datos[fila]?.[columna]
                          const seleccionada = celdaSeleccionada?.fila === fila && celdaSeleccionada?.columna === columna
                          const claseColor = c?.color
                            ? PALETA_ASIGNATURAS.find((x) => x.id === c.color)?.clase
                            : undefined
                          return (
                            <td
                              key={columna}
                              onClick={() => setCeldaSeleccionada({ fila, columna })}
                              title={c?.contenido || 'Sin asignar'}
                              className={cn(
                                'border border-border p-1 cursor-pointer align-top max-w-0',
                                seleccionada
                                  ? 'ring-2 ring-inset ring-primary bg-primary/10'
                                  : cn(claseColor, !claseColor && 'hover:bg-accent/50')
                              )}
                            >
                              <div className="truncate">{c?.contenido || '—'}</div>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {celdaSeleccionada && (
            <div className="text-sm">
              <p className="text-muted-foreground mb-1">Se guardará como nota de esa celda:</p>
              <div className="bg-muted rounded-lg p-3 whitespace-pre-wrap text-foreground max-h-32 overflow-y-auto">
                {texto}
              </div>
              {notaExistente && (
                <p className="text-xs text-muted-foreground mt-1">
                  Esa celda ya tiene una nota — se añadirá a continuación de la existente, sin borrarla.
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleGuardar} disabled={!celdaSeleccionada}>
            <Check className="w-4 h-4" />
            Guardar en el horario
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function generarPeriodos(config: ConfigHorarios) {
  const periodos: { inicio: string; fin: string; esRecreo?: boolean }[] = []
  let [hora, minuto] = config.horaInicio.split(':').map(Number)

  for (let i = 0; i < config.numPeriodos; i++) {
    const inicio = `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`
    minuto += config.duracionPeriodo
    if (minuto >= 60) {
      hora += Math.floor(minuto / 60)
      minuto = minuto % 60
    }
    const fin = `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`

    periodos.push({ inicio, fin })

    if (config.recreo && config.recreo.periodo === i + 1) {
      const inicioRecreo = fin
      minuto += config.recreo.duracion
      if (minuto >= 60) {
        hora += Math.floor(minuto / 60)
        minuto = minuto % 60
      }
      const finRecreo = `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`

      periodos.push({ inicio: inicioRecreo, fin: finRecreo, esRecreo: true })
    }
  }

  return periodos
}
