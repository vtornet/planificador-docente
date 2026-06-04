import { useCuadernoStore } from '../../stores/useCuadernoStore'
import { cn } from '../../utils/cn'

interface BottomNavProps {
  className?: string
}

const navItems = [
  { id: 'horario' as const, label: 'Horario', icon: '📅' },
  { id: 'calendario' as const, label: 'Planificar', icon: '📆' },
  { id: 'reuniones' as const, label: 'Reuniones', icon: '👥' },
  { id: 'notas' as const, label: 'Notas', icon: '📝' },
]

export function BottomNav({ className }: BottomNavProps) {
  const { view, setView, cuadernoActual } = useCuadernoStore()

  if (!cuadernoActual) return null

  return (
    <nav
      className={cn(
        'md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 safe-area-bottom',
        className
      )}
    >
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={cn(
              'flex flex-col items-center justify-center gap-1 px-4 py-2 transition-colors',
              view === item.id
                ? 'text-blue-600'
                : 'text-slate-500 hover:text-slate-700'
            )}
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
