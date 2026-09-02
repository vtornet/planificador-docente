import { test, expect } from './fixtures'
import { crearCuaderno, irASeccion, cerrarModal } from './helpers'

test.describe('Reuniones', () => {
  test('crear una reunión y verla en la lista', async ({ page, testUser }) => {
    await crearCuaderno(page, testUser)
    await irASeccion(page, 'Reuniones')

    await page.getByRole('button', { name: 'Crear reunión' }).click()
    await expect(page.getByRole('heading', { name: 'Nueva Reunión' })).toBeVisible()

    const titulo = 'Claustro de prueba E2E'
    await page.getByPlaceholder('Ej: Claustro mensual de septiembre').fill(titulo)
    await page.getByRole('button', { name: 'Guardar' }).click()

    // "Guardar" ya no cierra el modal: guarda y se queda abierto.
    await expect(page.getByText('Guardado')).toBeVisible()
    await cerrarModal(page)

    await expect(page.getByRole('heading', { name: 'Nueva Reunión' })).not.toBeVisible()
    await expect(page.getByText(titulo)).toBeVisible()
  })

  test('el icono de descarga de una reunión exporta solo esa reunión a PDF', async ({ page, testUser }) => {
    await crearCuaderno(page, testUser)
    await irASeccion(page, 'Reuniones')

    await page.getByRole('button', { name: 'Crear reunión' }).click()
    const titulo = 'Reunión para exportar E2E'
    await page.getByPlaceholder('Ej: Claustro mensual de septiembre').fill(titulo)
    await page.getByRole('button', { name: 'Guardar' }).click()
    await cerrarModal(page)
    await expect(page.getByText(titulo)).toBeVisible()

    await page.getByRole('button', { name: 'Descargar esta reunión en PDF' }).click()
    await expect(page.getByRole('heading', { name: 'Vista previa' })).toBeVisible()
    await expect(page.locator('canvas').first()).toBeVisible()

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Descargar', exact: true }).click(),
    ])

    expect(download.suggestedFilename()).toMatch(/^reunion-.*\.pdf$/)
  })
})
