import { useState, useEffect } from 'react'
import { format, addDays, startOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'
import { DIAS_SEMANA, COLOR_VACACIONES } from '../../types/constants'
import { useCuadernoStore } from '../../stores/useCuadernoStore'
import { useEditorContextStore } from '../../stores/useEditorContextStore'
import type { Semana } from '../../types'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Button } from '../ui/button'
import { CONFIG_HORARIOS_PREDEFINIDOS } from '../../types/constants'
import { esDiaFestivo, esDiaVacaciones } from '../../utils/festivos'
import {
  horarioActivoEnRango,
  horarioAbarcaMasDeLaSemana,
  dividirHorarioParaSemana,
  aplicarNotasEnDatos,
  contenidoParaSemana,
} from '../../utils/horarios'
import type { Horario, ConfigHorarios } from '../../types'
import { cn } from '../../utils/cn'
import { StickyNote } from 'lucide-react'

interface SemanaEditorProps {
  semana?: Semana
  fechaInicio?: Date
  onSave: () => void
  onCancel: () => void
}

export function SemanaEditor({
  semana,
  fechaInicio,
  onSave,
  onCancel,
}: SemanaEditorProps) {
  const { cuadernoActual, addSemana, updateSemana, updateHorario, addHorario, duplicateSemana } = useCuadernoStore()
  const festivos = cuadernoActual?.configuracion.festivos || []
  const vacaciones = cuadernoActual?.configuracion.vacaciones || []

  // Rango real de la semana (de la propia semana si ya existe, o de
  // fechaInicio si se está creando) — decide tanto qué horario prellena la
  // tabla como, ahora, a qué horario se escribe al guardar (ver
  // "PLANIFICACIÓN ↔ HORARIO: FUENTE ÚNICA" en CLAUDE.md).
  const inicioSemana = semana ? new Date(semana.fechaInicio) : fechaInicio || startOfWeek(new Date(), { weekStartsOn: 1 })
  const finSemana = semana ? new Date(semana.fechaFin) : addDays(inicioSemana, 4)
  const rangoSemana = { inicio: inicioSemana, fin: finSemana }

  const horariosVigentes = (cuadernoActual?.horarios || []).filter((h) =>
    horarioActivoEnRango(h, inicioSemana, finSemana)
  )
  const horarioVigente: Horario | undefined =
    horariosVigentes.find((h) => h.tipo === 'docente') || horariosVigentes[0]
  const configHorariosBase = horarioVigente?.configHorarios || CONFIG_HORARIOS_PREDEFINIDOS.secundaria
  const periodosHorarios = generarPeriodos(configHorariosBase)
  const numPeriodosConRecreo = configHorariosBase.numPeriodos + (configHorariosBase.recreo ? 1 : 0)

  const [numeroSemana, setNumeroSemana] = useState(semana?.numeroSemana || 1)
  const [observaciones, setObservaciones] = useState(semana?.observaciones || '')
  const [dias, setDias] = useState(() => {
    if (semana?.dias) {
      return semana.dias
    }
    return DIAS_SEMANA.map((_, diaIndex) => {
      const fecha = addDays(fechaInicio || new Date(), diaIndex)
      return {
        fecha,
        esFestivo: esDiaFestivo(fecha, festivos),
        esVacaciones: esDiaVacaciones(fecha, vacaciones),
        periodos: Array.from({ length: numPeriodosConRecreo }, () => ({ contenido: '' })),
      }
    })
  })

  // Cuando hay un horario vigente esa semana, el contenido editable de cada
  // periodo ya no vive en `dias` (eso queda para semanas sin horario) — se
  // lee y escribe en vivo en la nota de la celda del horario
  // (horario.datos[periodo][día].nota), para que un cambio aquí o en
  // Horarios se vea reflejado en los dos sitios sin mantener dos copias que
  // puedan desincronizarse. `dias` se sigue calculando al guardar (ver
  // construirDiasFinal) solo para que el PDF de la semana y el contexto del
  // asistente de IA, que leen Semana.dias directamente, sigan siendo útiles.
  const [notasHorario, setNotasHorario] = useState<Record<string, string>>(() => {
    if (!horarioVigente) return {}
    const inicial: Record<string, string> = {}
    for (let periodoIndex = 0; periodoIndex < numPeriodosConRecreo; periodoIndex++) {
      for (let diaIndex = 0; diaIndex < DIAS_SEMANA.length; diaIndex++) {
        inicial[`${periodoIndex}-${diaIndex}`] = horarioVigente.datos[periodoIndex]?.[diaIndex]?.nota || ''
      }
    }
    return inicial
  })
  const [mostrarAlcance, setMostrarAlcance] = useState(false)

  const publicarContexto = useEditorContextStore((s) => s.publicar)

  useEffect(() => {
    const texto = horarioVigente
      ? resumenConHorario(horarioVigente, notasHorario, periodosHorarios, observaciones)
      : resumenSemanaParaAsistente(dias, observaciones, periodosHorarios)
    if (texto) {
      publicarContexto('planificacion', `Semana del ${format(inicioSemana, 'dd/MM/yyyy')}`, texto)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dias, notasHorario, observaciones])

  // Versión final de `dias` que se guarda en la Semana: con horario vigente,
  // cada periodo se deriva de asignatura + nota (contenidoParaSemana) en vez
  // de venir de `dias` directamente.
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

    const diasFinal = construirDiasFinal()
    if (semana) {
      updateSemana(semana.id, { observaciones, dias: diasFinal })
    } else {
      const nuevaSemana: Omit<Semana, 'actualizado'> = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        fechaInicio: inicioSemana,
        fechaFin: finSemana,
        numeroSemana,
        observaciones,
        dias: diasFinal,
      }
      addSemana(nuevaSemana)
    }

    setMostrarAlcance(false)
    onSave()
  }

  const handleGuardar = () => {
    if (horarioVigente && horarioAbarcaMasDeLaSemana(horarioVigente, rangoSemana)) {
      setMostrarAlcance(true)
    } else {
      guardarConAlcance()
    }
  }

  const handleCeldaChange = (diaIndex: number, periodoIndex: number, valor: string) => {
    if (horarioVigente) {
      setNotasHorario((prev) => ({ ...prev, [`${periodoIndex}-${diaIndex}`]: valor }))
      return
    }
    const nuevosDias = [...dias]
    nuevosDias[diaIndex].periodos[periodoIndex] = {
      contenido: valor,
    }
    setDias(nuevosDias)
  }

  const getCeldaContenido = (diaIndex: number, periodoIndex: number) => {
    if (horarioVigente) return notasHorario[`${periodoIndex}-${diaIndex}`] || ''
    return dias[diaIndex]?.periodos[periodoIndex]?.contenido || ''
  }

  const getCeldaAsignatura = (diaIndex: number, periodoIndex: number) => {
    if (!horarioVigente) return ''
    return horarioVigente.datos[periodoIndex]?.[diaIndex]?.contenido || ''
  }

  const handleCopiarDia = (diaIndex: number) => {
    if (horarioVigente) {
      const valores = periodosHorarios.map((_, periodoIndex) => notasHorario[`${periodoIndex}-${diaIndex}`] || '')
      setNotasHorario((prev) => {
        const nuevo = { ...prev }
        for (let idx = diaIndex + 1; idx < DIAS_SEMANA.length; idx++) {
          valores.forEach((valor, periodoIndex) => {
            nuevo[`${periodoIndex}-${idx}`] = valor
          })
        }
        return nuevo
      })
      return
    }

    const contenidoDia = dias[diaIndex].periodos.map((p) => p.contenido)
    const nuevosDias = dias.map((dia, idx) => {
      if (idx > diaIndex) {
        return {
          ...dia,
          periodos: dia.periodos.map((_p, pIdx) => ({
            contenido: contenidoDia[pIdx] || '',
          })),
        }
      }
      return dia
    })
    setDias(nuevosDias)
  }

  // Pregunta de alcance (mismo patrón que HorarioTable.tsx/PasoExportarHorario.tsx):
  // una pantalla alternativa dentro del mismo Dialog del padre, no un <Dialog>
  // anidado.
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
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground tracking-tight">
            {semana ? `Editar Semana ${numeroSemana}` : 'Nueva Semana'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {fechaInicio && (
              <>Del {format(fechaInicio, 'dd/MM/yyyy', { locale: es })} al{' '}
              {format(addDays(fechaInicio, 4), 'dd/MM/yyyy', { locale: es })}</>
            )}
            {semana && (
              <>Del {format(new Date(semana.fechaInicio), 'dd/MM/yyyy')} al{' '}
              {format(new Date(semana.fechaFin), 'dd/MM/yyyy')}</>
            )}
          </p>
          {horarioVigente && (
            <p className="text-xs text-primary mt-1">
              Vinculada al horario "{horarioVigente.nombre}" — la asignatura de cada celda viene del horario;
              lo que escribas aquí se guarda como nota de esa celda y también se ve desde Horarios.
            </p>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-foreground">
              Nº Semana:
            </label>
            <Input
              type="number"
              min="1"
              max="36"
              value={numeroSemana}
              onChange={(e) => setNumeroSemana(parseInt(e.target.value) || 1)}
              className="w-20"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button onClick={handleGuardar}>Guardar</Button>
          </div>
        </div>
      </div>

      {/* Tabla de periodos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Planificación de Periodos</CardTitle>
            <div className="text-sm text-muted-foreground">
              Click en celda para editar • Enter para guardar
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="border border-border p-2 text-left text-sm font-semibold text-foreground min-w-[80px]">
                    Hora
                  </th>
                  {DIAS_SEMANA.map((dia, diaIndex) => (
                    <th
                      key={dia}
                      className="border border-border p-2 text-center text-sm font-semibold text-foreground min-w-[140px]"
                    >
                      <div className="flex items-center justify-center gap-2">
                        {dia}
                        <button
                          onClick={() => handleCopiarDia(DIAS_SEMANA.indexOf(dia))}
                          className="text-xs text-primary hover:text-primary/80"
                          title="Copiar este día a los siguientes"
                        >
                          📋
                        </button>
                      </div>
                      <div className="text-xs text-muted-foreground font-normal">
                        {format(dias[diaIndex]?.fecha || new Date(), 'dd/MM')}
                      </div>
                      {dias[diaIndex]?.esFestivo && (
                        <div className="text-xs font-medium mt-0.5" style={{ color: '#ef4444' }}>
                          Festivo
                        </div>
                      )}
                      {dias[diaIndex]?.esVacaciones && (
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
                    {DIAS_SEMANA.map((_, diaIndex) => {
                      // El recreo bloquea de verdad la edición; festivo/vacaciones aquí
                      // (a diferencia de Horarios) solo se marcan visualmente por ahora.
                      const bloqueada = periodo.esRecreo
                      const muted = dias[diaIndex]?.esFestivo || dias[diaIndex]?.esVacaciones || bloqueada
                      const asignatura = getCeldaAsignatura(diaIndex, periodoIndex)
                      return (
                        <td
                          key={diaIndex}
                          title={bloqueada ? 'Recreo, no se puede editar' : undefined}
                          className={cn(
                            'border border-border p-1 align-top min-h-[60px]',
                            muted && 'bg-muted/60'
                          )}
                        >
                          {horarioVigente && !bloqueada ? (
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
                          ) : (
                            <input
                              type="text"
                              value={getCeldaContenido(diaIndex, periodoIndex)}
                              onChange={(e) =>
                                handleCeldaChange(
                                  diaIndex,
                                  periodoIndex,
                                  e.target.value
                                )
                              }
                              disabled={bloqueada}
                              className="w-full min-h-[50px] p-2 text-sm resize-none bg-transparent text-foreground border-0 focus:ring-2 focus:ring-ring rounded disabled:cursor-not-allowed"
                              placeholder={bloqueada ? '' : 'Click para editar...'}
                            />
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Observaciones */}
      <Card>
        <CardHeader>
          <CardTitle>Observaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Añade observaciones generales de esta semana..."
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Botones de acción rápida */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => {
            if (confirm('¿Limpiar todos los periodos?')) {
              if (horarioVigente) {
                setNotasHorario((prev) => {
                  const limpio: Record<string, string> = {}
                  Object.keys(prev).forEach((clave) => {
                    limpio[clave] = ''
                  })
                  return limpio
                })
              } else {
                setDias(
                  dias.map((dia) => ({
                    ...dia,
                    periodos: dia.periodos.map(() => ({ contenido: '' })),
                  }))
                )
              }
            }
          }}
        >
          🗑️ Limpiar periodos
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            if (!semana) return
            const nuevaFecha = new Date(semana.fechaInicio)
            nuevaFecha.setDate(nuevaFecha.getDate() + 7)
            if (confirm(`¿Duplicar esta semana para la semana del ${format(nuevaFecha, 'dd/MM/yyyy')}?`)) {
              duplicateSemana(semana.id, nuevaFecha)
              onSave()
            }
          }}
          disabled={!semana}
        >
          📄 Duplicar semana
        </Button>
      </div>
    </div>
  )
}

function generarPeriodos(config: ConfigHorarios) {
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

/** Resumen en texto plano de una semana sin horario, para dar contexto al asistente de IA (ver useEditorContextStore). */
function resumenSemanaParaAsistente(
  dias: Semana['dias'],
  observaciones: string,
  periodosHorarios: { inicio: string; fin: string; esRecreo?: boolean }[]
): string {
  const lineas: string[] = []
  dias.forEach((dia, diaIndex) => {
    const contenidos = dia.periodos
      .map((p, periodoIndex) => {
        if (periodosHorarios[periodoIndex]?.esRecreo || !p.contenido.trim()) return null
        return `${periodosHorarios[periodoIndex]?.inicio || ''}: ${p.contenido.trim()}`
      })
      .filter((linea): linea is string => linea !== null)
    if (contenidos.length > 0) {
      lineas.push(`${DIAS_SEMANA[diaIndex]}: ${contenidos.join(' · ')}`)
    }
  })
  if (observaciones.trim()) {
    lineas.push(`Observaciones: ${observaciones.trim()}`)
  }
  return lineas.join('\n')
}

/** Igual que resumenSemanaParaAsistente, pero leyendo asignatura+nota en vivo del horario vigente. */
function resumenConHorario(
  horario: Horario,
  notasHorario: Record<string, string>,
  periodosHorarios: { inicio: string; fin: string; esRecreo?: boolean }[],
  observaciones: string
): string {
  const lineas: string[] = []
  DIAS_SEMANA.forEach((diaNombre, diaIndex) => {
    const contenidos = periodosHorarios
      .map((periodo, periodoIndex) => {
        if (periodo.esRecreo) return null
        const asignatura = horario.datos[periodoIndex]?.[diaIndex]?.contenido || ''
        const nota = notasHorario[`${periodoIndex}-${diaIndex}`]?.trim() || ''
        const texto = contenidoParaSemana(asignatura, nota)
        if (!texto) return null
        return `${periodo.inicio}: ${texto}`
      })
      .filter((linea): linea is string => linea !== null)
    if (contenidos.length > 0) {
      lineas.push(`${diaNombre}: ${contenidos.join(' · ')}`)
    }
  })
  if (observaciones.trim()) {
    lineas.push(`Observaciones: ${observaciones.trim()}`)
  }
  return lineas.join('\n')
}
