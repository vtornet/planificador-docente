import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { DialogosHost } from './components/ui/dialogos.tsx'
import { InstallPrompt } from './components/layout/InstallPrompt.tsx'
// Importado lo primero: registra el listener de `beforeinstallprompt`, que
// Chrome dispara muy pronto y una sola vez (si no se captura, se pierde).
import './utils/pwaInstall.ts'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <DialogosHost />
    <InstallPrompt />
  </StrictMode>,
)
