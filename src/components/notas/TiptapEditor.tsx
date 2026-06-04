import { useEditor, EditorContent } from '@tiptap/react'
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
  Table as TableIcon,
  Undo,
  Redo,
} from 'lucide-react'
import './TiptapEditor.css'

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
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
      }),
      Image,
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
  })

  if (!editor) return null

  const setLink = () => {
    const url = window.prompt('Introduce la URL:')
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  const addImage = () => {
    const url = window.prompt('Introduce la URL de la imagen:')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
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
      className={`p-2 rounded hover:bg-slate-100 transition-colors ${
        active ? 'bg-blue-100 text-blue-700' : 'text-slate-700'
      }`}
    >
      {children}
    </button>
  )

  const MenuBar = () => (
    <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 pb-2 mb-2">
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

      <div className="w-px h-6 bg-slate-300 mx-1" />

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

      <div className="w-px h-6 bg-slate-300 mx-1" />

      <ToolbarButton onClick={setLink} active={editor.isActive('link')} title="Enlace">
        <LinkIcon size={18} />
      </ToolbarButton>

      <ToolbarButton onClick={addImage} title="Imagen">
        <ImageIcon size={18} />
      </ToolbarButton>

      <ToolbarButton onClick={addTable} title="Tabla">
        <TableIcon size={18} />
      </ToolbarButton>

      <div className="w-px h-6 bg-slate-300 mx-1" />

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
    <div className="border border-slate-300 rounded-lg overflow-hidden">
      {editable && <MenuBar />}
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none p-4 min-h-[200px]"
      />
    </div>
  )
}
