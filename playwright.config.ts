import { defineConfig, devices } from '@playwright/test'
import { loadEnv } from 'vite'

// `npm run build`/`preview` (más abajo, en webServer) leen .env solos porque
// Vite lo hace por su cuenta al compilar — pero este archivo y los fixtures
// de e2e/ corren en un proceso Node aparte (el runner de Playwright), que no
// carga .env por su cuenta. loadEnv() ya viene con Vite (dependencia
// existente, no hace falta añadir dotenv); el prefijo '' vacío es a propósito
// para incluir también SUPABASE_SERVICE_ROLE_KEY, que no lleva VITE_.
Object.assign(process.env, loadEnv('development', process.cwd(), ''))

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
