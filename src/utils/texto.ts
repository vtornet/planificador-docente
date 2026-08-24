/** Convierte HTML (ej. el contenido de Tiptap) a texto plano, sin etiquetas. */
export function stripHtml(html: string): string {
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return (tmp.textContent || tmp.innerText || '').trim()
}

/**
 * Convierte texto plano (ej. una respuesta del asistente de IA) a HTML
 * simple, apto para insertarse en el contenido de una Nota (Tiptap):
 * párrafos separados por línea en blanco, saltos de línea sueltos como
 * `<br>`. Escapa `&`/`<`/`>` para no romper el HTML de la nota si el texto
 * los contiene.
 */
export function textoAHtml(texto: string): string {
  const escapado = texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return escapado
    .split(/\n{2,}/)
    .filter((parrafo) => parrafo.trim())
    .map((parrafo) => `<p>${parrafo.replace(/\n/g, '<br>')}</p>`)
    .join('')
}
