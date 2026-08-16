import { test, expect } from './fixtures'
import { crearCuaderno, irASeccion } from './helpers'

test.describe('Reuniones', () => {
  test('crear una reunión y verla en la lista', async ({ page, testUser }) => {
    await crearCuaderno(page, testUser)
    await irASeccion(page, 'Reuniones')

    await page.getByRole('button', { name: 'Crear reunión' }).click()
    await expect(page.getByRole('heading', { name: 'Nueva Reunión' })).toBeVisible()

    const titulo = 'Claustro de prueba E2E'
    await page.getByPlaceholder('Ej: Claustro mensual de septiembre').fill(titulo)
    await page.getByRole('button', { name: 'Guardar' }).click()

    await expect(page.getByRole('heading', { name: 'Nueva Reunión' })).not.toBeVisible()
    await expect(page.getByText(titulo)).toBeVisible()
  })
})
