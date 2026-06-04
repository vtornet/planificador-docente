import { useState } from 'react'
import { format, addDays, startOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'
import { DIAS_SEMANA } from '../../types/constants'
import { useCuadernoStore } from '../../stores/useCuadernoStore'
import type { Semana } from '../../types'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Button } from '../ui/button'
import { CONFIG_HORARIOS_PREDEFINIDOS } from '../../types/constants'

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
  const { addSemana, updateSemana, duplicateSemana } = useCuadernoStore()

  const [numeroSemana, setNumeroSemana] = useState(semana?.numeroSemana || 1)
  const [observaciones, setObservaciones] = useState(semana?.observaciones || '')
  const [dias, setDias] = useState(() => {
    if (semana?.dias) {
      return semana.dias
    }

    // Crear estructura base para una nueva semana
    const configHorarios = CONFIG_HORARIOS_PREDEFINIDOS.secundaria
    const numPeriodos = configHorarios.numPeriodos +
      (configHorarios.recreo ? 1 : 0)

    return DIAS_SEMANA.map((_, diaIndex) => {
      const fecha = addDays(fechaInicio || new Date(), diaIndex)
      return {
        fecha,
        esFestivo: false,
        esVacaciones: false,
        periodos: Array.from({ length: numPeriodos }, () => ({
          contenido: '',
        })),
      }
    })
  })

  const configHorarios = CONFIG_HORARIOS_PREDEFINIDOS.secundaria
  const periodosHorarios = generarPeriodos(configHorarios)

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

      const nuevaSemana: Semana = {
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
          <h3 className="text-lg font-semibold text-slate-900">
            {semana ? `Editar Semana ${numeroSemana}` : 'Nueva Semana'}
          </h3>
          <p className="text-sm text-slate-600">
            {fechaInicio && (
              <>Del {format(fechaInicio, 'dd/MM/yyyy', { locale: es })} al{' '}
              {format(addDays(fechaInicio, 4), 'dd/MM/yyyy', { locale: es })}</>
            )}
            {semana && (
              <>Del {format(new Date(semana.fechaInicio), 'dd/MM/yyyy')} al{' '}
              {format(new Date(semana.fechaFin), 'dd/MM/yyyy')}</>
            )}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700">
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
            <div className="text-sm text-slate-500">
              Click en celda para editar • Enter para guardar
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 p-2 text-left text-sm font-semibold text-slate-700 min-w-[80px]">
                    Hora
                  </th>
                  {DIAS_SEMANA.map((dia) => (
                    <th
                      key={dia}
                      className="border border-slate-300 p-2 text-center text-sm font-semibold text-slate-700 min-w-[140px]"
                    >
                      <div className="flex items-center justify-center gap-2">
                        {dia}
                        <button
                          onClick={() => handleCopiarDia(DIAS_SEMANA.indexOf(dia))}
                          className="text-xs text-blue-600 hover:text-blue-700"
                          title="Copiar este día a los siguientes"
                        >
                          📋
                        </button>
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
                    {DIAS_SEMANA.map((_, diaIndex) => (
                      <td
                        key={diaIndex}
                        className="border border-slate-300 p-1 align-top min-h-[60px]"
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
                          className="w-full min-h-[50px] p-2 text-sm resize-none bg-transparent border-0 focus:ring-2 focus:ring-blue-500 rounded"
                          placeholder="Click para editar..."
                        />
                      </td>
                    ))}
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
