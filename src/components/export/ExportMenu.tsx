// Menú de exportación para el Planificador Docente

import { useState } from 'react'
import { useCuadernoStore } from '../../stores/useCuadernoStore'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Button } from '../ui/button'
import { avisarDialogo } from '../ui/dialogos'
import { Download, FileText, Calendar, CalendarClock, Users, BookOpen, FileJson, Loader2 } from 'lucide-react'
import { exportCuadernoToJSON } from '../../utils/export'
import { PdfPreviewDialog } from './PdfPreviewDialog'
import type { PDFGenerado } from '../../utils/pdf.tsx'

type ExportType = 'horarios' | 'planificacion' | 'reuniones' | 'notas' | 'agenda' | 'completo' | 'json'

export function ExportMenu() {
  const { cuadernoActual } = useCuadernoStore()
  const [exporting, setExporting] = useState<ExportType | null>(null)
  // Cada opción de PDF genera el archivo primero y lo enseña aquí — la
  // descarga real solo ocurre si se confirma desde el propio diálogo
  // (ver PdfPreviewDialog.tsx), para poder pillar un error (ej. el módulo
  // equivocado del desplegable) antes de guardarlo. El backup JSON no pasa
  // por aquí, no tiene sentido previsualizarlo como PDF.
  const [previewPdf, setPreviewPdf] = useState<PDFGenerado | null>(null)

  const handleExport = async (type: ExportType) => {
    if (!cuadernoActual) return

    setExporting(type)
    try {
      switch (type) {
        case 'horarios': {
          // Todos los horarios combinados en un PDF (uno por página).
          // Para exportar uno en concreto, usa el botón de descarga de su tarjeta.
          if (cuadernoActual.horarios.length > 0) {
            const { generarHorariosPDF } = await import('../../utils/pdf.tsx')
            setPreviewPdf(await generarHorariosPDF(cuadernoActual.horarios, cuadernoActual.metadata))
          }
          break
        }

        case 'planificacion': {
          // La primera semana (o todas)
          if (cuadernoActual.planificacion.semanal.length > 0) {
            const { generarSemanaPDF } = await import('../../utils/pdf.tsx')
            setPreviewPdf(
              await generarSemanaPDF(cuadernoActual.planificacion.semanal[0], cuadernoActual.metadata, cuadernoActual.horarios)
            )
          }
          break
        }

        case 'reuniones': {
          // Todas las reuniones combinadas en un PDF (una por página).
          // Para exportar una en concreto, usa el botón de descarga de su tarjeta.
          if (cuadernoActual.reuniones.length > 0) {
            const { generarReunionesPDF } = await import('../../utils/pdf.tsx')
            setPreviewPdf(await generarReunionesPDF(cuadernoActual.reuniones, cuadernoActual.metadata))
          }
          break
        }

        case 'notas': {
          // Todas las notas
          if (cuadernoActual.notas.length > 0) {
            const { generarNotasPDF } = await import('../../utils/pdf.tsx')
            setPreviewPdf(await generarNotasPDF(cuadernoActual.notas, cuadernoActual.metadata))
          }
          break
        }

        case 'agenda': {
          // Los eventos de la agenda (expandiendo recurrencias)
          if ((cuadernoActual.eventos || []).length > 0) {
            const { generarEventosPDF } = await import('../../utils/pdf.tsx')
            setPreviewPdf(await generarEventosPDF(cuadernoActual))
          }
          break
        }

        case 'completo': {
          // Todo el cuaderno
          const { generarCuadernoCompletoPDF } = await import('../../utils/pdf.tsx')
          setPreviewPdf(await generarCuadernoCompletoPDF(cuadernoActual))
          break
        }

        case 'json':
          // El backup JSON se descarga directo, sin vista previa.
          exportCuadernoToJSON(cuadernoActual)
          break
      }
    } catch (error) {
      console.error('Error exporting:', error)
      avisarDialogo('Error al exportar. Por favor, inténtalo de nuevo.')
    } finally {
      setExporting(null)
    }
  }

  if (!cuadernoActual) return null

  const hasHorarios = cuadernoActual.horarios.length > 0
  const hasPlanificacion = cuadernoActual.planificacion.semanal.length > 0
  const hasReuniones = cuadernoActual.reuniones.length > 0
  const hasNotas = cuadernoActual.notas.length > 0
  const hasEventos = (cuadernoActual.eventos || []).length > 0

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={exporting !== null} aria-label="Exportar">
          {exporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">Exportar</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => handleExport('completo')} disabled={exporting !== null}>
          <FileText className="w-4 h-4 mr-2" />
          <span>PDF completo</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => handleExport('horarios')} disabled={!hasHorarios || exporting !== null}>
          <Calendar className="w-4 h-4 mr-2" />
          <span>Horarios (todos)</span>
          {!hasHorarios && <span className="ml-auto text-xs text-muted-foreground">(Sin datos)</span>}
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleExport('planificacion')} disabled={!hasPlanificacion || exporting !== null}>
          <BookOpen className="w-4 h-4 mr-2" />
          <span>Planificación</span>
          {!hasPlanificacion && <span className="ml-auto text-xs text-muted-foreground">(Sin datos)</span>}
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleExport('reuniones')} disabled={!hasReuniones || exporting !== null}>
          <Users className="w-4 h-4 mr-2" />
          <span>Reuniones (todas)</span>
          {!hasReuniones && <span className="ml-auto text-xs text-muted-foreground">(Sin datos)</span>}
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleExport('notas')} disabled={!hasNotas || exporting !== null}>
          <FileText className="w-4 h-4 mr-2" />
          <span>Notas</span>
          {!hasNotas && <span className="ml-auto text-xs text-muted-foreground">(Sin datos)</span>}
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleExport('agenda')} disabled={!hasEventos || exporting !== null}>
          <CalendarClock className="w-4 h-4 mr-2" />
          <span>Agenda (eventos)</span>
          {!hasEventos && <span className="ml-auto text-xs text-muted-foreground">(Sin datos)</span>}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => handleExport('json')} disabled={exporting !== null}>
          <FileJson className="w-4 h-4 mr-2" />
          <span>Backup (JSON)</span>
        </DropdownMenuItem>
      </DropdownMenuContent>

      <PdfPreviewDialog pdf={previewPdf} onOpenChange={(open) => !open && setPreviewPdf(null)} />
    </DropdownMenu>
  )
}
