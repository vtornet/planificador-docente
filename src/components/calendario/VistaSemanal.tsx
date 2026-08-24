import { useState } from 'react'
import { format, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { DIAS_SEMANA } from '../../types/constants'
import { useCuadernoStore } from '../../stores/useCuadernoStore'
import type { Horario, Semana } from '../../types'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Textarea } from '../ui/textarea'
import { CONFIG_HORARIOS_PREDEFINIDOS, COLOR_VACACIONES } from '../../types/constants'
import {
  horarioActivoEnRango,
  horarioAbarcaMasDeLaSemana,
  dividirHorarioParaSemana,
  aplicarNotasEnDatos,
  contenidoParaSemana,
} from '../../utils/horarios'
import { cn } from '../../utils/cn'
import { Save, StickyNote } from 'lucide-react'

interface VistaSemanalProps {
  semana: Semana
  onClose: () => void
}

export function VistaSemanal({ semana, onClose }: VistaSemanalProps) {
  const { updateSemana, updateHorario, addHorario, cuadernoActual } = useCuadernoStore()

  // Horario vigente esa semana — si existe, la asignatura de cada celda viene
  // de él y lo que se edite aquí se guarda como nota de esa celda (ver
  // "PLANIFICACIÓN ↔ HORARIO: FUENTE ÚNICA" en CLAUDE.md); antes esta vista
  // no lo comprobaba nunca y usaba siempre la plantilla "secundaria" a
  // ciegas, aunque la semana se hubiera creado con otro horario.
  const rangoSemana = { inicio: new Date(semana.fechaInicio), fin: new Date(semana.fechaFin) }
  const horariosVigentes = (cuadernoActual?.horarios || []).filter((h) =>
    horarioActivoEnRango(h, rangoSemana.inicio, rangoSemana.fin)
  )
  const horarioVigente: Horario | undefined =
    horariosVigentes.find((h) => h.tipo === 'docente') || horariosVigentes[0]
  const configHorarios = horarioVigente?.configHorarios || CONFIG_HORARIOS_PREDEFINIDOS.secundaria
  const periodosHorarios = generarPeriodos(configHorarios)

  const [observaciones, setObservaciones] = useState(semana.observaciones || '')
  const [dias, setDias] = useState(() => semana.dias.map((dia) => ({ ...dia, periodos: dia.periodos.map((p) => ({ ...p })) })))
  const [notasHorario, setNotasHorario] = useState<Record<string, string>>(() => {
    if (!horarioVigente) return {}
    const inicial: Record<string, string> = {}
    periodosHorarios.forEach((_periodo, periodoIndex) => {
      DIAS_SEMANA.forEach((_dia, diaIndex) => {
        inicial[`${periodoIndex}-${diaIndex}`] = horarioVigente.datos[periodoIndex]?.[diaIndex]?.nota || ''
      })
    })
    return inicial
  })
  const [dirty, setDirty] = useState(false)
  const [mostrarAlcance, setMostrarAlcance] = useState(false)
  const [editandoCelda, setEditandoCelda] = useState<{ diaIndex: number; periodoIndex: number } | null>(null)

  const diasSemana = DIAS_SEMANA.map((_, idx) => ({
    nombre: DIAS_SEMANA[idx],
    fecha: addDays(new Date(semana.fechaInicio), idx),
    esFestivo: semana.dias[idx]?.esFestivo || false,
    esVacaciones: semana.dias[idx]?.esVacaciones || false,
  }))

  const handleCeldaClick = (diaIndex: number, periodoIndex: number) => {
    if (periodosHorarios[periodoIndex]?.esRecreo) return
    if (!horarioVigente) setEditandoCelda({ diaIndex, periodoIndex })
  }

  const handleCeldaChange = (diaIndex: number, periodoIndex: number, valor: string) => {
    setDirty(true)
    if (horarioVigente) {
      setNotasHorario((prev) => ({ ...prev, [`${periodoIndex}-${diaIndex}`]: valor }))
      return
    }
    setDias((prev) => {
      const nuevosDias = [...prev]
      if (!nuevosDias[diaIndex]?.periodos) {
        nuevosDias[diaIndex] = {
          fecha: nuevosDias[diaIndex]?.fecha || new Date(),
          esFestivo: nuevosDias[diaIndex]?.esFestivo || false,
          esVacaciones: nuevosDias[diaIndex]?.esVacaciones || false,
          periodos: periodosHorarios.map(() => ({ contenido: '' })),
        }
      }
      nuevosDias[diaIndex] = { ...nuevosDias[diaIndex], periodos: [...nuevosDias[diaIndex].periodos] }
      nuevosDias[diaIndex].periodos[periodoIndex] = { contenido: valor }
      return nuevosDias
    })
  }

  const getCeldaContenido = (diaIndex: number, periodoIndex: number) => {
    if (horarioVigente) return notasHorario[`${periodoIndex}-${diaIndex}`] || ''
    return dias[diaIndex]?.periodos[periodoIndex]?.contenido || ''
  }

  const getCeldaAsignatura = (diaIndex: number, periodoIndex: number) => {
    if (!horarioVigente) return ''
    return horarioVigente.datos[periodoIndex]?.[diaIndex]?.contenido || ''
  }

  const construirDiasFinal = () => {
    if (!horarioVigente) return dias
    return dias.map((dia, diaIndex) => ({
      ...dia,
      periodos: periodosHorarios.map((periodo, periodoIndex) => {
        if (periodo.esRecreo) return { contenido: '' }
        const asignatura = horarioVigente.datos[periodoIndex]?.[diaIndex]?.contenido || ''
        const nota = notasHorario[`${periodoIndex}-${diaIndex}`] || ''
        return { contenido: contenidoParaSemana(asignatura, nota) }
      }),
    }))
  }

  const guardarConAlcance = (alcance?: 'periodo' | 'semana') => {
    if (horarioVigente) {
      if (alcance === 'semana') {
        const { actualizacionOriginal, nuevos } = dividirHorarioParaSemana(horarioVigente, rangoSemana)
        nuevos[0] = { ...nuevos[0], datos: aplicarNotasEnDatos(nuevos[0].datos, notasHorario) }
        updateHorario(horarioVigente.id, actualizacionOriginal)
        nuevos.forEach((nuevo) => addHorario(nuevo))
      } else {
        updateHorario(horarioVigente.id, { datos: aplicarNotasEnDatos(horarioVigente.datos, notasHorario) })
      }
    }

    updateSemana(semana.id, { observaciones, dias: construirDiasFinal() })
    setDirty(false)
    setMostrarAlcance(false)
    onClose()
  }

  const handleGuardar = () => {
    if (horarioVigente && horarioAbarcaMasDeLaSemana(horarioVigente, rangoSemana)) {
      setMostrarAlcance(true)
    } else {
      guardarConAlcance()
    }
  }

  if (mostrarAlcance) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground tracking-tight">
          ¿Guardar en todo el periodo o solo esta semana?
        </h3>
        <p className="text-sm text-muted-foreground">
          El horario "{horarioVigente?.nombre}" abarca varias semanas. Elige si los cambios de esta
          planificación se aplican a todas ellas o solo a esta semana (se independizará del resto).
        </p>
        <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
          <Button variant="ghost" className="w-full sm:w-auto" onClick={() => setMostrarAlcance(false)}>
            Volver
          </Button>
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => guardarConAlcance('semana')}>
            Solo esta semana
          </Button>
          <Button className="w-full sm:w-auto" onClick={() => guardarConAlcance('periodo')}>
            Todo el periodo
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground tracking-tight">
            Semana {semana.numeroSemana}
          </h3>
          <p className="text-sm text-muted-foreground">
            Del {format(new Date(semana.fechaInicio), 'dd/MM/yyyy', { locale: es })}{' '}
            al {format(new Date(semana.fechaFin), 'dd/MM/yyyy', { locale: es })}
          </p>
          {horarioVigente && (
            <p className="text-xs text-primary mt-1">
              Vinculada al horario "{horarioVigente.nombre}" — la asignatura de cada celda viene del horario;
              lo que escribas aquí se guarda como nota de esa celda y también se ve desde Horarios.
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleGuardar} disabled={!dirty}>
            <Save className="w-4 h-4" />
            Guardar cambios
          </Button>
        </div>
      </div>

      {/* Tabla de periodos */}
      <Card>
        <CardHeader>
          <CardTitle>Planificación Semanal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="border border-border p-2 text-left text-sm font-semibold text-foreground min-w-[80px]">
                    Hora
                  </th>
                  {diasSemana.map((dia) => (
                    <th
                      key={dia.nombre}
                      className="border border-border p-2 text-center text-sm font-semibold text-foreground min-w-[140px]"
                    >
                      <div>{dia.nombre}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(dia.fecha, 'dd/MM')}
                      </div>
                      {dia.esFestivo && (
                        <div className="text-xs font-medium mt-0.5" style={{ color: '#ef4444' }}>
                          Festivo
                        </div>
                      )}
                      {dia.esVacaciones && (
                        <div className="text-xs font-medium mt-0.5" style={{ color: COLOR_VACACIONES }}>
                          Vacaciones
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {periodosHorarios.map((periodo, periodoIndex) => (
                  <tr key={periodoIndex}>
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
                    {diasSemana.map((dia, diaIndex) => {
                      const isEditando =
                        editandoCelda?.diaIndex === diaIndex &&
                        editandoCelda?.periodoIndex === periodoIndex
                      // El recreo bloquea de verdad la edición; festivo/vacaciones aquí
                      // (a diferencia de Horarios) solo se marcan visualmente por ahora,
                      // se sigue pudiendo planificar contenido ese día si hace falta.
                      const bloqueada = periodo.esRecreo
                      const muted = dia.esFestivo || dia.esVacaciones || bloqueada
                      const asignatura = getCeldaAsignatura(diaIndex, periodoIndex)

                      return (
                        <td
                          key={diaIndex}
                          onClick={() =>
                            !isEditando && !bloqueada && handleCeldaClick(diaIndex, periodoIndex)
                          }
                          title={bloqueada ? 'Recreo, no se puede editar' : undefined}
                          className={cn(
                            'border border-border p-1 align-top min-h-[60px] transition-colors',
                            muted && 'bg-muted/60',
                            bloqueada ? 'cursor-not-allowed' : !horarioVigente && 'cursor-pointer hover:bg-accent/50'
                          )}
                        >
                          {bloqueada ? null : horarioVigente ? (
                            <div className="p-1">
                              <div className="text-sm truncate text-foreground">
                                {asignatura || <span className="text-muted-foreground/50 italic">Sin asignar</span>}
                              </div>
                              <div className="mt-0.5 flex items-start gap-1">
                                <StickyNote className="w-3 h-3 mt-1.5 flex-shrink-0 text-muted-foreground/70" />
                                <textarea
                                  value={getCeldaContenido(diaIndex, periodoIndex)}
                                  onChange={(e) => handleCeldaChange(diaIndex, periodoIndex, e.target.value)}
                                  className="w-full min-h-[42px] p-1 text-xs resize-none bg-transparent text-foreground border-0 focus:ring-2 focus:ring-ring rounded"
                                  placeholder="Planificación de este periodo..."
                                />
                              </div>
                            </div>
                          ) : isEditando ? (
                            <textarea
                              autoFocus
                              defaultValue={getCeldaContenido(diaIndex, periodoIndex)}
                              onChange={(e) => handleCeldaChange(diaIndex, periodoIndex, e.target.value)}
                              onBlur={() => setEditandoCelda(null)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') setEditandoCelda(null)
                                if (e.key === 'Escape') setEditandoCelda(null)
                              }}
                              className="w-full min-h-[50px] h-full p-2 text-sm resize-none bg-transparent text-foreground border-0 focus:ring-2 focus:ring-ring rounded"
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <div className="text-sm text-foreground whitespace-pre-wrap p-2 min-h-[50px]">
                              {getCeldaContenido(diaIndex, periodoIndex) || (
                                <span className="text-muted-foreground/50 italic">
                                  Click para editar
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-sm text-muted-foreground">
            Tip: {horarioVigente ? 'Escribe la nota de cada periodo directamente' : 'Click en celda para editar'} • "Guardar cambios" para confirmar
          </div>
        </CardContent>
      </Card>

      {/* Observaciones */}
      <Card>
        <CardHeader>
          <CardTitle>Observaciones de la semana</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={observaciones}
            onChange={(e) => {
              setObservaciones(e.target.value)
              setDirty(true)
            }}
            placeholder="Añade observaciones sobre esta semana..."
            rows={4}
          />
        </CardContent>
      </Card>
    </div>
  )
}

function generarPeriodos(config: Horario['configHorarios']) {
  const periodos: { inicio: string; fin: string; esRecreo?: boolean }[] = []
  let [hora, minuto] = config.horaInicio.split(':').map(Number)

  for (let i = 0; i < config.numPeriodos; i++) {
    const inicio = `${String(hora).padStart(2, '0')}:${String(minuto).padStart(
      2,
      '0'
    )}`
    minuto += config.duracionPeriodo
    if (minuto >= 60) {
      hora += Math.floor(minuto / 60)
      minuto = minuto % 60
    }
    const fin = `${String(hora).padStart(2, '0')}:${String(minuto).padStart(
      2,
      '0'
    )}`

    periodos.push({ inicio, fin })

    // Insertar recreo DESPUÉS del periodo especificado
    if (config.recreo && config.recreo.periodo === i + 1) {
      const inicioRecreo = fin
      minuto += config.recreo.duracion
      if (minuto >= 60) {
        hora += Math.floor(minuto / 60)
        minuto = minuto % 60
      }
      const finRecreo = `${String(hora).padStart(2, '0')}:${String(minuto).padStart(
        2,
        '0'
      )}`

      periodos.push({ inicio: inicioRecreo, fin: finRecreo, esRecreo: true })
    }
  }

  return periodos
}
