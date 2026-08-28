// Constantes para Docenza (Planificador Docente)

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
// Tailwind (con variante dark:) para pintar la celda del horario en la web,
// más los hex de fondo/texto equivalentes (claros, "modo día") para el PDF,
// que no entiende clases de Tailwind ni tiene modo oscuro (es papel impreso).
export const PALETA_ASIGNATURAS = [
  { id: 'red', clase: 'bg-red-100 dark:bg-red-950/40 text-red-900 dark:text-red-200', bg: '#fee2e2', texto: '#7f1d1d' },
  { id: 'orange', clase: 'bg-orange-100 dark:bg-orange-950/40 text-orange-900 dark:text-orange-200', bg: '#ffedd5', texto: '#7c2d12' },
  { id: 'amber', clase: 'bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200', bg: '#fef3c7', texto: '#78350f' },
  { id: 'yellow', clase: 'bg-yellow-100 dark:bg-yellow-950/40 text-yellow-900 dark:text-yellow-200', bg: '#fef9c3', texto: '#713f12' },
  { id: 'lime', clase: 'bg-lime-100 dark:bg-lime-950/40 text-lime-900 dark:text-lime-200', bg: '#ecfccb', texto: '#365314' },
  { id: 'green', clase: 'bg-green-100 dark:bg-green-950/40 text-green-900 dark:text-green-200', bg: '#dcfce7', texto: '#14532d' },
  { id: 'emerald', clase: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200', bg: '#d1fae5', texto: '#064e3b' },
  { id: 'teal', clase: 'bg-teal-100 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200', bg: '#ccfbf1', texto: '#134e4a' },
  { id: 'cyan', clase: 'bg-cyan-100 dark:bg-cyan-950/40 text-cyan-900 dark:text-cyan-200', bg: '#cffafe', texto: '#164e63' },
  { id: 'sky', clase: 'bg-sky-100 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200', bg: '#e0f2fe', texto: '#0c4a6e' },
  { id: 'blue', clase: 'bg-blue-100 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200', bg: '#dbeafe', texto: '#1e3a8a' },
  { id: 'indigo', clase: 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200', bg: '#e0e7ff', texto: '#312e81' },
  { id: 'violet', clase: 'bg-violet-100 dark:bg-violet-950/40 text-violet-900 dark:text-violet-200', bg: '#ede9fe', texto: '#4c1d95' },
  { id: 'purple', clase: 'bg-purple-100 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200', bg: '#f3e8ff', texto: '#581c87' },
  { id: 'fuchsia', clase: 'bg-fuchsia-100 dark:bg-fuchsia-950/40 text-fuchsia-900 dark:text-fuchsia-200', bg: '#fae8ff', texto: '#701a75' },
  { id: 'pink', clase: 'bg-pink-100 dark:bg-pink-950/40 text-pink-900 dark:text-pink-200', bg: '#fce7f3', texto: '#831843' },
  { id: 'rose', clase: 'bg-rose-100 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200', bg: '#ffe4e6', texto: '#881337' },
  { id: 'stone', clase: 'bg-stone-100 dark:bg-stone-950/40 text-stone-900 dark:text-stone-200', bg: '#f5f5f4', texto: '#1c1917' },
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

// Tipos de festivo, cada uno con su propio color para distinguirlos en el calendario.
export const TIPOS_FESTIVO = [
  { id: 'nacional', nombre: 'Nacional', color: '#ef4444' },
  { id: 'autonomico', nombre: 'Autonómico', color: '#22c55e' },
  { id: 'local', nombre: 'Local / provincial', color: '#a855f7' },
] as const

// Color para los periodos de vacaciones (distinto del azul ya usado por las semanas).
export const COLOR_VACACIONES = '#f59e0b'

// Paleta de colores para eventos de la agenda (estilo Google Calendar).
export const COLORES_EVENTOS = [
  { id: 'tomate', nombre: 'Tomate', color: '#d50000' },
  { id: 'mandarina', nombre: 'Mandarina', color: '#f4511e' },
  { id: 'platano', nombre: 'Plátano', color: '#f6bf26' },
  { id: 'salvia', nombre: 'Salvia', color: '#33b679' },
  { id: 'albahaca', nombre: 'Albahaca', color: '#0b8043' },
  { id: 'pavo-real', nombre: 'Pavo real', color: '#039be5' },
  { id: 'arandano', nombre: 'Arándano', color: '#3f51b5' },
  { id: 'lavanda', nombre: 'Lavanda', color: '#7986cb' },
  { id: 'uva', nombre: 'Uva', color: '#8e24aa' },
  { id: 'grafito', nombre: 'Grafito', color: '#616161' },
] as const

export const COLOR_EVENTO_POR_DEFECTO = 'pavo-real'

// Desplazamiento del recordatorio respecto al inicio del evento (o de las 09:00
// del día, en eventos de todo el día, ya que no tienen una hora concreta).
export const RECORDATORIOS = [
  { id: 'ninguno', nombre: 'Sin recordatorio', minutos: null },
  { id: 'momento', nombre: 'En el momento', minutos: 0 },
  { id: '10min', nombre: '10 minutos antes', minutos: 10 },
  { id: '30min', nombre: '30 minutos antes', minutos: 30 },
  { id: '1hora', nombre: '1 hora antes', minutos: 60 },
  { id: '1dia', nombre: '1 día antes', minutos: 24 * 60 },
] as const

export const HORA_RECORDATORIO_TODO_EL_DIA = '09:00'

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

// Etapas educativas para el perfil. Cada una apunta a la plantilla de intervalos
// horarios que se usa por defecto al crear un horario (clave de
// CONFIG_HORARIOS_PREDEFINIDOS). Infantil y Primaria comparten la jornada de
// primaria; el resto usa la de secundaria. Es solo un valor por defecto: la
// docente siempre puede personalizar los intervalos al crear el horario.
export const ETAPAS_EDUCATIVAS = [
  { id: 'infantil', nombre: 'Educación Infantil', config: 'primaria' as const },
  { id: 'primaria', nombre: 'Educación Primaria', config: 'primaria' as const },
  { id: 'eso', nombre: 'ESO', config: 'secundaria' as const },
  { id: 'bachillerato', nombre: 'Bachillerato', config: 'secundaria' as const },
  { id: 'fp', nombre: 'Formación Profesional', config: 'secundaria' as const },
  { id: 'otra', nombre: 'Otra', config: 'secundaria' as const },
] as const

// Devuelve la plantilla de intervalos por defecto para una etapa educativa.
// Si la etapa no está definida o no se reconoce, cae en 'secundaria' (el
// comportamiento que tenía la app antes de existir este campo).
export function configHorarioPorEtapa(etapaId?: string) {
  const etapa = ETAPAS_EDUCATIVAS.find((e) => e.id === etapaId)
  return CONFIG_HORARIOS_PREDEFINIDOS[etapa?.config ?? 'secundaria']
}

export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB para imágenes

export const DB_NAME = 'PlafinicadorDB'
export const DB_VERSION = 1
