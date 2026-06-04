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
