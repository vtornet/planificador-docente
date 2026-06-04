import { useState } from 'react'
import { format } from 'date-fns'
import { useCuadernoStore } from '../../stores/useCuadernoStore'
import { TIPOS_REUNION } from '../../types/constants'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { FirmaCanvas } from './FirmaCanvas'
import type { Reunion } from '../../types'

interface ReunionFormProps {
  reunion?: Reunion
  onSave: () => void
  onCancel: () => void
}

export function ReunionForm({ reunion, onSave, onCancel }: ReunionFormProps) {
  const { addReunion, updateReunion } = useCuadernoStore()

  const [titulo, setTitulo] = useState(reunion?.titulo || '')
  const [fecha, setFecha] = useState(
    reunion?.fecha
      ? format(new Date(reunion.fecha), 'yyyy-MM-dd')
      : format(new Date(), 'yyyy-MM-dd')
  )
  const [tipo, setTipo] = useState<Reunion['tipo']>(reunion?.tipo || 'claustro')
  const [asistentes, setAsistentes] = useState(
    reunion?.asistentes?.join(', ') || ''
  )
  const [asuntosTratados, setAsuntosTratados] = useState(
    reunion?.asuntosTratados || ''
  )
  const [acuerdos, setAcuerdos] = useState(reunion?.acuerdos || '')
  const [firmas, setFirmas] = useState<Reunion['firmas']>(reunion?.firmas || [])
  const [showFirmaDialog, setShowFirmaDialog] = useState(false)

  const handleGuardar = () => {
    if (!titulo.trim()) {
      alert('El título es obligatorio')
      return
    }

    const reunionData = {
      titulo: titulo.trim(),
      fecha: new Date(fecha),
      tipo,
      asistentes: asistentes
        .split(',')
        .map((a) => a.trim())
        .filter((a) => a.length > 0),
      asuntosTratados: asuntosTratados.trim(),
      acuerdos: acuerdos.trim(),
      firmas,
    }

    if (reunion) {
      updateReunion(reunion.id, reunionData)
    } else {
      addReunion(reunionData)
    }

    onSave()
  }

  const handleGuardarFirma = (nombre: string, imagen: string) => {
    const nuevaFirma = {
      nombre,
      imagen,
      fecha: new Date(),
    }
    setFirmas([...firmas, nuevaFirma])
    setShowFirmaDialog(false)
  }

  const handleEliminarFirma = (index: number) => {
    if (confirm('¿Eliminar esta firma?')) {
      setFirmas(firmas.filter((_, i) => i !== index))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">
          {reunion ? 'Editar Reunión' : 'Nueva Reunión'}
        </h3>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={handleGuardar}>Guardar</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Título *
            </label>
            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: Claustro mensual de septiembre"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Fecha *
              </label>
              <Input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tipo
              </label>
              <select
                value={tipo}
                onChange={(e) =>
                  setTipo(e.target.value as Reunion['tipo'])
                }
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {TIPOS_REUNION.map((t) => (
                  <option key={t.toLowerCase()} value={t.toLowerCase()}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Asistentes
            </label>
            <Input
              value={asistentes}
              onChange={(e) => setAsistentes(e.target.value)}
              placeholder="Ej: Juan Pérez, María García, Carlos López"
            />
            <p className="text-xs text-slate-500 mt-1">
              Separados por coma
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contenido de la Reunión</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Asuntos Tratados
            </label>
            <Textarea
              value={asuntosTratados}
              onChange={(e) => setAsuntosTratados(e.target.value)}
              placeholder="Lista los asuntos tratados en la reunión..."
              rows={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Acuerdos y Conclusiones
            </label>
            <Textarea
              value={acuerdos}
              onChange={(e) => setAcuerdos(e.target.value)}
              placeholder="Anota los acuerdos tomados y conclusiones..."
              rows={6}
            />
          </div>
        </CardContent>
      </Card>

      {firmas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Firmas Registradas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {firmas.map((firma, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-slate-900">
                      {firma.nombre}
                    </div>
                    <div className="text-xs text-slate-500">
                      {format(new Date(firma.fecha), 'dd/MM/yyyy HH:mm')}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-12 border border-slate-300 rounded bg-white p-1">
                      {firma.imagen && (
                        <img
                          src={firma.imagen}
                          alt={`Firma de ${firma.nombre}`}
                          className="w-full h-full object-contain"
                        />
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleEliminarFirma(idx)}
                    >
                      ×
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botón para añadir firma */}
      <Card>
        <CardContent className="pt-6">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowFirmaDialog(true)}
          >
            ✍️ Añadir Firma
          </Button>
        </CardContent>
      </Card>

      {/* Dialog para capturar firma */}
      <Dialog open={showFirmaDialog} onOpenChange={setShowFirmaDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Capturar Firma</DialogTitle>
          </DialogHeader>
          <FirmaCanvas
            onGuardar={handleGuardarFirma}
            onCancel={() => setShowFirmaDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
