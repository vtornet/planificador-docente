import type { CuadernoMetadata } from '../types'

// Datos mínimos de perfil que hacen falta para poder usar el resto de la app.
export function perfilCompleto(metadata: CuadernoMetadata): boolean {
  return !!(metadata.centro?.trim() && metadata.docente?.trim() && metadata.cursoEscolar?.trim())
}
