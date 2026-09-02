import * as React from 'react'
import { createPortal } from 'react-dom'
import { Button } from './button'

// Sustituye a `window.confirm` / `window.alert` por modales con el aspecto de
// la app. API imperativa (no hooks) para poder llamarla desde cualquier sitio
// —handlers async, catch de promesas, etc.— igual que los nativos:
//
//   if (await confirmarDialogo({ titulo: 'Eliminar nota', peligroso: true })) …
//   avisarDialogo('El título es obligatorio')
//
// Requiere <DialogosHost /> montado una vez (ver main.tsx). Si no lo está
// todavía, cae de vuelta a los nativos para no tragarse nunca un aviso.

export interface OpcionesConfirmar {
  titulo: string
  mensaje?: string
  textoConfirmar?: string
  textoCancelar?: string
  peligroso?: boolean
}

interface Peticion {
  titulo: string
  mensaje?: string
  textoConfirmar: string
  textoCancelar: string | null // null => modo aviso (un solo botón)
  peligroso: boolean
  resolver: (aceptado: boolean) => void
}

/**
 * Modal de mensaje con el aspecto de la app (mismas clases que DialogContent).
 * Presentacional: el estado lo maneja quien lo monta.
 */
export function ModalMensaje({
  titulo,
  mensaje,
  textoConfirmar,
  textoCancelar,
  peligroso,
  onConfirmar,
  onCancelar,
}: {
  titulo: string
  mensaje?: string
  textoConfirmar: string
  textoCancelar?: string | null
  peligroso?: boolean
  onConfirmar: () => void
  onCancelar: () => void
}) {
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancelar()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onCancelar])

  const tituloId = React.useId()
  const soloAviso = textoCancelar == null

  return createPortal(
    <div className="fixed inset-0 z-[70] overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" onClick={onCancelar} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={tituloId}
          className="relative z-[71] grid w-full max-w-sm gap-3 border bg-background p-6 shadow-lg sm:rounded-lg"
        >
          <h2 id={tituloId} className="text-lg font-semibold leading-tight tracking-tight">
            {titulo}
          </h2>
          {mensaje && <p className="text-sm text-muted-foreground whitespace-pre-line">{mensaje}</p>}
          <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {!soloAviso && (
              <Button variant="outline" onClick={onCancelar} autoFocus>
                {textoCancelar}
              </Button>
            )}
            <Button
              variant={peligroso ? 'destructive' : 'default'}
              onClick={onConfirmar}
              autoFocus={soloAviso}
            >
              {textoConfirmar}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

let emitir: ((p: Peticion) => void) | null = null

/** Confirmación sí/no. Resuelve a `true` si se acepta. */
export function confirmarDialogo(opts: OpcionesConfirmar): Promise<boolean> {
  return new Promise((resolve) => {
    if (!emitir) {
      resolve(window.confirm(opts.mensaje ? `${opts.titulo}\n\n${opts.mensaje}` : opts.titulo))
      return
    }
    emitir({
      titulo: opts.titulo,
      mensaje: opts.mensaje,
      textoConfirmar: opts.textoConfirmar ?? 'Aceptar',
      textoCancelar: opts.textoCancelar ?? 'Cancelar',
      peligroso: !!opts.peligroso,
      resolver: resolve,
    })
  })
}

/** Aviso informativo (un solo botón). */
export function avisarDialogo(
  arg: string | { titulo: string; mensaje?: string; textoConfirmar?: string }
): Promise<void> {
  const opts = typeof arg === 'string' ? { titulo: arg } : arg
  return new Promise((resolve) => {
    if (!emitir) {
      window.alert(opts.mensaje ? `${opts.titulo}\n\n${opts.mensaje}` : opts.titulo)
      resolve()
      return
    }
    emitir({
      titulo: opts.titulo,
      mensaje: opts.mensaje,
      textoConfirmar:
        ('textoConfirmar' in opts && opts.textoConfirmar) || 'Entendido',
      textoCancelar: null,
      peligroso: false,
      resolver: () => resolve(),
    })
  })
}

/** Monta el modal que atienden `confirmarDialogo` / `avisarDialogo`. Uno solo. */
export function DialogosHost() {
  const [peticion, setPeticion] = React.useState<Peticion | null>(null)

  React.useEffect(() => {
    emitir = setPeticion
    return () => {
      emitir = null
    }
  }, [])

  if (!peticion) return null

  const cerrar = (aceptado: boolean) => {
    peticion.resolver(aceptado)
    setPeticion(null)
  }

  return (
    <ModalMensaje
      titulo={peticion.titulo}
      mensaje={peticion.mensaje}
      textoConfirmar={peticion.textoConfirmar}
      textoCancelar={peticion.textoCancelar}
      peligroso={peticion.peligroso}
      onConfirmar={() => cerrar(true)}
      onCancelar={() => cerrar(false)}
    />
  )
}
