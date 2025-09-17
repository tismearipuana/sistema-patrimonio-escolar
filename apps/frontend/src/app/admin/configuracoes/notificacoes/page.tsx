// src/app/admin/configuracoes/notificacoes/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { 
  Bell, 
  Save, 
  ChevronLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
  Mail,
  MessageSquare,
  Smartphone,
  Clock,
  Users,
  AlertTriangle,
  Package,
  Wrench,
  FileText,
  Shield,
  Info
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import axios from 'axios'

interface User {
  id: string
  email: string
  name: string
  role: string
}

interface NotificationConfig {
  // Canais de Notificação
  emailEnabled: boolean
  smsEnabled: boolean
  whatsappEnabled: boolean
  systemEnabled: boolean
  
  // Configurações de E-mail
  emailHost: string
  emailPort: string
  emailUser: string
  emailPassword: string
  emailSSL: boolean
  emailFrom: string
  
  // Configurações de SMS
  smsProvider: string
  smsApiKey: string
  smsFrom: string
  
  // Configurações de WhatsApp
  whatsappApiUrl: string
  whatsappToken: string
  whatsappFrom: string
  
  // Tipos de Notificações
  notifications: {
    // Baixa de Ativos
    disposalRequest: boolean
    disposalApproved: boolean
    disposalRejected: boolean
    
    // Chamados
    ticketCreated: boolean
    ticketAssigned: boolean
    ticketResolved: boolean
    ticketClosed: boolean
    
    // Manutenção
    maintenanceScheduled: boolean
    maintenanceDue: boolean
    maintenanceCompleted: boolean
    
    // Alertas
    warrantyExpiring: boolean
    lowStock: boolean
    systemAlert: boolean
    
    // Relatórios
    dailyReport: boolean
    weeklyReport: boolean
    monthlyReport: boolean
  }
  
  // Destinatários por Tipo
  recipients: {
    disposal: string[]
    tickets: string[]
    maintenance: string[]
    alerts: string[]
    reports: string[]
  }
  
  // Agendamentos
  schedules: {
    dailyReportTime: string
    weeklyReportDay: string
    monthlyReportDay: string
    warrantyAlertDays: number
    maintenanceAlertDays: number
  }
}

export default function ConfiguracoesNotificacoesPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('channels')
  const [testingEmail, setTestingEmail] = useState(false)
  
  const [config, setConfig] = useState<NotificationConfig>({
    // Canais
    emailEnabled: true,
    smsEnabled: false,
    whatsappEnabled: false,
    systemEnabled: true,
    
    // E-mail
    emailHost: 'smtp.gmail.com',
    emailPort: '587',
    emailUser: '',
    emailPassword: '',
    emailSSL: true,
    emailFrom: 'noreply@sistema.gov.br',
    
    // SMS
    smsProvider: '',
    smsApiKey: '',
    smsFrom: '',
    
    // WhatsApp
    whatsappApiUrl: '',
    whatsappToken: '',
    whatsappFrom: '',
    
    // Tipos de Notificações
    notifications: {
      disposalRequest: true,
      disposalApproved: true,
      disposalRejected: true,
      ticketCreated: true,
      ticketAssigned: true,
      ticketResolved: true,
      ticketClosed: false,
      maintenanceScheduled: true,
      maintenanceDue: true,
      maintenanceCompleted: true,
      warrantyExpiring: true,
      lowStock: true,
      systemAlert: true,
      dailyReport: false,
      weeklyReport: true,
      monthlyReport: true
    },
    
    // Destinatários
    recipients: {
      disposal: [],
      tickets: [],
      maintenance: [],
      alerts: [],
      reports: []
    },
    
    // Agendamentos
    schedules: {
      dailyReportTime: '08:00',
      weeklyReportDay: '1', // Segunda
      monthlyReportDay: '1', // Dia 1
      warrantyAlertDays: 30,
      maintenanceAlertDays: 15
    }
  })

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      
      // Verificar permissão
      if (parsedUser.role !== 'SUPER_ADMIN' && parsedUser.role !== 'ADMIN') {
        router.push('/admin')
        return
      }
    } else {
      router.push('/login')
      return
    }
    
    loadConfig()
  }, [router])

  const loadConfig = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/config/notifications`)
      
      if (response.data && response.data.success && response.data.data) {
        setConfig(response.data.data)
      }
    } catch (err) {
      console.error('Erro ao carregar configurações:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setSuccess(false)
    setError('')
    
    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/config/notifications`,
        config
      )
      
      if (response.data && response.data.success) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch (err: any) {
      console.error('Erro ao salvar:', err)
      setError('Erro ao salvar configurações')
      setTimeout(() => setError(''), 3000)
    } finally {
      setSaving(false)
    }
  }

  const handleTestEmail = async () => {
    setTestingEmail(true)
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/config/test-email`,
        { testEmail: user?.email }
      )
      
      if (response.data.success) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError('Falha ao enviar e-mail de teste')
        setTimeout(() => setError(''), 3000)
      }
    } catch (err) {
      setError('Erro ao testar e-mail')
      setTimeout(() => setError(''), 3000)
    } finally {
      setTestingEmail(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleNotificationChange = (field: string, value: boolean) => {
    setConfig(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [field]: value
      }
    }))
  }

  const handleScheduleChange = (field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      schedules: {
        ...prev.schedules,
        [field]: value
      }
    }))
  }

  const handleRecipientChange = (type: string, value: string) => {
    const emails = value.split(',').map(e => e.trim()).filter(e => e)
    setConfig(prev => ({
      ...prev,
      recipients: {
        ...prev.recipients,
        [type]: emails
      }
    }))
  }

  const tabs = [
    { id: 'channels', label: 'Canais', icon: Bell },
    { id: 'types', label: 'Tipos de Notificação', icon: AlertCircle },
    { id: 'recipients', label: 'Destinatários', icon: Users },
    { id: 'schedules', label: 'Agendamentos', icon: Clock },
    { id: 'email', label: 'E-mail', icon: Mail },
    { id: 'sms', label: 'SMS', icon: MessageSquare },
    { id: 'whatsapp', label: 'WhatsApp', icon: Smartphone }
  ]

  // Filtrar tabs baseado no role
  const availableTabs = user?.role === 'SUPER_ADMIN' 
    ? tabs 
    : tabs.filter(tab => !['email', 'sms', 'whatsapp'].includes(tab.id))

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link 
              href="/admin/configuracoes"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Configurações de Notificações
              </h1>
              <p className="text-gray-600 mt-1">
                Gerencie notificações e alertas do sistema
              </p>
            </div>
          </div>
          
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Salvar</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Alertas */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
          <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
          <span className="text-green-800">Configurações salvas com sucesso!</span>
        </div>
      )}
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {/* Info Card para Admin */}
      {user?.role === 'ADMIN' && (
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-blue-900">Permissões Limitadas</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Como Administrador, você pode configurar tipos de notificações e destinatários. 
                  As configurações técnicas de e-mail, SMS e WhatsApp são exclusivas do Super Administrador.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex space-x-6 overflow-x-auto">
          {availableTabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 pb-3 px-1 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="font-medium">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Conteúdo das Tabs */}
      <div>
        {/* Tab Canais */}
        {activeTab === 'channels' && (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Canais de Notificação</h2>
              <p className="text-sm text-gray-600">
                Ative ou desative os canais de comunicação disponíveis
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* E-mail */}
                <div className="flex items-start space-x-4 p-4 border rounded-lg">
                  <Mail className="h-6 w-6 text-blue-600 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">E-mail</h3>
                        <p className="text-sm text-gray-600">
                          Notificações por e-mail
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.emailEnabled}
                          onChange={(e) => handleInputChange('emailEnabled', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    {config.emailEnabled && user?.role === 'SUPER_ADMIN' && (
                      <button
                        onClick={handleTestEmail}
                        disabled={testingEmail}
                        className="mt-3 text-sm text-blue-600 hover:text-blue-700"
                      >
                        {testingEmail ? 'Enviando...' : 'Testar E-mail'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Sistema */}
                <div className="flex items-start space-x-4 p-4 border rounded-lg">
                  <Bell className="h-6 w-6 text-green-600 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Sistema</h3>
                        <p className="text-sm text-gray-600">
                          Notificações internas do sistema
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.systemEnabled}
                          onChange={(e) => handleInputChange('systemEnabled', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* SMS */}
                <div className="flex items-start space-x-4 p-4 border rounded-lg opacity-60">
                  <MessageSquare className="h-6 w-6 text-purple-600 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">SMS</h3>
                        <p className="text-sm text-gray-600">
                          Notificações por SMS
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.smsEnabled}
                          onChange={(e) => handleInputChange('smsEnabled', e.target.checked)}
                          className="sr-only peer"
                          disabled={user?.role !== 'SUPER_ADMIN'}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Requer configuração adicional
                    </p>
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="flex items-start space-x-4 p-4 border rounded-lg opacity-60">
                  <Smartphone className="h-6 w-6 text-green-500 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">WhatsApp</h3>
                        <p className="text-sm text-gray-600">
                          Notificações por WhatsApp
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.whatsappEnabled}
                          onChange={(e) => handleInputChange('whatsappEnabled', e.target.checked)}
                          className="sr-only peer"
                          disabled={user?.role !== 'SUPER_ADMIN'}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Requer configuração adicional
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab Tipos de Notificação */}
        {activeTab === 'types' && (
          <div className="space-y-6">
            {/* Baixa de Ativos */}
            <Card>
              <CardHeader>
                <h3 className="text-md font-semibold flex items-center">
                  <Package className="h-5 w-5 mr-2 text-orange-600" />
                  Baixa de Ativos
                </h3>
              </CardHeader>
              <CardContent className="space-y-3">
                <label className="flex items-center justify-between">
                  <span className="text-sm">Nova solicitação de baixa</span>
                  <input
                    type="checkbox"
                    checked={config.notifications.disposalRequest}
                    onChange={(e) => handleNotificationChange('disposalRequest', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm">Baixa aprovada</span>
                  <input
                    type="checkbox"
                    checked={config.notifications.disposalApproved}
                    onChange={(e) => handleNotificationChange('disposalApproved', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm">Baixa rejeitada</span>
                  <input
                    type="checkbox"
                    checked={config.notifications.disposalRejected}
                    onChange={(e) => handleNotificationChange('disposalRejected', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </label>
              </CardContent>
            </Card>

            {/* Chamados */}
            <Card>
              <CardHeader>
                <h3 className="text-md font-semibold flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-blue-600" />
                  Chamados
                </h3>
              </CardHeader>
              <CardContent className="space-y-3">
                <label className="flex items-center justify-between">
                  <span className="text-sm">Novo chamado criado</span>
                  <input
                    type="checkbox"
                    checked={config.notifications.ticketCreated}
                    onChange={(e) => handleNotificationChange('ticketCreated', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm">Chamado atribuído</span>
                  <input
                    type="checkbox"
                    checked={config.notifications.ticketAssigned}
                    onChange={(e) => handleNotificationChange('ticketAssigned', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm">Chamado resolvido</span>
                  <input
                    type="checkbox"
                    checked={config.notifications.ticketResolved}
                    onChange={(e) => handleNotificationChange('ticketResolved', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm">Chamado fechado</span>
                  <input
                    type="checkbox"
                    checked={config.notifications.ticketClosed}
                    onChange={(e) => handleNotificationChange('ticketClosed', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </label>
              </CardContent>
            </Card>

            {/* Manutenção */}
            <Card>
              <CardHeader>
                <h3 className="text-md font-semibold flex items-center">
                  <Wrench className="h-5 w-5 mr-2 text-green-600" />
                  Manutenção
                </h3>
              </CardHeader>
              <CardContent className="space-y-3">
                <label className="flex items-center justify-between">
                  <span className="text-sm">Manutenção agendada</span>
                  <input
                    type="checkbox"
                    checked={config.notifications.maintenanceScheduled}
                    onChange={(e) => handleNotificationChange('maintenanceScheduled', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm">Manutenção próxima</span>
                  <input
                    type="checkbox"
                    checked={config.notifications.maintenanceDue}
                    onChange={(e) => handleNotificationChange('maintenanceDue', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm">Manutenção concluída</span>
                  <input
                    type="checkbox"
                    checked={config.notifications.maintenanceCompleted}
                    onChange={(e) => handleNotificationChange('maintenanceCompleted', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </label>
              </CardContent>
            </Card>

            {/* Relatórios */}
            <Card>
              <CardHeader>
                <h3 className="text-md font-semibold flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-purple-600" />
                  Relatórios
                </h3>
              </CardHeader>
              <CardContent className="space-y-3">
                <label className="flex items-center justify-between">
                  <span className="text-sm">Relatório diário</span>
                  <input
                    type="checkbox"
                    checked={config.notifications.dailyReport}
                    onChange={(e) => handleNotificationChange('dailyReport', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm">Relatório semanal</span>
                  <input
                    type="checkbox"
                    checked={config.notifications.weeklyReport}
                    onChange={(e) => handleNotificationChange('weeklyReport', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm">Relatório mensal</span>
                  <input
                    type="checkbox"
                    checked={config.notifications.monthlyReport}
                    onChange={(e) => handleNotificationChange('monthlyReport', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </label>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab Destinatários */}
        {activeTab === 'recipients' && (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Destinatários das Notificações</h2>
              <p className="text-sm text-gray-600">
                Configure quem recebe cada tipo de notificação (separe múltiplos e-mails por vírgula)
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Baixa de Ativos
                </label>
                <input
                  type="text"
                  value={config.recipients.disposal.join(', ')}
                  onChange={(e) => handleRecipientChange('disposal', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="admin@sistema.gov.br, patrimonio@sistema.gov.br"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chamados
                </label>
                <input
                  type="text"
                  value={config.recipients.tickets.join(', ')}
                  onChange={(e) => handleRecipientChange('tickets', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="suporte@sistema.gov.br, ti@sistema.gov.br"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Manutenção
                </label>
                <input
                  type="text"
                  value={config.recipients.maintenance.join(', ')}
                  onChange={(e) => handleRecipientChange('maintenance', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="manutencao@sistema.gov.br"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alertas do Sistema
                </label>
                <input
                  type="text"
                  value={config.recipients.alerts.join(', ')}
                  onChange={(e) => handleRecipientChange('alerts', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="admin@sistema.gov.br"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Relatórios
                </label>
                <input
                  type="text"
                  value={config.recipients.reports.join(', ')}
                  onChange={(e) => handleRecipientChange('reports', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="gestor@sistema.gov.br, diretoria@sistema.gov.br"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab Agendamentos */}
        {activeTab === 'schedules' && (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Agendamentos</h2>
              <p className="text-sm text-gray-600">
                Configure quando as notificações automáticas devem ser enviadas
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Horário do Relatório Diário
                  </label>
                  <input
                    type="time"
                    value={config.schedules.dailyReportTime}
                    onChange={(e) => handleScheduleChange('dailyReportTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dia do Relatório Semanal
                  </label>
                  <select
                    value={config.schedules.weeklyReportDay}
                    onChange={(e) => handleScheduleChange('weeklyReportDay', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="0">Domingo</option>
                    <option value="1">Segunda-feira</option>
                    <option value="2">Terça-feira</option>
                    <option value="3">Quarta-feira</option>
                    <option value="4">Quinta-feira</option>
                    <option value="5">Sexta-feira</option>
                    <option value="6">Sábado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dia do Relatório Mensal
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={config.schedules.monthlyReportDay}
                    onChange={(e) => handleScheduleChange('monthlyReportDay', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alertar Garantia (dias antes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={config.schedules.warrantyAlertDays}
                    onChange={(e) => handleScheduleChange('warrantyAlertDays', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alertar Manutenção (dias antes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={config.schedules.maintenanceAlertDays}
                    onChange={(e) => handleScheduleChange('maintenanceAlertDays', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab E-mail (apenas Super Admin) */}
        {activeTab === 'email' && user?.role === 'SUPER_ADMIN' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Configurações de E-mail</h2>
                <p className="text-sm text-gray-600">
                  Configure o servidor de e-mail para envio de notificações
                </p>
              </div>
              <Shield className="h-5 w-5 text-orange-500" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Servidor SMTP
                  </label>
                  <input
                    type="text"
                    value={config.emailHost}
                    onChange={(e) => handleInputChange('emailHost', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="smtp.gmail.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Porta
                  </label>
                  <input
                    type="text"
                    value={config.emailPort}
                    onChange={(e) => handleInputChange('emailPort', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="587"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Usuário
                  </label>
                  <input
                    type="email"
                    value={config.emailUser}
                    onChange={(e) => handleInputChange('emailUser', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="sistema@gmail.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Senha
                  </label>
                  <input
                    type="password"
                    value={config.emailPassword}
                    onChange={(e) => handleInputChange('emailPassword', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    E-mail de Envio
                  </label>
                  <input
                    type="email"
                    value={config.emailFrom}
                    onChange={(e) => handleInputChange('emailFrom', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="noreply@sistema.gov.br"
                  />
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={config.emailSSL}
                    onChange={(e) => handleInputChange('emailSSL', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label className="text-sm font-medium text-gray-700">
                    Usar SSL/TLS
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs SMS e WhatsApp omitidas por brevidade, mas seguiriam o mesmo padrão */}
      </div>
    </div>
  )
}