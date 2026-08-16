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
import { Download, FileText, Calendar, CalendarClock, Users, BookOpen, FileJson, Loader2 } from 'lucide-react'
import { exportCuadernoToJSON } from '../../utils/export'

type ExportType = 'horarios' | 'planificacion' | 'reuniones' | 'notas' | 'agenda' | 'completo' | 'json'

export function ExportMenu() {
  const { cuadernoActual } = useCuadernoStore()
  const [exporting, setExporting] = useState<ExportType | null>(null)

  const handleExport = async (type: ExportType) => {
    if (!cuadernoActual) return

    setExporting(type)
    try {
      switch (type) {
        case 'horarios': {
          // Exportar todos los horarios combinados en un PDF (uno por página).
          // Para exportar uno en concreto, usa el botón de descarga de su tarjeta.
          if (cuadernoActual.horarios.length > 0) {
            const { exportHorariosToPDF } = await import('../../utils/pdf.tsx')
            await exportHorariosToPDF(cuadernoActual.horarios, cuadernoActual.metadata)
          }
          break
        }

        case 'planificacion': {
          // Exportar la primera semana (o todas)
          if (cuadernoActual.planificacion.semanal.length > 0) {
            const { exportSemanaToPDF } = await import('../../utils/pdf.tsx')
            await exportSemanaToPDF(cuadernoActual.planificacion.semanal[0], cuadernoActual.metadata)
          }
          break
        }

        case 'reuniones': {
          // Exportar todas las reuniones combinadas en un PDF (una por página).
          // Para exportar una en concreto, usa el botón de descarga de su tarjeta.
          if (cuadernoActual.reuniones.length > 0) {
            const { exportReunionesToPDF } = await import('../../utils/pdf.tsx')
            await exportReunionesToPDF(cuadernoActual.reuniones, cuadernoActual.metadata)
          }
          break
        }

        case 'notas': {
          // Exportar todas las notas
          if (cuadernoActual.notas.length > 0) {
            const { exportNotasToPDF } = await import('../../utils/pdf.tsx')
            await exportNotasToPDF(cuadernoActual.notas, cuadernoActual.metadata)
          }
          break
        }

        case 'agenda': {
          // Exportar los eventos de la agenda (expandiendo recurrencias)
          if ((cuadernoActual.eventos || []).length > 0) {
            const { exportEventosToPDF } = await import('../../utils/pdf.tsx')
            await exportEventosToPDF(cuadernoActual)
          }
          break
        }

        case 'completo': {
          // Exportar todo el cuaderno
          const { exportCuadernoCompletoToPDF } = await import('../../utils/pdf.tsx')
          await exportCuadernoCompletoToPDF(cuadernoActual)
          break
        }

        case 'json':
          // Exportar a JSON
          exportCuadernoToJSON(cuadernoActual)
          break
      }
    } catch (error) {
      console.error('Error exporting:', error)
      alert('Error al exportar. Por favor, inténtalo de nuevo.')
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
        <Button variant="outline" size="sm" disabled={exporting !== null}>
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
    </DropdownMenu>
  )
}
