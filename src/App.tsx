import { Layout } from './components/layout/Layout'
import { useCuadernoStore } from './stores/useCuadernoStore'
import { HorarioManager } from './components/horario/HorarioManager'
import { CalendarioMensual } from './components/calendario/CalendarioMensual'

function HorariosView() {
  return <HorarioManager />
}

function CalendarioView() {
  return <CalendarioMensual />
}

function ReunionesView() {
  return (
    <div className="text-center py-12">
      <h2 className="text-2xl font-bold text-slate-900 mb-4">👥 Reuniones</h2>
      <p className="text-slate-600">Próximamente...</p>
    </div>
  )
}

function NotasView() {
  return (
    <div className="text-center py-12">
      <h2 className="text-2xl font-bold text-slate-900 mb-4">📝 Notas</h2>
      <p className="text-slate-600">Próximamente...</p>
    </div>
  )
}

function App() {
  const { cuadernoActual, view } = useCuadernoStore()

  // Mostrar pantalla de bienvenida si no hay cuaderno cargado
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
          <div className="space-y-3">
            <button
              onClick={() => {
                useCuadernoStore.getState().createCuaderno({
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
            <button className="w-full px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors">
              Cargar cuaderno existente
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
