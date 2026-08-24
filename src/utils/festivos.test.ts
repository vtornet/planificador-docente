import { describe, it, expect } from 'vitest'
import { esDiaFestivo, esDiaVacaciones, festivoDelDia, vacacionDelDia } from './festivos'
import type { Festivo, Vacacion } from '../types'

// Fechas construidas en hora LOCAL (como el resto de la app real — ver
// parseFechaInput.ts y "DESAJUSTE DE ZONA HORARIA EN FECHAS" en CLAUDE.md),
// no con new Date('yyyy-MM-dd') (medianoche UTC) — para que estos tests se
// comporten igual en cualquier zona horaria donde corran.
const local = (year: number, month: number, day: number) => new Date(year, month - 1, day)

const festivo = (fecha: Date, nombre = 'Festivo de prueba'): Festivo => ({
  id: nombre,
  nombre,
  fecha,
  tipo: 'nacional',
})

const vacacion = (inicio: Date, fin: Date, nombre = 'Vacaciones de prueba'): Vacacion => ({
  id: nombre,
  nombre,
  inicio,
  fin,
})

describe('esDiaFestivo / festivoDelDia', () => {
  const festivos = [festivo(local(2026, 10, 12), 'Fiesta Nacional'), festivo(local(2026, 12, 6), 'Día de la Constitución')]

  it('reconoce un día que coincide exactamente con un festivo', () => {
    expect(esDiaFestivo(local(2026, 10, 12), festivos)).toBe(true)
    expect(festivoDelDia(local(2026, 10, 12), festivos)?.nombre).toBe('Fiesta Nacional')
  })

  it('no confunde el día anterior ni el siguiente con el propio festivo', () => {
    expect(esDiaFestivo(local(2026, 10, 11), festivos)).toBe(false)
    expect(esDiaFestivo(local(2026, 10, 13), festivos)).toBe(false)
  })

  it('devuelve false/undefined con una lista vacía', () => {
    expect(esDiaFestivo(local(2026, 10, 12), [])).toBe(false)
    expect(festivoDelDia(local(2026, 10, 12), [])).toBeUndefined()
  })
})

describe('esDiaVacaciones / vacacionDelDia', () => {
  const vacaciones = [vacacion(local(2026, 12, 23), local(2027, 1, 7), 'Vacaciones de Navidad')]

  it('reconoce los días dentro del rango, incluidos los extremos', () => {
    expect(esDiaVacaciones(local(2026, 12, 23), vacaciones)).toBe(true)
    expect(esDiaVacaciones(local(2027, 1, 7), vacaciones)).toBe(true)
    expect(esDiaVacaciones(local(2026, 12, 25), vacaciones)).toBe(true)
    expect(vacacionDelDia(local(2026, 12, 25), vacaciones)?.nombre).toBe('Vacaciones de Navidad')
  })

  it('no incluye los días justo fuera del rango', () => {
    expect(esDiaVacaciones(local(2026, 12, 22), vacaciones)).toBe(false)
    expect(esDiaVacaciones(local(2027, 1, 8), vacaciones)).toBe(false)
  })
})
