import { useState, lazy, Suspense } from 'react'
import { useCuadernoStore } from '../../stores/useCuadernoStore'
import { useAuthStore } from '../../stores/useAuthStore'
import { cn } from '../../utils/cn'
import { Calendar, CalendarDays, Users, FileText, Moon, Sun, UserCircle, Upload, HelpCircle, Download, CreditCard, ShieldCheck } from 'lucide-react'
import { ImportDialog } from '../export/ImportDialog'
import { Button } from '../ui/button'
import { useTheme } from '../../hooks/useTheme'
import { PerfilDialog } from '../perfil/PerfilDialog'
import { AyudaDialog } from '../ayuda/AyudaDialog'
import { MiSuscripcionDialog } from '../suscripcion/MiSuscripcionDialog'

// Perezoso: el panel de administración solo lo abre una cuenta con is_admin
// (en la práctica, el propietario) — no tiene sentido enviarlo en el bundle
// de todas las docentes. AdminPanel devuelve null si open=false, así que el
// import() solo se dispara al abrirlo.
const AdminPanel = lazy(() => import('../admin/AdminPanel').then((m) => ({ default: m.AdminPanel })))

// Perezoso: es el único sitio de la app que usa el menú desplegable de Radix
// (react-dropdown-menu + floating-ui, ~100 KB sin minificar) — igual que las
// 4 secciones principales (ver App.tsx), se descarga solo cuando hace falta
// en vez de ir en el bundle inicial.
const ExportMenu = lazy(() => import('../export/ExportMenu').then((m) => ({ default: m.ExportMenu })))

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
  const isAdmin = useAuthStore((s) => s.isAdmin)
  const { theme, toggleTheme } = useTheme()
  const [showPerfil, setShowPerfil] = useState(false)
  const [showImportar, setShowImportar] = useState(false)
  const [showAyuda, setShowAyuda] = useState(false)
  const [showSuscripcion, setShowSuscripcion] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)

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
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center text-primary shadow-sm flex-shrink-0">
            <config.icon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight truncate">
              {config.title}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5 truncate">
              {cuadernoActual.metadata.centro} · {cuadernoActual.metadata.cursoEscolar}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {isAdmin && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowAdmin(true)}
              aria-label="Panel de administración"
              title="Panel de administración"
            >
              <ShieldCheck className="w-4 h-4 text-primary" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowAyuda(true)}
            aria-label="Ayuda"
            title="Ayuda"
          >
            <HelpCircle className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSuscripcion(true)}
            aria-label="Mi Suscripción"
            title="Mi Suscripción"
          >
            <CreditCard className="w-4 h-4" />
          </Button>
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowImportar(true)}
            title="Importar copia de seguridad"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Importar</span>
          </Button>
          <Suspense
            fallback={
              <Button variant="outline" size="sm" disabled>
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Exportar</span>
              </Button>
            }
          >
            <ExportMenu />
          </Suspense>
        </div>
      </div>
      <PerfilDialog open={showPerfil} onOpenChange={setShowPerfil} />
      <ImportDialog open={showImportar} onOpenChange={setShowImportar} />
      <AyudaDialog open={showAyuda} onOpenChange={setShowAyuda} />
      <MiSuscripcionDialog open={showSuscripcion} onOpenChange={setShowSuscripcion} />
      {isAdmin && (
        <Suspense fallback={null}>
          <AdminPanel open={showAdmin} onOpenChange={setShowAdmin} />
        </Suspense>
      )}
    </header>
  )
}
