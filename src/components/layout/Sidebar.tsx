import { useCuadernoStore } from '../../stores/useCuadernoStore'
import { cn } from '../../utils/cn'
import { Calendar, CalendarDays, Users, FileText, BookOpen } from 'lucide-react'

interface SidebarProps {
  className?: string
}

const navItems = [
  { id: 'horario' as const, label: 'Horarios', icon: Calendar },
  { id: 'calendario' as const, label: 'Calendario', icon: CalendarDays },
  { id: 'reuniones' as const, label: 'Reuniones', icon: Users },
  { id: 'notas' as const, label: 'Notas', icon: FileText },
]

export function Sidebar({ className }: SidebarProps) {
  const { view, setView, cuadernoActual } = useCuadernoStore()

  if (!cuadernoActual) return null

  return (
    <aside
      className={cn(
        'hidden md:flex md:flex-col md:w-64 md:fixed md:left-0 md:top-0 md:h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white p-6 shadow-2xl',
        className
      )}
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">Plafinicador</h2>
            <p className="text-xs text-slate-400">
              {cuadernoActual.metadata.cursoEscolar}
            </p>
          </div>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setView(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 relative',
                  view === item.id
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-900/50'
                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">{item.label}</span>
                {view === item.id && (
                  <div className="absolute left-0 w-1 h-8 bg-blue-400 rounded-r-full" />
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="pt-6 border-t border-slate-700/50">
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-300">
            {cuadernoActual.metadata.centro}
          </p>
          <p className="text-xs text-slate-500">
            {cuadernoActual.metadata.docente}
          </p>
        </div>
      </div>
    </aside>
  )
}
