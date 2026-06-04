import Dexie, { Table } from 'dexie'

// Definimos la base de datos directamente sin la interfaz estricta
class PlafinicadorDB extends Dexie {
  cuadernos!: Table<{
    id: string
    metadata: {
      cursoEscolar: string
      centro: string
      docente: string
      creado: number
      actualizado: number
    }
    data: unknown
  }, string>

  configuracion!: Table<{
    id: 'config'
    cursoEscolarActual: string
    fechaInicioCurso: number
    fechaFinCurso: number
    festivos: number[]
    vacaciones: Array<{
      nombre: string
      inicio: number
      fin: number
    }>
  }, 'config'>

  backup!: Table<{
    timestamp: number
    descripcion: string
    data: string
  }, string>

  constructor() {
    super('PlafinicadorDB')
    this.version(1).stores({
      cuadernos: '&id, cursoEscolar, centro, actualizado',
      configuracion: '&id',
      backup: '&timestamp',
    })
  }
}

export const db = new PlafinicadorDB()

// Funciones helper
export async function initDB(): Promise<void> {
  await db.open()
  await ensureConfig()
}

async function ensureConfig(): Promise<void> {
  const configCount = await db.configuracion.count()
  if (configCount === 0) {
    await db.configuracion.add({
      id: 'config',
      cursoEscolarActual: '2026-2027',
      fechaInicioCurso: new Date('2026-09-01').getTime(),
      fechaFinCurso: new Date('2027-06-30').getTime(),
      festivos: [],
      vacaciones: [],
    })
  }
}

export async function getConfig() {
  return await db.configuracion.get('config')
}

export async function updateConfig(config: Parameters<typeof db.configuracion.update>[1]): Promise<void> {
  await db.configuracion.update('config', config)
}

export async function getCuadernos() {
  return await db.cuadernos.toArray()
}

export async function getCuaderno(id: string) {
  return await db.cuadernos.get(id)
}

export async function saveCuaderno(cuaderno: Parameters<typeof db.cuadernos.put>[0]): Promise<string> {
  await db.cuadernos.put(cuaderno)
  return cuaderno.id
}

export async function deleteCuaderno(id: string): Promise<void> {
  await db.cuadernos.delete(id)
}

export async function createBackup(descripcion: string): Promise<number> {
  const timestamp = Date.now()
  await db.backup.add({
    timestamp,
    descripcion,
    data: '',
  })
  return timestamp
}

export async function getBackups() {
  return await db.backup.orderBy('timestamp').reverse().toArray()
}

export async function deleteBackup(timestamp: number): Promise<void> {
  await db.backup.delete(String(timestamp))
}
