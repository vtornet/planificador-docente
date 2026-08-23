export type BackEntry = { onBack: () => void }

// Pila LÓGICA de lo que la app considera "abierto" ahora mismo (Dialogs,
// niveles de HorarioManager...). Se actualiza de forma síncrona en cada
// push/resolve; el historial REAL del navegador se sincroniza con ella en un
// microtask aparte (ver `flush`), no en cada llamada.
const stack: BackEntry[] = []

// Profundidad que creemos tener apilada de verdad en window.history — se
// corrige, en cada popstate, leyendo `event.state.__appDepth` en vez de
// contar eventos a mano: un `history.go(-n)` con n>1 no siempre dispara n
// eventos `popstate` por separado (Chrome puede colapsarlos en uno solo), así
// que llevar la cuenta nosotros mismos se desincronizaba (bug real
// encontrado con Playwright: tras un salto de 2 niveles, el siguiente atrás
// físico genuino se ignoraba porque el contador de "eventos a ignorar" se
// quedaba en 1). Leer el `state` real del navegador es la única fuente de
// verdad que no depende de cuántos eventos se disparen.
let realDepth = 0
let flushScheduled = false
let listening = false

function ensureListener() {
  if (listening) return
  listening = true
  window.addEventListener('popstate', (e) => {
    const nuevaProfundidad = typeof e.state?.__appDepth === 'number' ? e.state.__appDepth : 0
    realDepth = nuevaProfundidad
    // Normalmente es 1 nivel, pero un solo popstate puede representar más de
    // un paso (ej. el propio `history.go(-2)` de más abajo, o un salto en el
    // historial del navegador ajeno a nosotros) — deshacer todos los que
    // queden por encima de la nueva profundidad real, de más reciente a más
    // antiguo. Si la profundidad ya coincidía (popstate "eco" de un cambio
    // que ya habíamos aplicado nosotros mismos vía resolveBackEntry), el
    // bucle no hace nada.
    while (stack.length > nuevaProfundidad) {
      const entry = stack.pop()
      entry?.onBack()
    }
  })
}

function scheduleFlush() {
  if (flushScheduled) return
  flushScheduled = true
  queueMicrotask(() => {
    flushScheduled = false
    const delta = stack.length - realDepth
    if (delta > 0) {
      for (let i = 0; i < delta; i++) {
        realDepth += 1
        window.history.pushState({ __appDepth: realDepth }, '')
      }
    } else if (delta < 0) {
      realDepth += delta
      window.history.go(delta)
    }
  })
}

/**
 * Apila una entrada asociada a un estado "abierto" de la app (un Dialog, un
 * nivel de navegación de HorarioManager...), para que el botón/gesto físico
 * de "atrás" de Android lo cierre en vez de cerrar la app entera.
 *
 * Es una única pila COMPARTIDA por toda la app a propósito, no una por
 * componente: el botón atrás siempre debe deshacer lo último que se abrió,
 * sea lo que sea, y solo una pila global puede garantizarlo cuando hay cosas
 * anidadas (ej. un Dialog abierto sobre un nivel de HorarioManager) — con
 * pilas independientes, un mismo `popstate` llegaría a todas a la vez y cada
 * una reaccionaría por su cuenta, desincronizando el estado.
 *
 * El historial real no se toca aquí mismo, sino en un microtask (`flush`):
 * si en el mismo tick se resuelve una entrada y se apila otra (ej. cambiar de
 * "Ver nota" a "Editar nota", un Dialog que se cierra y otro que se abre a la
 * vez), un `history.back()` síncrono mezclado con un `pushState` síncrono
 * puede desincronizar la posición real del historial (el `back()` es
 * asíncrono y actúa sobre la posición que haya EN EL MOMENTO en que se
 * ejecuta, no en el momento en que se llamó) — agrupar ambos cambios y
 * aplicar solo el neto evita esa condición de carrera.
 */
export function pushBackEntry(onBack: () => void): BackEntry {
  ensureListener()
  const entry: BackEntry = { onBack }
  stack.push(entry)
  scheduleFlush()
  return entry
}

/**
 * Marca una entrada como cerrada por un medio distinto al botón atrás (X,
 * click fuera, Escape, un botón "Volver" en pantalla): la quita de la pila
 * lógica ya mismo y deja que el siguiente microtask consuma (o no, si se
 * compensa con un push en el mismo tick) la entrada de historial real
 * correspondiente. Nunca llama a `onBack` (quien la resuelve ya ha
 * actualizado el estado por su cuenta).
 */
export function resolveBackEntry(entry: BackEntry) {
  const idx = stack.indexOf(entry)
  if (idx === -1) return
  stack.splice(idx, 1)
  scheduleFlush()
}
