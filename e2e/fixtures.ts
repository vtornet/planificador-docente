import { test as base, expect } from '@playwright/test'
import { crearUsuarioPrueba, eliminarUsuarioPrueba, type TestUser } from './testUser'

/**
 * Extiende el test de Playwright con una fixture `testUser`: una cuenta
 * Supabase efímera, creada antes del test y borrada después, independiente
 * de cualquier otro test que corra en paralelo (ver testUser.ts). Todos los
 * specs deben importar `test`/`expect` de aquí en vez de '@playwright/test'
 * directamente, para pasar por la puerta de login (ver App.tsx).
 */
export const test = base.extend<{ testUser: TestUser }>({
  testUser: async ({}, use) => {
    const user = await crearUsuarioPrueba()
    try {
      await use(user)
    } finally {
      await eliminarUsuarioPrueba(user.id)
    }
  },
})

export { expect }
