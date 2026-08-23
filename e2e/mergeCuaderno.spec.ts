import { test, expect } from './fixtures'
import { crearCuaderno, iniciarSesion, irASeccion } from './helpers'

// Verifica en vivo el punto 3 de los riesgos abiertos: "pérdida de datos en
// ediciones concurrentes en dos dispositivos offline a la vez (gana el
// cuaderno completo más reciente, no hay merge por campo)". Simula dos
// dispositivos reales con dos BrowserContext independientes (IndexedDB
// propia cada uno) que inician sesión con la MISMA cuenta, para que
// reconcileCuadernosConSupabase tenga algo real que fusionar.
test.describe('Fusión de cuadernos entre dispositivos (mergeCuaderno)', () => {
  test('editar módulos distintos en dos dispositivos offline: ambos cambios sobreviven al reconectar', async ({ page, context, browser, testUser }) => {
    // Dispositivo A: crea el cuaderno (queda sincronizado en Supabase).
    await crearCuaderno(page, testUser, { centro: 'IES Fusión' })

    // Dispositivo B: inicia sesión con la misma cuenta — recibe el mismo
    // cuaderno vía reconcile, no pasa por onboarding.
    const contextB = await browser.newContext()
    const pageB = await contextB.newPage()
    await iniciarSesion(pageB, testUser)
    await expect(pageB.getByRole('heading', { name: 'Horarios', level: 1 })).toBeVisible()

    // Entra en Reuniones MIENTRAS sigue online, para precargar su chunk
    // (React.lazy) antes de cortar la conexión — si se navega ahí ya sin
    // conexión, el import() dinámico no puede descargar el chunk y el
    // Suspense se queda colgado para siempre (hallazgo real al escribir este
    // test: fallaba de forma intermitente, 2 de 3 veces, siempre en el mismo
    // punto, hasta precargar el chunk aquí).
    await irASeccion(pageB, 'Reuniones')
    await expect(pageB.getByRole('button', { name: 'Crear reunión' })).toBeVisible()

    // Ambos dispositivos se quedan sin conexión antes de editar cada uno lo
    // suyo — ninguno de los dos sabe todavía lo que hizo el otro.
    await context.setOffline(true)
    await contextB.setOffline(true)

    // Dispositivo A (offline): crea un horario.
    await page.getByRole('button', { name: '+ Nuevo horario' }).click()
    await page.getByPlaceholder('Ej: Horario 1º ESO A').fill('Horario Dispositivo A')
    const fechasA = page.locator('input[type="date"]')
    await fechasA.first().fill('')
    await fechasA.nth(1).fill('')
    await page.getByRole('button', { name: 'Crear' }).click()
    await expect(page.getByRole('heading', { name: 'Nuevo horario' })).not.toBeVisible()

    // Dispositivo B (offline, ya en Reuniones con el chunk precargado): crea
    // una reunión — un módulo totalmente distinto al de A, para que el
    // conflicto sea real y no dentro del mismo array.
    await pageB.getByRole('button', { name: 'Crear reunión' }).click()
    await pageB.getByPlaceholder('Ej: Claustro mensual de septiembre').fill('Reunión Dispositivo B')
    await pageB.getByRole('button', { name: 'Guardar', exact: true }).click()
    await expect(pageB.getByText('Reunión Dispositivo B')).toBeVisible()

    // Dispositivo B recupera la conexión primero y recarga: su reconcile no
    // tiene nada que fusionar todavía (A sigue offline), así que simplemente
    // sube su propia reunión, que hasta ahora solo existía en su Dexie local.
    await contextB.setOffline(false)
    await pageB.reload()
    await expect(pageB.getByRole('heading', { name: 'Horarios', level: 1 })).toBeVisible()

    // Dispositivo A recupera la conexión y recarga: su reconcile fusiona su
    // propio horario (local, nunca llegó a subirse mientras estaba offline)
    // con la reunión que B ya subió — antes de este arreglo, aquí se habría
    // sustituido el cuaderno entero por el más reciente y se habría perdido
    // uno de los dos cambios en silencio.
    await context.setOffline(false)
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Horarios', level: 1 })).toBeVisible()
    await expect(page.getByText(/Ver 1 horario sin periodo asignado/)).toBeVisible()

    await irASeccion(page, 'Reuniones')
    await expect(page.getByText('Reunión Dispositivo B')).toBeVisible()

    // Confirma también que el dispositivo B, al recargar de nuevo, converge
    // con el horario que A acaba de subir — la fusión no es de un solo
    // sentido.
    await pageB.reload()
    await expect(pageB.getByRole('heading', { name: 'Horarios', level: 1 })).toBeVisible()
    await expect(pageB.getByText(/Ver 1 horario sin periodo asignado/)).toBeVisible()

    await contextB.close()
  })

  test('borrar un elemento en un dispositivo no lo resucita al fusionar con la copia (más antigua) de otro', async ({ page, context, browser, testUser }) => {
    // Dispositivo A: crea el cuaderno y una nota, ambos ya sincronizados.
    await crearCuaderno(page, testUser, { centro: 'IES Fusión Borrado' })
    await irASeccion(page, 'Notas')
    await page.getByRole('button', { name: 'Crear nota' }).click()
    const titulo = 'Nota a borrar'
    await page.getByPlaceholder('Ej: Proyecto de fin de curso').fill(titulo)
    await page.locator('.ProseMirror').click()
    await page.keyboard.type('Contenido de prueba.')
    await page.getByRole('button', { name: 'Guardar' }).click()
    await expect(page.getByText(titulo)).toBeVisible()

    // Dispositivo B: inicia sesión y recibe la nota (todavía no se ha
    // borrado en ningún sitio), y a partir de aquí nunca vuelve a tocarla —
    // es el dispositivo con la copia "vieja" que podría resucitarla.
    const contextB = await browser.newContext()
    const pageB = await contextB.newPage()
    await iniciarSesion(pageB, testUser)
    await irASeccion(pageB, 'Notas')
    await expect(pageB.getByText(titulo)).toBeVisible()

    // Dispositivo A borra la nota mientras está sin conexión. El borrado solo
    // está disponible en la vista de lista (no en la de cuadrícula, por
    // defecto) y pasa por un confirm() nativo del navegador.
    await context.setOffline(true)
    await page.getByTitle('Vista de lista').click()
    page.once('dialog', (dialog) => dialog.accept())
    await page.getByTitle('Eliminar esta nota').click()
    await expect(page.getByText(titulo)).not.toBeVisible()

    // A recupera la conexión y sube el borrado (con su tombstone).
    await context.setOffline(false)
    await page.reload()
    await irASeccion(page, 'Notas')
    await expect(page.getByText(titulo)).not.toBeVisible()

    // B, que nunca ha tocado la nota y todavía la tiene en su copia local,
    // recarga y fusiona con el remoto (que ya lleva el borrado + tombstone).
    // Sin el tombstone, la copia de B (más antigua, con la nota todavía
    // presente) la habría hecho reaparecer al fusionar.
    await pageB.reload()
    await irASeccion(pageB, 'Notas')
    await expect(pageB.getByText(titulo)).not.toBeVisible()

    await contextB.close()
  })
})
