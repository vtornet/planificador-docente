import { useState } from 'react'
import { DIAS_SEMANA } from '../../types/constants'
import type { CeldaHorario, Horario } from '../../types'
import { cn } from '../../utils/cn'
import { UserCircle, GraduationCap, Copy, StickyNote } from 'lucide-react'
import { Button } from '../ui/button'
import { CeldaHorarioDialog } from './CeldaHorarioDialog'

interface HorarioTableProps {
  horario: Horario
  onUpdate: (horario: Horario) => void
  onDuplicate?: (horario: Omit<Horario, 'id'>) => void
  className?: string
}

export function HorarioTable({ horario, onUpdate, onDuplicate, className }: HorarioTableProps) {
  const [celdaEditando, setCeldaEditando] = useState<{ fila: number; columna: number } | null>(null)

  const periodos = generarPeriodos(horario.configHorarios)

  const handleCeldaClick = (fila: number, columna: number) => {
    setCeldaEditando({ fila, columna })
  }

  const handleGuardarCelda = (celdaActualizada: CeldaHorario) => {
    if (!celdaEditando) return
    const { fila, columna } = celdaEditando
    const nuevosDatos = [...horario.datos]
    if (!nuevosDatos[fila]) {
      nuevosDatos[fila] = []
    }
    nuevosDatos[fila][columna] = celdaActualizada
    onUpdate({ ...horario, datos: nuevosDatos })
  }

  return (
    <div className={cn('w-full', className)}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground tracking-tight">{horario.nombre}</h3>
        <span className="text-sm text-muted-foreground flex items-center gap-1.5 bg-muted px-2.5 py-1 rounded-full">
          {horario.tipo === 'docente' ? (
            <>
              <UserCircle className="w-4 h-4" /> Docente
            </>
          ) : (
            <>
              <GraduationCap className="w-4 h-4" /> Alumnado
            </>
          )}
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border shadow-[var(--shadow-soft)]">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted">
              <th className="border border-border p-2 text-left text-sm font-semibold text-foreground min-w-[80px]">
                Hora
              </th>
              {DIAS_SEMANA.map((dia) => (
                <th
                  key={dia}
                  className="border border-border p-2 text-center text-sm font-semibold text-foreground min-w-[120px]"
                >
                  {dia}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periodos.map((periodo, fila) => (
              <tr key={fila}>
                <td className="border border-border p-2 text-sm text-muted-foreground font-medium bg-muted/50">
                  <div className="text-center">
                    {periodo.esRecreo ? (
                      <>
                        <div className="text-2xl">☕</div>
                        <div className="text-xs text-muted-foreground">Recreo</div>
                      </>
                    ) : (
                      <>
                        <div>{periodo.inicio}</div>
                        <div className="text-xs text-muted-foreground/70">- {periodo.fin}</div>
                      </>
                    )}
                  </div>
                </td>
                {DIAS_SEMANA.map((_, columna) => {
                  const celda = horario.datos[fila]?.[columna]

                  return (
                    <td
                      key={columna}
                      onClick={() => handleCeldaClick(fila, columna)}
                      className={cn(
                        'border border-border p-1 align-top min-h-[60px] cursor-pointer hover:bg-accent/50 transition-colors',
                        celda?.color && 'bg-opacity-20'
                      )}
                      style={{ backgroundColor: celda?.color || undefined }}
                    >
                      <div className="text-sm text-foreground whitespace-pre-wrap p-1 min-h-[50px]">
                        {celda?.contenido || (
                          <span className="text-muted-foreground/50 italic">Click para editar</span>
                        )}
                        {celda?.nota && (
                          <div
                            className="mt-1 flex items-start gap-1 text-xs text-muted-foreground italic"
                            title={celda.nota}
                          >
                            <StickyNote className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2">{celda.nota}</span>
                          </div>
                        )}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center gap-4">
        {onDuplicate && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              const nuevoTipo = horario.tipo === 'docente' ? 'alumnado' : 'docente'
              if (confirm(`¿Duplicar este horario como horario de ${nuevoTipo}?`)) {
                const duplicado: Omit<Horario, 'id'> = {
                  tipo: nuevoTipo,
                  nombre: `${horario.nombre} (${nuevoTipo})`,
                  datos: horario.datos.map((fila) => fila.map((celda) => ({ ...celda }))),
                  configHorarios: horario.configHorarios,
                }
                onDuplicate(duplicado)
              }
            }}
          >
            <Copy className="w-4 h-4" />
            Duplicar horario
          </Button>
        )}
        <span className="text-sm text-muted-foreground">
          Tip: Click en celda para elegir asignatura y añadir una nota
        </span>
      </div>

      <CeldaHorarioDialog
        open={celdaEditando !== null}
        onOpenChange={(open) => {
          if (!open) setCeldaEditando(null)
        }}
        celda={celdaEditando ? horario.datos[celdaEditando.fila]?.[celdaEditando.columna] : undefined}
        onGuardar={handleGuardarCelda}
      />
    </div>
  )
}

function generarPeriodos(config: Horario['configHorarios']) {
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

    // Insertar recreo DESPUÉS del periodo especificado
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
