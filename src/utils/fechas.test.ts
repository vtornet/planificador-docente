import { describe, it, expect } from 'vitest'
import { parseFechaInput } from './fechas'

describe('parseFechaInput', () => {
  it('interpreta el valor de un <input type="date"> en hora local, no UTC', () => {
    const fecha = parseFechaInput('2026-09-07')
    expect(fecha.getFullYear()).toBe(2026)
    expect(fecha.getMonth()).toBe(8) // 0-indexado: septiembre
    expect(fecha.getDate()).toBe(7)
    expect(fecha.getHours()).toBe(0)
    expect(fecha.getMinutes()).toBe(0)
  })

  it('no se desplaza de día cerca de medianoche, a diferencia de new Date(string)', () => {
    // El motivo real de que exista esta función (ver DESAJUSTE DE ZONA
    // HORARIA EN FECHAS en CLAUDE.md): new Date('2026-09-07') se interpreta
    // como medianoche UTC, que en Europe/Madrid (UTC+1/+2) cae ya el día 6 o
    // 7 según la hora del sistema — parseFechaInput siempre da el día exacto
    // pedido, sea cual sea la zona horaria del entorno donde corra.
    const fecha = parseFechaInput('2026-01-01')
    expect(fecha.getDate()).toBe(1)
    expect(fecha.getMonth()).toBe(0)
  })

  it('respeta años bisiestos', () => {
    const fecha = parseFechaInput('2028-02-29')
    expect(fecha.getMonth()).toBe(1)
    expect(fecha.getDate()).toBe(29)
  })
})
