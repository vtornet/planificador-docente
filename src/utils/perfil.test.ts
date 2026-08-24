import { describe, it, expect } from 'vitest'
import { perfilCompleto } from './perfil'
import type { CuadernoMetadata } from '../types'

function metadata(overrides: Partial<CuadernoMetadata> = {}): CuadernoMetadata {
  const ahora = new Date()
  return {
    centro: 'IES Prueba',
    docente: 'Docente de Prueba',
    cursoEscolar: '2026-2027',
    creado: ahora,
    actualizado: ahora,
    ...overrides,
  }
}

describe('perfilCompleto', () => {
  it('es true con los 3 campos obligatorios rellenos', () => {
    expect(perfilCompleto(metadata())).toBe(true)
  })

  it('es true aunque falten los campos opcionales (cursos, comunidad autónoma)', () => {
    expect(perfilCompleto(metadata({ cursos: undefined, comunidadAutonoma: undefined }))).toBe(true)
  })

  it.each(['centro', 'docente', 'cursoEscolar'] as const)('es false si falta %s', (campo) => {
    expect(perfilCompleto(metadata({ [campo]: '' }))).toBe(false)
  })

  it('es false si un campo obligatorio es solo espacios en blanco', () => {
    expect(perfilCompleto(metadata({ centro: '   ' }))).toBe(false)
  })
})
