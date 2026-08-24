import { useState } from 'react'
import { format, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { DIAS_SEMANA, PALETA_ASIGNATURAS } from '../../types/constants'
import { useCuadernoStore } from '../../stores/useCuadernoStore'
import type { CeldaHorario, Horario, Semana } from '../../types'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Textarea } from '../ui/textarea'
import { CONFIG_HORARIOS_PREDEFINIDOS, COLOR_VACACIONES } from '../../types/constants'
import {
  horarioActivoEnRango,
  horarioAbarcaMasDeLaSemana,
  dividirHorarioParaSemana,
  aplicarCeldasEnDatos,
  rejillaVacia,
  contenidoParaSemana,
} from '../../utils/horarios'
import { cn } from '../../utils/cn'
import { Save, StickyNote } from 'lucide-react'
import { CeldaHorarioForm } from '../horario/CeldaHorarioForm'

interface VistaSemanalProps {
  semana: Semana
  onClose: () => void
}

export function VistaSemanal({ semana, onClose }: VistaSemanalProps) {
  const { updateSemana, updateHorario, addHorario, cuadernoActual } = useCuadernoStore()

  // Horario vigente esa semana — si existe, se edita con las mismas
  // opciones que en Horarios (ver CeldaHorarioForm.tsx); si no, se crea uno
  // nuevo al guardar — ver "HORARIOS Y PLANIFICAR: MISMAS OPCIONES" en
  // CLAUDE.md. Antes esta vista no lo comprobaba nunca y usaba siempre la
  // plantilla "secundaria" a ciegas, aunque la semana se hubiera creado con
  // otro horario.
  const rangoSemana = { inicio: new Date(semana.fechaInicio), fin: new Date(semana.fechaFin) }
  const horariosVigentes = (cuadernoActual?.horarios || []).filter((h) =>
    horarioActivoEnRango(h, rangoSemana.inicio, rangoSemana.fin)
  )
  const horarioVigente: Horario | undefined =
    horariosVigentes.find((h) => h.tipo === 'docente') || horariosVigentes[0]
  const configHorarios = horarioVigente?.configHorarios || CONFIG_HORARIOS_PREDEFINIDOS.secundaria
  const periodosHorarios = generarPeriodos(configHorarios)

  const [observaciones, setObservaciones] = useState(semana.observaciones || '')
  const [celdas, setCeldas] = useState<Record<string, CeldaHorario>>({})
  const [celdaEditando, setCeldaEditando] = useState<{ periodoIndex: number; diaIndex: number } | null>(null)
  const [dirty, setDirty] = useState(false)
  const [mostrarAlcance, setMostrarAlcance] = useState(false)

  const celdaActual = (periodoIndex: number, diaIndex: number): CeldaHorario => {
    const key = `${periodoIndex}-${diaIndex}`
    return celdas[key] ?? horarioVigente?.datos[periodoIndex]?.[diaIndex] ?? { contenido: '' }
  }

  const diasSemana = DIAS_SEMANA.map((_, idx) => ({
    nombre: DIAS_SEMANA[idx],
    fecha: addDays(new Date(semana.fechaInicio), idx),
    esFestivo: semana.dias[idx]?.esFestivo || false,
    esVacaciones: semana.dias[idx]?.esVacaciones || false,
  }))

  const construirDiasFinal = () => {
    return semana.dias.map((dia, diaIndex) => ({
      ...dia,
      periodos: periodosHorarios.map((periodo, periodoIndex) => {
        if (periodo.esRecreo) return { contenido: '' }
        const celda = celdaActual(periodoIndex, diaIndex)
        return { contenido: contenidoParaSemana(celda.contenido || '', celda.nota || '') }
      }),
    }))
  }

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
      addHorario({
        tipo: 'docente',
        nombre: `Horario semana del ${format(rangoSemana.inicio, 'dd/MM/yyyy')}`,
        datos: aplicarCeldasEnDatos(rejillaVacia(configHorarios), celdas),
        configHorarios,
        fechaInicio: rangoSemana.inicio,
        fechaFin: rangoSemana.fin,
      })
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

  if (celdaEditando) {
    const { periodoIndex, diaIndex } = celdaEditando
    return (
      <CeldaHorarioForm
        key={`${periodoIndex}-${diaIndex}`}
        celda={celdaActual(periodoIndex, diaIndex)}
        onGuardar={(celdaActualizada) => {
          setCeldas((prev) => ({ ...prev, [`${periodoIndex}-${diaIndex}`]: celdaActualizada }))
          setDirty(true)
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
        <div>
          <h3 className="text-lg font-semibold text-foreground tracking-tight">
            Semana {semana.numeroSemana}
          </h3>
          <p className="text-sm text-muted-foreground">
            Del {format(new Date(semana.fechaInicio), 'dd/MM/yyyy', { locale: es })}{' '}
            al {format(new Date(semana.fechaFin), 'dd/MM/yyyy', { locale: es })}
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
            <table className="w-full border-collapse table-fixed">
              <thead>
                <tr className="bg-muted">
                  <th className="border border-border p-2 text-left text-sm font-semibold text-foreground w-20">
                    Hora
                  </th>
                  {diasSemana.map((dia) => (
                    <th
                      key={dia.nombre}
                      className="border border-border p-2 text-center text-sm font-semibold text-foreground w-[140px]"
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
                      // El recreo bloquea de verdad la edición; festivo/vacaciones aquí
                      // (a diferencia de Horarios) solo se marcan visualmente por ahora,
                      // se sigue pudiendo planificar contenido ese día si hace falta.
                      const bloqueada = periodo.esRecreo
                      const muted = dia.esFestivo || dia.esVacaciones || bloqueada
                      const celda = bloqueada ? undefined : celdaActual(periodoIndex, diaIndex)
                      const claseColor = celda?.color
                        ? PALETA_ASIGNATURAS.find((c) => c.id === celda.color)?.clase
                        : undefined

                      return (
                        <td
                          key={diaIndex}
                          onClick={() => !bloqueada && setCeldaEditando({ periodoIndex, diaIndex })}
                          title={bloqueada ? 'Recreo, no se puede editar' : undefined}
                          className={cn(
                            'border border-border p-1 align-top min-h-[60px] transition-colors',
                            bloqueada
                              ? 'bg-muted/60 cursor-not-allowed'
                              : muted
                                ? 'bg-muted/60 cursor-pointer'
                                : claseColor
                                  ? cn(claseColor, 'cursor-pointer hover:brightness-95 dark:hover:brightness-125')
                                  : 'cursor-pointer hover:bg-accent/50'
                          )}
                        >
                          {!bloqueada && (
                            <div className="p-1 min-h-[50px] overflow-hidden">
                              <div className="text-sm truncate">
                                {celda?.contenido || (
                                  <span className="text-muted-foreground/50 italic">Click para editar</span>
                                )}
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

          <div className="mt-4 text-sm text-muted-foreground">
            Tip: Click en celda para editar • "Guardar cambios" para confirmar
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
