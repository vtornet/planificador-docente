import * as React from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '../../utils/cn'
import { useHistoryBack } from '../../hooks/useHistoryBack'

type CloseGuard = () => boolean

interface DialogContextValue {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  /**
   * Cierre "amable": ejecuta el guardián de cierre registrado (si lo hay) y
   * solo cierra si este devuelve true. Lo usan el aspa y la tecla Escape.
   * El pulsar fuera del modal ya NO cierra (petición de las docentes: se
   * perdían reuniones/notas casi acabadas por un toque accidental).
   */
  requestClose: () => void
  /** Registra/limpia el guardián de cierre. `null` para quitarlo. */
  setCloseGuard: (guard: CloseGuard | null) => void
}

const DialogContext = React.createContext<DialogContextValue | undefined>(undefined)

function useDialog() {
  const context = React.useContext(DialogContext)
  if (!context) {
    throw new Error('Dialog components must be used within Dialog')
  }
  return context
}

/**
 * Para un formulario dentro de un <Dialog>: mientras `hayCambiosSinGuardar`
 * sea true, cerrar con el aspa o Escape pide confirmación. Devuelve la función
 * de cierre amable, para usarla también en un botón "Cerrar" propio.
 */
export function useDialogCloseGuard(
  hayCambiosSinGuardar: boolean,
  mensaje = '¿Cerrar sin guardar? Se perderán los cambios que no hayas guardado.'
) {
  const { requestClose, setCloseGuard } = useDialog()
  React.useEffect(() => {
    setCloseGuard(hayCambiosSinGuardar ? () => window.confirm(mensaje) : null)
    return () => setCloseGuard(null)
  }, [hayCambiosSinGuardar, mensaje, setCloseGuard])
  return requestClose
}

const Dialog = ({ isOpen, open, onOpenChange, children }: { isOpen?: boolean; open?: boolean; onOpenChange: (open: boolean) => void; children: React.ReactNode }) => {
  const isOpenValue = open !== undefined ? open : (isOpen !== undefined ? isOpen : false)
  const guardRef = React.useRef<CloseGuard | null>(null)

  const setCloseGuard = React.useCallback((guard: CloseGuard | null) => {
    guardRef.current = guard
  }, [])

  const requestClose = React.useCallback(() => {
    if (guardRef.current && guardRef.current() === false) return
    onOpenChange(false)
  }, [onOpenChange])

  // El botón atrás físico de Android cierra sin pasar por el guardián: tocar
  // la pila de historial (backNavigationStack) para "deshacer" un cierre
  // cancelado es justo lo que CLAUDE.md avisa de no hacer a la ligera.
  useHistoryBack(isOpenValue, () => onOpenChange(false))

  return (
    <DialogContext.Provider value={{ isOpen: isOpenValue, setIsOpen: onOpenChange, requestClose, setCloseGuard }}>
      {children}
    </DialogContext.Provider>
  )
}

const DialogTrigger = ({ asChild, children, ...props }: { asChild?: boolean; children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  const { setIsOpen } = useDialog()

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: () => setIsOpen(true),
    })
  }

  return <button onClick={() => setIsOpen(true)} {...props}>{children}</button>
}

const DialogContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    const { isOpen, requestClose } = useDialog()

    React.useEffect(() => {
      if (!isOpen) return
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') requestClose()
      }
      window.addEventListener('keydown', onKeyDown)
      return () => window.removeEventListener('keydown', onKeyDown)
    }, [isOpen, requestClose])

    if (!isOpen) return null

    // Renderizado en portal a document.body: si el Dialog se abre desde un
    // ancestro con backdrop-blur/filter/transform, ese ancestro crea un
    // containing block nuevo que rompe `position: fixed` y recorta el modal.
    return createPortal(
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop — no cierra al pulsarlo (ver requestClose en DialogContext) */}
        <div className="fixed inset-0 bg-black/50" />

        {/* Content */}
        <div className="flex min-h-full items-start justify-center p-4 sm:items-center">
          <div
            ref={ref}
            className={cn(
              'relative z-50 my-8 grid w-full max-w-lg gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg sm:my-0',
              className
            )}
            {...props}
          >
            <button
              type="button"
              onClick={() => requestClose()}
              aria-label="Cerrar"
              className="absolute right-3 top-3 rounded-sm p-2 text-muted-foreground opacity-70 transition-opacity hover:opacity-100 hover:text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <X className="h-4 w-4" />
            </button>
            {children}
          </div>
        </div>
      </div>,
      document.body
    )
  }
)
DialogContent.displayName = 'DialogContent'

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props} />
)
DialogHeader.displayName = 'DialogHeader'

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)} {...props} />
)
DialogFooter.displayName = 'DialogFooter'

const DialogTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2 ref={ref} className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props} />
  )
)
DialogTitle.displayName = 'DialogTitle'

const DialogDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
  )
)
DialogDescription.displayName = 'DialogDescription'

export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription }
