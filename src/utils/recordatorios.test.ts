import { describe, it, expect } from 'vitest'
import { fechaHoraEvento, fechaRecordatorio } from './recordatorios'
import type { Evento } from '../types'

const local = (year: number, month: number, day: number) => new Date(year, month - 1, day)

function crearEvento(overrides: Partial<Evento> = {}): Evento {
  const ahora = new Date()
  return {
    id: 'evento-1',
    titulo: 'Evento de prueba',
    fecha: local(2026, 9, 7),
    todoElDia: false,
    color: 'blue',
    recordatorio: 'ninguno',
    creado: ahora,
    actualizado: ahora,
    ...overrides,
  }
}

describe('fechaHoraEvento', () => {
  it('usa la hora de inicio en un evento con hora', () => {
    const evento = crearEvento({ todoElDia: false, horaInicio: '17:30' })
    const resultado = fechaHoraEvento(evento)
    expect(resultado.getHours()).toBe(17)
    expect(resultado.getMinutes()).toBe(30)
  })

  it('usa las 09:00 como ancla en un evento de todo el día', () => {
    const evento = crearEvento({ todoElDia: true, horaInicio: undefined })
    const resultado = fechaHoraEvento(evento)
    expect(resultado.getHours()).toBe(9)
    expect(resultado.getMinutes()).toBe(0)
  })

  it('acepta una fecha distinta a evento.fecha (una ocurrencia recurrente concreta)', () => {
    const evento = crearEvento({ todoElDia: false, horaInicio: '10:00', fecha: local(2026, 9, 7) })
    const otraOcurrencia = local(2026, 9, 14)
    const resultado = fechaHoraEvento(evento, otraOcurrencia)
    expect(resultado.getDate()).toBe(14)
    expect(resultado.getHours()).toBe(10)
  })
})

describe('fechaRecordatorio', () => {
  it('devuelve null si el recordatorio es "ninguno"', () => {
    const evento = crearEvento({ recordatorio: 'ninguno' })
    expect(fechaRecordatorio(evento)).toBeNull()
  })

  it('"en el momento" coincide exactamente con la hora del evento', () => {
    const evento = crearEvento({ todoElDia: false, horaInicio: '12:00', recordatorio: 'momento' })
    const recordatorio = fechaRecordatorio(evento)
    expect(recordatorio?.getTime()).toBe(fechaHoraEvento(evento).getTime())
  })

  it('"30 minutos antes" resta 30 minutos a la hora del evento', () => {
    const evento = crearEvento({ todoElDia: false, horaInicio: '12:00', recordatorio: '30min' })
    const recordatorio = fechaRecordatorio(evento)
    const esperado = fechaHoraEvento(evento).getTime() - 30 * 60 * 1000
    expect(recordatorio?.getTime()).toBe(esperado)
  })

  it('"1 día antes" resta 24 horas', () => {
    const evento = crearEvento({ todoElDia: false, horaInicio: '12:00', recordatorio: '1dia' })
    const recordatorio = fechaRecordatorio(evento)
    const esperado = fechaHoraEvento(evento).getTime() - 24 * 60 * 60 * 1000
    expect(recordatorio?.getTime()).toBe(esperado)
  })

  it('calcula el recordatorio para una ocurrencia recurrente concreta, no solo la primera', () => {
    const evento = crearEvento({ todoElDia: false, horaInicio: '09:00', recordatorio: '10min', fecha: local(2026, 9, 7) })
    const ocurrencia = local(2026, 9, 21)
    const recordatorio = fechaRecordatorio(evento, ocurrencia)
    expect(recordatorio?.getDate()).toBe(21)
    expect(recordatorio?.getHours()).toBe(8)
    expect(recordatorio?.getMinutes()).toBe(50)
  })
})
