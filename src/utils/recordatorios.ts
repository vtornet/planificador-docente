import { RECORDATORIOS, HORA_RECORDATORIO_TODO_EL_DIA } from '../types/constants'
import type { Evento } from '../types'

// Fecha+hora "real" del evento: la hora de inicio, o (en eventos de todo el
// día, que no tienen hora) una hora fija de referencia para poder calcular
// recordatorios igualmente. `fecha` permite calcularlo para una ocurrencia
// concreta de un evento recurrente en vez de para `evento.fecha` (la primera).
export function fechaHoraEvento(evento: Evento, fecha: Date = evento.fecha): Date {
  const hora = evento.todoElDia ? HORA_RECORDATORIO_TODO_EL_DIA : evento.horaInicio || HORA_RECORDATORIO_TODO_EL_DIA
  const [h, m] = hora.split(':').map(Number)
  const resultado = new Date(fecha)
  resultado.setHours(h, m, 0, 0)
  return resultado
}

// Momento en el que debería dispararse el recordatorio, o null si no tiene.
export function fechaRecordatorio(evento: Evento, fecha: Date = evento.fecha): Date | null {
  const config = RECORDATORIOS.find((r) => r.id === evento.recordatorio)
  if (!config || config.minutos === null) return null
  return new Date(fechaHoraEvento(evento, fecha).getTime() - config.minutos * 60 * 1000)
}
