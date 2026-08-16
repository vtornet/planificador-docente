import { test, expect } from './fixtures'
import { iniciarSesion } from './helpers'

test.describe('Onboarding', () => {
  test('el botón de crear cuaderno está deshabilitado hasta rellenar los 3 campos', async ({ page, testUser }) => {
    await iniciarSesion(page, testUser)

    // El campo "Curso escolar" viene precargado con una sugerencia por
    // defecto, así que el botón se habilita en cuanto Centro y Docente
    // también tienen contenido (no hace falta tocar Curso escolar).
    const botonCrear = page.getByRole('button', { name: 'Crear cuaderno' })
    await expect(botonCrear).toBeDisabled()

    await page.getByPlaceholder('Centro (ej: IES Mi Instituto)').fill('IES Prueba E2E')
    await expect(botonCrear).toBeDisabled()

    await page.getByPlaceholder('Tu nombre').fill('Docente de Prueba')
    await expect(botonCrear).toBeEnabled()

    const cursoInput = page.getByPlaceholder('Curso escolar (ej: 2026-2027)')
    await cursoInput.fill('')
    await expect(botonCrear).toBeDisabled()

    await cursoInput.fill('2026-2027')
    await expect(botonCrear).toBeEnabled()
  })

  test('crear un cuaderno lleva directo a la vista de Horarios', async ({ page, testUser }) => {
    await iniciarSesion(page, testUser)

    await page.getByPlaceholder('Centro (ej: IES Mi Instituto)').fill('IES Prueba E2E')
    await page.getByPlaceholder('Tu nombre').fill('Docente de Prueba')
    const cursoInput = page.getByPlaceholder('Curso escolar (ej: 2026-2027)')
    await cursoInput.fill('')
    await cursoInput.fill('2026-2027')

    await page.getByRole('button', { name: 'Crear cuaderno' }).click()

    await expect(page.getByRole('heading', { name: 'Horarios', level: 1 })).toBeVisible()
    await expect(page.getByText('IES Prueba E2E · 2026-2027')).toBeVisible()
  })
})
