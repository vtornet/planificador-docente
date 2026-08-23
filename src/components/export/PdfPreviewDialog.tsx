import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Button } from '../ui/button'
import { Download } from 'lucide-react'
import { saveAs } from 'file-saver'
import type { PDFGenerado } from '../../utils/pdf.tsx'

interface PdfPreviewDialogProps {
  pdf: PDFGenerado | null
  onOpenChange: (open: boolean) => void
}

/**
 * Muestra el PDF ya generado (en memoria, sin descargar todavía) en un
 * iframe antes de guardarlo — para poder pillar un error (ej. el módulo
 * equivocado del desplegable Exportar) antes de que se descargue, no
 * después. Solo cubre los exportados desde ExportMenu.tsx (los de un solo
 * elemento — icono de descarga en la tarjeta de un horario/reunión/nota
 * concretos — siguen descargando directo: ahí es mucho más difícil
 * equivocarse de qué se está exportando).
 */
export function PdfPreviewDialog({ pdf, onOpenChange }: PdfPreviewDialogProps) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!pdf) {
      setUrl(null)
      return
    }
    const objectUrl = URL.createObjectURL(pdf.blob)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [pdf])

  return (
    <Dialog open={pdf !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Vista previa</DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 rounded-md border border-border overflow-hidden bg-muted">
          {url && <iframe src={url} title="Vista previa del PDF" className="w-full h-full" />}
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
