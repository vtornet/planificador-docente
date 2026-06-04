import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useCuadernoStore } from '../../stores/useCuadernoStore'
import { CATEGORIAS_NOTAS } from '../../types/constants'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { TiptapEditor } from './TiptapEditor'
import type { Nota } from '../../types'
import { X } from 'lucide-react'

interface NotaEditorProps {
  nota?: Nota
  onSave: () => void
  onCancel: () => void
}

export function NotaEditor({ nota, onSave, onCancel }: NotaEditorProps) {
  const { addNota, updateNota } = useCuadernoStore()

  const [titulo, setTitulo] = useState(nota?.titulo || '')
  const [categoria, setCategoria] = useState(nota?.categoria || 'Otro')
  const [contenido, setContenido] = useState(nota?.contenido || '')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>(nota?.tags || [])

  const handleGuardar = () => {
    if (!titulo.trim()) {
      alert('El título es obligatorio')
      return
    }

    if (!contenido.trim()) {
      alert('El contenido no puede estar vacío')
      return
    }

    const notaData = {
      titulo: titulo.trim(),
      categoria,
      contenido,
      tipo: 'texto' as const,
      tags,
    }

    if (nota) {
      updateNota(nota.id, notaData)
    } else {
      addNota(notaData)
    }

    onSave()
  }

  const handleAgregarTag = () => {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag])
    }
    setTagInput('')
  }

  const handleEliminarTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAgregarTag()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">
          {nota ? 'Editar Nota' : 'Nueva Nota'}
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
          <CardTitle>Información de la Nota</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Título *
            </label>
            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: Proyecto de fin de curso"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Categoría
            </label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {CATEGORIAS_NOTAS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Etiquetas
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                placeholder="Añadir etiqueta..."
              />
              <Button type="button" variant="outline" onClick={handleAgregarTag}>
                Añadir
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleEliminarTag(tag)}
                      className="hover:text-blue-600"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {nota && (
            <div className="text-sm text-slate-500">
              Creada: {format(new Date(nota.creado), 'dd/MM/yyyy HH:mm', {
                locale: es,
              })}
              {nota.actualizado && nota.actualizado.getTime() !== nota.creado.getTime() && (
                <> • Actualizada: {format(new Date(nota.actualizado), 'dd/MM/yyyy HH:mm', { locale: es })}</>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contenido</CardTitle>
        </CardHeader>
        <CardContent>
          <TiptapEditor
            content={contenido}
            onChange={setContenido}
            placeholder="Escribe el contenido de tu nota..."
          />
        </CardContent>
      </Card>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">💡 Consejos</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Usa el toolbar para formatear texto: negrita, cursiva, listas...</li>
          <li>• Añade enlaces e imágenes con los botones correspondientes</li>
          <li>• Las etiquetas te ayudarán a encontrar tus notas rápidamente</li>
        </ul>
      </div>
    </div>
  )
}
