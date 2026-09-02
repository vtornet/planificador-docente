import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useCuadernoStore } from '../../stores/useCuadernoStore'
import { useEditorContextStore } from '../../stores/useEditorContextStore'
import { CATEGORIAS_NOTAS } from '../../types/constants'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { useDialogCloseGuard } from '../ui/dialog'
import { avisarDialogo } from '../ui/dialogos'
import { TiptapEditor } from './TiptapEditor'
import type { Nota } from '../../types'
import { X, Check } from 'lucide-react'
import { stripHtml } from '../../utils/texto'

interface NotaEditorProps {
  nota?: Nota
}

export function NotaEditor({ nota }: NotaEditorProps) {
  const { addNota, updateNota } = useCuadernoStore()

  // Puede empezar sin id (nota nueva) y adquirirlo tras el primer "Guardar":
  // los siguientes guardados actualizan esa misma nota, no crean copias.
  const [notaId, setNotaId] = useState<string | undefined>(nota?.id)
  const [titulo, setTitulo] = useState(nota?.titulo || '')
  const [categoria, setCategoria] = useState(nota?.categoria || 'Otro')
  const [contenido, setContenido] = useState(nota?.contenido || '')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>(nota?.tags || [])

  const firmaActual = JSON.stringify({ titulo, categoria, contenido, tags })
  const [firmaGuardada, setFirmaGuardada] = useState(firmaActual)
  const [guardadoOk, setGuardadoOk] = useState(false)
  const hayCambiosSinGuardar = firmaActual !== firmaGuardada

  const cerrar = useDialogCloseGuard(hayCambiosSinGuardar)

  const publicarContexto = useEditorContextStore((s) => s.publicar)

  useEffect(() => {
    const texto = stripHtml(contenido)
    if (texto) {
      publicarContexto('notas', titulo || '(nota sin título)', texto)
    }
  }, [titulo, contenido, publicarContexto])

  const handleGuardar = () => {
    if (!titulo.trim()) {
      avisarDialogo('El título es obligatorio')
      return
    }

    if (!contenido.trim()) {
      avisarDialogo('El contenido no puede estar vacío')
      return
    }

    const notaData = {
      titulo: titulo.trim(),
      categoria,
      contenido,
      tipo: 'texto' as const,
      tags,
    }

    if (notaId) {
      updateNota(notaId, notaData)
    } else {
      const nuevoId = addNota(notaData)
      if (!nuevoId) {
        avisarDialogo('No se ha podido guardar la nota. Si estás en la versión de prueba, revisa el límite de notas.')
        return
      }
      setNotaId(nuevoId)
    }

    setFirmaGuardada(firmaActual)
    setGuardadoOk(true)
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
          <CardTitle>Información de la Nota</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Título *
            </label>
            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: Proyecto de fin de curso"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
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
            <label className="block text-sm font-medium text-foreground mb-1">
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
                    className="inline-flex items-center gap-1 px-3 py-1 bg-primary/15 text-primary rounded-full text-sm"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleEliminarTag(tag)}
                      className="hover:text-primary/70"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {nota && (
            <div className="text-sm text-muted-foreground">
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

      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
        <h4 className="font-medium text-primary mb-2">💡 Consejos</h4>
        <ul className="text-sm text-primary/90 space-y-1">
          <li>• Usa el toolbar para formatear texto: negrita, cursiva, listas...</li>
          <li>• Añade enlaces e imágenes con los botones correspondientes</li>
          <li>• Las etiquetas te ayudarán a encontrar tus notas rápidamente</li>
        </ul>
      </div>
    </div>
  )
}
