import { test, expect } from './fixtures'
import { crearCuaderno } from './helpers'

test.describe('Navegación (desktop, Sidebar)', () => {
  test('las 4 secciones se cargan y muestran el título correcto en el header', async ({ page, testUser }) => {
    await crearCuaderno(page, testUser)

    const secciones: { boton: string; titulo: string }[] = [
      { boton: 'Calendario', titulo: 'Planificación' },
      { boton: 'Reuniones', titulo: 'Reuniones' },
      { boton: 'Notas', titulo: 'Notas' },
      { boton: 'Horarios', titulo: 'Horarios' },
    ]

    const sidebar = page.locator('aside')

    for (const { boton, titulo } of secciones) {
      await sidebar.getByRole('button', { name: boton, exact: true }).click()
      await expect(page.getByRole('heading', { name: titulo, level: 1 })).toBeVisible()
    }
  })
})

test.describe('Navegación (móvil, BottomNav)', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('las 4 secciones son accesibles desde la barra inferior', async ({ page, testUser }) => {
    await crearCuaderno(page, testUser)

    const bottomNav = page.locator('nav').filter({ hasText: 'Planificar' })

    const secciones: { boton: string; titulo: string }[] = [
      { boton: 'Planificar', titulo: 'Planificación' },
      { boton: 'Reuniones', titulo: 'Reuniones' },
      { boton: 'Notas', titulo: 'Notas' },
      { boton: 'Horario', titulo: 'Horarios' },
    ]

    for (const { boton, titulo } of secciones) {
      await bottomNav.getByRole('button', { name: boton, exact: true }).click()
      await expect(page.getByRole('heading', { name: titulo, level: 1 })).toBeVisible()
    }
  })
})
