import { describe, it, expect } from 'vitest'
import { fechasOcurrencias } from './recurrencia'
import type { Evento } from '../types'

const local = (year: number, month: number, day: number) => new Date(year, month - 1, day)

function crearEvento(overrides: Partial<Evento> = {}): Evento {
  const ahora = new Date()
  return {
    id: 'evento-1',
    titulo: 'Evento de prueba',
    fecha: local(2026, 9, 7),
    todoElDia: true,
    color: 'blue',
    recordatorio: 'ninguno',
    creado: ahora,
    actualizado: ahora,
    ...overrides,
  }
}

describe('fechasOcurrencias', () => {
  it('sin recurrencia, devuelve solo la fecha del propio evento', () => {
    const evento = crearEvento()
    const fechas = fechasOcurrencias(evento)
    expect(fechas).toHaveLength(1)
    expect(fechas[0].getTime()).toBe(local(2026, 9, 7).getTime())
  })

  it('recurrencia semanal: una ocurrencia por semana hasta el límite, ambos extremos incluidos', () => {
    const evento = crearEvento({
      fecha: local(2026, 9, 7),
      recurrencia: { frecuencia: 'semanal', hasta: local(2026, 9, 28) },
    })
    const fechas = fechasOcurrencias(evento)
    // Día 7, 14, 21 y 28 — 4 ocurrencias exactas.
    expect(fechas).toHaveLength(4)
    expect(fechas.map((f) => f.getDate())).toEqual([7, 14, 21, 28])
  })

  it('recurrencia diaria: una ocurrencia por día', () => {
    const evento = crearEvento({
      fecha: local(2026, 9, 1),
      recurrencia: { frecuencia: 'diaria', hasta: local(2026, 9, 5) },
    })
    const fechas = fechasOcurrencias(evento)
    expect(fechas).toHaveLength(5)
  })

  it('recurrencia mensual: una ocurrencia por mes, mismo día', () => {
    const evento = crearEvento({
      fecha: local(2026, 9, 15),
      recurrencia: { frecuencia: 'mensual', hasta: local(2026, 12, 15) },
    })
    const fechas = fechasOcurrencias(evento)
    expect(fechas).toHaveLength(4)
    expect(fechas.map((f) => f.getMonth())).toEqual([8, 9, 10, 11])
  })

  it('"hasta" anterior a la fecha del evento no genera ninguna ocurrencia', () => {
    const evento = crearEvento({
      fecha: local(2026, 9, 15),
      recurrencia: { frecuencia: 'semanal', hasta: local(2026, 9, 1) },
    })
    expect(fechasOcurrencias(evento)).toHaveLength(0)
  })

  it('no genera más de MAX_OCURRENCIAS (731) aunque "hasta" quede muy lejos', () => {
    const evento = crearEvento({
      fecha: local(2020, 1, 1),
      recurrencia: { frecuencia: 'diaria', hasta: local(2030, 1, 1) },
    })
    expect(fechasOcurrencias(evento).length).toBeLessThanOrEqual(731)
  })
})
