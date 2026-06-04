import { useRef, useEffect, useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

interface FirmaCanvasProps {
  onGuardar: (nombre: string, imagen: string) => void
  onCancel: () => void
}

export function FirmaCanvas({ onGuardar, onCancel }: FirmaCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [nombre, setNombre] = useState('')
  const [isEmpty, setIsEmpty] = useState(true)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Configurar el canvas
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // Ajustar tamaño del canvas
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height

    // Función para obtener coordenadas
    const getCoords = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect()
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      }
    }

    // Eventos de dibujo
    const startDrawing = (e: MouseEvent | TouchEvent) => {
      e.preventDefault()
      setIsDrawing(true)
      setIsEmpty(false)
      const coords = getCoords(e)
      ctx.beginPath()
      ctx.moveTo(coords.x, coords.y)
    }

    const draw = (e: MouseEvent | TouchEvent) => {
      if (!isDrawing) return
      e.preventDefault()
      const coords = getCoords(e)
      ctx.lineTo(coords.x, coords.y)
      ctx.stroke()
    }

    const stopDrawing = () => {
      setIsDrawing(false)
    }

    // Eventos de mouse
    canvas.addEventListener('mousedown', startDrawing)
    canvas.addEventListener('mousemove', draw)
    canvas.addEventListener('mouseup', stopDrawing)
    canvas.addEventListener('mouseleave', stopDrawing)

    // Eventos táctiles
    canvas.addEventListener('touchstart', startDrawing)
    canvas.addEventListener('touchmove', draw)
    canvas.addEventListener('touchend', stopDrawing)

    return () => {
      canvas.removeEventListener('mousedown', startDrawing)
      canvas.removeEventListener('mousemove', draw)
      canvas.removeEventListener('mouseup', stopDrawing)
      canvas.removeEventListener('mouseleave', stopDrawing)
      canvas.removeEventListener('touchstart', startDrawing)
      canvas.removeEventListener('touchmove', draw)
      canvas.removeEventListener('touchend', stopDrawing)
    }
  }, [isDrawing])

  const handleLimpiar = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setIsEmpty(true)
  }

  const handleGuardar = () => {
    if (!nombre.trim()) {
      alert('Por favor, indica el nombre de la persona que firma')
      return
    }

    if (isEmpty) {
      alert('Por favor, realiza una firma antes de guardar')
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return

    const imagen = canvas.toDataURL('image/png')
    onGuardar(nombre.trim(), imagen)
    setNombre('')
    handleLimpiar()
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Nombre de quien firma *
        </label>
        <Input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: Juan Pérez"
        />
      </div>

      <div className="border-2 border-dashed border-slate-300 rounded-lg p-2 bg-white">
        <canvas
          ref={canvasRef}
          className="w-full h-32 bg-white rounded cursor-crosshair"
          style={{ touchAction: 'none' }}
        />
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={handleLimpiar}>
          Limpiar
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={handleGuardar}>Guardar Firma</Button>
      </div>

      <p className="text-xs text-slate-500 text-center">
        Dibuja tu firma en el área de arriba
      </p>
    </div>
  )
}
