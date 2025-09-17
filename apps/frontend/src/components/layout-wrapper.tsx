// src/components/layout-wrapper.tsx
'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()

  useEffect(() => {
    // Verifica se está autenticado
    const token = localStorage.getItem('token')
    setIsAuthenticated(!!token)
    setLoading(false)

    // Se não estiver autenticado e não estiver na página de login, redireciona
    if (!token && pathname !== '/login') {
      window.location.href = '/login'
    }
  }, [pathname])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  // Se não estiver autenticado ou estiver na página de login, não usa o layout principal
  if (!isAuthenticated || pathname === '/login') {
    return <>{children}</>
  }

  // Se estiver autenticado e não na página de login, usa o layout principal
  return <MainLayout>{children}</MainLayout>
}