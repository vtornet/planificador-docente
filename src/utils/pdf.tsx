// Funciones para generar PDFs del Planificador Docente

import { pdf } from '@react-pdf/renderer'
import { saveAs } from 'file-saver'
import type { Horario, Semana, Reunion, Nota, CuadernoDocente } from '../types'
import {
  HorarioPDFDocument,
  HorariosPDFDocument,
  ReunionPDFDocument,
  ReunionesPDFDocument,
  NotaPDFDocument,
  NotasPDFDocument,
  SemanaPDFDocument,
  CuadernoCompletoPDF,
  AgendaPDFDocument,
} from './pdfTemplates'

export interface PDFGenerado {
  blob: Blob
  filename: string
}

/**
 * Genera un PDF (sin descargarlo) de un horario — ver generarHorariosPDF.
 */
export async function generarHorarioPDF(horario: Horario, metadata: CuadernoDocente['metadata']): Promise<PDFGenerado> {
  try {
    const doc = <HorarioPDFDocument horario={horario} metadata={metadata} />
    const blob = await pdf(doc).toBlob()
    return { blob, filename: `horario-${horario.nombre.replace(/\s+/g, '-')}.pdf` }
  } catch (error) {
    console.error('Error generating horario PDF:', error)
    throw new Error('Error al generar el PDF del horario')
  }
}

/**
 * Genera y descarga un PDF de un horario
 */
export async function exportHorarioToPDF(horario: Horario, metadata: CuadernoDocente['metadata']): Promise<void> {
  const { blob, filename } = await generarHorarioPDF(horario, metadata)
  saveAs(blob, filename)
}

/**
 * Genera un PDF (sin descargarlo) con varios horarios, uno por página —
 * usado por la vista previa de ExportMenu.tsx antes de confirmar la descarga.
 */
export async function generarHorariosPDF(horarios: Horario[], metadata: CuadernoDocente['metadata']): Promise<PDFGenerado> {
  try {
    const doc = <HorariosPDFDocument horarios={horarios} metadata={metadata} />
    const blob = await pdf(doc).toBlob()
    return { blob, filename: `horarios-${metadata.centro.replace(/\s+/g, '-')}.pdf` }
  } catch (error) {
    console.error('Error generating horarios PDF:', error)
    throw new Error('Error al generar el PDF de horarios')
  }
}

/**
 * Genera y descarga un único PDF con varios horarios, uno por página
 */
export async function exportHorariosToPDF(horarios: Horario[], metadata: CuadernoDocente['metadata']): Promise<void> {
  const { blob, filename } = await generarHorariosPDF(horarios, metadata)
  saveAs(blob, filename)
}

/**
 * Genera un PDF (sin descargarlo) de una reunión — ver generarHorariosPDF.
 */
export async function generarReunionPDF(reunion: Reunion, metadata: CuadernoDocente['metadata']): Promise<PDFGenerado> {
  try {
    const doc = <ReunionPDFDocument reunion={reunion} metadata={metadata} />
    const blob = await pdf(doc).toBlob()
    const fecha = new Date(reunion.fecha).toISOString().split('T')[0]
    return { blob, filename: `reunion-${reunion.titulo.replace(/\s+/g, '-')}-${fecha}.pdf` }
  } catch (error) {
    console.error('Error generating reunion PDF:', error)
    throw new Error('Error al generar el PDF de la reunión')
  }
}

/**
 * Genera y descarga un PDF de una reunión
 */
export async function exportReunionToPDF(reunion: Reunion, metadata: CuadernoDocente['metadata']): Promise<void> {
  const { blob, filename } = await generarReunionPDF(reunion, metadata)
  saveAs(blob, filename)
}

/**
 * Genera un PDF (sin descargarlo) de una única nota — ver generarHorariosPDF.
 */
export async function generarNotaPDF(nota: Nota, metadata: CuadernoDocente['metadata']): Promise<PDFGenerado> {
  try {
    const doc = <NotaPDFDocument nota={nota} metadata={metadata} />
    const blob = await pdf(doc).toBlob()
    return { blob, filename: `nota-${nota.titulo.replace(/\s+/g, '-')}.pdf` }
  } catch (error) {
    console.error('Error generating nota PDF:', error)
    throw new Error('Error al generar el PDF de la nota')
  }
}

/**
 * Genera y descarga un PDF de una única nota
 */
export async function exportNotaToPDF(nota: Nota, metadata: CuadernoDocente['metadata']): Promise<void> {
  const { blob, filename } = await generarNotaPDF(nota, metadata)
  saveAs(blob, filename)
}

/**
 * Genera un PDF (sin descargarlo) con todas las notas — ver generarHorariosPDF.
 */
export async function generarNotasPDF(notas: Nota[], metadata: CuadernoDocente['metadata']): Promise<PDFGenerado> {
  try {
    const doc = <NotasPDFDocument notas={notas} metadata={metadata} />
    const blob = await pdf(doc).toBlob()
    return { blob, filename: `notas-${new Date().toISOString().split('T')[0]}.pdf` }
  } catch (error) {
    console.error('Error generating notas PDF:', error)
    throw new Error('Error al generar el PDF de notas')
  }
}

/**
 * Genera y descarga un PDF de notas
 */
export async function exportNotasToPDF(notas: Nota[], metadata: CuadernoDocente['metadata']): Promise<void> {
  const { blob, filename } = await generarNotasPDF(notas, metadata)
  saveAs(blob, filename)
}

/**
 * Genera un PDF (sin descargarlo) de una semana — ver generarHorariosPDF.
 */
export async function generarSemanaPDF(
  semana: Semana,
  metadata: CuadernoDocente['metadata'],
  horarios: Horario[] = []
): Promise<PDFGenerado> {
  try {
    const doc = <SemanaPDFDocument semana={semana} metadata={metadata} horarios={horarios} />
    const blob = await pdf(doc).toBlob()
    return { blob, filename: `semana-${semana.numeroSemana}.pdf` }
  } catch (error) {
    console.error('Error generating semana PDF:', error)
    throw new Error('Error al generar el PDF de la semana')
  }
}

/**
 * Genera y descarga un PDF de una semana
 */
export async function exportSemanaToPDF(
  semana: Semana,
  metadata: CuadernoDocente['metadata'],
  horarios: Horario[] = []
): Promise<void> {
  const { blob, filename } = await generarSemanaPDF(semana, metadata, horarios)
  saveAs(blob, filename)
}

/**
 * Genera un PDF (sin descargarlo) completo del cuaderno — ver generarHorariosPDF.
 */
export async function generarCuadernoCompletoPDF(cuaderno: CuadernoDocente): Promise<PDFGenerado> {
  try {
    const doc = <CuadernoCompletoPDF cuaderno={cuaderno} />
    const blob = await pdf(doc).toBlob()
    const filename = `docenza-completo-${cuaderno.metadata.centro.replace(/\s+/g, '-')}-${cuaderno.metadata.cursoEscolar}.pdf`
    return { blob, filename }
  } catch (error) {
    console.error('Error generating cuaderno completo PDF:', error)
    throw new Error('Error al generar el PDF completo')
  }
}

/**
 * Genera y descarga un PDF completo del cuaderno
 */
export async function exportCuadernoCompletoToPDF(cuaderno: CuadernoDocente): Promise<void> {
  const { blob, filename } = await generarCuadernoCompletoPDF(cuaderno)
  saveAs(blob, filename)
}

/**
 * Genera un PDF (sin descargarlo) con la agenda de eventos del curso escolar
 * (expandiendo recurrencias) — ver generarHorariosPDF.
 */
export async function generarEventosPDF(cuaderno: CuadernoDocente): Promise<PDFGenerado> {
  try {
    const doc = <AgendaPDFDocument cuaderno={cuaderno} />
    const blob = await pdf(doc).toBlob()
    const filename = `agenda-${cuaderno.metadata.centro.replace(/\s+/g, '-')}-${cuaderno.metadata.cursoEscolar}.pdf`
    return { blob, filename }
  } catch (error) {
    console.error('Error generating agenda PDF:', error)
    throw new Error('Error al generar el PDF de la agenda')
  }
}

/**
 * Genera y descarga un PDF con la agenda de eventos del curso escolar,
 * expandiendo las ocurrencias de los eventos recurrentes dentro de ese rango.
 */
export async function exportEventosToPDF(cuaderno: CuadernoDocente): Promise<void> {
  const { blob, filename } = await generarEventosPDF(cuaderno)
  saveAs(blob, filename)
}

/**
 * Genera un PDF (sin descargarlo) con varias reuniones, una por página —
 * ver generarHorariosPDF.
 */
export async function generarReunionesPDF(reuniones: Reunion[], metadata: CuadernoDocente['metadata']): Promise<PDFGenerado> {
  try {
    const doc = <ReunionesPDFDocument reuniones={reuniones} metadata={metadata} />
    const blob = await pdf(doc).toBlob()
    return { blob, filename: `reuniones-${metadata.centro.replace(/\s+/g, '-')}.pdf` }
  } catch (error) {
    console.error('Error generating reuniones PDF:', error)
    throw new Error('Error al generar el PDF de reuniones')
  }
}

/**
 * Genera y descarga un único PDF con varias reuniones, una por página
 */
export async function exportReunionesToPDF(reuniones: Reunion[], metadata: CuadernoDocente['metadata']): Promise<void> {
  const { blob, filename } = await generarReunionesPDF(reuniones, metadata)
  saveAs(blob, filename)
}

/**
 * Genera un PDF de todas las semanas de planificación
 */
export async function exportSemanasToPDF(
  semanas: Semana[],
  metadata: CuadernoDocente['metadata'],
  horarios: Horario[] = []
): Promise<void> {
  try {
    for (const semana of semanas) {
      await exportSemanaToPDF(semana, metadata, horarios)
    }
  } catch (error) {
    console.error('Error generating semanas PDF:', error)
    throw new Error('Error al generar los PDFs de semanas')
  }
}
