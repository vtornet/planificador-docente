import { useEffect, useState, lazy, Suspense } from 'react'
import { Layout } from './components/layout/Layout'
import { useCuadernoStore } from './stores/useCuadernoStore'
import { useAuthStore } from './stores/useAuthStore'
import { AuthScreen } from './components/auth/AuthScreen'
import { ResetPasswordScreen } from './components/auth/ResetPasswordScreen'
import { ClaimLocalDataDialog } from './components/auth/ClaimLocalDataDialog'
import { initDB, getCuadernos } from './db/db'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'
import { useTheme } from './hooks/useTheme'
import { COMUNIDADES_AUTONOMAS } from './types/festivosOficiales'
import { ETAPAS_EDUCATIVAS } from './types/constants'
import docenzaIcon from './assets/docenza-icon.webp'

function cursoEscolarPorDefecto(): string {
  const hoy = new Date()
  const anio = hoy.getFullYear()
  // getMonth() es 0-indexado: 7 = agosto. Desde agosto ya se prepara el curso
  // que empieza en septiembre, así que sugerimos ese como valor por defecto.
  return hoy.getMonth() >= 7 ? `${anio}-${anio + 1}` : `${anio - 1}-${anio}`
}

const HorarioManager = lazy(() => import('./components/horario/HorarioManager').then((m) => ({ default: m.HorarioManager })))
const CalendarioMensual = lazy(() => import('./components/calendario/CalendarioMensual').then((m) => ({ default: m.CalendarioMensual })))
const ReunionList = lazy(() => import('./components/reuniones/ReunionList').then((m) => ({ default: m.ReunionList })))
const NotasList = lazy(() => import('./components/notas/NotasList').then((m) => ({ default: m.NotasList })))

function VistaCargando() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )
}

function App() {
  const { cuadernoActual, view, createCuaderno, loadCuaderno } = useCuadernoStore()
  const { user, isLoading: authIsLoading, initAuth, passwordRecovery } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [cuadernosExistentes, setCuadernosExistentes] = useState<any[]>([])
  // null = todavía no se ha comprobado; [] = comprobado, nada que reclamar (o
  // ya resuelto); con elementos = hay que mostrar ClaimLocalDataDialog antes
  // de seguir cargando la app.
  const [cuadernosSinReclamar, setCuadernosSinReclamar] = useState<any[] | null>(null)
  const [centro, setCentro] = useState('')
  const [docente, setDocente] = useState('')
  const [cursoEscolar, setCursoEscolar] = useState(cursoEscolarPorDefecto())
  const [comunidadAutonoma, setComunidadAutonoma] = useState('')
  const [etapaEducativa, setEtapaEducativa] = useState('')
  useTheme() // aplica el tema guardado también en las pantallas previas al Layout

  useEffect(() => {
    initAuth()
  }, [initAuth])

  useEffect(() => {
    // Al iniciar sesión, comprueba una única vez si hay cuadernos locales de
    // antes de existir cuentas (sin userId) — si los hay, el efecto de más
    // abajo espera a que se resuelva ClaimLocalDataDialog antes de conciliar
    // con Supabase y decidir qué cuaderno mostrar.
    if (!user) return
    setCuadernosSinReclamar(null)

    async function comprobar() {
      await initDB()
      const todos = await getCuadernos()
      setCuadernosSinReclamar(todos.filter((c) => !c.userId))
    }

    comprobar()
  }, [user])

  useEffect(() => {
    // Espera a que haya sesión y a que ya se sepa si hay algo que reclamar
    // (cuadernosSinReclamar !== null) y, si lo hay, a que el diálogo se
    // resuelva (se vacía la lista al confirmar o declinar, ver más abajo).
    if (!user) return
    if (cuadernosSinReclamar === null) return
    if (cuadernosSinReclamar.length > 0) return
    const usuarioActual = user

    async function init() {
      setIsLoading(true)
      try {
        // Inicializar IndexedDB
        await initDB()

        // Conciliar con Supabase antes de decidir qué cuaderno mostrar, para
        // que un dispositivo nuevo (o uno que estuvo offline) ya tenga los
        // datos del otro dispositivo disponibles localmente. En su propio
        // try/catch a propósito: si falla (típicamente sin conexión), no debe
        // impedir cargar los cuadernos ya guardados en Dexie más abajo — igual
        // que el resto de sync en esta app, es una mejora "mejor esfuerzo",
        // nunca un requisito para poder usar la app offline.
        try {
          const { reconcileCuadernosConSupabase } = await import('./sync/syncCuaderno')
          await reconcileCuadernosConSupabase()
        } catch (error) {
          console.error('No se pudo conciliar con Supabase (¿sin conexión?):', error)
        }

        // Cargar cuadernos existentes — solo los del usuario que ha iniciado
        // sesión. Si dos cuentas distintas han usado este mismo navegador,
        // Dexie guarda los cuadernos de ambas en la misma tabla: filtrar por
        // userId evita que una vea los de la otra. Los cuadernos sin userId
        // son de antes de esta migración (locales, nunca sincronizados) —
        // siguen visibles hasta que se reclamen explícitamente (Fase E).
        const todos = await getCuadernos()
        const cuadernos = todos.filter((c) => !c.userId || c.userId === usuarioActual.id)

        if (cuadernos.length > 0) {
          // Cargar el cuaderno más reciente
          const ultimoCuaderno = cuadernos.sort((a, b) => b.metadata.actualizado - a.metadata.actualizado)[0]
          await loadCuaderno(ultimoCuaderno.id)
        }

        setCuadernosExistentes(cuadernos)
      } catch (error) {
        console.error('Error al inicializar:', error)
      } finally {
        setIsLoading(false)
      }
    }

    init()
  }, [user, cuadernosSinReclamar, loadCuaderno])

  if (authIsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  // El enlace de "restablecer contraseña" del email también crea una sesión
  // temporal (user pasa a estar relleno), así que esta comprobación va antes
  // de "!user" — si no, se saltaría directa a la app normal sin dar opción
  // a poner la contraseña nueva.
  if (passwordRecovery) {
    return <ResetPasswordScreen />
  }

  if (!user) {
    return <AuthScreen />
  }

  if (cuadernosSinReclamar && cuadernosSinReclamar.length > 0) {
    return (
      <ClaimLocalDataDialog
        cuadernos={cuadernosSinReclamar}
        onResuelto={() => setCuadernosSinReclamar([])}
      />
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!cuadernoActual) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
        <div className="bg-card text-card-foreground rounded-2xl shadow-[var(--shadow-strong)] border border-border p-8 max-w-lg w-full text-center animate-scale-in">
          <img
            src={docenzaIcon}
            alt="Docenza"
            width={80}
            height={80}
            fetchPriority="high"
            className="w-20 h-20 mx-auto mb-6 drop-shadow-lg"
          />
          <h1 className="text-3xl font-bold text-foreground mb-3 tracking-tight">
            Docenza
          </h1>
          <p className="text-muted-foreground mb-8">
            Planificador Docente
          </p>

          {cuadernosExistentes.length > 0 && (
            <div className="mb-6 text-left">
              <p className="text-sm font-medium text-foreground mb-3">Cuadernos disponibles:</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {cuadernosExistentes.map((cuaderno) => (
                  <button
                    key={cuaderno.id}
                    onClick={() => loadCuaderno(cuaderno.id)}
                    className="w-full text-left px-4 py-3 bg-muted hover:bg-accent/50 border border-transparent hover:border-border rounded-lg transition-colors"
                  >
                    <div className="font-medium text-foreground">{cuaderno.data?.nombre || cuaderno.metadata.centro}</div>
                    <div className="text-sm text-muted-foreground">
                      {cuaderno.metadata.cursoEscolar} • {cuaderno.metadata.docente}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3 text-left">
            <p className="text-sm font-medium text-foreground -mb-1">Crear nuevo cuaderno</p>
            <Input
              value={centro}
              onChange={(e) => setCentro(e.target.value)}
              placeholder="Centro (ej: IES Mi Instituto)"
            />
            <Input
              value={docente}
              onChange={(e) => setDocente(e.target.value)}
              placeholder="Tu nombre"
            />
            <Input
              value={cursoEscolar}
              onChange={(e) => setCursoEscolar(e.target.value)}
              placeholder="Curso escolar (ej: 2026-2027)"
            />
            <div>
              <select
                value={comunidadAutonoma}
                onChange={(e) => setComunidadAutonoma(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Comunidad autónoma (opcional)</option>
                {COMUNIDADES_AUTONOMAS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Se usa para cargar automáticamente el festivo de tu comunidad en el calendario. Puedes
                cambiarla más adelante desde Perfil.
              </p>
            </div>
            <div>
              <select
                value={etapaEducativa}
                onChange={(e) => setEtapaEducativa(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Etapa educativa (opcional)</option>
                {ETAPAS_EDUCATIVAS.map((etapa) => (
                  <option key={etapa.id} value={etapa.id}>
                    {etapa.nombre}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Elige la plantilla de intervalos por defecto al crear un horario. Puedes cambiarla más
                adelante desde Perfil.
              </p>
            </div>
            <Button
              size="lg"
              className="w-full"
              disabled={!centro.trim() || !docente.trim() || !cursoEscolar.trim()}
              onClick={() => {
                createCuaderno({
                  cursoEscolar: cursoEscolar.trim(),
                  centro: centro.trim(),
                  docente: docente.trim(),
                  comunidadAutonoma: comunidadAutonoma || undefined,
                  etapaEducativa: etapaEducativa || undefined,
                  creado: new Date(),
                  actualizado: new Date(),
                })
              }}
            >
              Crear cuaderno
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const viewComponent = {
    horario: <HorarioManager />,
    calendario: <CalendarioMensual />,
    reuniones: <ReunionList />,
    notas: <NotasList />,
  }[view]

  return (
    <Layout>
      <Suspense fallback={<VistaCargando />}>{viewComponent}</Suspense>
    </Layout>
  )
}

export default App
