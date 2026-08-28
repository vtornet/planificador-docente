/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// Con dominio propio (docenza.app), GitHub Pages sirve la app en la raíz del
// dominio, no en una subruta — a diferencia de antes (vtornet.github.io/
// planificador-docente/), donde hacía falta el prefijo. Ya no depende de
// ninguna variable de entorno de build.
const base = '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    nodePolyfills({
      // Whether to polyfill specific globals.
      globals: {
        Buffer: true, // can also be 'build', 'dev', or false
        global: true,
        process: true,
      },
      // Whether to polyfill `process` on legacy browsers (~0.1% browsers)
      // process: true,
    }),
    VitePWA({
      registerType: 'autoUpdate',
      // 'script-defer' añade defer al <script> de registro del Service Worker
      // para que no bloquee el primer render (Lighthouse lo marcaba como
      // recurso que bloquea el renderizado). El registro del SW no necesita
      // ocurrir antes de pintar.
      injectRegister: 'script-defer',
      includeAssets: ['favicon.ico', 'favicon-256.png', 'icons/*.png'],
      manifest: {
        name: 'Docenza',
        short_name: 'Docenza',
        description: 'Docenza, planificador digital para docentes',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: base,
        start_url: base,
        icons: [
          {
            src: `${base}icons/icon-192x192.png`,
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: `${base}icons/icon-512x512.png`,
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: `${base}icons/icon-maskable-512x512.png`,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      }
    })
  ],
  server: {
    port: 5173,
    host: true
  },
  test: {
    // Utilidades puras, sin DOM — 'node' basta y arranca más rápido que
    // 'jsdom'. Si algún día se testean componentes React, esto tendría que
    // pasar a 'jsdom' (o un `environmentMatchGlobs` por carpeta).
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
