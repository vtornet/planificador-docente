import { useCuadernoStore } from '../../stores/useCuadernoStore'
import { cn } from '../../utils/cn'

interface AppHeaderProps {
  className?: string
}

export function AppHeader({ className }: AppHeaderProps) {
  const { cuadernoActual, view } = useCuadernoStore()

  if (!cuadernoActual) return null

  const viewTitle = {
    horario: 'Horarios',
    calendario: 'Planificación',
    reuniones: 'Reuniones',
    notas: 'Notas',
  }[view]

  return (
    <header
      className={cn(
        'bg-white border-b border-slate-200 px-4 py-3 md:px-6 md:py-4',
        'md:ml-64', // offset for sidebar on desktop
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">
            {viewTitle}
          </h1>
          <p className="text-sm text-slate-600">
            {cuadernoActual.metadata.centro} · {cuadernoActual.metadata.cursoEscolar}
          </p>
        </div>
      </div>
    </header>
  )
}
