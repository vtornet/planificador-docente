import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, RefreshCw, Search, Loader2 } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { useHistoryBack } from '../../hooks/useHistoryBack'
import {
  callAdmin,
  type AdminStats,
  type AdminUser,
  type AdminUsersPage,
  type EstadoUsuario,
} from '../../lib/adminApi'
import { AdminUserDetailDialog } from './AdminUserDetailDialog'

interface AdminPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const ESTADO_LABEL: Record<EstadoUsuario, { texto: string; clase: string }> = {
  activa: { texto: 'Suscripción activa', clase: 'bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300' },
  cancela_al_final: { texto: 'Cancela al final del periodo', clase: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300' },
  trial: { texto: 'Periodo de prueba (Stripe)', clase: 'bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300' },
  manual: { texto: 'Premium manual', clase: 'bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-300' },
  impago: { texto: 'Impago', clase: 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300' },
  cancelada: { texto: 'Cancelada', clase: 'bg-muted text-muted-foreground' },
  prueba: { texto: 'Prueba gratuita', clase: 'bg-muted text-muted-foreground' },
}

function fecha(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function AdminPanel({ open, onOpenChange }: AdminPanelProps) {
  useHistoryBack(open, () => onOpenChange(false))

  const [stats, setStats] = useState<AdminStats | null>(null)
  const [statsError, setStatsError] = useState<string | null>(null)

  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(1)
  const [usersPage, setUsersPage] = useState<AdminUsersPage | null>(null)
  const [usersError, setUsersError] = useState<string | null>(null)
  const [cargandoUsers, setCargandoUsers] = useState(false)

  const [detalleUserId, setDetalleUserId] = useState<string | null>(null)

  const cargarStats = useCallback(async () => {
    setStatsError(null)
    try {
      setStats(await callAdmin<AdminStats>('stats'))
    } catch (e) {
      setStatsError(e instanceof Error ? e.message : 'Error al cargar el resumen')
    }
  }, [])

  const cargarUsers = useCallback(async (search: string, page: number) => {
    setCargandoUsers(true)
    setUsersError(null)
    try {
      setUsersPage(await callAdmin<AdminUsersPage>('list_users', { search, page, pageSize: 25 }))
    } catch (e) {
      setUsersError(e instanceof Error ? e.message : 'Error al cargar los usuarios')
    } finally {
      setCargandoUsers(false)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    cargarStats()
  }, [open, cargarStats])

  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => cargarUsers(busqueda.trim(), pagina), 300)
    return () => clearTimeout(t)
  }, [open, busqueda, pagina, cargarUsers])

  const refrescar = () => {
    cargarStats()
    cargarUsers(busqueda.trim(), pagina)
  }

  const onUsuarioCambiado = () => {
    refrescar()
  }

  if (!open) return null

  const totalPaginas = usersPage ? Math.max(1, Math.ceil(usersPage.total / usersPage.pageSize)) : 1

  // Portal a document.body: si se renderiza donde está montado (dentro de
  // <header>, que lleva `backdrop-blur`), ese `backdrop-filter` crea un bloque
  // contenedor para `position: fixed` y el panel queda atrapado dentro del
  // recuadro de la cabecera en vez de ocupar la pantalla. Mismo motivo por el
  // que ui/dialog.tsx también usa createPortal.
  return createPortal(
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Panel de administración</h1>
            <p className="text-sm text-muted-foreground">Usuarios, suscripciones y estadísticas de Docenza</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={refrescar}>
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refrescar</span>
            </Button>
            <Button variant="ghost" size="icon" aria-label="Cerrar" onClick={() => onOpenChange(false)}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Resumen */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Resumen</h2>
          {statsError && <p className="text-sm text-destructive mb-3">{statsError}</p>}
          {!stats && !statsError && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Cargando…
            </div>
          )}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard titulo="Usuarios" valor={stats.usuarios.total} sub={`+${stats.usuarios.altas7} en 7 días · +${stats.usuarios.altas30} en 30`} />
              <StatCard titulo="Premium" valor={stats.premium.total} sub={`${stats.premium.dePago} de pago · ${stats.premium.manual} manual`} />
              <StatCard titulo="En prueba gratuita" valor={stats.premium.enPrueba} />
              <StatCard titulo="Ingreso anual estimado" valor={`${stats.ingresoAnualEstimado} €`} sub={`${stats.suscripciones.activas} suscripciones activas`} />
              <StatCard titulo="Impagos" valor={stats.suscripciones.pastDue} />
              <StatCard titulo="Programadas para cancelar" valor={stats.suscripciones.programadasCancelar} />
              <StatCard titulo="Cuadernos" valor={stats.cuadernos.total} sub={`media ${stats.cuadernos.mediaPorUsuario} por usuario`} />
              <StatCard titulo="Mensajes de IA" valor={stats.ia.mensajesHoy} sub={`${stats.ia.mensajes7} en 7 días`} />
            </div>
          )}
          {stats && stats.ia.topSemana.length > 0 && (
            <div className="mt-3 text-xs text-muted-foreground">
              <span className="font-medium">Top IA (7 días):</span>{' '}
              {stats.ia.topSemana.map((t) => `${t.email} (${t.count})`).join(' · ')}
            </div>
          )}
        </section>

        {/* Usuarios */}
        <section>
          <div className="flex items-center justify-between gap-4 mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Usuarios {usersPage ? `(${usersPage.total})` : ''}
            </h2>
            <div className="relative w-full max-w-xs">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value)
                  setPagina(1)
                }}
                placeholder="Buscar por email…"
                className="pl-9"
              />
            </div>
          </div>

          {usersError && <p className="text-sm text-destructive mb-3">{usersError}</p>}

          <div className="border border-border rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="text-left font-medium px-3 py-2">Email</th>
                  <th className="text-left font-medium px-3 py-2">Estado</th>
                  <th className="text-right font-medium px-3 py-2">Cuadernos</th>
                  <th className="text-right font-medium px-3 py-2">IA hoy</th>
                  <th className="text-left font-medium px-3 py-2 hidden md:table-cell">Alta</th>
                  <th className="text-left font-medium px-3 py-2 hidden lg:table-cell">Último acceso</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {cargandoUsers && (
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin inline" /> Cargando…
                    </td>
                  </tr>
                )}
                {!cargandoUsers && usersPage?.users.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                      Sin resultados
                    </td>
                  </tr>
                )}
                {!cargandoUsers &&
                  usersPage?.users.map((u) => <FilaUsuario key={u.id} u={u} onVer={() => setDetalleUserId(u.id)} />)}
              </tbody>
            </table>
          </div>

          {usersPage && totalPaginas > 1 && (
            <div className="flex items-center justify-between mt-3 text-sm">
              <Button variant="outline" size="sm" disabled={pagina <= 1} onClick={() => setPagina((p) => p - 1)}>
                Anterior
              </Button>
              <span className="text-muted-foreground">
                Página {pagina} de {totalPaginas}
              </span>
              <Button variant="outline" size="sm" disabled={pagina >= totalPaginas} onClick={() => setPagina((p) => p + 1)}>
                Siguiente
              </Button>
            </div>
          )}
        </section>
      </div>

      <AdminUserDetailDialog
        userId={detalleUserId}
        onClose={() => setDetalleUserId(null)}
        onCambiado={onUsuarioCambiado}
      />
    </div>,
    document.body
  )
}

function StatCard({ titulo, valor, sub }: { titulo: string; valor: string | number; sub?: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-3">
      <div className="text-xs text-muted-foreground">{titulo}</div>
      <div className="text-2xl font-bold text-foreground mt-1">{valor}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  )
}

function FilaUsuario({ u, onVer }: { u: AdminUser; onVer: () => void }) {
  const estado = ESTADO_LABEL[u.estado]
  return (
    <tr className="border-t border-border hover:bg-muted/30">
      <td className="px-3 py-2">
        <span className="font-medium text-foreground break-all">{u.email}</span>
        {u.isAdmin && <span className="ml-2 text-xs text-primary font-semibold">ADMIN</span>}
      </td>
      <td className="px-3 py-2">
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${estado.clase}`}>{estado.texto}</span>
        {u.manualPremium && u.manualPremiumNote && (
          <span className="block text-xs text-muted-foreground mt-0.5">{u.manualPremiumNote}</span>
        )}
      </td>
      <td className="px-3 py-2 text-right tabular-nums">{u.cuadernos}</td>
      <td className="px-3 py-2 text-right tabular-nums">{u.iaHoy}</td>
      <td className="px-3 py-2 hidden md:table-cell text-muted-foreground">{fecha(u.createdAt)}</td>
      <td className="px-3 py-2 hidden lg:table-cell text-muted-foreground">{fecha(u.lastSignInAt)}</td>
      <td className="px-3 py-2 text-right">
        <Button variant="outline" size="sm" onClick={onVer}>
          Ver
        </Button>
      </td>
    </tr>
  )
}
