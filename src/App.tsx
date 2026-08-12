import { useEffect, useState } from 'react'
import { Layout } from './components/layout/Layout'
import { useCuadernoStore } from './stores/useCuadernoStore'
import { HorarioManager } from './components/horario/HorarioManager'
import { CalendarioMensual } from './components/calendario/CalendarioMensual'
import { ReunionList } from './components/reuniones/ReunionList'
import { NotasList } from './components/notas/NotasList'
import { initDB, getCuadernos } from './db/db'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'
import { useTheme } from './hooks/useTheme'
import docenzaIcon from './assets/docenza-icon.png'

function cursoEscolarPorDefecto(): string {
  const hoy = new Date()
  const anio = hoy.getFullYear()
  // getMonth() es 0-indexado: 7 = agosto. Desde agosto ya se prepara el curso
  // que empieza en septiembre, así que sugerimos ese como valor por defecto.
  return hoy.getMonth() >= 7 ? `${anio}-${anio + 1}` : `${anio - 1}-${anio}`
}

function HorariosView() {
  return <HorarioManager />
}

function CalendarioView() {
  return <CalendarioMensual />
}

function ReunionesView() {
  return <ReunionList />
}

function NotasView() {
  return <NotasList />
}

function App() {
  const { cuadernoActual, view, createCuaderno, loadCuaderno } = useCuadernoStore()
  const [isLoading, setIsLoading] = useState(true)
  const [cuadernosExistentes, setCuadernosExistentes] = useState<any[]>([])
  const [centro, setCentro] = useState('')
  const [docente, setDocente] = useState('')
  const [cursoEscolar, setCursoEscolar] = useState(cursoEscolarPorDefecto())
  useTheme() // aplica el tema guardado también en las pantallas previas al Layout

  useEffect(() => {
    async function init() {
      try {
        // Inicializar IndexedDB
        await initDB()

        // Cargar cuadernos existentes
        const cuadernos = await getCuadernos()

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
  }, [loadCuaderno])

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
            <Button
              size="lg"
              className="w-full"
              disabled={!centro.trim() || !docente.trim() || !cursoEscolar.trim()}
              onClick={() => {
                createCuaderno({
                  cursoEscolar: cursoEscolar.trim(),
                  centro: centro.trim(),
                  docente: docente.trim(),
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
    horario: <HorariosView />,
    calendario: <CalendarioView />,
    reuniones: <ReunionesView />,
    notas: <NotasView />,
  }[view]

  return <Layout>{viewComponent}</Layout>
}

export default App
