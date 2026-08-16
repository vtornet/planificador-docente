import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Button } from '../ui/button'
import { TiptapEditor } from './TiptapEditor'
import type { Nota } from '../../types'

interface NotaViewerProps {
  nota: Nota
  onEditar: () => void
  onCerrar: () => void
}

export function NotaViewer({ nota, onEditar, onCerrar }: NotaViewerProps) {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-xl font-semibold text-foreground">{nota.titulo}</h3>
          <span className="px-2 py-1 text-xs font-medium rounded bg-muted text-muted-foreground whitespace-nowrap">
            {nota.categoria}
          </span>
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          Creada: {format(new Date(nota.creado), 'dd/MM/yyyy HH:mm', { locale: es })}
          {nota.actualizado && nota.actualizado.getTime() !== nota.creado.getTime() && (
            <> • Actualizada: {format(new Date(nota.actualizado), 'dd/MM/yyyy HH:mm', { locale: es })}</>
          )}
        </div>
        {nota.tags && nota.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {nota.tags.map((tag) => (
              <span key={tag} className="px-2 py-0.5 bg-muted text-muted-foreground rounded text-xs">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <TiptapEditor content={nota.contenido} onChange={() => {}} editable={false} />

      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={onCerrar}>
          Cerrar
        </Button>
        <Button onClick={onEditar}>Editar</Button>
      </div>
    </div>
  )
}
