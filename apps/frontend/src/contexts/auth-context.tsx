//src/contexts/auth-context.tsx
'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import axios from 'axios'

interface User {
  id: string
  name: string
  email: string
  role: string
  tenant: {
    id: string
    name: string
    code: string
  }
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (token: string, userData: User) => void
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const isAuthenticated = !!user

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token')
      const userData = localStorage.getItem('user')

      if (token && userData) {
        // Configura o axios para usar o token
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        
        // Verifica se o token ainda é válido
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile`)
        
        if (response.data.user) {
          setUser(JSON.parse(userData))
        } else {
          // Token inválido, remove dados
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          delete axios.defaults.headers.common['Authorization']
        }
      }
    } catch (error) {
      // Token inválido ou erro na verificação
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      delete axios.defaults.headers.common['Authorization']
      console.error('Erro na verificação de auth:', error)
    } finally {
      setLoading(false)
    }
  }

  const login = (token: string, userData: User) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
    router.push('/login')
  }

  // Redirect logic
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated && pathname !== '/login') {
        router.push('/login')
      } else if (isAuthenticated && pathname === '/login') {
        router.push('/')
      }
    }
  }, [isAuthenticated, loading, pathname, router])

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

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}