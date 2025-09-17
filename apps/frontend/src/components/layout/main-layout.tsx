// src/components/layout/main-layout.tsx
'use client'

import { ReactNode, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from './sidebar'

interface User {
  id: string
  name: string
  email: string
  role: string
  tenant?: {
    id: string
    name: string
    code: string
  }
}

interface MainLayoutProps {
  children: ReactNode
}

const roleLabels = {
  SUPER_ADMIN: 'Super Administrador',
  ADMIN: 'Administrador',
  GESTOR_ESCOLAR: 'Gestor Escolar',
  SOLICITANTE: 'Solicitante'
}

export function MainLayout({ children }: MainLayoutProps) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (!token || !userData) {
      router.push('/login')
      return
    }

    try {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error)
      router.push('/login')
    }
  }, [router])

  if (!user) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Sistema de Patrimônio Escolar
              </h1>
              <p className="text-gray-600 text-sm">
                Gestão Municipal de Ativos Educacionais
              </p>
            </div>
            
            {/* User Info */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-600 font-medium">Online</span>
              </div>
              
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">
                  {roleLabels[user.role as keyof typeof roleLabels]}
                  {user.tenant && ` • ${user.tenant.name}`}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}