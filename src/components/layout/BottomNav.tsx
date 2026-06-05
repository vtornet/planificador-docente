import { useCuadernoStore } from '../../stores/useCuadernoStore'
import { cn } from '../../utils/cn'
import { Calendar, CalendarDays, Users, FileText } from 'lucide-react'

interface BottomNavProps {
  className?: string
}

const navItems = [
  { id: 'horario' as const, label: 'Horario', icon: Calendar },
  { id: 'calendario' as const, label: 'Planificar', icon: CalendarDays },
  { id: 'reuniones' as const, label: 'Reuniones', icon: Users },
  { id: 'notas' as const, label: 'Notas', icon: FileText },
]

export function BottomNav({ className }: BottomNavProps) {
  const { view, setView, cuadernoActual } = useCuadernoStore()

  if (!cuadernoActual) return null

  return (
    <nav
      className={cn(
        'md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-slate-200/50 safe-area-bottom shadow-lg shadow-slate-200/50',
        className
      )}
    >
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={cn(
              'flex flex-col items-center justify-center gap-1 px-4 py-2 transition-all duration-200 relative flex-1',
              view === item.id
                ? 'text-blue-600'
                : 'text-slate-500 hover:text-slate-700 active:scale-95'
            )}
          >
            {view === item.id && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-0.5 bg-blue-600 rounded-b-full" />
            )}
            <item.icon className={cn(
              'w-6 h-6 transition-all duration-200',
              view === item.id ? 'scale-110' : 'scale-100'
            )} />
            <span className={cn(
              'text-xs font-medium transition-all duration-200',
              view === item.id ? 'font-semibold' : 'font-normal'
            )}>{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
