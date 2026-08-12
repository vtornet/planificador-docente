import { useRef, useState } from 'react'
import { useCuadernoStore } from '../../stores/useCuadernoStore'
import { importCuadernoFromJSON, validateCuaderno } from '../../utils/export'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Button } from '../ui/button'
import { AlertTriangle, Upload } from 'lucide-react'
import type { CuadernoDocente } from '../../types'

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImportDialog({ open, onOpenChange }: ImportDialogProps) {
  const { cuadernoActual, updateCuaderno } = useCuadernoStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [datosImportados, setDatosImportados] = useState<CuadernoDocente | null>(null)
  const [nombreArchivo, setNombreArchivo] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [importando, setImportando] = useState(false)

  const resetEstado = () => {
    setDatosImportados(null)
    setNombreArchivo('')
    setError('')
    setCargando(false)
    setImportando(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSeleccionarArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setError('')
    setDatosImportados(null)
    if (!file) return

    setNombreArchivo(file.name)
    setCargando(true)
    try {
      const cuaderno = await importCuadernoFromJSON(file)
      if (!validateCuaderno(cuaderno)) {
        setError('El archivo no tiene el formato de una copia de seguridad válida de Docenza.')
        return
      }
      setDatosImportados(cuaderno)
    } catch (err) {
      console.error('Error importando cuaderno:', err)
      setError('No se ha podido leer el archivo. Asegúrate de que es un .json exportado desde "Exportar → Backup (JSON)".')
    } finally {
      setCargando(false)
    }
  }

  const handleImportar = async () => {
    if (!datosImportados || !cuadernoActual) return
    setImportando(true)
    try {
      await updateCuaderno({
        ...datosImportados,
        id: cuadernoActual.id, // mantener el mismo cuaderno, no crear uno duplicado
      })
      resetEstado()
      onOpenChange(false)
    } finally {
      setImportando(false)
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) resetEstado()
    onOpenChange(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Importar copia de seguridad</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Archivo de copia de seguridad (.json)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleSeleccionarArchivo}
              className="w-full text-sm text-foreground file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground file:text-sm file:font-medium file:cursor-pointer hover:file:bg-primary/90 cursor-pointer"
            />
            {nombreArchivo && (
              <p className="text-xs text-muted-foreground mt-1">Seleccionado: {nombreArchivo}</p>
            )}
          </div>

          {cargando && <p className="text-sm text-muted-foreground">Leyendo archivo...</p>}

          {error && (
            <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {datosImportados && (
            <div className="space-y-3">
              <div className="bg-muted rounded-lg p-3 text-sm space-y-1">
                <p><span className="font-medium text-foreground">Centro:</span> {datosImportados.metadata.centro}</p>
                <p><span className="font-medium text-foreground">Docente:</span> {datosImportados.metadata.docente}</p>
                <p><span className="font-medium text-foreground">Curso escolar:</span> {datosImportados.metadata.cursoEscolar}</p>
                <p className="text-muted-foreground">
                  {datosImportados.horarios.length} horarios · {datosImportados.reuniones.length} reuniones ·{' '}
                  {datosImportados.notas.length} notas · {datosImportados.planificacion.semanal.length} semanas de planificación
                </p>
              </div>
              <div className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg p-3">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>Esto reemplazará todos los datos actuales de tu cuaderno (horarios, reuniones, notas y planificación) por los del archivo. No se puede deshacer.</p>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleImportar} disabled={!datosImportados || importando}>
            <Upload className="w-4 h-4" />
            {importando ? 'Importando...' : 'Importar y reemplazar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
