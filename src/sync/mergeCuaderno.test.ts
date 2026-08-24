import { describe, it, expect } from 'vitest'
import { mergeCuadernos } from './mergeCuaderno'
import type { CuadernoDocente, Horario, Nota, Eliminacion, CuadernoMetadata, Configuracion } from '../types'

function metadata(overrides: Partial<CuadernoMetadata> = {}): CuadernoMetadata {
  return {
    centro: 'IES Prueba',
    docente: 'Docente de Prueba',
    cursoEscolar: '2026-2027',
    creado: new Date('2026-01-01'),
    actualizado: new Date('2026-01-01'),
    ...overrides,
  }
}

function configuracion(overrides: Partial<Configuracion> = {}): Configuracion {
  return {
    id: 'config',
    cursoEscolarActual: '2026-2027',
    fechaInicioCurso: new Date('2026-09-01'),
    fechaFinCurso: new Date('2027-06-30'),
    festivos: [],
    vacaciones: [],
    ...overrides,
  }
}

function horario(id: string, actualizado: Date, overrides: Partial<Horario> = {}): Horario {
  return {
    id,
    tipo: 'docente',
    nombre: `Horario ${id}`,
    datos: [],
    configHorarios: { numPeriodos: 1, horaInicio: '08:00', duracionPeriodo: 55 },
    actualizado,
    ...overrides,
  }
}

function nota(id: string, actualizado: Date, overrides: Partial<Nota> = {}): Nota {
  return {
    id,
    titulo: `Nota ${id}`,
    categoria: 'general',
    contenido: '',
    tipo: 'texto',
    tags: [],
    creado: actualizado,
    actualizado,
    ...overrides,
  }
}

// Cuaderno "vacío" mínimo, para no repetir todos los campos en cada test —
// cada test rellena solo lo que le interesa comprobar.
function cuaderno(overrides: Partial<CuadernoDocente> = {}): CuadernoDocente {
  return {
    id: 'cuaderno-1',
    metadata: metadata(),
    horarios: [],
    planificacion: { mensual: [], semanal: [] },
    reuniones: [],
    notas: [],
    eventos: [],
    configuracion: configuracion(),
    eliminados: [],
    ...overrides,
  }
}

describe('mergeCuadernos — unión de elementos sin conflicto', () => {
  it('un elemento que solo existe en local sobrevive', () => {
    const local = cuaderno({ horarios: [horario('a', new Date('2026-01-01'))] })
    const remoto = cuaderno({ horarios: [] })
    const resultado = mergeCuadernos(local, remoto)
    expect(resultado.horarios.map((h) => h.id)).toEqual(['a'])
  })

  it('un elemento que solo existe en remoto sobrevive', () => {
    const local = cuaderno({ horarios: [] })
    const remoto = cuaderno({ horarios: [horario('b', new Date('2026-01-01'))] })
    const resultado = mergeCuadernos(local, remoto)
    expect(resultado.horarios.map((h) => h.id)).toEqual(['b'])
  })

  it('elementos distintos en cada lado se unen todos, sin perder ninguno (el caso real que motivó este arreglo)', () => {
    const local = cuaderno({ horarios: [horario('a', new Date('2026-01-01'))] })
    // Simula "A crea un horario, B crea una reunión" fusionando ambos lados.
    const remotoConReunion = cuaderno({
      reuniones: [
        {
          id: 'r1',
          titulo: 'Reunión',
          fecha: new Date('2026-01-01'),
          tipo: 'claustro',
          asistentes: [],
          asuntosTratados: '',
          acuerdos: '',
          firmas: [],
          creada: new Date('2026-01-01'),
          actualizado: new Date('2026-01-01'),
        },
      ],
    })
    const resultado = mergeCuadernos(local, remotoConReunion)
    expect(resultado.horarios.map((h) => h.id)).toEqual(['a'])
    expect(resultado.reuniones.map((r) => r.id)).toEqual(['r1'])
  })
})

describe('mergeCuadernos — mismo id en ambos lados', () => {
  it('gana la copia con actualizado más reciente, sea local o remota', () => {
    const antiguo = horario('a', new Date('2026-01-01'), { nombre: 'Antiguo' })
    const nuevo = horario('a', new Date('2026-06-01'), { nombre: 'Nuevo' })

    const resultadoLocalGana = mergeCuadernos(cuaderno({ horarios: [nuevo] }), cuaderno({ horarios: [antiguo] }))
    expect(resultadoLocalGana.horarios[0].nombre).toBe('Nuevo')

    const resultadoRemotoGana = mergeCuadernos(cuaderno({ horarios: [antiguo] }), cuaderno({ horarios: [nuevo] }))
    expect(resultadoRemotoGana.horarios[0].nombre).toBe('Nuevo')
  })

  it('actualizado ausente (dato de antes de existir el campo) se trata como muy antiguo, nunca gana', () => {
    const sinFecha = horario('a', undefined as unknown as Date, { nombre: 'Sin fecha' })
    const conFecha = horario('a', new Date('2020-01-01'), { nombre: 'Con fecha' })
    const resultado = mergeCuadernos(cuaderno({ horarios: [sinFecha] }), cuaderno({ horarios: [conFecha] }))
    expect(resultado.horarios[0].nombre).toBe('Con fecha')
  })
})

describe('mergeCuadernos — tombstones (eliminados)', () => {
  it('un borrado posterior a la última edición conocida hace desaparecer el elemento', () => {
    const item = nota('n1', new Date('2026-01-01'))
    const tombstone: Eliminacion = { id: 'n1', tipo: 'nota', fecha: new Date('2026-02-01') }

    // El dispositivo local borró la nota (tombstone); el remoto todavía la
    // tiene (nunca se enteró del borrado) — el borrado debe ganar.
    const resultado = mergeCuadernos(
      cuaderno({ notas: [], eliminados: [tombstone] }),
      cuaderno({ notas: [item], eliminados: [] })
    )
    expect(resultado.notas).toHaveLength(0)
  })

  it('una edición posterior al borrado (en el otro dispositivo) resucita el elemento', () => {
    // Se borró en un dispositivo a las 12:00, pero el otro dispositivo lo
    // siguió editando hasta las 13:00 antes de sincronizar — la edición es
    // más reciente que el borrado, así que debe sobrevivir.
    const editadoDespuesDelBorrado = nota('n1', new Date('2026-01-01T13:00:00'))
    const tombstone: Eliminacion = { id: 'n1', tipo: 'nota', fecha: new Date('2026-01-01T12:00:00') }

    const resultado = mergeCuadernos(
      cuaderno({ notas: [], eliminados: [tombstone] }),
      cuaderno({ notas: [editadoDespuesDelBorrado], eliminados: [] })
    )
    expect(resultado.notas).toHaveLength(1)
  })

  it('un tombstone de otro tipo de entidad no afecta a elementos con el mismo id', () => {
    const item = nota('mismo-id', new Date('2026-01-01'))
    const tombstoneDeHorario: Eliminacion = { id: 'mismo-id', tipo: 'horario', fecha: new Date('2026-02-01') }

    const resultado = mergeCuadernos(
      cuaderno({ notas: [item], eliminados: [tombstoneDeHorario] }),
      cuaderno({ notas: [], eliminados: [] })
    )
    expect(resultado.notas).toHaveLength(1)
  })

  it('los tombstones de ambos lados se unen, quedándose con la fecha más reciente por (tipo, id)', () => {
    const tombstoneAntiguo: Eliminacion = { id: 'n1', tipo: 'nota', fecha: new Date('2026-01-01') }
    const tombstoneReciente: Eliminacion = { id: 'n1', tipo: 'nota', fecha: new Date('2026-06-01') }

    const resultado = mergeCuadernos(
      cuaderno({ eliminados: [tombstoneAntiguo] }),
      cuaderno({ eliminados: [tombstoneReciente] })
    )
    expect(resultado.eliminados).toHaveLength(1)
    expect(resultado.eliminados[0].fecha.getTime()).toBe(tombstoneReciente.fecha.getTime())
  })
})

describe('mergeCuadernos — metadata y configuracion (bloque completo, no por campo)', () => {
  it('metadata y configuracion viajan juntas, según metadata.actualizado', () => {
    const local = cuaderno({
      metadata: metadata({ centro: 'IES Local', actualizado: new Date('2026-06-01') }),
      configuracion: configuracion({ cursoEscolarActual: 'de local' }),
    })
    const remoto = cuaderno({
      metadata: metadata({ centro: 'IES Remoto', actualizado: new Date('2026-01-01') }),
      configuracion: configuracion({ cursoEscolarActual: 'de remoto' }),
    })
    const resultado = mergeCuadernos(local, remoto)
    expect(resultado.metadata.centro).toBe('IES Local')
    expect(resultado.configuracion.cursoEscolarActual).toBe('de local')
  })

  it('con metadata.actualizado igual, gana local (empate se resuelve a favor del que se está reconciliando)', () => {
    const fecha = new Date('2026-01-01')
    const local = cuaderno({ metadata: metadata({ centro: 'IES Local', actualizado: fecha }) })
    const remoto = cuaderno({ metadata: metadata({ centro: 'IES Remoto', actualizado: fecha }) })
    const resultado = mergeCuadernos(local, remoto)
    expect(resultado.metadata.centro).toBe('IES Local')
  })
})

describe('mergeCuadernos — idempotencia', () => {
  it('fusionar un cuaderno consigo mismo no cambia nada', () => {
    const original = cuaderno({
      horarios: [horario('a', new Date('2026-01-01'))],
      notas: [nota('n1', new Date('2026-01-01'))],
    })
    const resultado = mergeCuadernos(original, original)
    expect(resultado.horarios.map((h) => h.id)).toEqual(['a'])
    expect(resultado.notas.map((n) => n.id)).toEqual(['n1'])
  })
})
