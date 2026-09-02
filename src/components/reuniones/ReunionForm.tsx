import { useState } from 'react'
import { format } from 'date-fns'
import { useCuadernoStore } from '../../stores/useCuadernoStore'
import { TIPOS_REUNION } from '../../types/constants'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, useDialogCloseGuard } from '../ui/dialog'
import { avisarDialogo, confirmarDialogo } from '../ui/dialogos'
import { FirmaCanvas } from './FirmaCanvas'
import type { Reunion } from '../../types'
import { parseFechaInput } from '../../utils/fechas'
import { Check } from 'lucide-react'

interface ReunionFormProps {
  reunion?: Reunion
}

export function ReunionForm({ reunion }: ReunionFormProps) {
  const { cuadernoActual, addReunion, updateReunion } = useCuadernoStore()

  // Puede empezar sin id (reunión nueva) y adquirirlo tras el primer "Guardar":
  // así los siguientes guardados actualizan esa misma reunión, no crean copias.
  const [reunionId, setReunionId] = useState<string | undefined>(reunion?.id)
  const [titulo, setTitulo] = useState(reunion?.titulo || '')
  const [fecha, setFecha] = useState(
    reunion?.fecha
      ? format(new Date(reunion.fecha), 'yyyy-MM-dd')
      : format(new Date(), 'yyyy-MM-dd')
  )
  const [tipo, setTipo] = useState<Reunion['tipo']>(reunion?.tipo || 'claustro')
  const [asistentes, setAsistentes] = useState(
    reunion?.asistentes?.join(', ') || cuadernoActual?.metadata.docente || ''
  )
  const [asuntosTratados, setAsuntosTratados] = useState(
    reunion?.asuntosTratados || ''
  )
  const [acuerdos, setAcuerdos] = useState(reunion?.acuerdos || '')
  const [firmas, setFirmas] = useState<Reunion['firmas']>(reunion?.firmas || [])
  const [showFirmaDialog, setShowFirmaDialog] = useState(false)

  const firmaActual = JSON.stringify({ titulo, fecha, tipo, asistentes, asuntosTratados, acuerdos, firmas })
  const [firmaGuardada, setFirmaGuardada] = useState(firmaActual)
  const [guardadoOk, setGuardadoOk] = useState(false)
  const hayCambiosSinGuardar = firmaActual !== firmaGuardada

  // Cerrar con el aspa, Escape o el botón "Cerrar" pide confirmación si hay
  // cambios sin guardar.
  const cerrar = useDialogCloseGuard(hayCambiosSinGuardar)

  const handleGuardar = () => {
    if (!titulo.trim()) {
      avisarDialogo('El título es obligatorio')
      return
    }

    const reunionData = {
      titulo: titulo.trim(),
      fecha: parseFechaInput(fecha),
      tipo,
      asistentes: asistentes
        .split(',')
        .map((a) => a.trim())
        .filter((a) => a.length > 0),
      asuntosTratados: asuntosTratados.trim(),
      acuerdos: acuerdos.trim(),
      firmas,
    }

    if (reunionId) {
      updateReunion(reunionId, reunionData)
    } else {
      const nuevoId = addReunion(reunionData)
      if (!nuevoId) {
        avisarDialogo('No se ha podido guardar la reunión. Si estás en la versión de prueba, revisa el límite de reuniones.')
        return
      }
      setReunionId(nuevoId)
    }

    setFirmaGuardada(firmaActual)
    setGuardadoOk(true)
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

  const handleEliminarFirma = async (index: number) => {
    if (await confirmarDialogo({ titulo: '¿Eliminar esta firma?', textoConfirmar: 'Eliminar', peligroso: true })) {
      setFirmas(firmas.filter((_, i) => i !== index))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end gap-2">
        {guardadoOk && !hayCambiosSinGuardar && (
          <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400 mr-auto">
            <Check className="w-4 h-4" />
            Guardado
          </span>
        )}
        <Button variant="outline" onClick={cerrar}>
          Cerrar
        </Button>
        <Button onClick={handleGuardar}>Guardar</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
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
              <label className="block text-sm font-medium text-foreground mb-1">
                Fecha *
              </label>
              <Input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
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
            <label className="block text-sm font-medium text-foreground mb-1">
              Asistentes
            </label>
            <Input
              value={asistentes}
              onChange={(e) => setAsistentes(e.target.value)}
              placeholder="Ej: Juan Pérez, María García, Carlos López"
            />
            <p className="text-xs text-muted-foreground mt-1">
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
            <label className="block text-sm font-medium text-foreground mb-1">
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
            <label className="block text-sm font-medium text-foreground mb-1">
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
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div>
                    <div className="font-medium text-foreground">
                      {firma.nombre}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(firma.fecha), 'dd/MM/yyyy HH:mm')}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-12 border border-border rounded bg-card p-1">
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
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
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
