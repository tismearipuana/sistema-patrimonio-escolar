// src/app/admin/chamados/page - Página de Chamados (Perfis distintos)
'use client'

import { useState, useEffect } from 'react'
import { 
  AlertCircle, Plus, Clock, CheckCircle, User, Calendar, Filter, 
  Tag, X, Save, Wrench, Building2, FileText, TrendingUp, 
  Users, BarChart3, Activity, CheckSquare, UserCheck
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface Ticket {
  id: string
  title: string
  description: string
  status: 'ABERTO' | 'EM_ANDAMENTO' | 'AGUARDANDO' | 'RESOLVIDO' | 'FECHADO'
  priority: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA'
  category: string
  createdAt: string
  acceptedAt?: string
  resolvedAt?: string
  asset?: {
    id: string
    code: string
    name: string
    category: string
    location?: string
  }
  createdBy: {
    id: string
    name: string
    email: string
  }
  assignedTo?: {
    id: string
    name: string
    email: string
  }
  tenant: {
    id: string
    name: string
    code?: string
  }
}

interface FormData {
  title: string
  description: string
  category: string
  priority: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA'
  assetId: string
}

interface Asset {
  id: string
  code: string
  name: string
  category: string
  location?: string
  tenant: {
    id: string
    name: string
  }
}

interface Technician {
  id: string
  name: string
  email: string
  role: string
  canAcceptTickets?: boolean
}

interface CurrentUser {
  id: string
  name: string
  email: string
  role: 'SUPER_ADMIN' | 'ADMIN' | 'GESTOR_ESCOLAR' | 'SOLICITANTE'
  tenantId?: string
  tenant?: {
    id: string
    name: string
  }
  canAcceptTickets?: boolean
}

export default function ChamadosPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState('TODOS')
  const [priorityFilter, setPriorityFilter] = useState('TODOS')
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    category: 'MANUTENCAO',
    priority: 'MEDIA',
    assetId: ''
  })

  useEffect(() => {
    loadUserData()
    fetchTickets()
    fetchAssets()
    fetchTechnicians()

    // Verifica se há dados de ativo para reportar problema vindo do QR code
    const reportAssetId = localStorage.getItem('reportAssetId')
    const reportAssetName = localStorage.getItem('reportAssetName')
    const reportAssetCode = localStorage.getItem('reportAssetCode')
    
    if (reportAssetId && reportAssetName) {
      setFormData(prev => ({
        ...prev,
        title: `Problema no equipamento ${reportAssetCode}`,
        assetId: reportAssetId
      }))
      setShowForm(true)
      
      // Remove os dados do localStorage
      localStorage.removeItem('reportAssetId')
      localStorage.removeItem('reportAssetName')
      localStorage.removeItem('reportAssetCode')
    }
  }, [])

  const loadUserData = () => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setCurrentUser(JSON.parse(userData))
    }
  }

  const fetchTickets = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tickets`)
      const data = await response.json()
      
      if (data.tickets) {
        setTickets(data.tickets)
      }
    } catch (error) {
      console.error('Erro ao buscar chamados:', error)
      setError('Erro ao carregar chamados')
    } finally {
      setLoading(false)
    }
  }

  const fetchAssets = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/assets`)
      const data = await response.json()
      
      if (data.assets) {
        setAssets(data.assets)
      }
    } catch (error) {
      console.error('Erro ao buscar ativos:', error)
    }
  }

  const fetchTechnicians = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tickets/technicians/available`)
      const data = await response.json()
      
      if (data.technicians) {
        setTechnicians(data.technicians)
      }
    } catch (error) {
      console.error('Erro ao buscar técnicos:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const submitData = {
        ...formData,
        createdById: currentUser?.id,
        tenantId: currentUser?.tenantId || currentUser?.tenant?.id
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erro ao criar chamado')
      }

      await fetchTickets()
      resetForm()
    } catch (error: any) {
      const errorMsg = error.message || 'Erro ao criar chamado'
      setError(errorMsg)
      console.error('Erro ao criar chamado:', error)
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'MANUTENCAO',
      priority: 'MEDIA',
      assetId: ''
    })
    setShowForm(false)
    setError('')
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const acceptTicket = async (ticketId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tickets/${ticketId}/accept`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          acceptedById: currentUser?.id 
        })
      })

      if (response.ok) {
        await fetchTickets()
      }
    } catch (error) {
      console.error('Erro ao aceitar chamado:', error)
    }
  }

  const updateTicketStatus = async (ticketId: string, status: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tickets/${ticketId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        await fetchTickets()
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
    }
  }

  const assignTicket = async (ticketId: string, assignedToId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tickets/${ticketId}/assign`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assignedToId })
      })

      if (response.ok) {
        await fetchTickets()
        setShowAssignModal(false)
        setSelectedTicket(null)
      }
    } catch (error) {
      console.error('Erro ao atribuir chamado:', error)
    }
  }

  // Filtros baseados no perfil do usuário
  const getFilteredTickets = () => {
    let filtered = [...tickets]

    // Filtrar por perfil
    if (currentUser) {
      switch (currentUser.role) {
        case 'SOLICITANTE':
          // Vê apenas seus próprios chamados
          filtered = filtered.filter(t => t.createdBy.id === currentUser.id)
          break
        case 'GESTOR_ESCOLAR':
          // Vê chamados da sua escola
          filtered = filtered.filter(t => t.tenant.id === currentUser.tenantId)
          break
        case 'ADMIN':
          // Vê todos os chamados (já filtrado)
          break
        case 'SUPER_ADMIN':
          // Vê todos os chamados (já filtrado)
          break
      }
    }

    // Aplicar filtros de status e prioridade
    if (statusFilter !== 'TODOS') {
      filtered = filtered.filter(t => t.status === statusFilter)
    }
    if (priorityFilter !== 'TODOS') {
      filtered = filtered.filter(t => t.priority === priorityFilter)
    }

    return filtered
  }

  const ticketsFiltrados = getFilteredTickets()

  // Estatísticas para SUPER_ADMIN
  const getStats = () => {
    const total = tickets.length
    const abertos = tickets.filter(t => t.status === 'ABERTO').length
    const emAndamento = tickets.filter(t => t.status === 'EM_ANDAMENTO').length
    const resolvidos = tickets.filter(t => t.status === 'RESOLVIDO').length
    const fechados = tickets.filter(t => t.status === 'FECHADO').length

    // Estatísticas por técnico
    const techStats = technicians.map(tech => {
      const assigned = tickets.filter(t => t.assignedTo?.id === tech.id)
      const resolved = assigned.filter(t => t.status === 'RESOLVIDO' || t.status === 'FECHADO')
      return {
        ...tech,
        total: assigned.length,
        resolved: resolved.length,
        pending: assigned.filter(t => t.status === 'EM_ANDAMENTO').length
      }
    })

    // Estatísticas por escola
    const schoolStats = new Map()
    tickets.forEach(ticket => {
      const school = ticket.tenant.name
      if (!schoolStats.has(school)) {
        schoolStats.set(school, { total: 0, resolved: 0, pending: 0 })
      }
      const stats = schoolStats.get(school)
      stats.total++
      if (ticket.status === 'RESOLVIDO' || ticket.status === 'FECHADO') {
        stats.resolved++
      } else if (ticket.status !== 'FECHADO') {
        stats.pending++
      }
    })

    return { total, abertos, emAndamento, resolvidos, fechados, techStats, schoolStats }
  }

  const stats = getStats()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ABERTO': return 'bg-red-100 text-red-700 border-red-200'
      case 'EM_ANDAMENTO': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'AGUARDANDO': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'RESOLVIDO': return 'bg-green-100 text-green-700 border-green-200'
      case 'FECHADO': return 'bg-gray-100 text-gray-700 border-gray-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'BAIXA': return 'bg-gray-100 text-gray-700'
      case 'MEDIA': return 'bg-blue-100 text-blue-700'
      case 'ALTA': return 'bg-orange-100 text-orange-700'
      case 'CRITICA': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ABERTO': return <AlertCircle className="h-4 w-4" />
      case 'EM_ANDAMENTO': return <Clock className="h-4 w-4" />
      case 'AGUARDANDO': return <Clock className="h-4 w-4" />
      case 'RESOLVIDO': return <CheckCircle className="h-4 w-4" />
      case 'FECHADO': return <CheckCircle className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Verifica se pode criar chamados
  const canCreateTicket = () => {
    return currentUser?.role !== 'SUPER_ADMIN' // SUPER_ADMIN não cria chamados
  }

  // Verifica se pode aceitar chamados
  const canAcceptTickets = () => {
    return currentUser?.canAcceptTickets === true
  }

  // Verifica se pode gerenciar chamados
  const canManageTickets = () => {
    return currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN'
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Carregando chamados...</span>
        </div>
      </div>
    )
  }

  // Dashboard SUPER_ADMIN
  if (currentUser?.role === 'SUPER_ADMIN') {
    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <BarChart3 className="mr-3 h-7 w-7 text-purple-500" />
            Painel Executivo - Chamados
          </h1>
          <p className="text-gray-600 mt-1">
            Visão estratégica do sistema de suporte
          </p>
        </div>

        {/* Estatísticas Gerais */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <FileText className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm">Abertos</p>
                  <p className="text-2xl font-bold">{stats.abertos}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Em Andamento</p>
                  <p className="text-2xl font-bold">{stats.emAndamento}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Resolvidos</p>
                  <p className="text-2xl font-bold">{stats.resolvidos}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-gray-500 to-gray-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-100 text-sm">Taxa Resolução</p>
                  <p className="text-2xl font-bold">
                    {stats.total > 0 ? Math.round((stats.resolvidos / stats.total) * 100) : 0}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-gray-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance dos Técnicos */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900">Performance dos Técnicos</h2>
            <p className="text-gray-600">Acompanhamento de produtividade</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.techStats.map((tech) => (
                <div key={tech.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium">{tech.name}</p>
                      <p className="text-sm text-gray-600">{tech.email}</p>
                    </div>
                  </div>
                  <div className="flex space-x-6 text-sm">
                    <div className="text-center">
                      <p className="font-semibold">{tech.total}</p>
                      <p className="text-gray-500">Total</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-blue-600">{tech.pending}</p>
                      <p className="text-gray-500">Pendentes</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-green-600">{tech.resolved}</p>
                      <p className="text-gray-500">Resolvidos</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-purple-600">
                        {tech.total > 0 ? Math.round((tech.resolved / tech.total) * 100) : 0}%
                      </p>
                      <p className="text-gray-500">Taxa</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Demandas por Escola */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900">Demandas por Escola</h2>
            <p className="text-gray-600">Identificação de pontos críticos</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from(stats.schoolStats.entries()).map(([school, data]) => (
                <div key={school} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Building2 className="h-5 w-5 text-gray-400" />
                    <p className="font-medium">{school}</p>
                  </div>
                  <div className="flex space-x-6 text-sm">
                    <div className="text-center">
                      <p className="font-semibold">{data.total}</p>
                      <p className="text-gray-500">Total</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-orange-600">{data.pending}</p>
                      <p className="text-gray-500">Pendentes</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-green-600">{data.resolved}</p>
                      <p className="text-gray-500">Resolvidos</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Dashboard ADMIN (Técnicos)
  if (currentUser?.role === 'ADMIN') {
    const myTickets = tickets.filter(t => t.assignedTo?.id === currentUser.id)
    const openTickets = tickets.filter(t => t.status === 'ABERTO' && !t.assignedTo)

    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Wrench className="mr-3 h-7 w-7 text-blue-500" />
            Painel do Técnico
          </h1>
          <p className="text-gray-600 mt-1">
            Gerencie seus atendimentos
          </p>
        </div>

        {/* Estatísticas Pessoais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Fila de Espera</p>
                  <p className="text-2xl font-bold text-red-600">{openTickets.length}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-200" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Meus Chamados</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {myTickets.filter(t => t.status === 'EM_ANDAMENTO').length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Resolvidos Hoje</p>
                  <p className="text-2xl font-bold text-green-600">
                    {myTickets.filter(t => {
                      if (!t.resolvedAt) return false
                      const today = new Date().toDateString()
                      const resolved = new Date(t.resolvedAt).toDateString()
                      return today === resolved && t.status === 'RESOLVIDO'
                    }).length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Resolvidos</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {myTickets.filter(t => t.status === 'RESOLVIDO' || t.status === 'FECHADO').length}
                  </p>
                </div>
                <Activity className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fila de Chamados Abertos */}
        {canAcceptTickets() && openTickets.length > 0 && (
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900">Fila de Chamados Abertos</h2>
              <p className="text-gray-600">Clique em "Aceitar" para assumir o atendimento</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {openTickets.map((ticket) => (
                  <div key={ticket.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{ticket.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{ticket.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            {ticket.createdBy.name}
                          </span>
                          <span className="flex items-center">
                            <Building2 className="h-3 w-3 mr-1" />
                            {ticket.tenant.name}
                          </span>
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(ticket.createdAt)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => acceptTicket(ticket.id)}
                        className="ml-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center space-x-2"
                      >
                        <UserCheck className="h-4 w-4" />
                        <span>Aceitar</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Meus Chamados em Andamento */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900">Meus Chamados em Andamento</h2>
            <p className="text-gray-600">Chamados sob sua responsabilidade</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {myTickets.filter(t => t.status === 'EM_ANDAMENTO').map((ticket) => (
                <div key={ticket.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{ticket.title}</h3>
                      <p className="text-gray-600 text-sm mb-2">{ticket.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center">
                          <Building2 className="h-3 w-3 mr-1" />
                          {ticket.tenant.name}
                        </span>
                        {ticket.acceptedAt && (
                          <span className="flex items-center">
                            <CheckSquare className="h-3 w-3 mr-1" />
                            Aceito em: {formatDate(ticket.acceptedAt)}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => updateTicketStatus(ticket.id, 'RESOLVIDO')}
                      className="ml-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                      Resolver
                    </button>
                  </div>
                </div>
              ))}
              
              {myTickets.filter(t => t.status === 'EM_ANDAMENTO').length === 0 && (
                <p className="text-center py-8 text-gray-500">
                  Nenhum chamado em andamento
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Dashboard padrão (GESTOR_ESCOLAR e SOLICITANTE)
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <AlertCircle className="mr-3 h-7 w-7 text-red-500" />
            {currentUser?.role === 'GESTOR_ESCOLAR' ? 'Chamados da Escola' : 'Meus Chamados'}
          </h1>
          <p className="text-gray-600 mt-1">
            {currentUser?.role === 'GESTOR_ESCOLAR' 
              ? 'Gerencie as solicitações de suporte da sua escola'
              : 'Acompanhe suas solicitações de suporte'}
          </p>
        </div>
        
        {canCreateTicket() && (
          <button 
            onClick={() => setShowForm(true)}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors shadow-sm hover:shadow"
          >
            <Plus className="h-4 w-4" />
            <span>Novo Chamado</span>
          </button>
        )}
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">Abertos</p>
                <p className="text-2xl font-bold">
                  {ticketsFiltrados.filter(t => t.status === 'ABERTO').length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Em Andamento</p>
                <p className="text-2xl font-bold">
                  {ticketsFiltrados.filter(t => t.status === 'EM_ANDAMENTO').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Resolvidos</p>
                <p className="text-2xl font-bold">
                  {ticketsFiltrados.filter(t => t.status === 'RESOLVIDO').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Total</p>
                <p className="text-2xl font-bold">{ticketsFiltrados.length}</p>
              </div>
              <Tag className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="min-w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="TODOS">Todos os Status</option>
                <option value="ABERTO">Aberto</option>
                <option value="EM_ANDAMENTO">Em Andamento</option>
                <option value="AGUARDANDO">Aguardando</option>
                <option value="RESOLVIDO">Resolvido</option>
                <option value="FECHADO">Fechado</option>
              </select>
            </div>

            <div className="min-w-48">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="TODOS">Todas as Prioridades</option>
                <option value="BAIXA">Baixa</option>
                <option value="MEDIA">Média</option>
                <option value="ALTA">Alta</option>
                <option value="CRITICA">Crítica</option>
              </select>
            </div>

            <div className="text-sm text-gray-600 ml-auto">
              {ticketsFiltrados.length} chamado(s)
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Chamados */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">
            {currentUser?.role === 'SOLICITANTE' ? 'Meus Chamados' : 'Lista de Chamados'}
          </h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {ticketsFiltrados.map((ticket) => (
              <div key={ticket.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center flex-wrap gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 text-lg">{ticket.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border inline-flex items-center space-x-1 ${getStatusColor(ticket.status)}`}>
                        {getStatusIcon(ticket.status)}
                        <span>{ticket.status.replace('_', ' ')}</span>
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-3">{ticket.description}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-gray-600">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{ticket.createdBy.name}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{formatDate(ticket.createdAt)}</span>
                      </div>

                      {currentUser?.role === 'GESTOR_ESCOLAR' && (
                        <div className="flex items-center">
                          <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{ticket.tenant.name}</span>
                        </div>
                      )}

                      {ticket.asset && (
                        <div className="flex items-center">
                          <Wrench className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{ticket.asset.code} - {ticket.asset.name}</span>
                        </div>
                      )}
                    </div>

                    {ticket.assignedTo && (
                      <div className="mt-2 text-sm text-blue-600 flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        <span className="font-medium">Atribuído para:</span>
                        <span className="ml-1">{ticket.assignedTo.name}</span>
                      </div>
                    )}

                    {ticket.resolvedAt && (
                      <div className="mt-2 text-sm text-green-600 flex items-center">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        <span>Resolvido em: {formatDate(ticket.resolvedAt)}</span>
                      </div>
                    )}
                  </div>

                  {/* Ações para GESTOR_ESCOLAR */}
                  {currentUser?.role === 'GESTOR_ESCOLAR' && canManageTickets() && (
                    <div className="flex flex-col space-y-2 ml-4">
                      {ticket.status === 'ABERTO' && !ticket.assignedTo && (
                        <button
                          onClick={() => {
                            setSelectedTicket(ticket)
                            setShowAssignModal(true)
                          }}
                          className="px-3 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
                        >
                          Atribuir
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {ticketsFiltrados.length === 0 && (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum chamado encontrado</h3>
                <p className="text-gray-600 mb-4">
                  {currentUser?.role === 'SOLICITANTE' 
                    ? 'Você ainda não abriu nenhum chamado.'
                    : 'Nenhum chamado registrado para sua escola.'}
                </p>
                {canCreateTicket() && (
                  <button 
                    onClick={() => setShowForm(true)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg inline-flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Criar Primeiro Chamado</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Atribuição (apenas para quem pode gerenciar) */}
      {showAssignModal && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <h3 className="text-lg font-semibold">Atribuir Chamado</h3>
              <p className="text-sm text-gray-600">{selectedTicket.title}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selecionar Técnico:
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {technicians.filter(t => t.canAcceptTickets).map(tech => (
                    <button
                      key={tech.id}
                      onClick={() => assignTicket(selectedTicket.id, tech.id)}
                      className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                    >
                      <div className="font-medium">{tech.name}</div>
                      <div className="text-sm text-gray-600">{tech.email}</div>
                      <div className="text-xs text-blue-600">{tech.role}</div>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowAssignModal(false)
                    setSelectedTicket(null)
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Formulário Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Novo Chamado</h2>
                <button
                  onClick={resetForm}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
                  <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título do Chamado *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Ex: Computador não liga"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição do Problema *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Descreva detalhadamente o problema..."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoria
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="MANUTENCAO">Manutenção</option>
                      <option value="HARDWARE">Hardware</option>
                      <option value="SOFTWARE">Software</option>
                      <option value="REDE">Rede</option>
                      <option value="INSTALACAO">Instalação</option>
                      <option value="CONFIGURACAO">Configuração</option>
                      <option value="OUTROS">Outros</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prioridade
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => handleInputChange('priority', e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="BAIXA">Baixa</option>
                      <option value="MEDIA">Média</option>
                      <option value="ALTA">Alta</option>
                      <option value="CRITICA">Crítica</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Equipamento (Opcional)
                  </label>
                  <select
                    value={formData.assetId}
                    onChange={(e) => handleInputChange('assetId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="">Selecione um equipamento (opcional)</option>
                    {assets
                      .filter(asset => 
                        currentUser?.role === 'GESTOR_ESCOLAR' 
                          ? asset.tenant.id === currentUser.tenantId 
                          : true
                      )
                      .map(asset => (
                        <option key={asset.id} value={asset.id}>
                          {asset.code} - {asset.name}
                          {asset.location && ` - ${asset.location}`}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="flex space-x-3 pt-6">
                  <button
                    onClick={resetForm}
                    type="button"
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving || !formData.title || !formData.description}
                    className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Criando...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>Criar Chamado</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}