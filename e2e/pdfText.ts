import { readFile } from 'node:fs/promises'
// Build "legacy" de pdfjs-dist: funciona en Node puro (sin DOM/worker), a
// diferencia del build normal que usa PdfPreviewDialog.tsx en el navegador.
// Usado solo para verificar en los tests que el contenido REAL de un PDF
// generado (no solo que la descarga ocurre) es el esperado — ej. confirmar
// que un cambio hecho en Horarios se refleja en el PDF de Planificación sin
// tener que volver a guardar esa semana (ver "PLANIFICACIÓN ↔ HORARIO" en
// CLAUDE.md).
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'

export async function extraerTextoPDF(path: string): Promise<string> {
  const data = await readFile(path)
  const doc = await getDocument({ data: new Uint8Array(data) }).promise
  let texto = ''
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    texto += content.items.map((item) => ('str' in item ? (item as { str: string }).str : '')).join(' ') + '\n'
  }
  return texto
}
