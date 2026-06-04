import { useCuadernoStore } from '../../stores/useCuadernoStore'
import { cn } from '../../utils/cn'

interface SidebarProps {
  className?: string
}

const navItems = [
  { id: 'horario' as const, label: 'Horarios', icon: '📅' },
  { id: 'calendario' as const, label: 'Calendario', icon: '📆' },
  { id: 'reuniones' as const, label: 'Reuniones', icon: '👥' },
  { id: 'notas' as const, label: 'Notas', icon: '📝' },
]

export function Sidebar({ className }: SidebarProps) {
  const { view, setView, cuadernoActual } = useCuadernoStore()

  if (!cuadernoActual) return null

  return (
    <aside
      className={cn(
        'hidden md:flex md:flex-col md:w-64 md:fixed md:left-0 md:top-0 md:h-screen bg-slate-900 text-white p-4',
        className
      )}
    >
      <div className="mb-6">
        <h2 className="text-lg font-bold">Plafinicador</h2>
        <p className="text-sm text-slate-400">
          {cuadernoActual.metadata.cursoEscolar}
        </p>
      </div>

      <nav className="flex-1">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setView(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                  view === item.id
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                )}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="text-xs text-slate-500 mt-4">
        <p>{cuadernoActual.metadata.centro}</p>
        <p>{cuadernoActual.metadata.docente}</p>
      </div>
    </aside>
  )
}
