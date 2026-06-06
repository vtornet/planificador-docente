import { useEffect, useState } from 'react'
import { Layout } from './components/layout/Layout'
import { useCuadernoStore } from './stores/useCuadernoStore'
import { HorarioManager } from './components/horario/HorarioManager'
import { CalendarioMensual } from './components/calendario/CalendarioMensual'
import { ReunionList } from './components/reuniones/ReunionList'
import { NotasList } from './components/notas/NotasList'
import { initDB, getCuadernos } from './db/db'

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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!cuadernoActual) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full text-center">
          <div className="text-6xl mb-6">📘</div>
          <h1 className="text-3xl font-bold text-slate-900 mb-3">
            Plafinicador Docente
          </h1>
          <p className="text-slate-600 mb-8">
            Tu planificador digital para la gestión escolar
          </p>

          {cuadernosExistentes.length > 0 && (
            <div className="mb-6 text-left">
              <p className="text-sm font-medium text-slate-700 mb-3">Cuadernos disponibles:</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {cuadernosExistentes.map((cuaderno) => (
                  <button
                    key={cuaderno.id}
                    onClick={() => loadCuaderno(cuaderno.id)}
                    className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <div className="font-medium text-slate-900">{cuaderno.data?.nombre || cuaderno.metadata.centro}</div>
                    <div className="text-sm text-slate-500">
                      {cuaderno.metadata.cursoEscolar} • {cuaderno.metadata.docente}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={() => {
                createCuaderno({
                  cursoEscolar: '2026-2027',
                  centro: 'Mi Centro',
                  docente: 'Docente',
                  creado: new Date(),
                  actualizado: new Date(),
                })
              }}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Crear nuevo cuaderno
            </button>
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
