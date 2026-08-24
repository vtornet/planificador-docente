import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import { NodeSelection } from '@tiptap/pm/state'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Link as LinkIcon,
  Image as ImageIcon,
  Upload,
  Table as TableIcon,
  Undo,
  Redo,
  X,
  PenTool,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { DibujoCanvas } from './DibujoCanvas'
import './TiptapEditor.css'

const MAX_IMAGE_DIMENSION = 1600

function archivoAImagenComprimida(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => {
      const img = new window.Image()
      img.onerror = reject
      img.onload = () => {
        let { width, height } = img
        if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
          const escala = MAX_IMAGE_DIMENSION / Math.max(width, height)
          width = Math.round(width * escala)
          height = Math.round(height * escala)
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('No se pudo procesar la imagen'))
          return
        }
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

interface TiptapEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  editable?: boolean
}

export function TiptapEditor({
  content,
  onChange,
  placeholder = 'Escribe aquí...',
  editable = true,
}: TiptapEditorProps) {
  const [imagenAmpliada, setImagenAmpliada] = useState<string | null>(null)
  const [mostrarDibujo, setMostrarDibujo] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
      }),
      // allowBase64: las imágenes subidas desde el dispositivo se guardan como
      // data: URL (ver archivoAImagenComprimida más abajo) — sin esto, el
      // parser de HTML de Tiptap las descarta en silencio al reconstruir el
      // documento desde `content` (afecta a leer una nota guardada, tanto en
      // modo Ver como al reabrirla para Editar; insertarla en caliente vía el
      // botón de subir sí funcionaba, porque eso no pasa por el parser).
      Image.configure({ allowBase64: true }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editable,
    editorProps: {
      handleClickOn: (view, _pos, node, nodePos, event) => {
        if (node.type.name === 'image') {
          event.preventDefault()
          const selection = NodeSelection.create(view.state.doc, nodePos)
          view.dispatch(view.state.tr.setSelection(selection))
          setImagenAmpliada(node.attrs.src as string)
          return true
        }
        return false
      },
    },
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!editor) return null

  const setLink = () => {
    const url = window.prompt('Introduce la URL:')
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  const addImageDesdeUrl = () => {
    const url = window.prompt('Introduce la URL de la imagen:')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  const addImageDesdeDispositivo = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const dataUrl = await archivoAImagenComprimida(file)
      editor.chain().focus().setImage({ src: dataUrl }).run()
    } catch {
      window.alert('No se pudo cargar la imagen. Prueba con otro archivo.')
    }
  }

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }

  const handleInsertarDibujo = (imagen: string) => {
    editor.chain().focus().setImage({ src: imagen }).run()
    setMostrarDibujo(false)
  }

  const ToolbarButton = ({
    onClick,
    active,
    children,
    title,
  }: {
    onClick: () => void
    active?: boolean
    children: React.ReactNode
    title: string
  }) => (
    <button
      onClick={onClick}
      type="button"
      title={title}
      className={`p-2 rounded hover:bg-accent transition-colors ${
        active ? 'bg-primary/15 text-primary' : 'text-foreground'
      }`}
    >
      {children}
    </button>
  )

  const MenuBar = () => (
    <div className="flex flex-wrap items-center gap-1 border-b border-border pb-2 mb-2">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')}
        title="Negrito (Ctrl+B)"
      >
        <Bold size={18} />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')}
        title="Cursiva (Ctrl+I)"
      >
        <Italic size={18} />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive('heading', { level: 2 })}
        title="Título"
      >
        <Heading2 size={18} />
      </ToolbarButton>

      <div className="w-px h-6 bg-border mx-1" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive('bulletList')}
        title="Lista desordenada"
      >
        <List size={18} />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive('orderedList')}
        title="Lista ordenada"
      >
        <ListOrdered size={18} />
      </ToolbarButton>

      <div className="w-px h-6 bg-border mx-1" />

      <ToolbarButton onClick={setLink} active={editor.isActive('link')} title="Enlace">
        <LinkIcon size={18} />
      </ToolbarButton>

      <ToolbarButton onClick={addImageDesdeUrl} title="Imagen desde URL">
        <ImageIcon size={18} />
      </ToolbarButton>

      <ToolbarButton onClick={addImageDesdeDispositivo} title="Subir imagen desde el dispositivo">
        <Upload size={18} />
      </ToolbarButton>

      <ToolbarButton onClick={() => setMostrarDibujo(true)} title="Insertar dibujo o escritura a mano">
        <PenTool size={18} />
      </ToolbarButton>

      <ToolbarButton onClick={addTable} title="Tabla">
        <TableIcon size={18} />
      </ToolbarButton>

      <div className="w-px h-6 bg-border mx-1" />

      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        title="Deshacer (Ctrl+Z)"
      >
        <Undo size={18} />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        title="Rehacer (Ctrl+Y)"
      >
        <Redo size={18} />
      </ToolbarButton>
    </div>
  )

  return (
    <div className="border border-input rounded-lg overflow-hidden bg-background">
      {editable && <MenuBar />}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none p-4 min-h-[200px] text-foreground"
      />
      <Dialog open={mostrarDibujo} onOpenChange={setMostrarDibujo}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Insertar dibujo o escritura a mano</DialogTitle>
          </DialogHeader>
          <DibujoCanvas onInsertar={handleInsertarDibujo} onCancel={() => setMostrarDibujo(false)} />
        </DialogContent>
      </Dialog>
      {imagenAmpliada &&
        createPortal(
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
            onClick={() => setImagenAmpliada(null)}
          >
            <button
              type="button"
              onClick={() => setImagenAmpliada(null)}
              aria-label="Cerrar"
              className="absolute right-4 top-4 rounded-full p-2 text-white/80 hover:text-white hover:bg-white/10"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={imagenAmpliada}
              alt=""
              className="max-w-full max-h-full object-contain rounded"
              onClick={(e) => e.stopPropagation()}
            />
          </div>,
          document.body
        )}
    </div>
  )
}
