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

  test('el icono de descarga de una nota exporta solo esa nota a PDF, imagen incluida', async ({ page, testUser }) => {
    await crearCuaderno(page, testUser)
    await irASeccion(page, 'Notas')

    await page.getByRole('button', { name: 'Crear nota' }).click()
    const titulo = 'Nota con imagen para exportar E2E'
    await page.getByPlaceholder('Ej: Proyecto de fin de curso').fill(titulo)
    await page.locator('.ProseMirror').click()
    await page.keyboard.type('Texto de la nota.')

    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.getByTitle('Subir imagen desde el dispositivo').click(),
    ])
    await fileChooser.setFiles('public/icons/icon-192x192.png')
    await expect(page.locator('.ProseMirror img')).toBeVisible()

    await page.getByRole('button', { name: 'Guardar' }).click()
    await expect(page.getByText(titulo)).toBeVisible()

    await page.getByTitle('Descargar esta nota en PDF').first().click()
    await expect(page.getByRole('heading', { name: 'Vista previa' })).toBeVisible()
    await expect(page.locator('canvas').first()).toBeVisible()

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Descargar', exact: true }).click(),
    ])
    expect(download.suggestedFilename()).toMatch(/^nota-.*\.pdf$/)
  })

  test('una imagen subida a una nota se ve en el modo Ver, no solo el texto', async ({ page, testUser }) => {
    await crearCuaderno(page, testUser)
    await irASeccion(page, 'Notas')

    await page.getByRole('button', { name: 'Crear nota' }).click()
    const titulo = 'Nota con imagen para ver E2E'
    await page.getByPlaceholder('Ej: Proyecto de fin de curso').fill(titulo)
    await page.locator('.ProseMirror').click()
    await page.keyboard.type('Texto antes de la imagen.')

    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.getByTitle('Subir imagen desde el dispositivo').click(),
    ])
    await fileChooser.setFiles('public/icons/icon-192x192.png')
    await expect(page.locator('.ProseMirror img')).toBeVisible()

    await page.getByRole('button', { name: 'Guardar' }).click()
    await expect(page.getByText(titulo)).toBeVisible()

    // Las imágenes se guardan como data: URL — el parser de HTML de Tiptap las
    // descarta salvo que el nodo Image tenga allowBase64 activado (ver
    // TiptapEditor.tsx). Sin ese ajuste, el modo Ver mostraba el texto pero no
    // la imagen porque el contenido se reconstruye desde el HTML guardado.
    await page.getByText(titulo).click()
    await expect(page.locator('.ProseMirror img')).toBeVisible()
  })
})
