// Convierte el valor de un <input type="date"> ("yyyy-MM-dd") a un Date en
// hora LOCAL (medianoche local), no en UTC. `new Date('yyyy-MM-dd')` lo
// interpreta como medianoche UTC, lo que lo desajusta unas horas respecto a
// las fechas que se construyen en el resto de la app (con date-fns, siempre
// en hora local) y puede desplazar comparaciones "de día exacto" cerca de
// medianoche (ej. la pregunta de "todo el periodo/solo esta semana"
// disparándose aunque las fechas coincidan exactamente con la semana).
export function parseFechaInput(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}
