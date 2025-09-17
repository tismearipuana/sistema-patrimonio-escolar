//src/app/page.tsx - Página Inicial com funcionalidades por perfil.
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Monitor, Users, AlertCircle, TrendingUp, School, Wrench, DollarSign, Activity,
  Shield, Building, Headphones, Package, BarChart3, Clock, CheckCircle
} from 'lucide-react'
import axios from 'axios'
import { StatCard, Card, CardContent, CardHeader } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

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

interface DashboardData {
  assets: {
    total: number
    byStatus: Array<{ status: string; count: number }>
    byCategory?: Array<{ category: string; count: number }>
    totalValue: number
  }
  tickets: {
    total: number
    byStatus?: Array<{ status: string; count: number }>
    byPriority?: Array<{ priority: string; count: number }>
  }
  users?: {
    total: number
    byRole?: Array<{ role: string; count: number }>
    activeInLast30Days: number
  }
  schools: {
    total: number
  }
  disposalRequests: {
    pending: number
  }
}

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initDashboard = async () => {
      try {
        // Verificar se está autenticado
        const token = localStorage.getItem('token')
        const userData = localStorage.getItem('user')
        
        if (!token || !userData) {
          router.push('/login')
          return
        }

        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)

        // Se for SOLICITANTE, redirecionar para chamados
        if (parsedUser.role === 'SOLICITANTE') {
          router.push('/chamados')
          return
        }

        // Buscar dados do dashboard baseado no perfil
        await fetchDashboardData(parsedUser, token)

      } catch (error) {
        console.error('Erro ao inicializar dashboard:', error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    initDashboard()
  }, [router])

  const fetchDashboardData = async (currentUser: User, token: string) => {
    try {
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }

      let endpoint = ''

      // Endpoint baseado no perfil
      switch (currentUser.role) {
        case 'SUPER_ADMIN':
          endpoint = `${process.env.NEXT_PUBLIC_API_URL}/dashboard/super-admin`
          break
        
        case 'ADMIN':
          endpoint = `${process.env.NEXT_PUBLIC_API_URL}/dashboard/admin`
          break
        
        case 'GESTOR_ESCOLAR':
          if (!currentUser.tenant?.id) {
            throw new Error('Gestor escolar sem escola vinculada')
          }
          endpoint = `${process.env.NEXT_PUBLIC_API_URL}/dashboard/school/${currentUser.tenant.id}`
          break

        default:
          throw new Error('Perfil não reconhecido')
      }

      console.log('Fazendo requisição para:', endpoint)
      const response = await axios.get(endpoint, config)
      console.log('Dados recebidos:', response.data)
      
      setData(response.data)

    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error)
      
      // Se o erro for 401/403, redirecionar para login
      if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/login')
        return
      }

      // Dados fallback para desenvolvimento
      setData({
        assets: { total: 0, byStatus: [], byCategory: [], totalValue: 0 },
        tickets: { total: 0, byStatus: [], byPriority: [] },
        users: { total: 0, byRole: [], activeInLast30Days: 0 },
        schools: { total: 0 },
        disposalRequests: { pending: 0 }
      })
    }
  }

  const renderSuperAdminDashboard = () => (
    <>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Shield className="mr-3 h-8 w-8 text-purple-600" />
                Dashboard Super Administrador
              </h1>
              <p className="text-gray-600 mt-1">Visão completa do sistema municipal</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-purple-600">Super Administrador</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Cards principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total de Escolas"
            value={data?.schools.total || 0}
            icon={<School className="h-8 w-8 text-blue-500" />}
          />
          <StatCard
            title="Total de Ativos"
            value={data?.assets.total || 0}
            icon={<Monitor className="h-8 w-8 text-green-500" />}
          />
          <StatCard
            title="Total de Usuários"
            value={data?.users?.total || 0}
            icon={<Users className="h-8 w-8 text-purple-500" />}
          />
          <StatCard
            title="Valor do Patrimônio"
            value={`R$ ${(data?.assets.totalValue || 0).toLocaleString('pt-BR')}`}
            icon={<DollarSign className="h-8 w-8 text-yellow-500" />}
          />
        </div>

        {/* Segunda linha de cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Chamados Abertos"
            value={data?.tickets.total || 0}
            icon={<AlertCircle className="h-8 w-8 text-red-500" />}
          />
          <StatCard
            title="Usuários Ativos (30d)"
            value={data?.users?.activeInLast30Days || 0}
            icon={<Activity className="h-8 w-8 text-green-500" />}
          />
          <StatCard
            title="Baixas Pendentes"
            value={data?.disposalRequests.pending || 0}
            icon={<Wrench className="h-8 w-8 text-orange-500" />}
          />
        </div>

        {/* Gráficos para Super Admin */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Status dos Ativos</h3>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {data?.assets.byStatus && data.assets.byStatus.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.assets.byStatus}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="count"
                        label={({ status, count }) => `${status}: ${count}`}
                      >
                        {data.assets.byStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#3B82F6', '#EF4444', '#10B981', '#F59E0B'][index % 4]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Sem dados para exibir
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Resumo do Sistema</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Escolas Ativas:</span>
                  <span className="font-semibold">{data?.schools.total || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Usuários Cadastrados:</span>
                  <span className="font-semibold">{data?.users?.total || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Ativos Cadastrados:</span>
                  <span className="font-semibold">{data?.assets.total || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Valor Total:</span>
                  <span className="font-semibold text-green-600">
                    R$ {(data?.assets.totalValue || 0).toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )

  const renderAdminDashboard = () => (
    <>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Package className="mr-3 h-8 w-8 text-blue-600" />
                Dashboard Administrativo
              </h1>
              <p className="text-gray-600 mt-1">Gestão patrimonial municipal</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-blue-600">Administrador</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Cards principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Escolas Cadastradas"
            value={data?.schools.total || 0}
            icon={<Building className="h-8 w-8 text-blue-500" />}
          />
          <StatCard
            title="Total de Ativos"
            value={data?.assets.total || 0}
            icon={<Monitor className="h-8 w-8 text-green-500" />}
          />
          <StatCard
            title="Valor do Patrimônio"
            value={`R$ ${(data?.assets.totalValue || 0).toLocaleString('pt-BR')}`}
            icon={<DollarSign className="h-8 w-8 text-yellow-500" />}
          />
          <StatCard
            title="Baixas para Aprovar"
            value={data?.disposalRequests.pending || 0}
            icon={<AlertCircle className="h-8 w-8 text-red-500" />}
          />
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Status dos Ativos</h3>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {data?.assets.byStatus && data.assets.byStatus.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.assets.byStatus}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="count"
                        label={({ status, count }) => `${status}: ${count}`}
                      >
                        {data.assets.byStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#3B82F6', '#EF4444', '#10B981', '#F59E0B'][index % 4]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Sem dados para exibir
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Ativos por Categoria</h3>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {data?.assets.byCategory && data.assets.byCategory.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.assets.byCategory}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Sem dados para exibir
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )

  const renderGestorDashboard = () => (
    <>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <School className="mr-3 h-8 w-8 text-green-600" />
                {user?.tenant?.name || 'Escola'}
              </h1>
              <p className="text-gray-600 mt-1">Dashboard da Gestão Escolar</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-green-600">Gestor Escolar</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Cards principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Ativos da Escola"
            value={data?.assets.total || 0}
            icon={<Monitor className="h-8 w-8 text-blue-500" />}
          />
          <StatCard
            title="Chamados Abertos"
            value={data?.tickets.total || 0}
            icon={<Headphones className="h-8 w-8 text-red-500" />}
          />
          <StatCard
            title="Valor do Patrimônio"
            value={`R$ ${(data?.assets.totalValue || 0).toLocaleString('pt-BR')}`}
            icon={<DollarSign className="h-8 w-8 text-green-500" />}
          />
          <StatCard
            title="Em Manutenção"
            value={data?.assets.byStatus?.find(s => s.status === 'MANUTENCAO')?.count || 0}
            icon={<Wrench className="h-8 w-8 text-orange-500" />}
          />
        </div>

        {/* Gráfico de status dos ativos da escola */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Status dos Ativos da Escola</h3>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {data?.assets.byStatus && data.assets.byStatus.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.assets.byStatus}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="count"
                        label={({ status, count }) => `${status}: ${count}`}
                      >
                        {data.assets.byStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#3B82F6', '#EF4444', '#10B981', '#F59E0B'][index % 4]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Sem dados para exibir
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Informações da Escola</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Nome:</span>
                  <span className="font-semibold">{user?.tenant?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Código:</span>
                  <span className="font-semibold">{user?.tenant?.code || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total de Ativos:</span>
                  <span className="font-semibold">{data?.assets.total || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Chamados Abertos:</span>
                  <span className="font-semibold text-red-600">{data?.tickets.total || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {user.role === 'SUPER_ADMIN' && renderSuperAdminDashboard()}
      {user.role === 'ADMIN' && renderAdminDashboard()}
      {user.role === 'GESTOR_ESCOLAR' && renderGestorDashboard()}
    </div>
  )
}