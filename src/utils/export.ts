// Utilidades para exportar e importar datos del Planificador Docente

import { saveAs } from 'file-saver'
import type { CuadernoDocente } from '../types'

/**
 * Convierte un objeto Date a string ISO para serialización JSON
 */
function dateToISO(date: Date | string | undefined): string | undefined {
  if (!date) return undefined
  if (typeof date === 'string') return date
  return date.toISOString()
}

/**
 * Convierte strings ISO a objetos Date para deserialización JSON
 */
function isoToDate(iso: string | Date | undefined): Date | undefined {
  if (!iso) return undefined
  if (iso instanceof Date) return iso
  return new Date(iso)
}

/**
 * Prepara un cuaderno para exportación JSON
 * Convierte Date objects a ISO strings
 */
function prepareCuadernoForExport(cuaderno: CuadernoDocente): any {
  return {
    ...cuaderno,
    metadata: {
      ...cuaderno.metadata,
      creado: dateToISO(cuaderno.metadata.creado),
      actualizado: dateToISO(cuaderno.metadata.actualizado),
    },
    horarios: cuaderno.horarios.map((h) => ({ ...h })),
    planificacion: {
      mensual: cuaderno.planificacion.mensual.map((m) => ({ ...m })),
      semanal: cuaderno.planificacion.semanal.map((s) => ({
        ...s,
        fechaInicio: dateToISO(s.fechaInicio),
        fechaFin: dateToISO(s.fechaFin),
        dias: s.dias.map((d) => ({
          ...d,
          fecha: dateToISO(d.fecha),
        })),
      })),
    },
    reuniones: cuaderno.reuniones.map((r) => ({
      ...r,
      fecha: dateToISO(r.fecha),
      creada: dateToISO(r.creada),
      firmas: r.firmas.map((f) => ({
        ...f,
        fecha: dateToISO(f.fecha),
      })),
    })),
    notas: cuaderno.notas.map((n) => ({
      ...n,
      creado: dateToISO(n.creado),
      actualizado: dateToISO(n.actualizado),
    })),
    configuracion: {
      ...cuaderno.configuracion,
      fechaInicioCurso: dateToISO(cuaderno.configuracion.fechaInicioCurso),
      fechaFinCurso: dateToISO(cuaderno.configuracion.fechaFinCurso),
      festivos: cuaderno.configuracion.festivos.map((f) => dateToISO(f)!),
      vacaciones: cuaderno.configuracion.vacaciones.map((v) => ({
        ...v,
        inicio: dateToISO(v.inicio),
        fin: dateToISO(v.fin),
      })),
    },
  }
}

/**
 * Restaura un cuaderno desde JSON importado
 * Convierte ISO strings a Date objects
 */
function restoreCuadernoFromImport(data: any): CuadernoDocente {
  return {
    ...data,
    metadata: {
      ...data.metadata,
      creado: isoToDate(data.metadata.creado)!,
      actualizado: isoToDate(data.metadata.actualizado)!,
    },
    horarios: data.horarios || [],
    planificacion: {
      mensual: data.planificacion?.mensual || [],
      semanal: (data.planificacion?.semanal || []).map((s: any) => ({
        ...s,
        fechaInicio: isoToDate(s.fechaInicio)!,
        fechaFin: isoToDate(s.fechaFin)!,
        dias: (s.dias || []).map((d: any) => ({
          ...d,
          fecha: isoToDate(d.fecha)!,
        })),
      })),
    },
    reuniones: (data.reuniones || []).map((r: any) => ({
      ...r,
      fecha: isoToDate(r.fecha)!,
      creada: isoToDate(r.creada)!,
      firmas: (r.firmas || []).map((f: any) => ({
        ...f,
        fecha: isoToDate(f.fecha)!,
      })),
    })),
    notas: (data.notas || []).map((n: any) => ({
      ...n,
      creado: isoToDate(n.creado)!,
      actualizado: isoToDate(n.actualizado)!,
    })),
    configuracion: {
      ...data.configuracion,
      fechaInicioCurso: isoToDate(data.configuracion?.fechaInicioCurso)!,
      fechaFinCurso: isoToDate(data.configuracion?.fechaFinCurso)!,
      festivos: (data.configuracion?.festivos || []).map((f: string) => isoToDate(f)!),
      vacaciones: (data.configuracion?.vacaciones || []).map((v: any) => ({
        ...v,
        inicio: isoToDate(v.inicio)!,
        fin: isoToDate(v.fin)!,
      })),
    },
  }
}

/**
 * Exporta el cuaderno completo a un archivo JSON
 */
export function exportCuadernoToJSON(cuaderno: CuadernoDocente, filename?: string): void {
  try {
    const data = prepareCuadernoForExport(cuaderno)
    const jsonString = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const defaultFilename = `plafinicador-${cuaderno.metadata.centro.replace(/\s+/g, '-')}-${cuaderno.metadata.cursoEscolar}.json`
    saveAs(blob, filename || defaultFilename)
  } catch (error) {
    console.error('Error exporting cuaderno:', error)
    throw new Error('Error al exportar el cuaderno')
  }
}

/**
 * Exporta un módulo específico a JSON
 */
export function exportModuloToJSON(data: any, filename: string): void {
  try {
    const jsonString = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    saveAs(blob, filename)
  } catch (error) {
    console.error('Error exporting module:', error)
    throw new Error('Error al exportar el módulo')
  }
}

/**
 * Descarga cualquier datos como archivo JSON
 */
export function downloadJSON(data: any, filename: string): void {
  try {
    const jsonString = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    saveAs(blob, filename)
  } catch (error) {
    console.error('Error downloading JSON:', error)
    throw new Error('Error al descargar el archivo')
  }
}

/**
 * Importa un cuaderno desde un archivo JSON
 */
export async function importCuadernoFromJSON(file: File): Promise<CuadernoDocente> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const jsonString = e.target?.result as string
        const data = JSON.parse(jsonString)
        const cuaderno = restoreCuadernoFromImport(data)
        resolve(cuaderno)
      } catch (error) {
        console.error('Error parsing JSON:', error)
        reject(new Error('Error al leer el archivo JSON'))
      }
    }

    reader.onerror = () => {
      reject(new Error('Error al leer el archivo'))
    }

    reader.readAsText(file)
  })
}

/**
 * Valida que un objeto sea un CuadernoDocente válido
 */
export function validateCuaderno(data: any): boolean {
  if (!data || typeof data !== 'object') return false
  if (!data.id || !data.metadata) return false
  if (!data.metadata.centro || !data.metadata.cursoEscolar) return false

  // Validar que tenga las propiedades básicas
  const hasHorarios = Array.isArray(data.horarios)
  const hasPlanificacion = data.planificacion && typeof data.planificacion === 'object'
  const hasReuniones = Array.isArray(data.reuniones)
  const hasNotas = Array.isArray(data.notas)
  const hasConfiguracion = data.configuracion && typeof data.configuracion === 'object'

  return hasHorarios && hasPlanificacion && hasReuniones && hasNotas && hasConfiguracion
}
