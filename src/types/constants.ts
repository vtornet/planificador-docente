// Constantes para el Plafinicador Docente

export const MESES = [
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
] as const

export const DIAS_SEMANA = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
] as const

export const DIAS_SEMANA_COMPLETO = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
] as const

export const TIPOS_REUNION = [
  'Claustro',
  'Departamento',
  'Ciclo',
  'Tutoría',
  'Otra',
] as const

export const CATEGORIAS_NOTAS = [
  'Proyectos',
  'Salidas escolares',
  'Planos de clase',
  'Ideas',
  'Recursos',
  'Otro',
] as const

export const CURSOS_ESCOLARES = [
  '2024-2025',
  '2025-2026',
  '2026-2027',
  '2027-2028',
  '2028-2029',
] as const

export const ASIGNATURAS_PREDEFINIDAS = [
  'Lengua',
  'Matemáticas',
  'Conocimiento del Medio',
  'Atención Educativa',
  'Plástica',
  'Música',
  'Inglés',
  'Francés',
  'Portugués',
  'Religión',
  'Educación Física',
  'Valores Sociales y Cívicos',
] as const

// Paleta de colores para asignaturas: cada entrada es un id + las clases
// Tailwind (con variante dark:) para pintar la celda del horario.
export const PALETA_ASIGNATURAS = [
  { id: 'red', clase: 'bg-red-100 dark:bg-red-950/40 text-red-900 dark:text-red-200' },
  { id: 'orange', clase: 'bg-orange-100 dark:bg-orange-950/40 text-orange-900 dark:text-orange-200' },
  { id: 'amber', clase: 'bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200' },
  { id: 'yellow', clase: 'bg-yellow-100 dark:bg-yellow-950/40 text-yellow-900 dark:text-yellow-200' },
  { id: 'lime', clase: 'bg-lime-100 dark:bg-lime-950/40 text-lime-900 dark:text-lime-200' },
  { id: 'green', clase: 'bg-green-100 dark:bg-green-950/40 text-green-900 dark:text-green-200' },
  { id: 'emerald', clase: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200' },
  { id: 'teal', clase: 'bg-teal-100 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200' },
  { id: 'cyan', clase: 'bg-cyan-100 dark:bg-cyan-950/40 text-cyan-900 dark:text-cyan-200' },
  { id: 'sky', clase: 'bg-sky-100 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200' },
  { id: 'blue', clase: 'bg-blue-100 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200' },
  { id: 'indigo', clase: 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200' },
  { id: 'violet', clase: 'bg-violet-100 dark:bg-violet-950/40 text-violet-900 dark:text-violet-200' },
  { id: 'purple', clase: 'bg-purple-100 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200' },
  { id: 'fuchsia', clase: 'bg-fuchsia-100 dark:bg-fuchsia-950/40 text-fuchsia-900 dark:text-fuchsia-200' },
  { id: 'pink', clase: 'bg-pink-100 dark:bg-pink-950/40 text-pink-900 dark:text-pink-200' },
  { id: 'rose', clase: 'bg-rose-100 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200' },
  { id: 'stone', clase: 'bg-stone-100 dark:bg-stone-950/40 text-stone-900 dark:text-stone-200' },
] as const

// Color fijo para cada asignatura predefinida (siempre el mismo, no hay que elegirlo)
export const COLORES_ASIGNATURAS_PREDEFINIDAS: Record<string, string> = {
  'Lengua': 'red',
  'Matemáticas': 'blue',
  'Conocimiento del Medio': 'emerald',
  'Atención Educativa': 'amber',
  'Plástica': 'fuchsia',
  'Música': 'violet',
  'Inglés': 'cyan',
  'Francés': 'indigo',
  'Portugués': 'teal',
  'Religión': 'stone',
  'Educación Física': 'lime',
  'Valores Sociales y Cívicos': 'pink',
}

export const COLORES_CELDA = [
  { nombre: 'Sin color', valor: undefined },
  { nombre: 'Rojo claro', valor: '#fecaca' },
  { nombre: 'Naranja claro', valor: '#fed7aa' },
  { nombre: 'Amarillo claro', valor: '#fef08a' },
  { nombre: 'Verde claro', valor: '#bbf7d0' },
  { nombre: 'Azul claro', valor: '#bfdbfe' },
  { nombre: 'Morado claro', valor: '#e9d5ff' },
  { nombre: 'Rosa claro', valor: '#fbcfe8' },
  { nombre: 'Gris claro', valor: '#e5e7eb' },
] as const

export const CONFIG_HORARIOS_PREDEFINIDOS = {
  primaria: {
    numPeriodos: 7,
    horaInicio: '09:00',
    duracionPeriodo: 50,
    recreo: { periodo: 4, duracion: 30 },
  },
  secundaria: {
    numPeriodos: 6,
    horaInicio: '08:00',
    duracionPeriodo: 55,
    recreo: { periodo: 3, duracion: 30 },
  },
}

export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB para imágenes

export const DB_NAME = 'PlafinicadorDB'
export const DB_VERSION = 1
