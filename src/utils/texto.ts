/** Convierte HTML (ej. el contenido de Tiptap) a texto plano, sin etiquetas. */
export function stripHtml(html: string): string {
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return (tmp.textContent || tmp.innerText || '').trim()
}
