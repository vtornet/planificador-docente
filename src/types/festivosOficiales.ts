// Datos de festivos oficiales de España, verificados en fuentes públicas (BOE,
// resoluciones de la Dirección General de Trabajo, Wikipedia) en agosto de
// 2026 para poblar por defecto los festivos nacionales y autonómicos de un
// cuaderno nuevo. Son una AYUDA de partida, no una fuente legal — el docente
// puede añadir, editar o borrar cualquiera desde "Festivos y vacaciones".
//
// Los festivos nacionales de fecha fija son los mismos todos los años. El
// Viernes Santo es movible (depende de la Pascua) y solo se cubren los años
// de los cursos escolares ya listados en CURSOS_ESCOLARES (constants.ts) — si
// se añade un curso más adelante, hay que añadir aquí su Viernes Santo.

import type { Festivo } from '.'

interface FechaFija {
  mes: number // 1-12
  dia: number
  nombre: string
}

// Festivos nacionales de fecha fija (iguales cada año).
export const FESTIVOS_NACIONALES_FIJOS: FechaFija[] = [
  { mes: 1, dia: 1, nombre: 'Año Nuevo' },
  { mes: 1, dia: 6, nombre: 'Epifanía del Señor' },
  { mes: 5, dia: 1, nombre: 'Fiesta del Trabajo' },
  { mes: 8, dia: 15, nombre: 'Asunción de la Virgen' },
  { mes: 10, dia: 12, nombre: 'Fiesta Nacional de España' },
  { mes: 11, dia: 1, nombre: 'Todos los Santos' },
  { mes: 12, dia: 6, nombre: 'Día de la Constitución' },
  { mes: 12, dia: 8, nombre: 'Inmaculada Concepción' },
  { mes: 12, dia: 25, nombre: 'Navidad' },
]

// Viernes Santo (movible): solo cae en la parte de enero-julio de un curso
// escolar, así que la clave es el año natural en el que cae (segundo año del
// curso, ej. "2026-2027" -> 2027).
export const VIERNES_SANTO_POR_ANIO: Record<number, { mes: number; dia: number }> = {
  2025: { mes: 4, dia: 18 },
  2026: { mes: 4, dia: 3 },
  2027: { mes: 3, dia: 26 },
  2028: { mes: 4, dia: 14 },
  2029: { mes: 3, dia: 30 },
}

export const COMUNIDADES_AUTONOMAS = [
  { id: 'andalucia', nombre: 'Andalucía' },
  { id: 'aragon', nombre: 'Aragón' },
  { id: 'asturias', nombre: 'Asturias' },
  { id: 'baleares', nombre: 'Islas Baleares' },
  { id: 'canarias', nombre: 'Canarias' },
  { id: 'cantabria', nombre: 'Cantabria' },
  { id: 'castilla-la-mancha', nombre: 'Castilla-La Mancha' },
  { id: 'castilla-y-leon', nombre: 'Castilla y León' },
  { id: 'catalunya', nombre: 'Cataluña' },
  { id: 'extremadura', nombre: 'Extremadura' },
  { id: 'galicia', nombre: 'Galicia' },
  { id: 'madrid', nombre: 'Madrid' },
  { id: 'murcia', nombre: 'Región de Murcia' },
  { id: 'navarra', nombre: 'Navarra' },
  { id: 'pais-vasco', nombre: 'País Vasco' },
  { id: 'rioja', nombre: 'La Rioja' },
  { id: 'valencia', nombre: 'Comunidad Valenciana' },
  { id: 'ceuta', nombre: 'Ceuta' },
  { id: 'melilla', nombre: 'Melilla' },
] as const

export type ComunidadAutonomaId = (typeof COMUNIDADES_AUTONOMAS)[number]['id']

// Día festivo propio de cada comunidad ("Día de Andalucía", etc.). País Vasco
// no tiene actualmente ningún día festivo autonómico oficial (el "Euskadiko
// Eguna" del 25 de octubre se derogó en 2013), así que se deja sin festivo.
export const FESTIVO_AUTONOMICO_POR_COMUNIDAD: Record<ComunidadAutonomaId, FechaFija | null> = {
  'andalucia': { mes: 2, dia: 28, nombre: 'Día de Andalucía' },
  'aragon': { mes: 4, dia: 23, nombre: 'Día de Aragón' },
  'asturias': { mes: 9, dia: 8, nombre: 'Día de Asturias' },
  'baleares': { mes: 3, dia: 1, nombre: 'Día de las Illes Balears' },
  'canarias': { mes: 5, dia: 30, nombre: 'Día de Canarias' },
  'cantabria': { mes: 7, dia: 28, nombre: 'Día de las Instituciones de Cantabria' },
  'castilla-la-mancha': { mes: 5, dia: 31, nombre: 'Día de Castilla-La Mancha' },
  'castilla-y-leon': { mes: 4, dia: 23, nombre: 'Día de Castilla y León' },
  'catalunya': { mes: 9, dia: 11, nombre: 'Diada de Catalunya' },
  'extremadura': { mes: 9, dia: 8, nombre: 'Día de Extremadura' },
  'galicia': { mes: 7, dia: 25, nombre: 'Día de Galicia (Santiago Apóstol)' },
  'madrid': { mes: 5, dia: 2, nombre: 'Día de la Comunidad de Madrid' },
  'murcia': { mes: 6, dia: 9, nombre: 'Día de la Región de Murcia' },
  'navarra': { mes: 12, dia: 3, nombre: 'Día de Navarra (San Francisco Javier)' },
  'pais-vasco': null,
  'rioja': { mes: 6, dia: 9, nombre: 'Día de La Rioja' },
  'valencia': { mes: 10, dia: 9, nombre: 'Día de la Comunitat Valenciana' },
  'ceuta': { mes: 9, dia: 2, nombre: 'Día de Ceuta' },
  'melilla': { mes: 9, dia: 17, nombre: 'Día de Melilla' },
}

function anioParaMes(mes: number, anioInicio: number, anioFin: number): number {
  return mes >= 9 ? anioInicio : anioFin
}

// Genera los festivos nacionales (fijos + Viernes Santo si se conoce ese año)
// para un curso escolar tipo "2026-2027".
export function festivosNacionalesParaCursoEscolar(cursoEscolar: string): Omit<Festivo, 'id'>[] {
  const [anioInicio, anioFin] = cursoEscolar.split('-').map(Number)
  if (!anioInicio || !anioFin) return []

  const festivos: Omit<Festivo, 'id'>[] = FESTIVOS_NACIONALES_FIJOS.map((f) => ({
    nombre: f.nombre,
    fecha: new Date(anioParaMes(f.mes, anioInicio, anioFin), f.mes - 1, f.dia),
    tipo: 'nacional',
  }))

  const viernesSanto = VIERNES_SANTO_POR_ANIO[anioFin]
  if (viernesSanto) {
    festivos.push({
      nombre: 'Viernes Santo',
      fecha: new Date(anioFin, viernesSanto.mes - 1, viernesSanto.dia),
      tipo: 'nacional',
    })
  }

  return festivos
}

// Genera el festivo autonómico (si existe) de una comunidad para un curso
// escolar tipo "2026-2027". Devuelve un array vacío si la comunidad no tiene
// día festivo propio (ej. País Vasco) o no se reconoce el id.
export function festivoAutonomicoParaCursoEscolar(
  comunidadId: string,
  cursoEscolar: string
): Omit<Festivo, 'id'>[] {
  const dia = FESTIVO_AUTONOMICO_POR_COMUNIDAD[comunidadId as ComunidadAutonomaId]
  if (!dia) return []

  const [anioInicio, anioFin] = cursoEscolar.split('-').map(Number)
  if (!anioInicio || !anioFin) return []

  return [
    {
      nombre: dia.nombre,
      fecha: new Date(anioParaMes(dia.mes, anioInicio, anioFin), dia.mes - 1, dia.dia),
      tipo: 'autonomico',
    },
  ]
}
