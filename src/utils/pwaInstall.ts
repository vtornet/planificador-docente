// Captura del evento `beforeinstallprompt` a nivel de módulo.
//
// Chrome/Edge/Android disparan `beforeinstallprompt` una sola vez y muy pronto
// (en cuanto procesan el manifest), a veces antes de que React monte. Si no se
// llama a `preventDefault()` y se guarda el evento en ese instante, se pierde y
// ya no hay forma de mostrar el diálogo nativo de instalación. Por eso el
// listener se registra al importar este módulo (main.tsx lo importa lo primero),
// no dentro de un componente.
//
// Navegadores que NO disparan el evento: Safari (iOS y escritorio) y Firefox.
// Para esos, InstallPrompt.tsx muestra instrucciones manuales.

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  prompt: () => Promise<void>
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

let deferred: BeforeInstallPromptEvent | null = null
let instalada = false
const listeners = new Set<() => void>()

function notificar() {
  listeners.forEach((fn) => fn())
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Evita el mini-infobar nativo de Chrome: mostramos UI propia y disparamos
    // el prompt cuando la docente pulsa "Instalar".
    e.preventDefault()
    deferred = e as BeforeInstallPromptEvent
    notificar()
  })

  window.addEventListener('appinstalled', () => {
    deferred = null
    instalada = true
    notificar()
  })
}

/** El evento guardado, o null si el navegador aún no lo ha disparado (o no lo soporta). */
export function getDeferredPrompt(): BeforeInstallPromptEvent | null {
  return deferred
}

/** Olvida el evento tras usarlo (no se puede reutilizar el mismo objeto). */
export function clearDeferredPrompt() {
  deferred = null
  notificar()
}

/** true si en algún momento de esta sesión se disparó `appinstalled`. */
export function seHaInstaladoEnEstaSesion(): boolean {
  return instalada
}

/** Suscribe a cambios (nuevo evento capturado, instalación completada). Devuelve la baja. */
export function subscribeInstall(fn: () => void): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

/** true si la app se está ejecutando ya como PWA instalada (cualquier plataforma). */
export function enModoApp(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    // iOS Safari no soporta display-mode: usa esta propiedad no estándar.
    (navigator as unknown as { standalone?: boolean }).standalone === true ||
    document.referrer.startsWith('android-app://')
  )
}

/** true en iPhone/iPad (incluido iPadOS 13+, que se hace pasar por Mac). */
export function esIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  if (/iPad|iPhone|iPod/.test(ua)) return true
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
}

/** Heurística de "navegador de escritorio/Android que soporta instalación de PWA". */
export function navegadorInstalable(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  // Firefox no instala PWAs sin extensión; Safari de escritorio tampoco.
  if (/Firefox\//.test(ua)) return false
  if (/Safari\//.test(ua) && !/Chrome\/|Chromium\/|Edg\//.test(ua) && !esIOS()) return false
  return true
}
