import { useState } from 'react'
import { format, addDays, startOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'
import { DIAS_SEMANA, COLOR_VACACIONES } from '../../types/constants'
import { useCuadernoStore } from '../../stores/useCuadernoStore'
import type { Semana } from '../../types'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Button } from '../ui/button'
import { CONFIG_HORARIOS_PREDEFINIDOS } from '../../types/constants'
import { esDiaFestivo, esDiaVacaciones } from '../../utils/festivos'
import { horarioActivoEnRango } from '../../utils/horarios'
import type { Horario, ConfigHorarios } from '../../types'
import { cn } from '../../utils/cn'

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
  const { cuadernoActual, addSemana, updateSemana, duplicateSemana } = useCuadernoStore()
  const festivos = cuadernoActual?.configuracion.festivos || []
  const vacaciones = cuadernoActual?.configuracion.vacaciones || []

  // Horario vigente esa semana (si existe), para prellenar la planificación con
  // su estructura real de periodos y las asignaturas de cada celda. Solo se usa
  // al crear una semana nueva (!semana) — una semana ya guardada mantiene sus
  // propios datos, editados o no, sin recalcularse a partir del horario.
  const inicioSemanaNueva = fechaInicio || startOfWeek(new Date(), { weekStartsOn: 1 })
  const finSemanaNueva = addDays(inicioSemanaNueva, 4)
  const horariosVigentes = (cuadernoActual?.horarios || []).filter((h) =>
    horarioActivoEnRango(h, inicioSemanaNueva, finSemanaNueva)
  )
  const horarioVigente: Horario | undefined =
    horariosVigentes.find((h) => h.tipo === 'docente') || horariosVigentes[0]
  const configHorariosBase = horarioVigente?.configHorarios || CONFIG_HORARIOS_PREDEFINIDOS.secundaria

  const [numeroSemana, setNumeroSemana] = useState(semana?.numeroSemana || 1)
  const [observaciones, setObservaciones] = useState(semana?.observaciones || '')
  const [dias, setDias] = useState(() => {
    if (semana?.dias) {
      return semana.dias
    }

    // Crear estructura base para una nueva semana, tomando el nº de periodos y,
    // si hay horario vigente, el contenido ya asignado en él (datos[periodo][día]).
    const numPeriodos = configHorariosBase.numPeriodos + (configHorariosBase.recreo ? 1 : 0)

    return DIAS_SEMANA.map((_, diaIndex) => {
      const fecha = addDays(fechaInicio || new Date(), diaIndex)
      return {
        fecha,
        esFestivo: esDiaFestivo(fecha, festivos),
        esVacaciones: esDiaVacaciones(fecha, vacaciones),
        periodos: Array.from({ length: numPeriodos }, (_, periodoIndex) => ({
          contenido: horarioVigente?.datos[periodoIndex]?.[diaIndex]?.contenido || '',
        })),
      }
    })
  })

  const periodosHorarios = generarPeriodos(configHorariosBase)

  const handleGuardar = () => {
    if (semana) {
      // Actualizar semana existente
      updateSemana(semana.id, {
        observaciones,
        dias,
      })
    } else {
      // Crear nueva semana
      const inicioSemana = fechaInicio || startOfWeek(new Date(), { weekStartsOn: 1 })
      const finSemana = addDays(inicioSemana, 4) // Lunes a Viernes

      const nuevaSemana: Omit<Semana, 'actualizado'> = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        fechaInicio: inicioSemana,
        fechaFin: finSemana,
        numeroSemana,
        observaciones,
        dias,
      }

      addSemana(nuevaSemana)
    }

    onSave()
  }

  const handleCeldaChange = (
    diaIndex: number,
    periodoIndex: number,
    valor: string
  ) => {
    const nuevosDias = [...dias]
    nuevosDias[diaIndex].periodos[periodoIndex] = {
      contenido: valor,
    }
    setDias(nuevosDias)
  }

  const getCeldaContenido = (diaIndex: number, periodoIndex: number) => {
    return dias[diaIndex]?.periodos[periodoIndex]?.contenido || ''
  }

  const handleCopiarDia = (diaIndex: number) => {
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
          {!semana && horarioVigente && (
            <p className="text-xs text-primary mt-1">
              Precargada desde el horario "{horarioVigente.nombre}" — puedes editar cualquier celda libremente.
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
                      return (
                        <td
                          key={diaIndex}
                          title={bloqueada ? 'Recreo, no se puede editar' : undefined}
                          className={cn(
                            'border border-border p-1 align-top min-h-[60px]',
                            muted && 'bg-muted/60'
                          )}
                        >
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
              setDias(
                dias.map((dia) => ({
                  ...dia,
                  periodos: dia.periodos.map(() => ({ contenido: '' })),
                }))
              )
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
