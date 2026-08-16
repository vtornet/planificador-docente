import { test, expect } from './fixtures'
import { crearCuaderno, irASeccion } from './helpers'

test.describe('Notas', () => {
  test('crear una nota con el editor de texto rico y verla en la lista', async ({ page, testUser }) => {
    await crearCuaderno(page, testUser)
    await irASeccion(page, 'Notas')

    await page.getByRole('button', { name: 'Crear nota' }).click()
    await expect(page.getByRole('heading', { name: 'Nueva Nota' })).toBeVisible()

    const titulo = 'Nota de prueba E2E'
    await page.getByPlaceholder('Ej: Proyecto de fin de curso').fill(titulo)
    await page.locator('.ProseMirror').click()
    await page.keyboard.type('Contenido de prueba escrito por el test E2E.')

    await page.getByRole('button', { name: 'Guardar' }).click()

    await expect(page.getByRole('heading', { name: 'Nueva Nota' })).not.toBeVisible()
    await expect(page.getByText(titulo)).toBeVisible()
  })
})
