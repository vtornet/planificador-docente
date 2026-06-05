import { useCuadernoStore } from '../../stores/useCuadernoStore'
import { cn } from '../../utils/cn'
import { Calendar, CalendarDays, Users, FileText } from 'lucide-react'
import { ExportMenu } from '../export/ExportMenu'

interface AppHeaderProps {
  className?: string
}

const viewConfig = {
  horario: { title: 'Horarios', icon: Calendar },
  calendario: { title: 'Planificación', icon: CalendarDays },
  reuniones: { title: 'Reuniones', icon: Users },
  notas: { title: 'Notas', icon: FileText },
} as const

export function AppHeader({ className }: AppHeaderProps) {
  const { cuadernoActual, view } = useCuadernoStore()

  if (!cuadernoActual) return null

  const config = viewConfig[view]

  return (
    <header
      className={cn(
        'bg-white border-b border-slate-200/50 shadow-sm px-4 py-4 md:px-6 md:py-5 transition-shadow duration-200',
        'md:ml-64', // offset for sidebar on desktop
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
            <config.icon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              {config.title}
            </h1>
            <p className="text-sm text-slate-600 mt-0.5">
              {cuadernoActual.metadata.centro} · {cuadernoActual.metadata.cursoEscolar}
            </p>
          </div>
        </div>
        <ExportMenu />
      </div>
    </header>
  )
}
