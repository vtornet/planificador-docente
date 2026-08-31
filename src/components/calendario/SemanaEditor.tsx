import { useState, useEffect } from 'react'
import { format, addDays, startOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'
import { DIAS_SEMANA, COLOR_VACACIONES, PALETA_ASIGNATURAS } from '../../types/constants'
import { useCuadernoStore } from '../../stores/useCuadernoStore'
import { useEditorContextStore } from '../../stores/useEditorContextStore'
import type { CeldaHorario, Semana } from '../../types'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Button } from '../ui/button'
import { CONFIG_HORARIOS_PREDEFINIDOS } from '../../types/constants'
import { esDiaFestivo, esDiaVacaciones } from '../../utils/festivos'
import {
  horarioVigenteDeSemana,
  horarioAbarcaMasDeLaSemana,
  dividirHorarioParaSemana,
  aplicarCeldasEnDatos,
  rejillaVacia,
  contenidoParaSemana,
} from '../../utils/horarios'
import type { Horario, ConfigHorarios } from '../../types'
import { cn } from '../../utils/cn'
import { StickyNote } from 'lucide-react'
import { CeldaHorarioForm } from '../horario/CeldaHorarioForm'

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
  const { cuadernoActual, addSemana, updateSemana, updateHorario, addHorario } = useCuadernoStore()
  const festivos = cuadernoActual?.configuracion.festivos || []
  const vacaciones = cuadernoActual?.configuracion.vacaciones || []

  // Rango real de la semana (de la propia semana si ya existe, o de
  // fechaInicio si se está creando) — decide tanto qué horario prellena la
  // tabla como, ahora, a qué horario se escribe al guardar (ver "HORARIOS Y
  // PLANIFICAR: MISMAS OPCIONES" en CLAUDE.md).
  const inicioSemana = semana ? new Date(semana.fechaInicio) : fechaInicio || startOfWeek(new Date(), { weekStartsOn: 1 })
  const finSemana = semana ? new Date(semana.fechaFin) : addDays(inicioSemana, 4)
  const rangoSemana = { inicio: inicioSemana, fin: finSemana }

  const horarioVigente: Horario | undefined = horarioVigenteDeSemana(
    cuadernoActual?.horarios || [],
    rangoSemana
  )
  const configHorariosBase = horarioVigente?.configHorarios || CONFIG_HORARIOS_PREDEFINIDOS.secundaria
  const periodosHorarios = generarPeriodos(configHorariosBase)

  const [numeroSemana, setNumeroSemana] = useState(semana?.numeroSemana || 1)
  const [observaciones, setObservaciones] = useState(semana?.observaciones || '')
  // Solo fecha/festivo/vacaciones por día — el contenido de cada periodo
  // (asignatura, color, nota) vive en `celdas`, nunca aquí, ni con horario
  // vigente ni sin él (si no hay ninguno, se crea uno al guardar).
  const [dias] = useState(() => {
    if (semana?.dias) return semana.dias
    return DIAS_SEMANA.map((_, diaIndex) => {
      const fecha = addDays(fechaInicio || new Date(), diaIndex)
      return {
        fecha,
        esFestivo: esDiaFestivo(fecha, festivos),
        esVacaciones: esDiaVacaciones(fecha, vacaciones),
        periodos: [],
      }
    })
  })

  // Editar una celda ofrece siempre las mismas opciones que en Horarios
  // (asignatura predefinida o personalizada, color, nota — ver
  // CeldaHorarioForm.tsx, compartido entre los dos). Los cambios se
  // acumulan aquí como borrador; si no hay horario vigente esa semana, se
  // crea uno nuevo al guardar (scoped exactamente a esta semana) en vez de
  // dejar la planificación sin reflejo en Horarios.
  const [celdas, setCeldas] = useState<Record<string, CeldaHorario>>({})
  const [celdaEditando, setCeldaEditando] = useState<{ periodoIndex: number; diaIndex: number } | null>(null)
  const [mostrarAlcance, setMostrarAlcance] = useState(false)

  const celdaActual = (periodoIndex: number, diaIndex: number): CeldaHorario => {
    const key = `${periodoIndex}-${diaIndex}`
    return celdas[key] ?? horarioVigente?.datos[periodoIndex]?.[diaIndex] ?? { contenido: '' }
  }

  const publicarContexto = useEditorContextStore((s) => s.publicar)

  const construirDiasFinal = () => {
    return dias.map((dia, diaIndex) => ({
      ...dia,
      periodos: periodosHorarios.map((periodo, periodoIndex) => {
        if (periodo.esRecreo) return { contenido: '' }
        const celda = celdaActual(periodoIndex, diaIndex)
        return { contenido: contenidoParaSemana(celda.contenido || '', celda.nota || '') }
      }),
    }))
  }

  useEffect(() => {
    const texto = resumenParaAsistente(dias, observaciones, periodosHorarios, celdaActual)
    if (texto) {
      publicarContexto('planificacion', `Semana del ${format(inicioSemana, 'dd/MM/yyyy')}`, texto)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [celdas, observaciones])

  const guardarConAlcance = (alcance?: 'periodo' | 'semana') => {
    if (horarioVigente) {
      if (alcance === 'semana') {
        const { actualizacionOriginal, nuevos } = dividirHorarioParaSemana(horarioVigente, rangoSemana)
        nuevos[0] = { ...nuevos[0], datos: aplicarCeldasEnDatos(nuevos[0].datos, celdas) }
        updateHorario(horarioVigente.id, actualizacionOriginal)
        nuevos.forEach((nuevo) => addHorario(nuevo))
      } else {
        updateHorario(horarioVigente.id, { datos: aplicarCeldasEnDatos(horarioVigente.datos, celdas) })
      }
    } else if (Object.keys(celdas).length > 0) {
      // No había ningún horario vigente esa semana: se crea uno nuevo,
      // scoped exactamente a esta semana, para que lo planificado aquí se
      // vea también en Horarios (antes se quedaba solo en Planificación).
      addHorario({
        tipo: 'docente',
        nombre: `Horario semana del ${format(inicioSemana, 'dd/MM/yyyy')}`,
        datos: aplicarCeldasEnDatos(rejillaVacia(configHorariosBase), celdas),
        configHorarios: configHorariosBase,
        fechaInicio: inicioSemana,
        fechaFin: finSemana,
      })
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

  const handleCopiarDia = (diaIndex: number) => {
    setCeldas((prev) => {
      const nuevo = { ...prev }
      periodosHorarios.forEach((periodo, periodoIndex) => {
        if (periodo.esRecreo) return
        const origen = celdaActual(periodoIndex, diaIndex)
        for (let idx = diaIndex + 1; idx < DIAS_SEMANA.length; idx++) {
          // Nunca copiar sobre un día festivo/de vacaciones — misma regla
          // que bloquea su edición manual, para no colarse por este atajo.
          if (dias[idx]?.esFestivo || dias[idx]?.esVacaciones) continue
          nuevo[`${periodoIndex}-${idx}`] = { ...origen }
        }
      })
      return nuevo
    })
  }

  // Pantalla de alcance (mismo patrón que HorarioTable.tsx/PasoExportarHorario.tsx):
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

  if (celdaEditando) {
    const { periodoIndex, diaIndex } = celdaEditando
    return (
      <CeldaHorarioForm
        key={`${periodoIndex}-${diaIndex}`}
        celda={celdaActual(periodoIndex, diaIndex)}
        onGuardar={(celdaActualizada) => {
          setCeldas((prev) => ({ ...prev, [`${periodoIndex}-${diaIndex}`]: celdaActualizada }))
          setCeldaEditando(null)
        }}
        onCerrar={() => setCeldaEditando(null)}
      />
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
          {horarioVigente ? (
            <p className="text-xs text-primary mt-1">
              Vinculada al horario "{horarioVigente.nombre}" — se edita igual que en Horarios, y los
              cambios se ven en los dos sitios.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">
              Sin horario para esta semana todavía — al guardar se creará uno nuevo con lo que
              planifiques aquí, visible también en Horarios.
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
              Click en celda para editar
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse table-fixed">
              <thead>
                <tr className="bg-muted">
                  <th className="border border-border p-2 text-left text-sm font-semibold text-foreground w-20">
                    Hora
                  </th>
                  {DIAS_SEMANA.map((dia, diaIndex) => (
                    <th
                      key={dia}
                      className="border border-border p-2 text-center text-sm font-semibold text-foreground w-[140px]"
                    >
                      <div className="flex items-center justify-center gap-2">
                        {dia}
                        <button
                          onClick={() => handleCopiarDia(diaIndex)}
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
                      // Mismo criterio que en Horarios (HorarioTable.tsx): un día festivo
                      // o de vacaciones bloquea la edición igual que el recreo — si no, una
                      // nota escrita aquí quedaría después imposible de editar o borrar desde
                      // Horarios, que sí bloquea esas celdas.
                      const esRecreo = periodo.esRecreo
                      const diaNoLectivo = dias[diaIndex]?.esFestivo || dias[diaIndex]?.esVacaciones
                      const noEditable = esRecreo || diaNoLectivo
                      const celda = esRecreo ? undefined : celdaActual(periodoIndex, diaIndex)
                      const claseColor = celda?.color
                        ? PALETA_ASIGNATURAS.find((c) => c.id === celda.color)?.clase
                        : undefined
                      return (
                        <td
                          key={diaIndex}
                          onClick={() => !noEditable && setCeldaEditando({ periodoIndex, diaIndex })}
                          title={diaNoLectivo ? 'Día no lectivo, no se puede editar' : esRecreo ? 'Recreo, no se puede editar' : undefined}
                          className={cn(
                            'border border-border p-1 align-top min-h-[60px] transition-colors',
                            noEditable
                              ? 'bg-muted/60 cursor-not-allowed'
                              : claseColor
                                ? cn(claseColor, 'cursor-pointer hover:brightness-95 dark:hover:brightness-125')
                                : 'cursor-pointer hover:bg-accent/50'
                          )}
                        >
                          {!esRecreo && (
                            <div className="p-1 min-h-[50px] overflow-hidden">
                              <div className="text-sm truncate">
                                {celda?.contenido || (noEditable ? null : (
                                  <span className="text-muted-foreground/50 italic">Click para editar</span>
                                ))}
                              </div>
                              {celda?.nota && (
                                <div className="mt-0.5 flex items-start gap-1 text-xs opacity-80 italic">
                                  <StickyNote className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                  <span className="line-clamp-2 break-words whitespace-pre-wrap">{celda.nota}</span>
                                </div>
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
              setCeldas((prev) => {
                const limpio = { ...prev }
                periodosHorarios.forEach((periodo, periodoIndex) => {
                  if (periodo.esRecreo) return
                  DIAS_SEMANA.forEach((_, diaIndex) => {
                    limpio[`${periodoIndex}-${diaIndex}`] = { contenido: '' }
                  })
                })
                return limpio
              })
            }
          }}
        >
          🗑️ Limpiar periodos
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

/** Resumen en texto plano de una semana, para dar contexto al asistente de IA (ver useEditorContextStore). */
function resumenParaAsistente(
  dias: Semana['dias'],
  observaciones: string,
  periodosHorarios: { inicio: string; fin: string; esRecreo?: boolean }[],
  celdaActual: (periodoIndex: number, diaIndex: number) => CeldaHorario
): string {
  const lineas: string[] = []
  dias.forEach((_dia, diaIndex) => {
    const contenidos = periodosHorarios
      .map((periodo, periodoIndex) => {
        if (periodo.esRecreo) return null
        const celda = celdaActual(periodoIndex, diaIndex)
        const texto = contenidoParaSemana(celda.contenido || '', celda.nota || '')
        if (!texto) return null
        return `${periodo.inicio}: ${texto}`
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
