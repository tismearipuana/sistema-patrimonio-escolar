// src/app/admin/configuracoes/page.tsx - Página Administrativa de Configurações gerais
'use client'

import { useState, useEffect } from 'react'
import { 
  Settings, 
  Building2, 
  Package, 
  QrCode, 
  FileText, 
  Bell, 
  Shield,
  Users,
  ChevronRight,
  Lock,
  Database,
  AlertTriangle
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'

interface User {
  id: string
  email: string
  name: string
  role: string
}

interface ConfigCard {
  id: string
  title: string
  description: string
  icon: any
  href: string
  color: string
  bgColor: string
  available: boolean
  requiresSuperAdmin?: boolean
  isDangerous?: boolean
}

export default function ConfiguracoesMainPage() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  const configCards: ConfigCard[] = [
    {
      id: 'geral',
      title: 'Configurações Gerais',
      description: 'Informações da instituição, logo e dados de contato',
      icon: Building2,
      href: '/admin/configuracoes/geral',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      available: true
    },
    {
      id: 'patrimonio',
      title: 'Patrimônio',
      description: 'Categorias, status e condições dos ativos',
      icon: Package,
      href: '/admin/configuracoes/patrimonio',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      available: true
    },
    {
      id: 'usuarios',
      title: 'Gestão de Usuários',
      description: 'Adicionar e gerenciar usuários do sistema',
      icon: Users,
      href: '/admin/configuracoes/usuarios',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      available: true,
      requiresSuperAdmin: true
    },
    {
      id: 'qrcodes',
      title: 'QR Codes',
      description: 'Personalização de cores e estilos dos QR codes',
      icon: QrCode,
      href: '/admin/configuracoes/qr-codes',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      available: true
    },
    {
      id: 'relatorios',
      title: 'Relatórios',
      description: 'Configurações de geração automática e envio',
      icon: FileText,
      href: '/admin/configuracoes/relatorios',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      available: true
    },
    {
      id: 'notificacoes',
      title: 'Notificações',
      description: 'Alertas de manutenção, garantias e e-mails',
      icon: Bell,
      href: '/admin/configuracoes/notificacoes',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      available: true
    },
    {
      id: 'seguranca',
      title: 'Segurança',
      description: 'Políticas de senha, auditoria e backups',
      icon: Shield,
      href: '/admin/configuracoes/seguranca',
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      available: false
    },
    {
      id: 'reset',
      title: 'Reset do Sistema',
      description: 'Limpar banco de dados e reiniciar com dados padrão',
      icon: Database,
      href: '/admin/configuracoes/reset',
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      available: true,
      requiresSuperAdmin: true,
      isDangerous: true
    }
  ]

  // Filtrar cards baseado no perfil do usuário
  const availableCards = configCards.filter(card => {
    // Se o card requer Super Admin e o usuário não é Super Admin, não mostrar
    if (card.requiresSuperAdmin && user?.role !== 'SUPER_ADMIN') {
      return false
    }
    return true
  })

  // Separar cards perigosos dos normais
  const normalCards = availableCards.filter(card => !card.isDangerous)
  const dangerousCards = availableCards.filter(card => card.isDangerous)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Settings className="mr-3 h-7 w-7 text-gray-500" />
          Configurações do Sistema
        </h1>
        <p className="text-gray-600 mt-1">
          Gerencie todas as configurações e personalizações do sistema
        </p>
      </div>

      {/* Grid de Cards Normais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {normalCards.map((card) => {
          const IconComponent = card.icon
          
          return (
            <Link
              key={card.id}
              href={card.available ? card.href : '#'}
              className={card.available ? '' : 'pointer-events-none'}
            >
              <Card 
                className={`group relative overflow-hidden transition-all duration-200 ${
                  card.available 
                    ? 'hover:shadow-lg hover:scale-105 cursor-pointer' 
                    : 'opacity-60 cursor-not-allowed'
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-lg ${card.bgColor}`}>
                      <IconComponent className={`h-6 w-6 ${card.color}`} />
                    </div>
                    {card.available ? (
                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors mt-3" />
                    ) : (
                      <Lock className="h-5 w-5 text-gray-400 mt-3" />
                    )}
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {card.title}
                  </h3>
                  
                  <p className="text-sm text-gray-600">
                    {card.description}
                  </p>
                  
                  {card.requiresSuperAdmin && (
                    <div className="mt-3">
                      <span className="inline-flex items-center px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full font-medium">
                        Super Admin
                      </span>
                    </div>
                  )}
                  
                  {!card.available && (
                    <div className="mt-3">
                      <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                        Em desenvolvimento
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Seção de Ações Perigosas (apenas para Super Admin) */}
      {dangerousCards.length > 0 && (
        <>
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex items-center space-x-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <h2 className="text-lg font-semibold text-gray-900">Zona de Perigo</h2>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Ações irreversíveis que afetam todo o sistema. Use com extrema cautela.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dangerousCards.map((card) => {
              const IconComponent = card.icon
              
              return (
                <Link
                  key={card.id}
                  href={card.href}
                >
                  <Card 
                    className="group relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer border-red-200 bg-red-50"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-lg bg-red-200">
                          <IconComponent className="h-6 w-6 text-red-700" />
                        </div>
                        <ChevronRight className="h-5 w-5 text-red-400 group-hover:text-red-600 transition-colors mt-3" />
                      </div>
                      
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {card.title}
                      </h3>
                      
                      <p className="text-sm text-gray-600">
                        {card.description}
                      </p>
                      
                      <div className="mt-3 flex items-center space-x-2">
                        <span className="inline-flex items-center px-2 py-1 bg-red-200 text-red-800 text-xs rounded-full font-medium">
                          Ação Perigosa
                        </span>
                        {card.requiresSuperAdmin && (
                          <span className="inline-flex items-center px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full font-medium">
                            Super Admin
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </>
      )}

      {/* Cards informativos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card de informação sobre permissões */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-blue-900">Controle de Acesso</h3>
                <p className="text-sm text-blue-700 mt-1">
                  {user?.role === 'SUPER_ADMIN' ? (
                    <>Como Super Administrador, você tem acesso total a todas as configurações do sistema, incluindo ações perigosas.</>
                  ) : (
                    <>Como Administrador, você tem acesso às configurações gerais. A gestão de usuários e ações perigosas são exclusivas do Super Administrador.</>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card de aviso sobre alterações */}
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Settings className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-amber-900">Importante</h3>
                <p className="text-sm text-amber-700 mt-1">
                  As alterações realizadas nas configurações afetam todo o sistema. 
                  Certifique-se de salvar suas modificações em cada seção.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}