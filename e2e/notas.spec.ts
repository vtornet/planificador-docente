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

  test('click en una nota abre el modo Ver (solo lectura) y desde ahí se puede pasar a Editar', async ({ page, testUser }) => {
    await crearCuaderno(page, testUser)
    await irASeccion(page, 'Notas')

    await page.getByRole('button', { name: 'Crear nota' }).click()
    const titulo = 'Nota para ver E2E'
    await page.getByPlaceholder('Ej: Proyecto de fin de curso').fill(titulo)
    await page.locator('.ProseMirror').click()
    await page.keyboard.type('Contenido de la nota.')
    await page.getByRole('button', { name: 'Guardar' }).click()
    await expect(page.getByText(titulo)).toBeVisible()

    // Click en la tarjeta abre el modo Ver, no el editor directamente: no debe
    // aparecer la cabecera "Editar Nota", y el botón "Editar" (propio del
    // visor, no de la tarjeta en vista grid) confirma que estamos en modo Ver.
    await page.getByText(titulo).click()
    await expect(page.getByRole('heading', { name: 'Editar Nota' })).not.toBeVisible()
    const botonEditar = page.getByRole('button', { name: 'Editar', exact: true })
    await expect(botonEditar).toBeVisible()

    await botonEditar.click()
    await expect(page.getByRole('heading', { name: 'Editar Nota' })).toBeVisible()
    await expect(page.locator('.ProseMirror')).toHaveText('Contenido de la nota.')
  })
})
