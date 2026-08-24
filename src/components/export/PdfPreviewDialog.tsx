import { useEffect, useRef, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Button } from '../ui/button'
import { Download, Loader2 } from 'lucide-react'
import { saveAs } from 'file-saver'
import type { PDFGenerado } from '../../utils/pdf.tsx'

interface PdfPreviewDialogProps {
  pdf: PDFGenerado | null
  onOpenChange: (open: boolean) => void
}

/**
 * Muestra el PDF ya generado (en memoria, sin descargar todavía) antes de
 * guardarlo — para poder pillar un error (ej. el módulo equivocado del
 * desplegable Exportar) antes de que se descargue, no después. Solo cubre
 * los exportados desde ExportMenu.tsx (los de un solo elemento — icono de
 * descarga en la tarjeta de un horario/reunión/nota concretos — siguen
 * descargando directo: ahí es mucho más difícil equivocarse de qué se está
 * exportando).
 *
 * Renderiza con pdf.js a <canvas> en vez de un <iframe src="blob:...">: la
 * primera versión usaba iframe y funcionaba en escritorio, pero en móvil
 * (iOS Safari, Chrome Android) el visor nativo de PDF que necesita un iframe
 * no está disponible de forma fiable — la vista previa salía en blanco (bug
 * real reportado por el usuario). pdf.js renderiza con JavaScript puro, sin
 * depender de ningún plugin del navegador, así que funciona igual en
 * cualquier dispositivo.
 */
export function PdfPreviewDialog({ pdf, onOpenChange }: PdfPreviewDialogProps) {
  return (
    <Dialog open={pdf !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Vista previa</DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 rounded-md border border-border overflow-y-auto bg-muted p-2 sm:p-4">
          {pdf && <PdfPaginas blob={pdf.blob} />}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              if (pdf) saveAs(pdf.blob, pdf.filename)
              onOpenChange(false)
            }}
          >
            <Download className="w-4 h-4" />
            Descargar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function PdfPaginas({ blob }: { blob: Blob }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [estado, setEstado] = useState<'cargando' | 'lista' | 'error'>('cargando')

  useEffect(() => {
    let cancelado = false
    let loadingTask: import('pdfjs-dist').PDFDocumentLoadingTask | undefined

    async function render() {
      setEstado('cargando')
      const contenedor = containerRef.current
      if (!contenedor) return
      contenedor.innerHTML = ''

      try {
        const pdfjsLib = await import('pdfjs-dist')
        const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

        const datos = await blob.arrayBuffer()
        loadingTask = pdfjsLib.getDocument({ data: datos })
        const pdfDoc = await loadingTask.promise
        if (cancelado) return

        // Ancho disponible en el momento de renderizar, para que la página
        // se vea completa sin desbordar en pantallas estrechas (móvil).
        const anchoDisponible = contenedor.clientWidth

        for (let i = 1; i <= pdfDoc.numPages; i++) {
          if (cancelado) return
          const pagina = await pdfDoc.getPage(i)
          const viewportBase = pagina.getViewport({ scale: 1 })
          const escala = anchoDisponible / viewportBase.width
          const viewport = pagina.getViewport({ scale: escala })

          const canvas = document.createElement('canvas')
          canvas.width = viewport.width
          canvas.height = viewport.height
          canvas.className = 'w-full h-auto shadow-sm mb-3 bg-white'
          const ctx = canvas.getContext('2d')
          if (!ctx) continue

          await pagina.render({ canvas, canvasContext: ctx, viewport }).promise
          if (cancelado) return
          contenedor.appendChild(canvas)
        }

        if (!cancelado) setEstado('lista')
      } catch (error) {
        console.error('Error rendering PDF preview:', error)
        if (!cancelado) setEstado('error')
      }
    }

    render()

    return () => {
      cancelado = true
      loadingTask?.destroy()
    }
  }, [blob])

  return (
    <>
      {estado === 'cargando' && (
        <div className="flex items-center justify-center h-full text-muted-foreground gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          Generando vista previa…
        </div>
      )}
      {estado === 'error' && (
        <div className="flex items-center justify-center h-full text-destructive text-sm text-center px-4">
          No se ha podido mostrar la vista previa. Puedes descargarlo igualmente con el botón de abajo.
        </div>
      )}
      <div ref={containerRef} />
    </>
  )
}
