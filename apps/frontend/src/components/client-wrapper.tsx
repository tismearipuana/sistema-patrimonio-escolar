// src/components/client-wrapper
'use client'

import { useAuth } from '@/contexts/auth-context'
import { usePathname } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'

export function ClientWrapper({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  const pathname = usePathname()

  // Se não estiver autenticado ou estiver na página de login, não usa o layout principal
  if (!isAuthenticated || pathname === '/login') {
    return <>{children}</>
  }

  // Se estiver autenticado e não na página de login, usa o layout principal
  return <MainLayout>{children}</MainLayout>
}