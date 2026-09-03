import { useEffect, useState, type ReactNode } from 'react'
import { Download, Share, X } from 'lucide-react'
import { Button } from '../ui/button'
import {
  getDeferredPrompt,
  clearDeferredPrompt,
  subscribeInstall,
  enModoApp,
  esIOS,
  navegadorInstalable,
  type BeforeInstallPromptEvent,
} from '../../utils/pwaInstall'

// Aviso para instalar Docenza como PWA. Insistente a propósito (lo pidió el
// usuario): reaparece en cada sesión hasta que la app esté instalada. "Más
// tarde" solo la oculta hasta el siguiente arranque (sessionStorage, no
// localStorage).
//
// Tres variantes según lo que soporte el navegador:
//  1. Hay evento `beforeinstallprompt` guardado  -> botón "Instalar" (nativo).
//  2. iOS/iPadOS Safari (no soporta el evento)   -> instrucciones Compartir.
//  3. Resto sin evento tras esperar unos segundos -> instrucciones del menú.
//
// No se monta dentro del Layout sino en main.tsx, para que salga también en la
// pantalla de login/registro (antes de iniciar sesión).

const SNOOZE_KEY = 'docenza:install-snooze'

function estaPospuesto(): boolean {
  try {
    return sessionStorage.getItem(SNOOZE_KEY) === '1'
  } catch {
    return false
  }
}

export function InstallPrompt() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(() => getDeferredPrompt())
  const [oculto, setOculto] = useState(() => enModoApp() || estaPospuesto())
  // Damos un margen a que `beforeinstallprompt` llegue (Chrome lo dispara poco
  // después de cargar) antes de enseñar las instrucciones manuales genéricas.
  const [esperandoEvento, setEsperandoEvento] = useState(true)

  useEffect(() => {
    return subscribeInstall(() => {
      const d = getDeferredPrompt()
      setPrompt(d)
      if (d) setEsperandoEvento(false)
      if (enModoApp()) setOculto(true)
    })
  }, [])

  useEffect(() => {
    const t = window.setTimeout(() => setEsperandoEvento(false), 4000)
    return () => window.clearTimeout(t)
  }, [])

  useEffect(() => {
    // En escritorio, tras instalar desde el botón, el navegador pasa a
    // display-mode: standalone sin recargar: ocúltalo al momento.
    const mq = window.matchMedia('(display-mode: standalone)')
    const onChange = () => {
      if (mq.matches) setOculto(true)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  // Fuera de tests automatizados: evita que el banner interfiera con Playwright
  // (donde `beforeinstallprompt` no se dispara y saldría siempre la variante 3).
  if (typeof navigator !== 'undefined' && navigator.webdriver) return null

  if (oculto) return null

  const posponer = () => {
    try {
      sessionStorage.setItem(SNOOZE_KEY, '1')
    } catch {
      /* modo incógnito con storage bloqueado: se ocultará solo en memoria */
    }
    setOculto(true)
  }

  const instalar = async () => {
    if (!prompt) return
    try {
      await prompt.prompt()
      const { outcome } = await prompt.userChoice
      clearDeferredPrompt()
      setPrompt(null)
      if (outcome === 'accepted') {
        setOculto(true)
      } else {
        // Rechazó el diálogo nativo: no insistir hasta la próxima sesión.
        posponer()
      }
    } catch {
      clearDeferredPrompt()
      setPrompt(null)
    }
  }

  let contenido: ReactNode = null

  if (prompt) {
    contenido = (
      <>
        <Download className="w-5 h-5 flex-shrink-0 text-primary" />
        <p className="flex-1 min-w-0">
          <span className="font-medium">Instala Docenza en este dispositivo</span> para abrirla como
          una app y usarla sin conexión.
        </p>
        <Button size="sm" onClick={instalar} className="flex-shrink-0">
          Instalar
        </Button>
      </>
    )
  } else if (esIOS()) {
    contenido = (
      <>
        <Share className="w-5 h-5 flex-shrink-0 text-primary" />
        <p className="flex-1 min-w-0">
          <span className="font-medium">Instala Docenza:</span> pulsa{' '}
          <Share className="inline w-4 h-4 -mt-0.5" aria-label="Compartir" /> Compartir y luego{' '}
          <span className="font-medium">«Añadir a pantalla de inicio»</span>.
        </p>
      </>
    )
  } else if (!esperandoEvento && navegadorInstalable()) {
    contenido = (
      <>
        <Download className="w-5 h-5 flex-shrink-0 text-primary" />
        <p className="flex-1 min-w-0">
          <span className="font-medium">Instala Docenza como app:</span> abre el menú de tu navegador
          (⋮) y elige <span className="font-medium">«Instalar aplicación»</span> o{' '}
          <span className="font-medium">«Añadir a pantalla de inicio»</span>.
        </p>
      </>
    )
  } else {
    return null
  }

  return (
    <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] md:bottom-0 z-50 px-3 pb-3 md:px-4 md:pb-4 pointer-events-none">
      <div className="pointer-events-auto mx-auto flex max-w-2xl items-center gap-3 rounded-xl border border-border bg-card text-card-foreground px-4 py-3 text-sm shadow-[var(--shadow-strong)]">
        {contenido}
        <button
          onClick={posponer}
          aria-label="Más tarde"
          title="Más tarde"
          className="flex-shrink-0 -mr-1 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
