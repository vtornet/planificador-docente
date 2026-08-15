import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import {
  Calendar,
  CalendarDays,
  Users,
  FileText,
  Sparkles,
  UserCircle,
  Download,
  WifiOff,
} from 'lucide-react'

interface AyudaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface Seccion {
  icono: typeof Calendar
  titulo: string
  contenido: React.ReactNode
}

const SECCIONES: Seccion[] = [
  {
    icono: Calendar,
    titulo: 'Horarios',
    contenido: (
      <>
        <p>
          Crea un horario con "+ Nuevo horario" y elige si es de docente o de alumnado. Al hacer
          click en una celda puedes asignarle una asignatura (con su color) y añadir una nota.
        </p>
        <p>
          Los horarios se organizan por mes y semana — si un horario dura varias semanas (ej. un
          trimestre) y editas una celda, la app te preguntará si el cambio se aplica a todo el
          periodo o solo a la semana que estás viendo.
        </p>
        <p>Recuerda pulsar "Guardar cambios" tras editar una celda — los cambios no se guardan solos.</p>
      </>
    ),
  },
  {
    icono: CalendarDays,
    titulo: 'Calendario y Planificación',
    contenido: (
      <>
        <p>
          Haz click en un día vacío del calendario para crear la planificación semanal de esa
          semana (periodos lectivos, contenido de cada uno). Haz click en una semana ya creada para
          verla o editarla.
        </p>
        <p>
          <strong>"Nuevo evento"</strong> es para citas o recordatorios puntuales (con hora, color y
          aviso), no para la planificación de clases — puede repetirse (diario, semanal o mensual).
        </p>
        <p>
          <strong>"Festivos y vacaciones"</strong> te deja añadir días no lectivos a mano, pero los
          festivos nacionales y el de tu comunidad autónoma se cargan solos si la indicaste al crear
          el cuaderno o en tu Perfil.
        </p>
      </>
    ),
  },
  {
    icono: Users,
    titulo: 'Reuniones',
    contenido: (
      <>
        <p>
          Registra reuniones con título, tipo, asistentes, asuntos tratados y acuerdos. Puedes
          añadir firmas digitales de quienes asistieron directamente desde el dispositivo.
        </p>
      </>
    ),
  },
  {
    icono: FileText,
    titulo: 'Notas',
    contenido: (
      <>
        <p>
          Editor de texto con formato (negrita, listas, tablas, imágenes...), categorías y
          etiquetas para organizarlas y encontrarlas después con el buscador.
        </p>
      </>
    ),
  },
  {
    icono: Sparkles,
    titulo: 'Asistente de IA',
    contenido: (
      <>
        <p>
          El botón flotante con el icono de estrellas abre un asistente que ayuda a mejorar la
          redacción de tus notas y a proponer ideas de actividades para la planificación semanal.
          Solo disponible con la suscripción activa, y necesita conexión a internet.
        </p>
      </>
    ),
  },
  {
    icono: UserCircle,
    titulo: 'Cuenta y suscripción',
    contenido: (
      <>
        <p>
          Hace falta una cuenta para usar la app — así tus datos se sincronizan entre todos tus
          dispositivos. Sin suscripción puedes probar cada módulo (1 horario, 1 reunión, 1 nota, 1
          semana de planificación y 1 evento); para seguir creando más hace falta suscribirse.
        </p>
        <p>
          Desde el icono de perfil puedes cambiar tus datos (centro, curso escolar, comunidad
          autónoma...) y cerrar sesión.
        </p>
      </>
    ),
  },
  {
    icono: Download,
    titulo: 'Exportar e importar',
    contenido: (
      <>
        <p>
          El botón "Exportar" genera PDFs (de un módulo o del cuaderno completo) y también un
          backup en JSON con todos tus datos. "Importar" restaura un backup — ten en cuenta que
          reemplaza todos los datos actuales del cuaderno, no los combina.
        </p>
      </>
    ),
  },
  {
    icono: WifiOff,
    titulo: 'Funciona sin conexión',
    contenido: (
      <>
        <p>
          Puedes seguir creando y editando horarios, reuniones, notas y planificación sin
          internet — se guarda en tu dispositivo y se sincroniza en cuanto recuperas conexión. El
          asistente de IA y el pago de la suscripción sí necesitan estar conectados.
        </p>
      </>
    ),
  },
]

export function AyudaDialog({ open, onOpenChange }: AyudaDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Guía de uso</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {SECCIONES.map(({ icono: Icono, titulo, contenido }) => (
            <div key={titulo}>
              <h3 className="flex items-center gap-2 font-semibold text-foreground mb-2">
                <Icono className="w-4 h-4 text-primary flex-shrink-0" />
                {titulo}
              </h3>
              <div className="text-sm text-muted-foreground space-y-2 pl-6">{contenido}</div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
