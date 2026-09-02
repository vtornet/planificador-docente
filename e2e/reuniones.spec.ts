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

  test('cerrar con cambios sin guardar muestra el aviso de la app, no el del sistema', async ({ page, testUser }) => {
    await crearCuaderno(page, testUser)
    await irASeccion(page, 'Reuniones')

    await page.getByRole('button', { name: 'Crear reunión' }).click()
    await page.getByPlaceholder('Ej: Claustro mensual de septiembre').fill('Reunión a medias E2E')

    // Aspa con cambios sin guardar: sale el aviso propio (un alertdialog del
    // DOM, no el window.confirm del navegador, que Playwright no vería como tal).
    await cerrarModal(page)
    await expect(page.getByRole('alertdialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: '¿Cerrar sin guardar?' })).toBeVisible()

    // "Seguir editando" mantiene el formulario y lo escrito.
    await page.getByRole('button', { name: 'Seguir editando' }).click()
    await expect(page.getByRole('alertdialog')).not.toBeVisible()
    await expect(page.getByPlaceholder('Ej: Claustro mensual de septiembre')).toHaveValue('Reunión a medias E2E')

    // "Cerrar sin guardar" descarta y cierra.
    await cerrarModal(page)
    await page.getByRole('button', { name: 'Cerrar sin guardar' }).click()
    await expect(page.getByRole('heading', { name: 'Nueva Reunión' })).not.toBeVisible()
    await expect(page.getByText('Reunión a medias E2E')).not.toBeVisible()
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
