'use client'

import { AuthProvider, useAuth } from '@/contexts/auth-context'
import { usePathname } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'

export function ClientWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <InnerWrapper>{children}</InnerWrapper>
    </AuthProvider>
  )
}

function InnerWrapper({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  const pathname = usePathname()

  // Se não estiver autenticado ou estiver na página de login, renderiza direto
  if (!isAuthenticated || pathname === '/login') {
    return <>{children}</>
  }

  // Se estiver autenticado e não for login, usa o layout principal
  return <MainLayout>{children}</MainLayout>
}
