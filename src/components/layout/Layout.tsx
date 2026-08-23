import React from 'react'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { AppHeader } from './AppHeader'
import { useCuadernoStore } from '../../stores/useCuadernoStore'
import { perfilCompleto } from '../../utils/perfil'
import { CompletarPerfilScreen } from '../perfil/CompletarPerfilScreen'
import { useRecordatoriosEventos } from '../../hooks/useRecordatoriosEventos'
import { useCheckoutReturn } from '../../hooks/useCheckoutReturn'
import { CheckoutStatusBanner } from './CheckoutStatusBanner'
import { SyncTopeBanner } from './SyncTopeBanner'
import { AsistenteChat } from '../ai/AsistenteChat'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { cuadernoActual, isLoading, error } = useCuadernoStore()
  useRecordatoriosEventos()
  const estadoCheckout = useCheckoutReturn()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center animate-fade-in">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center max-w-md px-4 animate-fade-in">
          <div className="text-destructive text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-foreground mb-2">Error</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  if (!cuadernoActual) {
    return null // App maneja este caso
  }

  if (!perfilCompleto(cuadernoActual.metadata)) {
    return <CompletarPerfilScreen />
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Sidebar />
      <div className="md:ml-64 pb-16 md:pb-0">
        <AppHeader />
        <CheckoutStatusBanner estado={estadoCheckout} />
        <SyncTopeBanner />
        <main className="p-4 md:p-6">{children}</main>
      </div>
      <BottomNav />
      <AsistenteChat />
    </div>
  )
}
