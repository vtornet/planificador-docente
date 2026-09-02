import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'
import type { TestUser } from './testUser'

/**
 * Inicia sesión con una usuaria de prueba (ver e2e/fixtures.ts) y espera a
 * que la app pase la puerta de login. No asume qué pantalla viene después
 * (onboarding para una cuenta nueva sin cuadernos, o la app ya cargada si el
 * test reutiliza sesión) — cada llamador espera lo que necesite a continuación.
 */
export async function iniciarSesion(page: Page, testUser: TestUser) {
  await page.goto('/')

  await page.getByPlaceholder('tu@email.com').fill(testUser.email)
  await page.getByPlaceholder('••••••••').fill(testUser.password)
  // "Iniciar sesión" también es el texto de la pestaña (modo por defecto, ya
  // activa) además del botón de enviar — se acota al <form> para no ambigüar
  // entre los dos.
  await page.locator('form').getByRole('button', { name: 'Iniciar sesión' }).click()

  await expect(page.getByPlaceholder('tu@email.com')).not.toBeVisible()
}

/**
 * Inicia sesión y completa el onboarding (crear cuaderno nuevo), dejando la
 * app en la vista de Horarios. Cada test de Playwright arranca con un browser
 * context nuevo (IndexedDB vacía) y una cuenta Supabase efímera propia (ver
 * fixtures.ts), así que no hace falta limpiar nada entre tests.
 */
export async function crearCuaderno(
  page: Page,
  testUser: TestUser,
  datos: { centro?: string; docente?: string; cursoEscolar?: string; etapaEducativa?: string } = {}
) {
  const { centro = 'IES Prueba E2E', docente = 'Docente de Prueba', cursoEscolar = '2026-2027', etapaEducativa } = datos

  await iniciarSesion(page, testUser)

  await page.getByPlaceholder('Centro (ej: IES Mi Instituto)').fill(centro)
  await page.getByPlaceholder('Tu nombre').fill(docente)
  const cursoInput = page.getByPlaceholder('Curso escolar (ej: 2026-2027)')
  await cursoInput.fill('')
  await cursoInput.fill(cursoEscolar)

  if (etapaEducativa) {
    await page
      .locator('select', { has: page.locator('option', { hasText: 'Etapa educativa (opcional)' }) })
      .selectOption({ label: etapaEducativa })
  }

  await page.getByRole('button', { name: 'Crear cuaderno' }).click()

  await expect(page.getByRole('heading', { name: 'Horarios', level: 1 })).toBeVisible()
}

/** Navega a una sección usando el Sidebar de escritorio. */
export async function irASeccion(page: Page, seccion: 'Horarios' | 'Calendario' | 'Reuniones' | 'Notas') {
  await page.locator('aside').getByRole('button', { name: seccion, exact: true }).click()
}

/**
 * Cierra el modal abierto pulsando el aspa. Los formularios de creación/edición
 * (Reunión, Nota, Evento, Perfil) ya NO se cierran al pulsar "Guardar" ni al
 * pulsar fuera del modal: guardan y siguen abiertos, y se cierran con el aspa
 * o el botón "Cerrar". `.first()` apunta al aspa (aria-label "Cerrar"), que
 * está siempre y va antes en el DOM que el botón "Cerrar" del pie.
 */
export async function cerrarModal(page: Page) {
  await page.getByRole('button', { name: 'Cerrar' }).first().click()
}
