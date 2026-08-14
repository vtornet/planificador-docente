import { useEffect, useRef } from 'react'
import { useCuadernoStore } from '../stores/useCuadernoStore'
import { fechaHoraEvento, fechaRecordatorio } from '../utils/recordatorios'
import { fechasOcurrencias } from '../utils/recurrencia'

// Comprueba periódicamente si algún evento con recordatorio debe notificarse
// ahora. Solo funciona mientras la app esté abierta (no hay servidor de push
// en esta app offline-first) — ver nota en CLAUDE.md.
export function useRecordatoriosEventos() {
  const cuadernoActual = useCuadernoStore((s) => s.cuadernoActual)
  const eventos = cuadernoActual?.eventos
  const yaNotificados = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!eventos || eventos.length === 0) return
    if (typeof window === 'undefined' || typeof Notification === 'undefined') return

    const revisar = () => {
      const ahora = new Date()
      eventos.forEach((evento) => {
        if (evento.recordatorio === 'ninguno') return

        // Un evento recurrente puede tener muchas ocurrencias: cada una
        // necesita su propio recordatorio y su propia clave de "ya avisado"
        // (si solo se comprobara evento.fecha, únicamente la primera
        // ocurrencia llegaría a notificarse).
        fechasOcurrencias(evento).forEach((fechaOcurrencia) => {
          // La clave incluye los campos relevantes: si el usuario edita la
          // fecha, hora o el propio recordatorio, vuelve a ser elegible.
          const clave = `${evento.id}:${fechaOcurrencia.toISOString()}:${evento.horaInicio || ''}:${evento.recordatorio}`
          if (yaNotificados.current.has(clave)) return

          const disparo = fechaRecordatorio(evento, fechaOcurrencia)
          const inicio = fechaHoraEvento(evento, fechaOcurrencia)
          if (!disparo) return

          if (ahora >= disparo && ahora < inicio) {
            yaNotificados.current.add(clave)
            if (Notification.permission === 'granted') {
              new Notification(evento.titulo, {
                body: evento.todoElDia ? 'Hoy · Todo el día' : `Hoy a las ${evento.horaInicio}`,
                icon: '/icons/icon-192x192.png',
                tag: evento.id,
              })
            }
          }
        })
      })
    }

    revisar()
    const interval = setInterval(revisar, 30_000)
    return () => clearInterval(interval)
  }, [eventos])
}
