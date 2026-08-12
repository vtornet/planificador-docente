import { useEffect, useState } from 'react'
import { DIAS_SEMANA, PALETA_ASIGNATURAS } from '../../types/constants'
import type { CeldaHorario, Horario } from '../../types'
import { cn } from '../../utils/cn'
import { UserCircle, GraduationCap, Copy, StickyNote, Save } from 'lucide-react'
import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { CeldaHorarioDialog } from './CeldaHorarioDialog'

interface HorarioTableProps {
  horario: Horario
  onGuardar: (datos: CeldaHorario[][], alcance?: 'periodo' | 'semana') => void
  preguntarAlcance?: boolean
  onDuplicate?: (horario: Omit<Horario, 'id'>) => void
  className?: string
}

export function HorarioTable({ horario, onGuardar, preguntarAlcance, onDuplicate, className }: HorarioTableProps) {
  const [celdaEditando, setCeldaEditando] = useState<{ fila: number; columna: number } | null>(null)
  const [datos, setDatos] = useState<CeldaHorario[][]>(horario.datos)
  const [dirty, setDirty] = useState(false)
  const [mostrarPreguntaAlcance, setMostrarPreguntaAlcance] = useState(false)

  // Mientras haya cambios sin guardar, no se sincroniza con lo que llegue del
  // padre (evita perder el borrador si se actualiza el horario por otra vía).
  useEffect(() => {
    if (!dirty) setDatos(horario.datos)
  }, [horario.datos, dirty])

  const periodos = generarPeriodos(horario.configHorarios)

  const handleCeldaClick = (fila: number, columna: number) => {
    setCeldaEditando({ fila, columna })
  }

  const handleGuardarCelda = (celdaActualizada: CeldaHorario) => {
    if (!celdaEditando) return
    const { fila, columna } = celdaEditando
    setDatos((prev) => {
      const nuevosDatos = [...prev]
      nuevosDatos[fila] = [...(nuevosDatos[fila] || [])]
      nuevosDatos[fila][columna] = celdaActualizada
      return nuevosDatos
    })
    setDirty(true)
  }

  const confirmarGuardado = (alcance?: 'periodo' | 'semana') => {
    onGuardar(datos, alcance)
    setDirty(false)
    setMostrarPreguntaAlcance(false)
  }

  const handleClickGuardar = () => {
    if (preguntarAlcance) {
      setMostrarPreguntaAlcance(true)
    } else {
      confirmarGuardado()
    }
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
        <table className="w-full border-collapse table-fixed">
          <thead>
            <tr className="bg-muted">
              <th className="border border-border p-2 text-left text-sm font-semibold text-foreground w-20">
                Hora
              </th>
              {DIAS_SEMANA.map((dia) => (
                <th
                  key={dia}
                  className="border border-border p-2 text-center text-sm font-semibold text-foreground w-[140px]"
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
                  const celda = datos[fila]?.[columna]
                  const claseColor = celda?.color
                    ? PALETA_ASIGNATURAS.find((c) => c.id === celda.color)?.clase
                    : undefined

                  return (
                    <td
                      key={columna}
                      onClick={() => handleCeldaClick(fila, columna)}
                      className={cn(
                        'border border-border p-1 align-top min-h-[60px] cursor-pointer transition-colors',
                        claseColor ? cn(claseColor, 'hover:brightness-95 dark:hover:brightness-125') : 'hover:bg-accent/50'
                      )}
                    >
                      <div className="p-1 min-h-[50px] overflow-hidden">
                        <div className="text-sm truncate">
                          {celda?.contenido || (
                            <span className="text-muted-foreground/50 italic">Click para editar</span>
                          )}
                        </div>
                        {celda?.nota && (
                          <div className="mt-0.5 flex items-start gap-1 text-xs opacity-80 italic">
                            <StickyNote className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2 break-words">{celda.nota}</span>
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

      <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4 flex-wrap">
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
                    fechaInicio: horario.fechaInicio,
                    fechaFin: horario.fechaFin,
                  }
                  onDuplicate(duplicado)
                }
              }}
            >
              <Copy className="w-4 h-4" />
              Duplicar horario
            </Button>
          )}
          <span className="text-sm text-muted-foreground hidden sm:inline">
            Tip: Click en celda para ver el contenido completo, editarlo o añadir una nota
          </span>
        </div>
        <Button onClick={handleClickGuardar} disabled={!dirty}>
          <Save className="w-4 h-4" />
          Guardar cambios
        </Button>
      </div>

      <CeldaHorarioDialog
        open={celdaEditando !== null}
        onOpenChange={(open) => {
          if (!open) setCeldaEditando(null)
        }}
        celda={celdaEditando ? datos[celdaEditando.fila]?.[celdaEditando.columna] : undefined}
        onGuardar={handleGuardarCelda}
      />

      <Dialog open={mostrarPreguntaAlcance} onOpenChange={setMostrarPreguntaAlcance}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>¿Guardar todo el periodo o solo esta semana?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Este horario abarca varias semanas. Elige si los cambios se aplican a todas ellas
            o solo a la semana que estás viendo ahora mismo (se independizará del resto).
          </p>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => confirmarGuardado('semana')}
            >
              Solo esta semana
            </Button>
            <Button className="w-full sm:w-auto" onClick={() => confirmarGuardado('periodo')}>
              Todo el periodo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
