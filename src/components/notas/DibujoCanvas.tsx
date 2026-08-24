import { useRef, useEffect, useState } from 'react'
import { Button } from '../ui/button'

const GROSORES = [
  { id: 'fino', label: 'Fino', valor: 1.5 },
  { id: 'medio', label: 'Medio', valor: 3 },
  { id: 'grueso', label: 'Grueso', valor: 5 },
] as const

interface DibujoCanvasProps {
  onInsertar: (imagen: string) => void
  onCancel: () => void
}

export function DibujoCanvas({ onInsertar, onCancel }: DibujoCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawingRef = useRef(false)
  const grosorRef = useRef<number>(GROSORES[0].valor)
  const [grosor, setGrosor] = useState<number>(GROSORES[0].valor)
  const [isEmpty, setIsEmpty] = useState(true)

  useEffect(() => {
    grosorRef.current = grosor
  }, [grosor])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.strokeStyle = '#000'
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height

    const getCoords = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect()
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      }
    }

    const startDrawing = (e: MouseEvent | TouchEvent) => {
      e.preventDefault()
      isDrawingRef.current = true
      setIsEmpty(false)
      ctx.lineWidth = grosorRef.current
      const coords = getCoords(e)
      ctx.beginPath()
      ctx.moveTo(coords.x, coords.y)
    }

    const draw = (e: MouseEvent | TouchEvent) => {
      if (!isDrawingRef.current) return
      e.preventDefault()
      const coords = getCoords(e)
      ctx.lineTo(coords.x, coords.y)
      ctx.stroke()
    }

    const stopDrawing = () => {
      isDrawingRef.current = false
    }

    canvas.addEventListener('mousedown', startDrawing)
    canvas.addEventListener('mousemove', draw)
    canvas.addEventListener('mouseup', stopDrawing)
    canvas.addEventListener('mouseleave', stopDrawing)

    canvas.addEventListener('touchstart', startDrawing, { passive: false })
    canvas.addEventListener('touchmove', draw, { passive: false })
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
  }, [])

  const handleLimpiar = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setIsEmpty(true)
  }

  const handleInsertar = () => {
    if (isEmpty) {
      alert('Dibuja algo antes de insertarlo')
      return
    }
    const canvas = canvasRef.current
    if (!canvas) return
    const imagen = canvas.toDataURL('image/png')
    onInsertar(imagen)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-foreground">Grosor del pincel:</span>
        <div className="flex gap-1">
          {GROSORES.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setGrosor(g.valor)}
              aria-pressed={grosor === g.valor}
              className={`px-3 py-1 text-sm rounded border transition-colors ${
                grosor === g.valor
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-input text-foreground hover:bg-accent'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      <div className="border-2 border-dashed border-border rounded-lg p-2 bg-white">
        <canvas
          ref={canvasRef}
          className="w-full h-80 sm:h-[28rem] bg-white rounded cursor-crosshair"
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
        <Button onClick={handleInsertar}>Insertar dibujo</Button>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Dibuja o escribe a mano en el área de arriba
      </p>
    </div>
  )
}
