import * as React from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '../../utils/cn'
import { Button, type ButtonProps } from './button'
import { useHistoryBack } from '../../hooks/useHistoryBack'

/** Devuelve true si cerrar el modal debería pedir confirmación (hay cambios sin guardar). */
type CloseGuard = () => boolean

interface DialogContextValue {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  /**
   * Cierre "amable": si hay un guardián registrado y dice que hay cambios sin
   * guardar, muestra el aviso de confirmación (con aspecto de la app, no el
   * `window.confirm` del sistema); si no, cierra. Lo usan el aspa, Escape y
   * los botones "Cerrar" de los formularios. Pulsar fuera del modal NO cierra
   * (petición de las docentes: se perdían reuniones/notas casi acabadas por
   * un toque accidental).
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
export function useDialogCloseGuard(hayCambiosSinGuardar: boolean) {
  const { requestClose, setCloseGuard } = useDialog()
  React.useEffect(() => {
    setCloseGuard(() => hayCambiosSinGuardar)
    return () => setCloseGuard(null)
  }, [hayCambiosSinGuardar, setCloseGuard])
  return requestClose
}

/**
 * Igual que `useDialogCloseGuard` pero como componente, para cuando el
 * formulario que conoce `hayCambiosSinGuardar` es el mismo que monta el
 * <Dialog> (EventoDialog, PerfilDialog): sus hooks corren fuera del contexto,
 * pero un hijo renderizado dentro de <DialogContent> sí lo tiene.
 */
export function DialogUnsavedGuard({ active }: { active: boolean }) {
  const { setCloseGuard } = useDialog()
  React.useEffect(() => {
    setCloseGuard(() => active)
    return () => setCloseGuard(null)
  }, [active, setCloseGuard])
  return null
}

/** Botón que dispara el cierre amable del <Dialog> (pasa por el guardián). */
const DialogCloseButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ onClick, ...props }, ref) => {
    const { requestClose } = useDialog()
    return (
      <Button
        ref={ref}
        onClick={(e) => {
          onClick?.(e)
          requestClose()
        }}
        {...props}
      />
    )
  }
)
DialogCloseButton.displayName = 'DialogCloseButton'

function ConfirmarSalidaModal({ onConfirmar, onCancelar }: { onConfirmar: () => void; onCancelar: () => void }) {
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancelar()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onCancelar])

  return createPortal(
    <div className="fixed inset-0 z-[70] overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" onClick={onCancelar} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirmar-salida-titulo"
          className="relative z-[71] grid w-full max-w-sm gap-3 border bg-background p-6 shadow-lg sm:rounded-lg"
        >
          <h2 id="confirmar-salida-titulo" className="text-lg font-semibold leading-none tracking-tight">
            ¿Cerrar sin guardar?
          </h2>
          <p className="text-sm text-muted-foreground">
            Tienes cambios sin guardar. Si cierras ahora, se perderán.
          </p>
          <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={onCancelar} autoFocus>
              Seguir editando
            </Button>
            <Button variant="destructive" onClick={onConfirmar}>
              Cerrar sin guardar
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

const Dialog = ({ isOpen, open, onOpenChange, children }: { isOpen?: boolean; open?: boolean; onOpenChange: (open: boolean) => void; children: React.ReactNode }) => {
  const isOpenValue = open !== undefined ? open : (isOpen !== undefined ? isOpen : false)
  const guardRef = React.useRef<CloseGuard | null>(null)
  const [confirmando, setConfirmando] = React.useState(false)

  const setCloseGuard = React.useCallback((guard: CloseGuard | null) => {
    guardRef.current = guard
  }, [])

  const requestClose = React.useCallback(() => {
    if (confirmando) return
    if (guardRef.current && guardRef.current()) {
      setConfirmando(true)
      return
    }
    onOpenChange(false)
  }, [onOpenChange, confirmando])

  // Si el Dialog se cierra por cualquier otra vía (botón atrás de Android, el
  // padre pone open=false…) con el aviso abierto, que no quede huérfano.
  React.useEffect(() => {
    if (!isOpenValue) setConfirmando(false)
  }, [isOpenValue])

  // El botón atrás físico de Android cierra sin pasar por el guardián: tocar
  // la pila de historial (backNavigationStack) para "deshacer" un cierre
  // cancelado es justo lo que CLAUDE.md avisa de no hacer a la ligera.
  useHistoryBack(isOpenValue, () => onOpenChange(false))

  return (
    <DialogContext.Provider value={{ isOpen: isOpenValue, setIsOpen: onOpenChange, requestClose, setCloseGuard }}>
      {children}
      {confirmando && (
        <ConfirmarSalidaModal
          onConfirmar={() => {
            setConfirmando(false)
            onOpenChange(false)
          }}
          onCancelar={() => setConfirmando(false)}
        />
      )}
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

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogCloseButton,
}
