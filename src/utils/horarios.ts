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
): { actualizacionOriginal: Partial<Horario>; nuevos: Omit<Horario, 'id' | 'actualizado'>[] } {
  const diaAntes = addDays(semana.inicio, -1)
  const diaDespues = addDays(semana.fin, 1)
  const fechaFinOriginal = original.fechaFin ? new Date(original.fechaFin) : null

  const hayAntes = new Date(original.fechaInicio!) < semana.inicio
  const hayDespues = fechaFinOriginal === null || fechaFinOriginal > semana.fin

  const clonarDatos = () => original.datos.map((fila) => fila.map((celda) => ({ ...celda })))

  const nuevos: Omit<Horario, 'id' | 'actualizado'>[] = [
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

// Aplica un mapa de notas nuevas (clave "fila-columna") a la rejilla de un
// horario, sin tocar el resto de campos de cada celda (asignatura, color).
// Usado por Planificación (SemanaEditor/VistaSemanal) para escribir la
// planificación de una semana concreta como nota de la celda del horario
// correspondiente — ver "PLANIFICACIÓN ↔ HORARIO: FUENTE ÚNICA" en CLAUDE.md.
export function aplicarNotasEnDatos(datos: Horario['datos'], notas: Record<string, string>): Horario['datos'] {
  const nuevosDatos = datos.map((fila) => [...fila])
  for (const [clave, nota] of Object.entries(notas)) {
    const [fila, columna] = clave.split('-').map(Number)
    if (!nuevosDatos[fila]) continue
    nuevosDatos[fila] = [...nuevosDatos[fila]]
    nuevosDatos[fila][columna] = { ...nuevosDatos[fila][columna], nota }
  }
  return nuevosDatos
}

// Texto que se guarda en Semana.dias[].periodos[].contenido cuando el
// periodo está respaldado por un horario — combina la asignatura (contexto,
// nunca editable desde Planificación) con la nota (lo que sí edita la
// docente ahí) para que el PDF de la semana y el contexto del asistente de
// IA (que leen directamente este campo, no el horario) sigan siendo útiles
// sin tener que cruzar datos con el horario en cada sitio que los consume.
export function contenidoParaSemana(asignatura: string, nota: string): string {
  if (!nota.trim()) return asignatura
  return asignatura ? `${asignatura}: ${nota}` : nota
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
