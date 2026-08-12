import { isSameDay, isWithinInterval, startOfDay, endOfDay } from 'date-fns'
import type { Configuracion } from '../types'

export function esDiaFestivo(fecha: Date, festivos: Configuracion['festivos']): boolean {
  return festivos.some((f) => isSameDay(new Date(f.fecha), fecha))
}

export function esDiaVacaciones(fecha: Date, vacaciones: Configuracion['vacaciones']): boolean {
  return vacaciones.some((v) =>
    isWithinInterval(fecha, { start: startOfDay(new Date(v.inicio)), end: endOfDay(new Date(v.fin)) })
  )
}

export function festivoDelDia(fecha: Date, festivos: Configuracion['festivos']) {
  return festivos.find((f) => isSameDay(new Date(f.fecha), fecha))
}

export function vacacionDelDia(fecha: Date, vacaciones: Configuracion['vacaciones']) {
  return vacaciones.find((v) =>
    isWithinInterval(fecha, { start: startOfDay(new Date(v.inicio)), end: endOfDay(new Date(v.fin)) })
  )
}
