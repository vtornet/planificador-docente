import { describe, it, expect } from 'vitest'
import { CONFIG_HORARIOS_PREDEFINIDOS, ETAPAS_EDUCATIVAS, configHorarioPorEtapa } from './constants'

describe('configHorarioPorEtapa', () => {
  it('devuelve la plantilla de secundaria cuando no se pasa etapa (comportamiento previo a este campo)', () => {
    expect(configHorarioPorEtapa(undefined)).toBe(CONFIG_HORARIOS_PREDEFINIDOS.secundaria)
  })

  it('devuelve la plantilla de secundaria para una etapa desconocida', () => {
    expect(configHorarioPorEtapa('no-existe')).toBe(CONFIG_HORARIOS_PREDEFINIDOS.secundaria)
  })

  it('Infantil y Primaria usan la jornada de primaria (7 periodos)', () => {
    expect(configHorarioPorEtapa('infantil')).toBe(CONFIG_HORARIOS_PREDEFINIDOS.primaria)
    expect(configHorarioPorEtapa('primaria')).toBe(CONFIG_HORARIOS_PREDEFINIDOS.primaria)
    expect(configHorarioPorEtapa('primaria').numPeriodos).toBe(7)
  })

  it('ESO, Bachillerato y FP usan la jornada de secundaria (6 periodos)', () => {
    for (const id of ['eso', 'bachillerato', 'fp']) {
      expect(configHorarioPorEtapa(id)).toBe(CONFIG_HORARIOS_PREDEFINIDOS.secundaria)
    }
    expect(configHorarioPorEtapa('eso').numPeriodos).toBe(6)
  })

  it('cada etapa apunta a una clave real de CONFIG_HORARIOS_PREDEFINIDOS', () => {
    for (const etapa of ETAPAS_EDUCATIVAS) {
      expect(CONFIG_HORARIOS_PREDEFINIDOS[etapa.config]).toBeDefined()
    }
  })
})
