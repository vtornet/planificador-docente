// Tipos principales del Plafinicador Docente

// ============== METADATA ==============
interface CuadernoMetadata {
  cursoEscolar: string // "2026-2027"
  centro: string
  docente: string
  creado: Date
  actualizado: Date
}

// ============== HORARIOS ==============
interface Horario {
  id: string
  tipo: 'docente' | 'alumnado'
  nombre: string
  datos: CeldaHorario[][] // [hora][dia]
  configHorarios: ConfigHorarios
}

interface ConfigHorarios {
  numPeriodos: number // 7-8 periodos
  horaInicio: string // "08:00"
  duracionPeriodo: number // minutos
  recreo?: { periodo: number; duracion: number }
}

interface CeldaHorario {
  contenido: string
  color?: string
}

// ============== PLANIFICACIÓN ==============
interface PlanificacionMensual {
  id: string
  mes: number // 1-12
  año: number
  cursoEscolar: string
}

interface Semana {
  id: string
  fechaInicio: Date
  fechaFin: Date
  numeroSemana: number // 1-36
  observaciones: string
  dias: DiaPlanificacion[]
}

interface DiaPlanificacion {
  fecha: Date
  esFestivo: boolean
  esVacaciones: boolean
  periodos: Periodo[]  // Array de contenido por cada periodo horario
}

interface Periodo {
  contenido: string
}

// ============== REUNIONES ==============
interface Reunion {
  id: string
  titulo: string
  fecha: Date
  tipo: 'claustro' | 'departamento' | 'ciclo' | 'tutoria' | 'otra'
  asistentes: string[]
  asuntosTratados: string
  acuerdos: string
  firmas: Firma[]
  creada: Date
}

interface Firma {
  nombre: string
  imagen: string // base64 de la firma
  fecha: Date
}

// ============== NOTAS ==============
interface Nota {
  id: string
  titulo: string
  categoria: string
  contenido: string // HTML del editor rico
  tipo: 'texto' | 'imagen' | 'tabla' | 'mixto'
  tags: string[]
  creado: Date
  actualizado: Date
}

// ============== CONFIGURACIÓN ==============
interface Configuracion {
  id: 'config'
  cursoEscolarActual: string
  fechaInicioCurso: Date
  fechaFinCurso: Date
  festivos: Date[]
  vacaciones: Vacacion[]
}

interface Vacacion {
  nombre: string
  inicio: Date
  fin: Date
}

// ============== CUADERNO COMPLETO ==============
interface CuadernoDocente {
  id: string
  metadata: CuadernoMetadata
  horarios: Horario[]
  planificacion: {
    mensual: PlanificacionMensual[]
    semanal: Semana[]
  }
  reuniones: Reunion[]
  notas: Nota[]
  configuracion: Configuracion
}

// ============== EXPORTS ==============
export type {
  CuadernoMetadata,
  Horario,
  ConfigHorarios,
  CeldaHorario,
  PlanificacionMensual,
  Semana,
  DiaPlanificacion,
  Periodo,
  Reunion,
  Firma,
  Nota,
  Configuracion,
  Vacacion,
  CuadernoDocente,
}
