import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useCuadernoStore } from '../../stores/useCuadernoStore'
import { TIPOS_FESTIVO, COLOR_VACACIONES } from '../../types/constants'
import type { TipoFestivo } from '../../types'
import { parseFechaInput } from '../../utils/fechas'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Trash2 } from 'lucide-react'

interface FestivosDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

function colorDeTipo(tipo: TipoFestivo): string {
  return TIPOS_FESTIVO.find((t) => t.id === tipo)?.color || '#ef4444'
}

export function FestivosDialog({ open, onOpenChange }: FestivosDialogProps) {
  const { cuadernoActual, updateCuaderno } = useCuadernoStore()
  const festivos = cuadernoActual?.configuracion.festivos || []
  const vacaciones = cuadernoActual?.configuracion.vacaciones || []

  const [nombreFestivo, setNombreFestivo] = useState('')
  const [fechaFestivo, setFechaFestivo] = useState('')
  const [tipoFestivo, setTipoFestivo] = useState<TipoFestivo>('nacional')

  const [nombreVacacion, setNombreVacacion] = useState('')
  const [inicioVacacion, setInicioVacacion] = useState('')
  const [finVacacion, setFinVacacion] = useState('')

  if (!cuadernoActual) return null

  const handleAgregarFestivo = () => {
    if (!nombreFestivo.trim() || !fechaFestivo) return
    updateCuaderno({
      configuracion: {
        ...cuadernoActual.configuracion,
        festivos: [
          ...festivos,
          { id: generateId(), nombre: nombreFestivo.trim(), fecha: parseFechaInput(fechaFestivo), tipo: tipoFestivo },
        ],
      },
    })
    setNombreFestivo('')
    setFechaFestivo('')
  }

  const handleEliminarFestivo = (id: string) => {
    updateCuaderno({
      configuracion: { ...cuadernoActual.configuracion, festivos: festivos.filter((f) => f.id !== id) },
    })
  }

  const handleAgregarVacacion = () => {
    if (!nombreVacacion.trim() || !inicioVacacion || !finVacacion) return
    updateCuaderno({
      configuracion: {
        ...cuadernoActual.configuracion,
        vacaciones: [
          ...vacaciones,
          { id: generateId(), nombre: nombreVacacion.trim(), inicio: parseFechaInput(inicioVacacion), fin: parseFechaInput(finVacacion) },
        ],
      },
    })
    setNombreVacacion('')
    setInicioVacacion('')
    setFinVacacion('')
  }

  const handleEliminarVacacion = (id: string) => {
    updateCuaderno({
      configuracion: { ...cuadernoActual.configuracion, vacaciones: vacaciones.filter((v) => v.id !== id) },
    })
  }

  const festivosOrdenados = [...festivos].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
  const vacacionesOrdenadas = [...vacaciones].sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime())

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Festivos y vacaciones</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Festivos */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-2">Festivos</h4>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-2 mb-3">
              <Input
                value={nombreFestivo}
                onChange={(e) => setNombreFestivo(e.target.value)}
                placeholder="Ej: Día de la Constitución"
              />
              <Input
                type="date"
                value={fechaFestivo}
                onChange={(e) => setFechaFestivo(e.target.value)}
                className="sm:w-40"
              />
              <select
                value={tipoFestivo}
                onChange={(e) => setTipoFestivo(e.target.value as TipoFestivo)}
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm sm:w-40"
              >
                {TIPOS_FESTIVO.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                  </option>
                ))}
              </select>
              <Button type="button" variant="outline" onClick={handleAgregarFestivo}>
                Añadir
              </Button>
            </div>

            {festivosOrdenados.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Sin festivos añadidos.</p>
            ) : (
              <ul className="space-y-1.5">
                {festivosOrdenados.map((festivo) => (
                  <li
                    key={festivo.id}
                    className="flex items-center justify-between gap-2 bg-muted rounded-lg px-3 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: colorDeTipo(festivo.tipo) }}
                      />
                      <span className="text-sm text-foreground truncate">{festivo.nombre}</span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {format(new Date(festivo.fecha), "d 'de' MMMM", { locale: es })}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleEliminarFestivo(festivo.id)}
                      className="text-muted-foreground hover:text-destructive flex-shrink-0"
                      title="Eliminar festivo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Vacaciones */}
          <div className="pt-4 border-t border-border">
            <h4 className="text-sm font-semibold text-foreground mb-2">Vacaciones</h4>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-2 mb-3">
              <Input
                value={nombreVacacion}
                onChange={(e) => setNombreVacacion(e.target.value)}
                placeholder="Ej: Vacaciones de Navidad"
              />
              <Input
                type="date"
                value={inicioVacacion}
                onChange={(e) => setInicioVacacion(e.target.value)}
                className="sm:w-40"
              />
              <Input
                type="date"
                value={finVacacion}
                onChange={(e) => setFinVacacion(e.target.value)}
                className="sm:w-40"
              />
              <Button type="button" variant="outline" onClick={handleAgregarVacacion}>
                Añadir
              </Button>
            </div>

            {vacacionesOrdenadas.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Sin periodos de vacaciones añadidos.</p>
            ) : (
              <ul className="space-y-1.5">
                {vacacionesOrdenadas.map((vacacion) => (
                  <li
                    key={vacacion.id}
                    className="flex items-center justify-between gap-2 bg-muted rounded-lg px-3 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: COLOR_VACACIONES }}
                      />
                      <span className="text-sm text-foreground truncate">{vacacion.nombre}</span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {format(new Date(vacacion.inicio), 'd MMM', { locale: es })} - {format(new Date(vacacion.fin), "d MMM yyyy", { locale: es })}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleEliminarVacacion(vacacion.id)}
                      className="text-muted-foreground hover:text-destructive flex-shrink-0"
                      title="Eliminar periodo de vacaciones"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
