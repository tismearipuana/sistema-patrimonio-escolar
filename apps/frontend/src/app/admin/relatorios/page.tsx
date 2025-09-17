// src/app/admin/relatorios/page - Página de Gestão de Relatórios (Perfis)
'use client'

import { useState, useEffect } from 'react'
import { 
  BarChart3, 
  Download, 
  Filter, 
  TrendingUp,
  Package,
  DollarSign,
  Activity,
  AlertCircle,
  Calendar,
  Building,
  FileDown,
  FileText,
  PieChart,
  ArrowUp,
  ArrowDown,
  Wrench,
  CheckCircle,
  XCircle,
  Clock,
  Printer
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts'

interface User {
  id: string
  name: string
  role: string
  tenant?: {
    id: string
    name: string
  }
  tenantId?: string
}

interface Asset {
  id: string
  name: string
  category: string
  status: string
  condition?: string
  purchaseValue?: number
  tenant: {
    id: string
    name: string
  }
  createdAt: string
}

interface DashboardData {
  totalAssets: number
  totalValue: number
  activeAssets: number
  maintenanceAssets: number
  assetsByCategory: { name: string; value: number; percentage: number }[]
  assetsByStatus: { name: string; value: number; color: string }[]
  assetsByCondition: { name: string; value: number; color: string }[]
  assetsBySchool: { name: string; total: number; value: number }[]
  recentAcquisitions: Asset[]
  monthlyTrend: { month: string; acquisitions: number; maintenance: number }[]
}

export default function RelatoriosPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [selectedSchool, setSelectedSchool] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [schools, setSchools] = useState<{id: string, name: string}[]>([])
  const [exportingPdf, setExportingPdf] = useState(false)
  const [exportingExcel, setExportingExcel] = useState(false)

  // Cores para os gráficos
  const COLORS = {
    primary: ['#3B82F6', '#60A5FA', '#93BBFC', '#C3D9FE'],
    status: {
      ATIVO: '#10B981',
      INATIVO: '#6B7280',
      MANUTENCAO: '#F59E0B',
      BAIXADO: '#EF4444'
    },
    condition: {
      OTIMO: '#10B981',
      BOM: '#3B82F6',
      REGULAR: '#F59E0B',
      RUIM: '#EF4444'
    }
  }

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  useEffect(() => {
    if (user) {
      fetchDashboardData()
      fetchSchools()
    }
  }, [user, selectedPeriod, selectedSchool, selectedCategory])

  const fetchDashboardData = async () => {
    if (!user) return
    
    setLoading(true)
    setError(null)
    
    try {
      // Construir query params
      const params = new URLSearchParams({
        period: selectedPeriod,
        category: selectedCategory
      })

      // Adicionar escola apenas se não for GESTOR_ESCOLAR e se uma escola específica foi selecionada
      if (user.role !== 'GESTOR_ESCOLAR' && selectedSchool !== 'all') {
        params.append('schoolId', selectedSchool)
      }

      // SEM TOKEN - já que o backend não usa autenticação
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/dashboard?${params}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setDashboardData(data)
      
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error)
      setError(error instanceof Error ? error.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const fetchSchools = async () => {
    if (!user) return

    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tenants`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSchools(Array.isArray(data) ? data : data.tenants || [])
      }
    } catch (error) {
      console.error('Erro ao buscar escolas:', error)
    }
  }

  const exportPDF = async () => {
    setExportingPdf(true)
    try {
      // TODO: Implementar exportação real para PDF
      await new Promise(resolve => setTimeout(resolve, 2000))
      alert('Exportação para PDF será implementada em breve!')
    } catch (error) {
      console.error('Erro ao exportar PDF:', error)
      alert('Erro ao gerar PDF')
    } finally {
      setExportingPdf(false)
    }
  }

  const exportExcel = async () => {
    setExportingExcel(true)
    try {
      // TODO: Implementar exportação real para Excel
      await new Promise(resolve => setTimeout(resolve, 2000))
      alert('Exportação para Excel será implementada em breve!')
    } catch (error) {
      console.error('Erro ao exportar Excel:', error)
      alert('Erro ao gerar Excel')
    } finally {
      setExportingExcel(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value)
  }

  const calculateTrend = (current: number, total: number, label: string) => {
    if (total === 0) return { percentage: 0, trend: 'neutral', text: 'Sem dados' }
    
    const percentage = ((current / total) * 100).toFixed(1)
    return {
      percentage: Number(percentage),
      trend: current > total * 0.8 ? 'up' : current < total * 0.5 ? 'down' : 'neutral',
      text: `${percentage}% do total`
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando relatórios...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-medium mb-2">Erro ao carregar relatórios</p>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => fetchDashboardData()}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Nenhum dado encontrado</p>
        </div>
      </div>
    )
  }

  const activeAssetsTrend = calculateTrend(dashboardData.activeAssets, dashboardData.totalAssets, 'ativos')
  const maintenanceTrend = calculateTrend(dashboardData.maintenanceAssets, dashboardData.totalAssets, 'manutenção')

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <BarChart3 className="mr-3 h-7 w-7 text-blue-500" />
            Relatórios e Análises
          </h1>
          <p className="text-gray-600 mt-1">
            {user?.role === 'GESTOR_ESCOLAR' 
              ? `Dashboard de ${user.tenant?.name || 'sua escola'}`
              : 'Dashboard geral do patrimônio'}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => window.print()}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Printer className="h-4 w-4" />
            <span>Imprimir</span>
          </button>
          
          <button
            onClick={exportPDF}
            disabled={exportingPdf}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 disabled:opacity-50"
          >
            {exportingPdf ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Gerando...</span>
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4" />
                <span>Exportar PDF</span>
              </>
            )}
          </button>
          
          <button
            onClick={exportExcel}
            disabled={exportingExcel}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 disabled:opacity-50"
          >
            {exportingExcel ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Gerando...</span>
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                <span>Exportar Excel</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Período
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="week">Última Semana</option>
                <option value="month">Último Mês</option>
                <option value="quarter">Último Trimestre</option>
                <option value="year">Último Ano</option>
                <option value="all">Todo Período</option>
              </select>
            </div>
            
            {user?.role !== 'GESTOR_ESCOLAR' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Escola
                </label>
                <select
                  value={selectedSchool}
                  onChange={(e) => setSelectedSchool(e.target.value)}
                  className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Todas as Escolas</option>
                  {schools.map(school => (
                    <option key={school.id} value={school.id}>{school.name}</option>
                  ))}
                </select>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoria
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todas as Categorias</option>
                <option value="COMPUTADOR">Computadores</option>
                <option value="NOTEBOOK">Notebooks</option>
                <option value="IMPRESSORA">Impressoras</option>
                <option value="TABLET">Tablets</option>
                <option value="ROTEADOR">Roteadores</option>
                <option value="PROJETOR">Projetores</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Ativos</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {formatNumber(dashboardData.totalAssets)}
                </p>
                <div className="flex items-center mt-2">
                  <span className="text-sm text-gray-500">
                    Base atual do patrimônio
                  </span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Valor Total</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {formatCurrency(dashboardData.totalValue)}
                </p>
                <div className="flex items-center mt-2">
                  <span className="text-sm text-gray-500">
                    Valor patrimonial atual
                  </span>
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ativos em Operação</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {formatNumber(dashboardData.activeAssets)}
                </p>
                <div className="flex items-center mt-2">
                  {activeAssetsTrend.trend === 'up' && <ArrowUp className="h-4 w-4 text-green-500 mr-1" />}
                  {activeAssetsTrend.trend === 'down' && <ArrowDown className="h-4 w-4 text-red-500 mr-1" />}
                  <span className={`text-sm ${activeAssetsTrend.trend === 'up' ? 'text-green-600' : activeAssetsTrend.trend === 'down' ? 'text-red-600' : 'text-gray-500'}`}>
                    {activeAssetsTrend.text}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-emerald-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Em Manutenção</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {formatNumber(dashboardData.maintenanceAssets)}
                </p>
                <div className="flex items-center mt-2">
                  {maintenanceTrend.trend === 'up' && <ArrowUp className="h-4 w-4 text-red-500 mr-1" />}
                  {maintenanceTrend.trend === 'down' && <ArrowDown className="h-4 w-4 text-green-500 mr-1" />}
                  <span className={`text-sm ${maintenanceTrend.trend === 'up' ? 'text-red-600' : maintenanceTrend.trend === 'down' ? 'text-green-600' : 'text-gray-500'}`}>
                    {maintenanceTrend.text}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Wrench className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Pizza - Categorias */}
        {dashboardData.assetsByCategory.length > 0 && (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Distribuição por Categoria</h3>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RePieChart>
                  <Pie
                    data={dashboardData.assetsByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name} (${percentage}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {dashboardData.assetsByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS.primary[index % COLORS.primary.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatNumber(Number(value))} />
                </RePieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Gráfico de Barras - Status */}
        {dashboardData.assetsByStatus.length > 0 && (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Ativos por Status</h3>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dashboardData.assetsByStatus}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatNumber(Number(value))} />
                  <Bar dataKey="value" fill="#3B82F6">
                    {dashboardData.assetsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Gráfico de Área - Tendência Mensal */}
        {dashboardData.monthlyTrend.length > 0 && (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Tendência Mensal</h3>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dashboardData.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="acquisitions" 
                    stackId="1" 
                    stroke="#3B82F6" 
                    fill="#3B82F6" 
                    name="Aquisições"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="maintenance" 
                    stackId="1" 
                    stroke="#F59E0B" 
                    fill="#F59E0B" 
                    name="Manutenções"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Gráfico de Barras - Condições */}
        {dashboardData.assetsByCondition.length > 0 && (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Estado de Conservação</h3>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dashboardData.assetsByCondition} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" />
                  <Tooltip formatter={(value) => formatNumber(Number(value))} />
                  <Bar dataKey="value" fill="#3B82F6">
                    {dashboardData.assetsByCondition.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tabela de Escolas - apenas se não for GESTOR_ESCOLAR */}
      {user?.role !== 'GESTOR_ESCOLAR' && dashboardData.assetsBySchool.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Ativos por Escola</h3>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Escola</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700">Total de Ativos</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Valor Patrimonial</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700">% do Total</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.assetsBySchool.map((school, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <Building className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="font-medium">{school.name}</span>
                        </div>
                      </td>
                      <td className="text-center py-3 px-4">{formatNumber(school.total)}</td>
                      <td className="text-right py-3 px-4 font-medium">{formatCurrency(school.value)}</td>
                      <td className="text-center py-3 px-4">
                        <div className="flex items-center justify-center">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${(school.total / dashboardData.totalAssets) * 100}%` }}
                            />
                          </div>
                          <span className="ml-2 text-sm text-gray-600">
                            {((school.total / dashboardData.totalAssets) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Card de Relatórios Rápidos */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Relatórios Rápidos</h3>
          <p className="text-sm text-gray-600">Gere relatórios específicos com um clique</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left">
              <FileText className="h-8 w-8 text-blue-500 mb-2" />
              <h4 className="font-medium text-gray-900">Inventário Completo</h4>
              <p className="text-sm text-gray-600 mt-1">Lista detalhada de todos os ativos</p>
            </button>
            
            <button className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left">
              <AlertCircle className="h-8 w-8 text-yellow-500 mb-2" />
              <h4 className="font-medium text-gray-900">Ativos em Manutenção</h4>
              <p className="text-sm text-gray-600 mt-1">Equipamentos que precisam de atenção</p>
            </button>
            
            <button className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left">
              <TrendingUp className="h-8 w-8 text-green-500 mb-2" />
              <h4 className="font-medium text-gray-900">Relatório de Depreciação</h4>
              <p className="text-sm text-gray-600 mt-1">Análise de valor contábil</p>
            </button>
            
            <button className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left">
              <Activity className="h-8 w-8 text-purple-500 mb-2" />
              <h4 className="font-medium text-gray-900">Movimentações</h4>
              <p className="text-sm text-gray-600 mt-1">Transferências e baixas do período</p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}