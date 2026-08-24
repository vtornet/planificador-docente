import { describe, it, expect } from 'vitest'
import {
  horarioActivoEnRango,
  horarioAbarcaMasDeLaSemana,
  dividirHorarioParaSemana,
  formatRangoFechas,
  aplicarNotasEnDatos,
  contenidoParaSemana,
} from './horarios'
import type { Horario } from '../types'

const local = (year: number, month: number, day: number) => new Date(year, month - 1, day)

function crearHorario(overrides: Partial<Horario> = {}): Horario {
  return {
    id: 'horario-1',
    tipo: 'docente',
    nombre: 'Horario de prueba',
    datos: [[{ contenido: 'Lengua' }, { contenido: 'Matemáticas' }]],
    configHorarios: { numPeriodos: 1, horaInicio: '08:00', duracionPeriodo: 55 },
    actualizado: new Date(),
    ...overrides,
  }
}

describe('horarioActivoEnRango', () => {
  it('es false sin fechaInicio (horario sin periodo asignado)', () => {
    const horario = crearHorario({ fechaInicio: undefined })
    expect(horarioActivoEnRango(horario, local(2026, 9, 1), local(2026, 9, 30))).toBe(false)
  })

  it('es true si el horario abarca todo el rango pedido', () => {
    const horario = crearHorario({ fechaInicio: local(2026, 9, 1), fechaFin: local(2026, 12, 20) })
    expect(horarioActivoEnRango(horario, local(2026, 9, 7), local(2026, 9, 11))).toBe(true)
  })

  it('es true si el rango pedido solo se solapa parcialmente', () => {
    const horario = crearHorario({ fechaInicio: local(2026, 9, 7), fechaFin: local(2026, 9, 11) })
    expect(horarioActivoEnRango(horario, local(2026, 9, 1), local(2026, 9, 30))).toBe(true)
  })

  it('es false si el rango pedido es completamente anterior o posterior', () => {
    const horario = crearHorario({ fechaInicio: local(2026, 9, 7), fechaFin: local(2026, 9, 11) })
    expect(horarioActivoEnRango(horario, local(2026, 8, 1), local(2026, 8, 31))).toBe(false)
    expect(horarioActivoEnRango(horario, local(2026, 10, 1), local(2026, 10, 31))).toBe(false)
  })

  it('sin fechaFin (rango abierto), sigue activo indefinidamente hacia el futuro', () => {
    const horario = crearHorario({ fechaInicio: local(2026, 9, 7), fechaFin: undefined })
    expect(horarioActivoEnRango(horario, local(2027, 6, 1), local(2027, 6, 30))).toBe(true)
  })
})

describe('horarioAbarcaMasDeLaSemana', () => {
  const semana = { inicio: local(2026, 9, 7), fin: local(2026, 9, 11) }

  it('es false si el horario coincide exactamente con la semana', () => {
    const horario = crearHorario({ fechaInicio: local(2026, 9, 7), fechaFin: local(2026, 9, 11) })
    expect(horarioAbarcaMasDeLaSemana(horario, semana)).toBe(false)
  })

  it('es true si empieza antes de la semana', () => {
    const horario = crearHorario({ fechaInicio: local(2026, 9, 1), fechaFin: local(2026, 9, 11) })
    expect(horarioAbarcaMasDeLaSemana(horario, semana)).toBe(true)
  })

  it('es true si termina después de la semana', () => {
    const horario = crearHorario({ fechaInicio: local(2026, 9, 7), fechaFin: local(2026, 12, 20) })
    expect(horarioAbarcaMasDeLaSemana(horario, semana)).toBe(true)
  })

  it('es true si no tiene fechaFin (rango abierto)', () => {
    const horario = crearHorario({ fechaInicio: local(2026, 9, 7), fechaFin: undefined })
    expect(horarioAbarcaMasDeLaSemana(horario, semana)).toBe(true)
  })
})

describe('dividirHorarioParaSemana', () => {
  it('semana en medio de un periodo más largo: recorta el original en dos trozos y crea uno nuevo para la semana', () => {
    // Trimestre completo (8 sept - 20 dic), se aísla la semana del 14 al 18.
    const original = crearHorario({ fechaInicio: local(2026, 9, 8), fechaFin: local(2026, 12, 20) })
    const semana = { inicio: local(2026, 9, 14), fin: local(2026, 9, 18) }

    const { actualizacionOriginal, nuevos } = dividirHorarioParaSemana(original, semana)

    // El original se recorta para acabar justo antes de la semana aislada.
    expect(actualizacionOriginal.fechaFin?.getTime()).toBe(local(2026, 9, 13).getTime())
    expect(actualizacionOriginal.fechaInicio).toBeUndefined()

    // nuevos[0] es la semana aislada; nuevos[1] es el resto "después".
    expect(nuevos).toHaveLength(2)
    expect(nuevos[0].fechaInicio?.getTime()).toBe(semana.inicio.getTime())
    expect(nuevos[0].fechaFin?.getTime()).toBe(semana.fin.getTime())
    expect(nuevos[1].fechaInicio?.getTime()).toBe(local(2026, 9, 19).getTime())
    expect(nuevos[1].fechaFin?.getTime()).toBe(local(2026, 12, 20).getTime())

    // Los datos (rejilla de celdas) se clonan, no se comparten por referencia.
    expect(nuevos[0].datos).toEqual(original.datos)
    expect(nuevos[0].datos).not.toBe(original.datos)
  })

  it('semana al principio del periodo: solo recorta el original hacia delante, sin trozo "después"', () => {
    const original = crearHorario({ fechaInicio: local(2026, 9, 7), fechaFin: local(2026, 9, 25) })
    const semana = { inicio: local(2026, 9, 7), fin: local(2026, 9, 11) }

    const { actualizacionOriginal, nuevos } = dividirHorarioParaSemana(original, semana)

    expect(actualizacionOriginal.fechaInicio?.getTime()).toBe(local(2026, 9, 12).getTime())
    expect(actualizacionOriginal.fechaFin).toBeUndefined()
    expect(nuevos).toHaveLength(1)
  })

  it('semana al final del periodo: solo recorta el original hacia atrás, sin trozo "después"', () => {
    const original = crearHorario({ fechaInicio: local(2026, 9, 7), fechaFin: local(2026, 9, 25) })
    const semana = { inicio: local(2026, 9, 21), fin: local(2026, 9, 25) }

    const { actualizacionOriginal, nuevos } = dividirHorarioParaSemana(original, semana)

    expect(actualizacionOriginal.fechaFin?.getTime()).toBe(local(2026, 9, 20).getTime())
    expect(actualizacionOriginal.fechaInicio).toBeUndefined()
    expect(nuevos).toHaveLength(1)
  })
})

describe('formatRangoFechas', () => {
  it('cadena vacía sin fechaInicio', () => {
    expect(formatRangoFechas(undefined, undefined)).toBe('')
  })

  it('"Desde el ..." sin fechaFin (rango abierto)', () => {
    expect(formatRangoFechas(local(2026, 9, 7), undefined)).toBe('Desde el 7 de septiembre de 2026')
  })

  it('"Del ... al ..." cuando ambas fechas caen en el mismo mes', () => {
    expect(formatRangoFechas(local(2026, 9, 7), local(2026, 9, 11))).toBe('Del 7 al 11 de septiembre de 2026')
  })

  it('formato abreviado cuando las fechas caen en meses distintos', () => {
    expect(formatRangoFechas(local(2026, 9, 28), local(2026, 10, 2))).toBe('Del 28 sep al 2 oct 2026')
  })
})

describe('aplicarNotasEnDatos', () => {
  it('escribe la nota en la celda indicada sin tocar la asignatura ni el resto de celdas', () => {
    const datos = [
      [{ contenido: 'Lengua' }, { contenido: 'Matemáticas' }],
      [{ contenido: 'Inglés' }, { contenido: 'Plástica' }],
    ]
    const resultado = aplicarNotasEnDatos(datos, { '0-1': 'Examen el jueves' })
    expect(resultado[0][1]).toEqual({ contenido: 'Matemáticas', nota: 'Examen el jueves' })
    expect(resultado[0][0]).toEqual({ contenido: 'Lengua' })
    expect(resultado[1]).toEqual(datos[1])
  })

  it('no muta el array original (inmutable)', () => {
    const datos = [[{ contenido: 'Lengua' }]]
    aplicarNotasEnDatos(datos, { '0-0': 'Nota nueva' })
    expect(datos[0][0]).toEqual({ contenido: 'Lengua' })
  })

  it('sobrescribe una nota ya existente en vez de acumularla', () => {
    const datos = [[{ contenido: 'Lengua', nota: 'Nota vieja' }]]
    const resultado = aplicarNotasEnDatos(datos, { '0-0': 'Nota nueva' })
    expect(resultado[0][0].nota).toBe('Nota nueva')
  })

  it('ignora claves que apuntan a una fila fuera de rango', () => {
    const datos = [[{ contenido: 'Lengua' }]]
    const resultado = aplicarNotasEnDatos(datos, { '5-0': 'No debería aplicarse' })
    expect(resultado).toEqual(datos)
  })
})

describe('contenidoParaSemana', () => {
  it('sin nota, devuelve solo la asignatura', () => {
    expect(contenidoParaSemana('Matemáticas', '')).toBe('Matemáticas')
    expect(contenidoParaSemana('Matemáticas', '   ')).toBe('Matemáticas')
  })

  it('con nota y asignatura, combina "asignatura: nota"', () => {
    expect(contenidoParaSemana('Matemáticas', 'Ejercicios página 12')).toBe('Matemáticas: Ejercicios página 12')
  })

  it('con nota pero sin asignatura, devuelve solo la nota', () => {
    expect(contenidoParaSemana('', 'Repaso general')).toBe('Repaso general')
  })
})
