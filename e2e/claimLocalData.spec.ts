import type { Page } from '@playwright/test'
import { test, expect } from './fixtures'
import { iniciarSesion } from './helpers'
import { getSupabaseAdmin } from './supabaseAdmin'

// Verifica en vivo la Fase E (reclamar cuadernos locales sin cuenta), que
// hasta ahora solo tenía tsc/build limpios pero ninguna prueba real.
//
// El escenario real que hay que reproducir es un cuaderno de antes de existir
// cuentas: uno que NUNCA se ha subido a Supabase, no simplemente uno al que
// se le borra el userId localmente. La primera versión de este test cometía
// justo ese error (crear el cuaderno con la app, que lo sincroniza al
// instante, y solo luego borrarle el userId en Dexie) — como la fila ya
// existía en Supabase bajo esa cuenta, reconcileCuadernosConSupabase la volvía
// a asociar por su cuenta en el siguiente reload, dando un falso positivo
// (el diálogo no volvía a aparecer aunque se declinara, sin que el código de
// declinar tuviera nada que ver). Para probar el camino real, el cuaderno se
// inyecta directamente en IndexedDB —bypasseando createCuaderno del todo—
// así nunca hay fila en Supabase salvo que reclamarCuadernoLocal la cree.
async function crearCuadernoHuerfano(
  page: Page,
  opts: { id: string; centro: string; horarios?: number }
) {
  await page.evaluate(
    async ({ id, centro, horarios }) => {
      const req = indexedDB.open('PlafinicadorDB')
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
      })
      const ahora = Date.now()
      const cursoEscolar = '2026-2027'
      const docente = 'Docente Huérfano E2E'
      const data = {
        id,
        metadata: { cursoEscolar, centro, docente, creado: new Date(ahora), actualizado: new Date(ahora) },
        horarios: Array.from({ length: horarios }, (_, i) => ({
          id: `horario-huerfano-${i}`,
          tipo: 'docente',
          nombre: `Horario ${i}`,
          datos: [],
          configHorarios: { numPeriodos: 6, horaInicio: '08:00', duracionPeriodo: 55 },
        })),
        planificacion: { mensual: [], semanal: [] },
        reuniones: [],
        notas: [],
        eventos: [],
        configuracion: {
          id: 'config',
          cursoEscolarActual: cursoEscolar,
          fechaInicioCurso: new Date(ahora),
          fechaFinCurso: new Date(ahora),
          festivos: [],
          vacaciones: [],
        },
      }
      // Sin userId a propósito: simula un cuaderno de antes de existir cuentas,
      // que nunca ha pasado por createCuaderno ni por ningún sync.
      const fila = {
        id,
        metadata: { cursoEscolar, centro, docente, creado: ahora, actualizado: ahora },
        data,
      }
      const tx = db.transaction('cuadernos', 'readwrite')
      tx.objectStore('cuadernos').put(fila)
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
      })
      db.close()
    },
    opts
  )
}

test.describe('Reclamar cuadernos locales sin cuenta (Fase E)', () => {
  test('un cuaderno huérfano dispara el diálogo de reclamo, se sube a Supabase y no vuelve a aparecer', async ({ page, testUser }) => {
    await iniciarSesion(page, testUser)
    const id = `huerfano-aceptar-${Date.now()}`
    await crearCuadernoHuerfano(page, { id, centro: 'IES Fase E', horarios: 1 })
    await page.reload()

    // Fase 1 del diálogo: vista previa antes de confirmar.
    await expect(page.getByRole('heading', { name: /Hemos encontrado/ })).toBeVisible()
    await expect(page.getByText('IES Fase E')).toBeVisible()
    await expect(page.getByText(/1 horario.*0 reuniones.*0 notas.*0 semanas.*0 eventos/)).toBeVisible()
    // Con testUser (suscripción activa por defecto en la fixture) no debe
    // avisar de límite de prueba, aunque haya contenido.
    await expect(page.getByText(/Supera el límite/)).not.toBeVisible()

    // Antes de confirmar: la fila no existe en Supabase todavía (nunca se ha
    // subido) — confirma que el escenario es fiel al real, no un cuaderno ya
    // sincronizado de antemano.
    const admin = getSupabaseAdmin()
    const { data: antes } = await admin.from('cuadernos').select('id').eq('id', id)
    expect(antes).toHaveLength(0)

    await page.getByRole('button', { name: 'Sí, subir mis datos' }).click()

    // Fase 2: resultado — subido correctamente (sin superar el tope).
    await expect(page.getByRole('heading', { name: 'Cuadernos asociados a tu cuenta' })).toBeVisible()
    await expect(page.getByText('IES Fase E')).toBeVisible()
    await expect(page.getByText(/necesita suscripción/)).not.toBeVisible()

    await page.getByRole('button', { name: 'Continuar' }).click()

    // La app se desbloquea con normalidad tras resolver el diálogo.
    await expect(page.getByRole('heading', { name: 'Horarios', level: 1 })).toBeVisible()

    // El cuaderno reclamado se subió de verdad a Supabase — comprobado con el
    // cliente admin (salta RLS) contra la fila real.
    const { data: filas, error } = await admin.from('cuadernos').select('id, user_id, metadata').eq('id', id)
    expect(error).toBeNull()
    expect(filas).toHaveLength(1)
    expect(filas![0].user_id).toBe(testUser.id)
    expect((filas![0].metadata as any).centro).toBe('IES Fase E')

    // Al recargar, el cuaderno ya tiene userId marcado en Dexie: el diálogo
    // de reclamo no debe volver a aparecer.
    await page.reload()
    await expect(page.getByRole('heading', { name: /Hemos encontrado/ })).not.toBeVisible()
    await expect(page.getByRole('heading', { name: 'Horarios', level: 1 })).toBeVisible()
  })

  test('declinar el reclamo desbloquea la app, no sube nada a Supabase y vuelve a preguntar en el próximo inicio de sesión', async ({ page, testUser }) => {
    await iniciarSesion(page, testUser)
    const id = `huerfano-declinar-${Date.now()}`
    await crearCuadernoHuerfano(page, { id, centro: 'IES Fase E Declinar' })
    await page.reload()

    await expect(page.getByRole('heading', { name: /Hemos encontrado/ })).toBeVisible()
    await page.getByRole('button', { name: 'No, empezar de cero' }).click()

    // La app se desbloquea igualmente (declinar no es un callejón sin salida).
    await expect(page.getByRole('heading', { name: 'Horarios', level: 1 })).toBeVisible()

    // Declinar no debe subir nada — el cuaderno huérfano nunca se ha
    // sincronizado y sigue sin hacerlo.
    const admin = getSupabaseAdmin()
    const { data: filas, error } = await admin.from('cuadernos').select('id').eq('id', id)
    expect(error).toBeNull()
    expect(filas).toHaveLength(0)

    // A diferencia de aceptar, declinar NO marca el cuaderno con el userId en
    // Dexie (decisión deliberada, ver ClaimLocalDataDialog/App.tsx) — así que
    // el siguiente inicio de sesión debe volver a preguntar.
    await page.reload()
    await expect(page.getByRole('heading', { name: /Hemos encontrado/ })).toBeVisible()
  })
})
