// Funciones para generar PDFs del Planificador Docente

import { pdf } from '@react-pdf/renderer'
import { saveAs } from 'file-saver'
import type { Horario, Semana, Reunion, Nota, CuadernoDocente } from '../types'
import {
  HorarioPDFDocument,
  ReunionPDFDocument,
  NotasPDFDocument,
  SemanaPDFDocument,
  CuadernoCompletoPDF,
} from './pdfTemplates'

/**
 * Genera y descarga un PDF de un horario
 */
export async function exportHorarioToPDF(horario: Horario, metadata: CuadernoDocente['metadata']): Promise<void> {
  try {
    const doc = <HorarioPDFDocument horario={horario} metadata={metadata} />
    const pdfBlob = await pdf(doc).toBlob()
    const filename = `horario-${horario.nombre.replace(/\s+/g, '-')}.pdf`
    saveAs(pdfBlob, filename)
  } catch (error) {
    console.error('Error generating horario PDF:', error)
    throw new Error('Error al generar el PDF del horario')
  }
}

/**
 * Genera y descarga un PDF de una reunión
 */
export async function exportReunionToPDF(reunion: Reunion, metadata: CuadernoDocente['metadata']): Promise<void> {
  try {
    const doc = <ReunionPDFDocument reunion={reunion} metadata={metadata} />
    const pdfBlob = await pdf(doc).toBlob()
    const fecha = new Date(reunion.fecha).toISOString().split('T')[0]
    const filename = `reunion-${reunion.titulo.replace(/\s+/g, '-')}-${fecha}.pdf`
    saveAs(pdfBlob, filename)
  } catch (error) {
    console.error('Error generating reunion PDF:', error)
    throw new Error('Error al generar el PDF de la reunión')
  }
}

/**
 * Genera y descarga un PDF de notas
 */
export async function exportNotasToPDF(notas: Nota[], metadata: CuadernoDocente['metadata']): Promise<void> {
  try {
    const doc = <NotasPDFDocument notas={notas} metadata={metadata} />
    const pdfBlob = await pdf(doc).toBlob()
    const filename = `notas-${new Date().toISOString().split('T')[0]}.pdf`
    saveAs(pdfBlob, filename)
  } catch (error) {
    console.error('Error generating notas PDF:', error)
    throw new Error('Error al generar el PDF de notas')
  }
}

/**
 * Genera y descarga un PDF de una semana
 */
export async function exportSemanaToPDF(semana: Semana, metadata: CuadernoDocente['metadata']): Promise<void> {
  try {
    const doc = <SemanaPDFDocument semana={semana} metadata={metadata} />
    const pdfBlob = await pdf(doc).toBlob()
    const filename = `semana-${semana.numeroSemana}.pdf`
    saveAs(pdfBlob, filename)
  } catch (error) {
    console.error('Error generating semana PDF:', error)
    throw new Error('Error al generar el PDF de la semana')
  }
}

/**
 * Genera y descarga un PDF completo del cuaderno
 */
export async function exportCuadernoCompletoToPDF(cuaderno: CuadernoDocente): Promise<void> {
  try {
    const doc = <CuadernoCompletoPDF cuaderno={cuaderno} />
    const pdfBlob = await pdf(doc).toBlob()
    const filename = `plafinicador-completo-${cuaderno.metadata.centro.replace(/\s+/g, '-')}-${cuaderno.metadata.cursoEscolar}.pdf`
    saveAs(pdfBlob, filename)
  } catch (error) {
    console.error('Error generating cuaderno completo PDF:', error)
    throw new Error('Error al generar el PDF completo')
  }
}

/**
 * Genera un PDF de todas las reuniones
 */
export async function exportReunionesToPDF(reuniones: Reunion[], metadata: CuadernoDocente['metadata']): Promise<void> {
  try {
    // Generar un PDF con todas las reuniones una detrás de otra
    // Por ahora, exportamos una por una en archivos separados
    for (const reunion of reuniones) {
      await exportReunionToPDF(reunion, metadata)
    }
  } catch (error) {
    console.error('Error generating reuniones PDF:', error)
    throw new Error('Error al generar los PDFs de reuniones')
  }
}

/**
 * Genera un PDF de todas las semanas de planificación
 */
export async function exportSemanasToPDF(semanas: Semana[], metadata: CuadernoDocente['metadata']): Promise<void> {
  try {
    for (const semana of semanas) {
      await exportSemanaToPDF(semana, metadata)
    }
  } catch (error) {
    console.error('Error generating semanas PDF:', error)
    throw new Error('Error al generar los PDFs de semanas')
  }
}
