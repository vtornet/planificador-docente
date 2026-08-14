import { addDays, addWeeks, addMonths, startOfDay } from 'date-fns'
import type { Evento } from '../types'

// Tope de seguridad para no generar de más si "hasta" queda muy lejos (ej.
// un evento diario "hasta" dentro de varios años). Con margen de sobra para
// cualquier recurrencia dentro de un curso escolar.
const MAX_OCURRENCIAS = 731

const PASO = {
  diaria: addDays,
  semanal: addWeeks,
  mensual: addMonths,
} as const

/**
 * Fechas (medianoche local) en las que cae cada ocurrencia de un evento. Sin
 * recurrencia, es solo su propia fecha. Con recurrencia, genera desde
 * `evento.fecha` (primera ocurrencia) hasta `recurrencia.hasta` inclusive.
 */
export function fechasOcurrencias(evento: Evento): Date[] {
  const inicio = startOfDay(new Date(evento.fecha))
  if (!evento.recurrencia) return [inicio]

  const { frecuencia, hasta } = evento.recurrencia
  const limite = startOfDay(new Date(hasta)).getTime()
  const paso = PASO[frecuencia]

  const fechas: Date[] = []
  let actual = inicio
  let iteraciones = 0

  while (actual.getTime() <= limite && iteraciones < MAX_OCURRENCIAS) {
    fechas.push(actual)
    actual = paso(actual, 1)
    iteraciones++
  }

  return fechas
}
