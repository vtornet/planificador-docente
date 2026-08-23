import * as React from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '../../utils/cn'
import { useHistoryBack } from '../../hooks/useHistoryBack'

interface DialogContextValue {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

const DialogContext = React.createContext<DialogContextValue | undefined>(undefined)

function useDialog() {
  const context = React.useContext(DialogContext)
  if (!context) {
    throw new Error('Dialog components must be used within Dialog')
  }
  return context
}

const Dialog = ({ isOpen, open, onOpenChange, children }: { isOpen?: boolean; open?: boolean; onOpenChange: (open: boolean) => void; children: React.ReactNode }) => {
  const isOpenValue = open !== undefined ? open : (isOpen !== undefined ? isOpen : false)
  useHistoryBack(isOpenValue, () => onOpenChange(false))
  return (
    <DialogContext.Provider value={{ isOpen: isOpenValue, setIsOpen: onOpenChange }}>
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
    const { isOpen, setIsOpen } = useDialog()

    React.useEffect(() => {
      if (!isOpen) return
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setIsOpen(false)
      }
      window.addEventListener('keydown', onKeyDown)
      return () => window.removeEventListener('keydown', onKeyDown)
    }, [isOpen, setIsOpen])

    if (!isOpen) return null

    // Renderizado en portal a document.body: si el Dialog se abre desde un
    // ancestro con backdrop-blur/filter/transform, ese ancestro crea un
    // containing block nuevo que rompe `position: fixed` y recorta el modal.
    return createPortal(
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50" onClick={() => setIsOpen(false)} />

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
              onClick={() => setIsOpen(false)}
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
