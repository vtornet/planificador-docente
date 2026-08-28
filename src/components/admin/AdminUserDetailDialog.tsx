import { useEffect, useState } from 'react'
import { Loader2, ShieldAlert } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { callAdmin, type AdminUserDetail } from '../../lib/adminApi'

interface Props {
  userId: string | null
  onClose: () => void
  onCambiado: () => void
}

function fechaHora(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const ACCION_LABEL: Record<string, string> = {
  grant_manual_premium: 'Premium manual concedido',
  revoke_manual_premium: 'Premium manual retirado',
  cancel_subscription: 'Suscripción cancelada',
  delete_user: 'Cuenta eliminada',
}

export function AdminUserDetailDialog({ userId, onClose, onCambiado }: Props) {
  const [detalle, setDetalle] = useState<AdminUserDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  // Estado de acciones
  const [nota, setNota] = useState('')
  const [ejecutando, setEjecutando] = useState<string | null>(null)
  const [confirmBorrado, setConfirmBorrado] = useState('')

  const cargar = async () => {
    if (!userId) return
    setCargando(true)
    setError(null)
    try {
      const d = await callAdmin<AdminUserDetail>('user_detail', { targetUserId: userId })
      setDetalle(d)
      setNota(d.profile?.manualPremiumNote ?? '')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar el usuario')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    if (userId) {
      setDetalle(null)
      setConfirmBorrado('')
      cargar()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const p = detalle?.profile

  const accion = async (nombre: string, fn: () => Promise<unknown>, recargar = true) => {
    setEjecutando(nombre)
    setError(null)
    try {
      await fn()
      onCambiado()
      if (recargar) await cargar()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'La operación no se pudo completar')
    } finally {
      setEjecutando(null)
    }
  }

  const togglePremium = () =>
    accion('premium', () =>
      callAdmin('set_manual_premium', {
        targetUserId: userId,
        enabled: !p?.manualPremium,
        note: nota.trim(),
      })
    )

  const cancelarSuscripcion = (immediately: boolean) =>
    accion('cancelar', () => callAdmin('cancel_subscription', { targetUserId: userId, immediately }))

  const borrarCuenta = () =>
    accion(
      'borrar',
      async () => {
        await callAdmin('delete_user', { targetUserId: userId })
        onClose()
      },
      false
    )

  return (
    <Dialog open={!!userId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{p?.email ?? 'Usuario'}</DialogTitle>
        </DialogHeader>

        {cargando && !detalle && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm py-6">
            <Loader2 className="w-4 h-4 animate-spin" /> Cargando…
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        {p && (
          <div className="space-y-6">
            {/* Estado */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
              <Dato k="Estado de pago" v={p.hasPaid ? 'Premium' : 'Prueba gratuita'} />
              <Dato k="Suscripción Stripe" v={p.subscriptionStatus ?? '—'} />
              <Dato k="Premium manual" v={p.manualPremium ? 'Sí' : 'No'} />
              <Dato k="Renovación / fin" v={p.subscriptionCurrentPeriodEnd ? fechaHora(p.subscriptionCurrentPeriodEnd) : '—'} />
              <Dato k="Alta" v={fechaHora(p.createdAt)} />
              <Dato k="Cancela al final" v={p.cancelAtPeriodEnd ? 'Sí' : 'No'} />
              {p.manualPremium && p.manualPremiumBy && (
                <Dato k="Premium manual por" v={`${p.manualPremiumBy} · ${fechaHora(p.manualPremiumAt)}`} />
              )}
            </div>

            {/* Premium manual */}
            <div className="border border-border rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-foreground text-sm">Premium manual</h3>
              <p className="text-xs text-muted-foreground">
                Concede acceso completo con independencia de Stripe. Se mantiene hasta que se retire aquí.
              </p>
              <Input
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder="Nota interna (ej: beta tester, compensación por incidencia)"
              />
              <Button
                variant={p.manualPremium ? 'outline' : 'default'}
                size="sm"
                disabled={ejecutando !== null}
                onClick={togglePremium}
              >
                {ejecutando === 'premium' && <Loader2 className="w-4 h-4 animate-spin" />}
                {p.manualPremium ? 'Retirar premium manual' : 'Conceder premium manual'}
              </Button>
            </div>

            {/* Cuadernos */}
            <div>
              <h3 className="font-semibold text-foreground text-sm mb-2">Cuadernos ({detalle?.cuadernos.length ?? 0})</h3>
              {detalle?.cuadernos.length === 0 && <p className="text-sm text-muted-foreground">Ninguno</p>}
              <div className="space-y-1">
                {detalle?.cuadernos.map((c) => (
                  <div key={c.id} className="text-sm flex justify-between gap-4 border-b border-border/50 py-1">
                    <span className="text-foreground">
                      {c.centro || 'Sin centro'} · {c.docente || 'Sin docente'} · {c.cursoEscolar || '—'}
                    </span>
                    <span className="text-muted-foreground whitespace-nowrap">{fechaHora(c.updatedAt)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Uso de IA */}
            {detalle && detalle.aiUsage.length > 0 && (
              <div>
                <h3 className="font-semibold text-foreground text-sm mb-2">Uso del asistente (últimos 30 días)</h3>
                <div className="flex flex-wrap gap-2 text-xs">
                  {detalle.aiUsage.map((r) => (
                    <span key={r.day} className="px-2 py-0.5 bg-muted rounded">
                      {r.day}: {r.count}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Historial de auditoría */}
            {detalle && detalle.audit.length > 0 && (
              <div>
                <h3 className="font-semibold text-foreground text-sm mb-2">Historial de acciones de admin</h3>
                <div className="space-y-1 text-xs">
                  {detalle.audit.map((a) => (
                    <div key={a.id} className="text-muted-foreground">
                      {fechaHora(a.created_at)} · <span className="text-foreground">{ACCION_LABEL[a.action] ?? a.action}</span>
                      {a.actor_email ? ` · por ${a.actor_email}` : ''}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Zona peligrosa */}
            <div className="border border-destructive/40 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-destructive text-sm flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" /> Zona peligrosa
              </h3>

              {p.tieneStripe && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={ejecutando !== null}
                    onClick={() => cancelarSuscripcion(false)}
                  >
                    {ejecutando === 'cancelar' && <Loader2 className="w-4 h-4 animate-spin" />}
                    Cancelar al final del periodo
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={ejecutando !== null}
                    onClick={() => cancelarSuscripcion(true)}
                  >
                    Cancelar de inmediato
                  </Button>
                </div>
              )}

              <div className="pt-2 border-t border-destructive/20">
                <p className="text-xs text-muted-foreground mb-2">
                  Eliminar la cuenta borra el usuario, su perfil y todos sus cuadernos (irreversible) y cancela su
                  suscripción de Stripe. Escribe <strong>ELIMINAR</strong> para confirmar.
                </p>
                <div className="flex gap-2">
                  <Input
                    value={confirmBorrado}
                    onChange={(e) => setConfirmBorrado(e.target.value)}
                    placeholder="ELIMINAR"
                    className="max-w-[180px]"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={confirmBorrado !== 'ELIMINAR' || ejecutando !== null}
                    onClick={borrarCuenta}
                  >
                    {ejecutando === 'borrar' && <Loader2 className="w-4 h-4 animate-spin" />}
                    Eliminar cuenta
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Dato({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground">{k}</span>
      <span className="text-foreground">{v}</span>
    </div>
  )
}
