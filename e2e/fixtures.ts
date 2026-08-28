import { test as base, expect } from '@playwright/test'
import { crearUsuarioPrueba, eliminarUsuarioPrueba, type TestUser } from './testUser'

/**
 * Extiende el test de Playwright con una fixture `testUser`: una cuenta
 * Supabase efímera, creada antes del test y borrada después, independiente
 * de cualquier otro test que corra en paralelo (ver testUser.ts). Todos los
 * specs deben importar `test`/`expect` de aquí en vez de '@playwright/test'
 * directamente, para pasar por la puerta de login (ver App.tsx).
 */
export const test = base.extend<{ testUser: TestUser; testUserTrial: TestUser; testAdmin: TestUser }>({
  testUser: async ({}, use) => {
    const user = await crearUsuarioPrueba()
    try {
      await use(user)
    } finally {
      await eliminarUsuarioPrueba(user.id)
    }
  },

  // Cuenta de prueba SIN suscripción activa (sujeta al tope de la prueba
  // gratuita) — para los tests que necesitan probar precisamente ese límite,
  // a diferencia de `testUser`, que lo evita a propósito.
  testUserTrial: async ({}, use) => {
    const user = await crearUsuarioPrueba({ suscripcion: 'trial' })
    try {
      await use(user)
    } finally {
      await eliminarUsuarioPrueba(user.id)
    }
  },

  // Cuenta con profiles.is_admin = true — para los tests del panel de
  // administración (e2e/admin.spec.ts). Requiere la migración 0005 aplicada.
  testAdmin: async ({}, use) => {
    const user = await crearUsuarioPrueba({ admin: true })
    try {
      await use(user)
    } finally {
      await eliminarUsuarioPrueba(user.id)
    }
  },
})

export { expect }
