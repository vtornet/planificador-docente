import { test, expect } from '@playwright/test'
import { crearCuaderno, irASeccion } from './helpers'

test.describe('Exportación', () => {
  test('la opción "Agenda" está deshabilitada sin eventos y exporta un PDF al crear uno', async ({ page }) => {
    await crearCuaderno(page)

    await page.getByRole('button', { name: 'Exportar' }).click()
    await expect(page.getByRole('menuitem', { name: 'Agenda (eventos)' })).toBeDisabled()
    await page.keyboard.press('Escape')

    await irASeccion(page, 'Calendario')
    await page.getByRole('button', { name: 'Nuevo evento' }).click()
    await page.getByPlaceholder('Ej: Reunión con familias').fill('Evento de prueba E2E')
    await page.getByRole('button', { name: 'Guardar' }).click()

    await page.getByRole('button', { name: 'Exportar' }).click()
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('menuitem', { name: 'Agenda (eventos)' }).click(),
    ])

    expect(download.suggestedFilename()).toMatch(/^agenda-.*\.pdf$/)
  })

  test('exportar el PDF completo del cuaderno descarga un archivo', async ({ page }) => {
    await crearCuaderno(page)

    await page.getByRole('button', { name: 'Exportar' }).click()
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('menuitem', { name: 'PDF completo' }).click(),
    ])

    expect(download.suggestedFilename()).toMatch(/^docenza-completo-.*\.pdf$/)
  })

  test('exportar el backup en JSON descarga un archivo', async ({ page }) => {
    await crearCuaderno(page)

    await page.getByRole('button', { name: 'Exportar' }).click()
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('menuitem', { name: 'Backup (JSON)' }).click(),
    ])

    expect(download.suggestedFilename()).toMatch(/^docenza-.*\.json$/)
  })
})
