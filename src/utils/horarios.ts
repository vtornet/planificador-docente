import { addDays, format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Horario } from '../types'

// ¿El horario está vigente en algún punto del rango [desde, hasta]?
export function horarioActivoEnRango(horario: Horario, desde: Date, hasta: Date): boolean {
  if (!horario.fechaInicio) return false
  const inicio = new Date(horario.fechaInicio)
  const fin = horario.fechaFin ? new Date(horario.fechaFin) : null
  return inicio <= hasta && (fin === null || fin >= desde)
}

// ¿El horario abarca más semanas que la indicada? (para ofrecer "modificar solo esta semana")
export function horarioAbarcaMasDeLaSemana(horario: Horario, semana: { inicio: Date; fin: Date }): boolean {
  if (!horario.fechaInicio) return false
  const inicio = new Date(horario.fechaInicio)
  const fin = horario.fechaFin ? new Date(horario.fechaFin) : null
  return inicio < semana.inicio || fin === null || fin > semana.fin
}

// Separa una semana concreta de un horario más amplio en una copia
// independiente (con los mismos datos, editable sin afectar al resto).
export function dividirHorarioParaSemana(
  original: Horario,
  semana: { inicio: Date; fin: Date }
): { actualizacionOriginal: Partial<Horario>; nuevos: Omit<Horario, 'id'>[] } {
  const diaAntes = addDays(semana.inicio, -1)
  const diaDespues = addDays(semana.fin, 1)
  const fechaFinOriginal = original.fechaFin ? new Date(original.fechaFin) : null

  const hayAntes = new Date(original.fechaInicio!) < semana.inicio
  const hayDespues = fechaFinOriginal === null || fechaFinOriginal > semana.fin

  const clonarDatos = () => original.datos.map((fila) => fila.map((celda) => ({ ...celda })))

  const nuevos: Omit<Horario, 'id'>[] = [
    {
      tipo: original.tipo,
      nombre: original.nombre,
      datos: clonarDatos(),
      configHorarios: original.configHorarios,
      fechaInicio: semana.inicio,
      fechaFin: semana.fin,
    },
  ]

  let actualizacionOriginal: Partial<Horario> = {}

  if (hayAntes && hayDespues) {
    actualizacionOriginal = { fechaFin: diaAntes }
    nuevos.push({
      tipo: original.tipo,
      nombre: original.nombre,
      datos: clonarDatos(),
      configHorarios: original.configHorarios,
      fechaInicio: diaDespues,
      fechaFin: fechaFinOriginal!,
    })
  } else if (hayAntes) {
    actualizacionOriginal = { fechaFin: diaAntes }
  } else if (hayDespues) {
    actualizacionOriginal = { fechaInicio: diaDespues }
  }

  return { actualizacionOriginal, nuevos }
}

export function formatRangoFechas(fechaInicio?: Date, fechaFin?: Date): string {
  if (!fechaInicio) return ''
  const inicio = new Date(fechaInicio)
  if (!fechaFin) return `Desde el ${format(inicio, "d 'de' MMMM 'de' yyyy", { locale: es })}`

  const fin = new Date(fechaFin)
  const mismoMes = inicio.getMonth() === fin.getMonth() && inicio.getFullYear() === fin.getFullYear()
  if (mismoMes) {
    return `Del ${format(inicio, 'd')} al ${format(fin, "d 'de' MMMM 'de' yyyy", { locale: es })}`
  }
  return `Del ${format(inicio, 'd MMM', { locale: es })} al ${format(fin, 'd MMM yyyy', { locale: es })}`
}
