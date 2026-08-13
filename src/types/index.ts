// Tipos principales de Docenza (Planificador Docente)

// ============== METADATA ==============
interface CuadernoMetadata {
  cursoEscolar: string // "2026-2027"
  centro: string
  docente: string
  cursos?: string[] // Ej: ["1º ESO A", "2º ESO B"] - usado como desplegable al crear horarios
  comunidadAutonoma?: string // id de COMUNIDADES_AUTONOMAS - para cargar el festivo autonómico correspondiente
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
  fechaInicio?: Date // tramo de fechas en que el horario está vigente
  fechaFin?: Date
}

interface ConfigHorarios {
  numPeriodos: number // 7-8 periodos
  horaInicio: string // "08:00"
  duracionPeriodo: number // minutos
  recreo?: { periodo: number; duracion: number }
}

interface CeldaHorario {
  contenido: string
  nota?: string
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

// ============== EVENTOS DE AGENDA ==============
// Recordatorio expresado como desplazamiento antes del evento (o del inicio del
// día, en eventos de todo el día). 'ninguno' desactiva la notificación.
type RecordatorioEvento = 'ninguno' | 'momento' | '10min' | '30min' | '1hora' | '1dia'

interface Evento {
  id: string
  titulo: string
  descripcion?: string
  fecha: Date // día del evento
  todoElDia: boolean
  horaInicio?: string // "HH:mm", solo si !todoElDia
  horaFin?: string // "HH:mm", opcional
  color: string // id de COLORES_EVENTOS
  recordatorio: RecordatorioEvento
  creado: Date
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
  festivos: Festivo[]
  vacaciones: Vacacion[]
  coloresAsignaturas?: Record<string, string> // nombre de asignatura personalizada -> id de color en PALETA_ASIGNATURAS
}

// 'nacional': festivo estatal (Constitución, Navidad...); 'autonomico': de la
// comunidad autónoma (Día de Andalucía...); 'local': provincial o municipal
// (días no lectivos elegidos por el Consejo Escolar Municipal, etc.)
type TipoFestivo = 'nacional' | 'autonomico' | 'local'

interface Festivo {
  id: string
  nombre: string
  fecha: Date
  tipo: TipoFestivo
  // 'automatico': cargado por defecto (nacional al crear el cuaderno, o
  // autonómico al elegir comunidad en el Perfil) - se puede sustituir sin
  // avisar. Sin definir (festivos añadidos a mano, o de antes de este campo)
  // se trata igual que 'manual': nunca se toca automáticamente.
  origen?: 'automatico' | 'manual'
}

interface Vacacion {
  id: string
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
  eventos: Evento[]
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
  Evento,
  RecordatorioEvento,
  Configuracion,
  Festivo,
  TipoFestivo,
  Vacacion,
  CuadernoDocente,
}
