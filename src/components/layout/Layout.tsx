import React from 'react'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { AppHeader } from './AppHeader'
import { useCuadernoStore } from '../../stores/useCuadernoStore'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { cuadernoActual, isLoading, error } = useCuadernoStore()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-md px-4">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Error</h2>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!cuadernoActual) {
    return null // App maneja este caso
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="md:ml-64 pb-16 md:pb-0">
        <AppHeader />
        <main className="p-4 md:p-6">{children}</main>
      </div>
      <BottomNav />
    </div>
  )
}
