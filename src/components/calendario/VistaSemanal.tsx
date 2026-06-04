import { useState } from 'react'
import { format, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { DIAS_SEMANA } from '../../types/constants'
import { useCuadernoStore } from '../../stores/useCuadernoStore'
import type { Semana } from '../../types'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Textarea } from '../ui/textarea'
import { Input } from '../ui/input'
import { CONFIG_HORARIOS_PREDEFINIDOS } from '../../types/constants'

interface VistaSemanalProps {
  semana: Semana
  onClose: () => void
}

export function VistaSemanal({ semana, onClose }: VistaSemanalProps) {
  const { updateSemana, cuadernoActual } = useCuadernoStore()
  const [observaciones, setObservaciones] = useState(semana.observaciones || '')
  const [editandoCelda, setEditandoCelda] = useState<{
    diaIndex: number
    periodoIndex: number
  } | null>(null)

  const configHorarios = cuadernoActual?.configuracion
    ? CONFIG_HORARIOS_PREDEFINIDOS.secundaria
    : CONFIG_HORARIOS_PREDEFINIDOS.secundaria

  // Generar periodos horarios
  const periodosHorarios = generarPeriodos(configHorarios)

  // Obtener días de la semana
  const diasSemana = DIAS_SEMANA.map((_, idx) => ({
    nombre: DIAS_SEMANA[idx],
    fecha: addDays(new Date(semana.fechaInicio), idx),
  }))

  const handleGuardarObservaciones = () => {
    updateSemana(semana.id, { observaciones: observaciones })
  }

  const handleCeldaClick = (diaIndex: number, periodoIndex: number) => {
    setEditandoCelda({ diaIndex, periodoIndex })
  }

  const handleCeldaChange = (
    diaIndex: number,
    periodoIndex: number,
    valor: string
  ) => {
    const nuevosDias = [...semana.dias]
    if (!nuevosDias[diaIndex]?.periodos) {
      nuevosDias[diaIndex] = {
        fecha: nuevosDias[diaIndex]?.fecha || new Date(),
        esFestivo: nuevosDias[diaIndex]?.esFestivo || false,
        esVacaciones: nuevosDias[diaIndex]?.esVacaciones || false,
        periodos: periodosHorarios.map(() => ({ contenido: '' })),
      }
    }

    if (!nuevosDias[diaIndex].periodos[periodoIndex]) {
      nuevosDias[diaIndex].periodos[periodoIndex] = { contenido: '' }
    }

    nuevosDias[diaIndex].periodos[periodoIndex].contenido = valor

    updateSemana(semana.id, { dias: nuevosDias })
  }

  const getCeldaContenido = (diaIndex: number, periodoIndex: number) => {
    return semana.dias[diaIndex]?.periodos[periodoIndex]?.contenido || ''
  }

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Semana {semana.numeroSemana}
          </h3>
          <p className="text-sm text-slate-600">
            Del {format(new Date(semana.fechaInicio), 'dd/MM/yyyy', { locale: es })}{' '}
            al {format(new Date(semana.fechaFin), 'dd/MM/yyyy', { locale: es })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={onClose}>Guardar</Button>
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
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 p-2 text-left text-sm font-semibold text-slate-700 min-w-[80px]">
                    Hora
                  </th>
                  {diasSemana.map((dia) => (
                    <th
                      key={dia.nombre}
                      className="border border-slate-300 p-2 text-center text-sm font-semibold text-slate-700 min-w-[140px]"
                    >
                      <div>{dia.nombre}</div>
                      <div className="text-xs text-slate-500">
                        {format(dia.fecha, 'dd/MM')}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {periodosHorarios.map((periodo, periodoIndex) => (
                  <tr key={periodoIndex}>
                    <td className="border border-slate-300 p-2 text-sm text-slate-600 font-medium bg-slate-50">
                      <div className="text-center">
                        <div>{periodo.inicio}</div>
                        <div className="text-xs text-slate-400">- {periodo.fin}</div>
                      </div>
                    </td>
                    {diasSemana.map((_, diaIndex) => {
                      const isEditando =
                        editandoCelda?.diaIndex === diaIndex &&
                        editandoCelda?.periodoIndex === periodoIndex

                      return (
                        <td
                          key={diaIndex}
                          onClick={() =>
                            !isEditando && handleCeldaClick(diaIndex, periodoIndex)
                          }
                          className="border border-slate-300 p-1 align-top min-h-[60px] cursor-pointer hover:bg-blue-50 transition-colors"
                        >
                          {isEditando ? (
                            <Input
                              autoFocus
                              defaultValue={getCeldaContenido(
                                diaIndex,
                                periodoIndex
                              )}
                              onChange={(e) =>
                                handleCeldaChange(
                                  diaIndex,
                                  periodoIndex,
                                  e.target.value
                                )
                              }
                              onBlur={() => setEditandoCelda(null)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') setEditandoCelda(null)
                                if (e.key === 'Escape') setEditandoCelda(null)
                              }}
                              className="min-h-[50px] h-full"
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <div className="text-sm text-slate-700 whitespace-pre-wrap p-2 min-h-[50px]">
                              {getCeldaContenido(diaIndex, periodoIndex) || (
                                <span className="text-slate-300 italic">
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

          <div className="mt-4 text-sm text-slate-500">
            Tip: Click en celda para editar, Enter para guardar
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
            onChange={(e) => setObservaciones(e.target.value)}
            onBlur={handleGuardarObservaciones}
            placeholder="Añade observaciones sobre esta semana..."
            rows={4}
          />
        </CardContent>
      </Card>
    </div>
  )
}

function generarPeriodos(config: typeof CONFIG_HORARIOS_PREDEFINIDOS.secundaria) {
  const periodos: { inicio: string; fin: string }[] = []
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

    // Comprobar si es recreo
    if (config.recreo && config.recreo.periodo === i + 1) {
      periodos.push({ inicio: '☕', fin: 'Recreo' })
      minuto += config.recreo.duracion
      if (minuto >= 60) {
        hora += Math.floor(minuto / 60)
        minuto = minuto % 60
      }
    } else {
      periodos.push({ inicio, fin })
    }
  }

  return periodos
}
