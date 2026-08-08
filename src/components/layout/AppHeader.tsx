import { useState } from 'react'
import { useCuadernoStore } from '../../stores/useCuadernoStore'
import { cn } from '../../utils/cn'
import { Calendar, CalendarDays, Users, FileText, Moon, Sun, UserCircle } from 'lucide-react'
import { ExportMenu } from '../export/ExportMenu'
import { Button } from '../ui/button'
import { useTheme } from '../../hooks/useTheme'
import { PerfilDialog } from '../perfil/PerfilDialog'

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
  const { theme, toggleTheme } = useTheme()
  const [showPerfil, setShowPerfil] = useState(false)

  if (!cuadernoActual) return null

  const config = viewConfig[view]

  return (
    <header
      className={cn(
        'bg-background/95 backdrop-blur border-b border-border shadow-sm px-4 py-4 md:px-6 md:py-5 transition-shadow duration-200',
        'md:ml-64', // offset for sidebar on desktop
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center text-primary shadow-sm">
            <config.icon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">
              {config.title}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {cuadernoActual.metadata.centro} · {cuadernoActual.metadata.cursoEscolar}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowPerfil(true)}
            aria-label="Perfil"
            title="Perfil"
          >
            <UserCircle className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          <ExportMenu />
        </div>
      </div>
      <PerfilDialog open={showPerfil} onOpenChange={setShowPerfil} />
    </header>
  )
}
