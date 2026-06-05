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
import { Download, FileText, Calendar, Users, BookOpen, FileJson, Loader2 } from 'lucide-react'
import {
  exportHorarioToPDF,
  exportReunionToPDF,
  exportNotasToPDF,
  exportSemanaToPDF,
  exportCuadernoCompletoToPDF,
} from '../../utils/pdf.tsx'
import { exportCuadernoToJSON } from '../../utils/export'

type ExportType = 'horarios' | 'planificacion' | 'reuniones' | 'notas' | 'completo' | 'json'

export function ExportMenu() {
  const { cuadernoActual } = useCuadernoStore()
  const [exporting, setExporting] = useState<ExportType | null>(null)

  const handleExport = async (type: ExportType) => {
    if (!cuadernoActual) return

    setExporting(type)
    try {
      switch (type) {
        case 'horarios':
          // Exportar el primer horario (o todos)
          if (cuadernoActual.horarios.length > 0) {
            await exportHorarioToPDF(cuadernoActual.horarios[0], cuadernoActual.metadata)
          }
          break

        case 'planificacion':
          // Exportar la primera semana (o todas)
          if (cuadernoActual.planificacion.semanal.length > 0) {
            await exportSemanaToPDF(cuadernoActual.planificacion.semanal[0], cuadernoActual.metadata)
          }
          break

        case 'reuniones':
          // Exportar la primera reunión (o todas)
          if (cuadernoActual.reuniones.length > 0) {
            await exportReunionToPDF(cuadernoActual.reuniones[0], cuadernoActual.metadata)
          }
          break

        case 'notas':
          // Exportar todas las notas
          if (cuadernoActual.notas.length > 0) {
            await exportNotasToPDF(cuadernoActual.notas, cuadernoActual.metadata)
          }
          break

        case 'completo':
          // Exportar todo el cuaderno
          await exportCuadernoCompletoToPDF(cuadernoActual)
          break

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
          <span>Horarios</span>
          {!hasHorarios && <span className="ml-auto text-xs text-muted-foreground">(Sin datos)</span>}
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleExport('planificacion')} disabled={!hasPlanificacion || exporting !== null}>
          <BookOpen className="w-4 h-4 mr-2" />
          <span>Planificación</span>
          {!hasPlanificacion && <span className="ml-auto text-xs text-muted-foreground">(Sin datos)</span>}
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleExport('reuniones')} disabled={!hasReuniones || exporting !== null}>
          <Users className="w-4 h-4 mr-2" />
          <span>Reuniones</span>
          {!hasReuniones && <span className="ml-auto text-xs text-muted-foreground">(Sin datos)</span>}
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleExport('notas')} disabled={!hasNotas || exporting !== null}>
          <FileText className="w-4 h-4 mr-2" />
          <span>Notas</span>
          {!hasNotas && <span className="ml-auto text-xs text-muted-foreground">(Sin datos)</span>}
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
