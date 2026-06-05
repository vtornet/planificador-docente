import { useState } from 'react'
import { DIAS_SEMANA } from '../../types/constants'
import type { Horario } from '../../types'
import { cn } from '../../utils/cn'
import { UserCircle, GraduationCap } from 'lucide-react'

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

  const handleCeldaChange = (fila: number, columna: number, valor: string) => {
    const nuevosDatos = [...horario.datos]
    if (!nuevosDatos[fila]) {
      nuevosDatos[fila] = []
    }
    nuevosDatos[fila][columna] = {
      ...nuevosDatos[fila][columna],
      contenido: valor,
    }
    onUpdate({ ...horario, datos: nuevosDatos })
  }

  return (
    <div className={cn('w-full', className)}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">{horario.nombre}</h3>
        <span className="text-sm text-slate-500 flex items-center gap-1">
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

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-slate-300 p-2 text-left text-sm font-semibold text-slate-700 min-w-[80px]">
                Hora
              </th>
              {DIAS_SEMANA.map((dia) => (
                <th
                  key={dia}
                  className="border border-slate-300 p-2 text-center text-sm font-semibold text-slate-700 min-w-[120px]"
                >
                  {dia}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periodos.map((periodo, fila) => (
              <tr key={fila}>
                <td className="border border-slate-300 p-2 text-sm text-slate-600 font-medium bg-slate-50">
                  <div className="text-center">
                    {periodo.esRecreo ? (
                      <>
                        <div className="text-2xl">☕</div>
                        <div className="text-xs text-slate-500">Recreo</div>
                      </>
                    ) : (
                      <>
                        <div>{periodo.inicio}</div>
                        <div className="text-xs text-slate-400">- {periodo.fin}</div>
                      </>
                    )}
                  </div>
                </td>
                {DIAS_SEMANA.map((_, columna) => {
                  const celda = horario.datos[fila]?.[columna]
                  const isEditando =
                    celdaEditando?.fila === fila && celdaEditando?.columna === columna

                  return (
                    <td
                      key={columna}
                      onClick={() => !isEditando && handleCeldaClick(fila, columna)}
                      className={cn(
                        'border border-slate-300 p-1 align-top min-h-[60px] cursor-pointer hover:bg-blue-50 transition-colors',
                        celda?.color && 'bg-opacity-20'
                      )}
                      style={{ backgroundColor: celda?.color || undefined }}
                    >
                      {isEditando ? (
                        <input
                          type="text"
                          autoFocus
                          value={celda?.contenido || ''}
                          onChange={(e) => handleCeldaChange(fila, columna, e.target.value)}
                          onBlur={() => setCeldaEditando(null)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') setCeldaEditando(null)
                            if (e.key === 'Escape') setCeldaEditando(null)
                          }}
                          className="w-full h-full min-h-[50px] p-1 text-sm resize-none bg-white border-0 focus:ring-2 focus:ring-blue-500 rounded"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <div className="text-sm text-slate-700 whitespace-pre-wrap p-1 min-h-[50px]">
                          {celda?.contenido || (
                            <span className="text-slate-300 italic">Click para editar</span>
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

      <div className="mt-4 flex items-center gap-4">
        {onDuplicate && (
          <button
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
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Duplicar horario
          </button>
        )}
        <span className="text-sm text-slate-500">
          Tip: Click en celda para editar, Enter para guardar, Esc para cancelar
        </span>
      </div>
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
