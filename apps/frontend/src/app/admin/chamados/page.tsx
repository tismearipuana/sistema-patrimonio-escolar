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
  priority: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA'
  category: string
  assetId?: string
  tenantId?: string
}

interface UserProfile {
  name: string
  role: 'ADMIN' | 'SUPPORT' | 'USER'
  tenantId?: string
  tenantName?: string
}

interface Asset {
  id: string
  code: string
  name: string
  location?: string
}

export default function ChamadosPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    priority: 'BAIXA',
    category: 'GERAL',
    assetId: '',
  })
  const [saving, setSaving] = useState(false)
  const [assets, setAssets] = useState<Asset[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0 })
  const [filter, setFilter] = useState('ALL')
  const [activeTab, setActiveTab] = useState('ALL')

  useEffect(() => {
    // Simulating API calls
    const fetchProfile = async () => {
      // In a real app, this would be an API call
      setProfile({
        name: 'Usuário Admin',
        role: 'ADMIN', // Change to 'SUPPORT' or 'USER' to test different views
        tenantName: 'Prefeitura Municipal'
      })
    }

    const fetchTickets = async () => {
      // Dummy data
      const dummyTickets: Ticket[] = [
        {
          id: '1',
          title: 'Computador da sala 5 não liga',
          description: 'O computador da mesa do professor na sala 5 não está dando sinal de vida. Já foi verificado o cabo de energia.',
          status: 'ABERTO',
          priority: 'ALTA',
          category: 'HARDWARE',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          createdBy: { id: 'user1', name: 'Ana Silva', email: 'ana@escola.com' },
          tenant: { id: 'tenant1', name: 'Escola Municipal ABC' }
        },
        {
          id: '2',
          title: 'Impressora da secretaria com falha na impressão',
          description: 'A impressora HP LaserJet está imprimindo com manchas pretas na lateral da página.',
          status: 'EM_ANDAMENTO',
          priority: 'MEDIA',
          category: 'PERIFERICOS',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          acceptedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          createdBy: { id: 'user2', name: 'Carlos Souza', email: 'carlos@escola.com' },
          assignedTo: { id: 'support1', name: 'Técnico Bob', email: 'bob@support.com' },
          tenant: { id: 'tenant1', name: 'Escola Municipal ABC' }
        },
        {
          id: '3',
          title: 'Solicitação de instalação de software',
          description: 'Gostaríamos de solicitar a instalação do software GCompris nos computadores do laboratório de informática.',
          status: 'RESOLVIDO',
          priority: 'BAIXA',
          category: 'SOFTWARE',
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          acceptedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
          resolvedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          createdBy: { id: 'user3', name: 'Mariana Lima', email: 'mariana@escola.com' },
          assignedTo: { id: 'support1', name: 'Técnico Bob', email: 'bob@support.com' },
          tenant: { id: 'tenant1', name: 'Escola Municipal ABC' }
        },
        {
          id: '4',
          title: 'Rede Wi-Fi instável no pátio',
          description: 'A conexão com a rede Wi-Fi para alunos está caindo constantemente na área do pátio.',
          status: 'AGUARDANDO',
          priority: 'MEDIA',
          category: 'REDES',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          createdBy: { id: 'user1', name: 'Ana Silva', email: 'ana@escola.com' },
          tenant: { id: 'tenant2', name: 'Escola Municipal XYZ' }
        },
         {
          id: '5',
          title: 'Projetor da biblioteca não funciona',
          description: 'O projetor multimídia da biblioteca não está ligando.',
          status: 'FECHADO',
          priority: 'ALTA',
          category: 'HARDWARE',
          createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          resolvedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          createdBy: { id: 'user4', name: 'Pedro Costa', email: 'pedro@escola.com' },
          assignedTo: { id: 'support2', name: 'Técnica Alice', email: 'alice@support.com' },
          tenant: { id: 'tenant2', name: 'Escola Municipal XYZ' }
        }
      ];
      setTickets(dummyTickets);
      setFilteredTickets(dummyTickets);
    }

    const fetchAssets = async () => {
      // Dummy data
      const dummyAssets: Asset[] = [
        { id: 'asset1', code: 'PC-SALA05-01', name: 'Computador i5', location: 'Sala 5' },
        { id: 'asset2', code: 'IMP-SEC-HP', name: 'Impressora HP LaserJet', location: 'Secretaria' },
        { id: 'asset3', code: 'PROJ-BIB-EPSON', name: 'Projetor Epson', location: 'Biblioteca' },
      ]
      setAssets(dummyAssets)
    }

    const loadData = async () => {
      setLoading(true)
      try {
        await Promise.all([fetchProfile(), fetchTickets(), fetchAssets()])
      } catch (e: any) {
        setError('Falha ao carregar dados. Tente novamente.')
        console.error(e)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  useEffect(() => {
    calculateStats(tickets)
  }, [tickets])

  useEffect(() => {
    let filtered = tickets;
    if (activeTab !== 'ALL') {
      if (activeTab === 'PENDING') {
        filtered = tickets.filter(t => t.status === 'ABERTO' || t.status === 'EM_ANDAMENTO' || t.status === 'AGUARDANDO');
      } else if (activeTab === 'RESOLVED') {
        filtered = tickets.filter(t => t.status === 'RESOLVIDO' || t.status === 'FECHADO');
      }
    }
    setFilteredTickets(filtered);
  }, [activeTab, tickets]);

  const calculateStats = (ticketList: Ticket[]) => {
    const newStats = { total: ticketList.length, pending: 0, resolved: 0 }
    ticketList.forEach(ticket => {
      if (ticket.status === 'RESOLVIDO' || ticket.status === 'FECHADO') {
        newStats.resolved++
      } else {
        newStats.pending++
      }
    })
    setStats(newStats)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const resetForm = () => {
    setIsFormOpen(false)
    setFormData({
      title: '',
      description: '',
      priority: 'BAIXA',
      category: 'GERAL',
      assetId: '',
    })
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.description) {
      alert('Título e descrição são obrigatórios.')
      return
    }
    setSaving(true)
    try {
      // Simulate API call
      console.log('Criando chamado:', formData)
      await new Promise(resolve => setTimeout(resolve, 1500))
      // Add to list locally
      const newTicket: Ticket = {
        id: (tickets.length + 1).toString(),
        ...formData,
        status: 'ABERTO',
        createdAt: new Date().toISOString(),
        createdBy: { id: 'currentUser', name: profile?.name || 'Usuário', email: 'current@user.com' },
        tenant: { id: profile?.tenantId || 'tenant1', name: profile?.tenantName || 'Escola' }
      }
      setTickets(prev => [newTicket, ...prev])
      setFilteredTickets(prev => [newTicket, ...prev])
      resetForm()
    } catch (err) {
      alert('Falha ao criar chamado. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const getStatusChip = (status: Ticket['status']) => {
    const baseClasses = "px-2 py-1 text-xs font-semibold rounded-full"
    switch (status) {
      case 'ABERTO': return <span className={`${baseClasses} bg-blue-100 text-blue-800`}>Aberto</span>
      case 'EM_ANDAMENTO': return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>Em Andamento</span>
      case 'AGUARDANDO': return <span className={`${baseClasses} bg-orange-100 text-orange-800`}>Aguardando</span>
      case 'RESOLVIDO': return <span className={`${baseClasses} bg-green-100 text-green-800`}>Resolvido</span>
      case 'FECHADO': return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>Fechado</span>
    }
  }
  
  const getPriorityIcon = (priority: Ticket['priority']) => {
     const baseClasses = "h-5 w-5"
     switch (priority) {
      case 'BAIXA': return <Tag className={`${baseClasses} text-gray-500`} />
      case 'MEDIA': return <Tag className={`${baseClasses} text-yellow-500`} />
      case 'ALTA': return <Tag className={`${baseClasses} text-orange-500`} />
      case 'CRITICA': return <Tag className={`${baseClasses} text-red-500`} />
    }
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-500">
        <AlertCircle className="h-6 w-6 mr-2" />
        {error}
      </div>
    )
  }

  const renderTicketCard = (ticket: Ticket) => (
    <Card key={ticket.id} className="mb-4 hover:shadow-lg transition-shadow">
      <CardHeader className="p-4 border-b">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-800">{ticket.title}</h3>
            <div className="flex items-center text-sm text-gray-500 mt-1 space-x-4">
               <div className="flex items-center"><Building2 className="h-4 w-4 mr-1.5" /> {ticket.tenant.name}</div>
               <div className="flex items-center"><User className="h-4 w-4 mr-1.5" /> {ticket.createdBy.name}</div>
               <div className="flex items-center"><Calendar className="h-4 w-4 mr-1.5" /> {new Date(ticket.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-2">
            {getStatusChip(ticket.status)}
            <div className="flex items-center text-sm">
                {getPriorityIcon(ticket.priority)}
                <span className="ml-1">{ticket.priority}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <p className="text-gray-600 mb-4">{ticket.description}</p>
        <div className="flex justify-between items-end">
            <div>
              {ticket.asset && (
                <div className="text-sm bg-gray-100 px-3 py-1.5 rounded-md inline-flex items-center">
                  <Wrench className="h-4 w-4 mr-2 text-gray-600"/>
                  <div>
                    <span className="font-semibold">{ticket.asset.name}</span>
                    <span className="text-gray-500 ml-2">({ticket.asset.code})</span>
                  </div>
                </div>
              )}
            </div>
            {ticket.assignedTo && (
              <div className="text-sm flex items-center text-gray-600">
                <UserCheck className="h-4 w-4 mr-1.5 text-blue-600"/>
                Atribuído a: <span className="font-semibold ml-1">{ticket.assignedTo.name}</span>
              </div>
            )}
        </div>
      </CardContent>
    </Card>
  );

  const tabs = [
    { id: 'ALL', label: 'Todos os Chamados', count: stats.total, icon: FileText },
    { id: 'PENDING', label: 'Pendentes', count: stats.pending, icon: Clock },
    { id: 'RESOLVED', label: 'Resolvidos', count: stats.resolved, icon: CheckSquare },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Painel de Chamados</h1>
          <p className="text-gray-500">Gerencie e acompanhe todos os chamados de suporte.</p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-red-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-red-600 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Novo Chamado</span>
        </button>
      </header>
      
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {tabs.map(tab => (
              <Card key={tab.id} className="p-4 flex items-center space-x-4">
                  <div className={`p-3 rounded-full bg-red-100 text-red-600`}>
                      <tab.icon className="h-6 w-6" />
                  </div>
                  <div>
                      <p className="text-gray-500 text-sm">{tab.label}</p>
                      <p className="text-2xl font-bold text-gray-800">{tab.count}</p>
                  </div>
              </Card>
          ))}
      </div>


      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <nav className="flex space-x-4 p-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-red-100 text-red-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="p-4">
           {filteredTickets.length > 0 ? (
              filteredTickets.map(renderTicketCard)
            ) : (
              <div className="text-center py-12 text-gray-500">
                <AlertCircle className="h-10 w-10 mx-auto mb-2" />
                <p>Nenhum chamado encontrado para esta categoria.</p>
              </div>
            )}
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl bg-white rounded-lg shadow-2xl relative">
            <button
              onClick={resetForm}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
            <CardHeader>
              <h2 className="text-2xl font-bold text-gray-800">Criar Novo Chamado</h2>
              <p className="text-gray-500">Preencha os detalhes abaixo para abrir um novo chamado de suporte.</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Título do Chamado</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                    placeholder="Ex: Computador não liga"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Descrição Detalhada</label>
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                    placeholder="Descreva o problema em detalhes. Inclua informações relevantes como localização, mensagens de erro, etc."
                  ></textarea>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
                    <select
                      id="priority"
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="BAIXA">Baixa</option>
                      <option value="MEDIA">Média</option>
                      <option value="ALTA">Alta</option>
                      <option value="CRITICA">Crítica</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                    >
                       <option value="GERAL">Geral</option>
                       <option value="HARDWARE">Hardware</option>
                       <option value="SOFTWARE">Software</option>
                       <option value="REDES">Redes</option>
                       <option value="PERIFERICOS">Periféricos</option>
                       <option value="OUTROS">Outros</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="assetId" className="block text-sm font-medium text-gray-700 mb-1">Vincular a um Patrimônio (Opcional)</label>
                  <select
                    id="assetId"
                    name="assetId"
                    value={formData.assetId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="">Nenhum</option>
                    {assets.map(asset => (
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