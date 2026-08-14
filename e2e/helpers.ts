import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

/**
 * Completa el onboarding (crear cuaderno nuevo) y deja la app en la vista de
 * Horarios. Cada test de Playwright arranca con un browser context nuevo, así
 * que IndexedDB está siempre vacía al empezar — no hace falta limpiar nada.
 */
export async function crearCuaderno(
  page: Page,
  datos: { centro?: string; docente?: string; cursoEscolar?: string } = {}
) {
  const { centro = 'IES Prueba E2E', docente = 'Docente de Prueba', cursoEscolar = '2026-2027' } = datos

  await page.goto('/')

  await page.getByPlaceholder('Centro (ej: IES Mi Instituto)').fill(centro)
  await page.getByPlaceholder('Tu nombre').fill(docente)
  const cursoInput = page.getByPlaceholder('Curso escolar (ej: 2026-2027)')
  await cursoInput.fill('')
  await cursoInput.fill(cursoEscolar)

  await page.getByRole('button', { name: 'Crear cuaderno' }).click()

  await expect(page.getByRole('heading', { name: 'Horarios', level: 1 })).toBeVisible()
}

/** Navega a una sección usando el Sidebar de escritorio. */
export async function irASeccion(page: Page, seccion: 'Horarios' | 'Calendario' | 'Reuniones' | 'Notas') {
  await page.locator('aside').getByRole('button', { name: seccion, exact: true }).click()
}
