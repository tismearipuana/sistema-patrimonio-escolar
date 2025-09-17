// src/app/admin/configuracoes/geral/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { 
  Building2, 
  Save, 
  ChevronLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  Globe
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import Link from 'next/link'
import axios from 'axios'

export default function ConfiguracoesGeralPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('institution')
  
  // Estado para as configurações
  const [config, setConfig] = useState({
    // Informações da Instituição
    institutionName: '',
    institutionType: 'Órgão Público Municipal',
    cnpj: '',
    stateRegistration: '',
    municipalRegistration: '',
    
    // Endereço
    address: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: 'SP',
    zipCode: '',
    
    // Contatos
    mainPhone: '',
    secondaryPhone: '',
    whatsapp: '',
    email: '',
    supportEmail: '',
    website: '',
    
    // Redes Sociais
    facebook: '',
    instagram: '',
    twitter: '',
    
    // Sistema
    systemName: 'Sistema de Patrimônio Escolar',
    systemVersion: '2.0.0',
    maintenanceMode: false,
    maintenanceMessage: ''
  })

  // Carregar configurações ao montar o componente
  useEffect(() => {
    loadConfig()
  }, [])

  // Função para carregar configurações
  const loadConfig = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/config/general`)
      
      if (response.data && response.data.success && response.data.data) {
        setConfig(response.data.data)
      }
    } catch (err) {
      console.error('Erro ao carregar configurações:', err)
      setError('Erro ao carregar configurações')
    } finally {
      setLoading(false)
    }
  }

  // Função para salvar configurações
  const handleSave = async () => {
    setSaving(true)
    setSuccess(false)
    setError('')
    
    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/config/general`, 
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

  // Função para atualizar campo
  const handleInputChange = (field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const tabs = [
    { id: 'institution', label: 'Instituição', icon: Building2 },
    { id: 'contact', label: 'Contatos', icon: Phone },
    { id: 'address', label: 'Endereço', icon: MapPin },
    { id: 'system', label: 'Sistema', icon: Globe }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
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
                Configurações Gerais
              </h1>
              <p className="text-gray-600 mt-1">
                Gerencie as informações básicas do sistema
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

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex space-x-8">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 pb-3 px-1 border-b-2 transition-colors ${
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
        {/* Tab Instituição */}
        {activeTab === 'institution' && (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Informações da Instituição</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome da Instituição
                  </label>
                  <input
                    type="text"
                    value={config.institutionName}
                    onChange={(e) => handleInputChange('institutionName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Secretaria Municipal de Educação"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Instituição
                  </label>
                  <select
                    value={config.institutionType}
                    onChange={(e) => handleInputChange('institutionType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Órgão Público Municipal">Órgão Público Municipal</option>
                    <option value="Órgão Público Estadual">Órgão Público Estadual</option>
                    <option value="Órgão Público Federal">Órgão Público Federal</option>
                    <option value="Autarquia">Autarquia</option>
                    <option value="Fundação">Fundação</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CNPJ
                  </label>
                  <input
                    type="text"
                    value={config.cnpj}
                    onChange={(e) => handleInputChange('cnpj', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="00.000.000/0001-00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Inscrição Estadual
                  </label>
                  <input
                    type="text"
                    value={config.stateRegistration}
                    onChange={(e) => handleInputChange('stateRegistration', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Isento"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Inscrição Municipal
                  </label>
                  <input
                    type="text"
                    value={config.municipalRegistration}
                    onChange={(e) => handleInputChange('municipalRegistration', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="000000"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab Contatos */}
        {activeTab === 'contact' && (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Informações de Contato</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone Principal
                  </label>
                  <input
                    type="text"
                    value={config.mainPhone}
                    onChange={(e) => handleInputChange('mainPhone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="(11) 3000-0000"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone Secundário
                  </label>
                  <input
                    type="text"
                    value={config.secondaryPhone}
                    onChange={(e) => handleInputChange('secondaryPhone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="(11) 3000-0001"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    WhatsApp
                  </label>
                  <input
                    type="text"
                    value={config.whatsapp}
                    onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="(11) 90000-0000"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    E-mail Principal
                  </label>
                  <input
                    type="email"
                    value={config.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="contato@prefeitura.gov.br"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    E-mail de Suporte
                  </label>
                  <input
                    type="email"
                    value={config.supportEmail}
                    onChange={(e) => handleInputChange('supportEmail', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="suporte@prefeitura.gov.br"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    value={config.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://www.prefeitura.gov.br"
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="text-md font-semibold text-gray-900 mb-4">Redes Sociais</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Facebook
                    </label>
                    <input
                      type="text"
                      value={config.facebook}
                      onChange={(e) => handleInputChange('facebook', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="prefeitura"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Instagram
                    </label>
                    <input
                      type="text"
                      value={config.instagram}
                      onChange={(e) => handleInputChange('instagram', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="@prefeitura"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Twitter
                    </label>
                    <input
                      type="text"
                      value={config.twitter}
                      onChange={(e) => handleInputChange('twitter', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="@prefeitura"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab Endereço */}
        {activeTab === 'address' && (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Endereço</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logradouro
                  </label>
                  <input
                    type="text"
                    value={config.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Rua Principal"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número
                  </label>
                  <input
                    type="text"
                    value={config.number}
                    onChange={(e) => handleInputChange('number', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="100"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Complemento
                  </label>
                  <input
                    type="text"
                    value={config.complement}
                    onChange={(e) => handleInputChange('complement', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Prédio A"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bairro
                  </label>
                  <input
                    type="text"
                    value={config.neighborhood}
                    onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Centro"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CEP
                  </label>
                  <input
                    type="text"
                    value={config.zipCode}
                    onChange={(e) => handleInputChange('zipCode', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="00000-000"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={config.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="São Paulo"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado
                  </label>
                  <select
                    value={config.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="AC">Acre</option>
                    <option value="AL">Alagoas</option>
                    <option value="AP">Amapá</option>
                    <option value="AM">Amazonas</option>
                    <option value="BA">Bahia</option>
                    <option value="CE">Ceará</option>
                    <option value="DF">Distrito Federal</option>
                    <option value="ES">Espírito Santo</option>
                    <option value="GO">Goiás</option>
                    <option value="MA">Maranhão</option>
                    <option value="MT">Mato Grosso</option>
                    <option value="MS">Mato Grosso do Sul</option>
                    <option value="MG">Minas Gerais</option>
                    <option value="PA">Pará</option>
                    <option value="PB">Paraíba</option>
                    <option value="PR">Paraná</option>
                    <option value="PE">Pernambuco</option>
                    <option value="PI">Piauí</option>
                    <option value="RJ">Rio de Janeiro</option>
                    <option value="RN">Rio Grande do Norte</option>
                    <option value="RS">Rio Grande do Sul</option>
                    <option value="RO">Rondônia</option>
                    <option value="RR">Roraima</option>
                    <option value="SC">Santa Catarina</option>
                    <option value="SP">São Paulo</option>
                    <option value="SE">Sergipe</option>
                    <option value="TO">Tocantins</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab Sistema */}
        {activeTab === 'system' && (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Configurações do Sistema</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Sistema
                  </label>
                  <input
                    type="text"
                    value={config.systemName}
                    onChange={(e) => handleInputChange('systemName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Versão do Sistema
                  </label>
                  <input
                    type="text"
                    value={config.systemVersion}
                    onChange={(e) => handleInputChange('systemVersion', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="text-md font-semibold text-gray-900 mb-4">Modo de Manutenção</h3>
                <div className="space-y-4">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={config.maintenanceMode}
                      onChange={(e) => handleInputChange('maintenanceMode', e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Ativar modo de manutenção
                    </span>
                  </label>
                  
                  {config.maintenanceMode && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mensagem de Manutenção
                      </label>
                      <textarea
                        value={config.maintenanceMessage}
                        onChange={(e) => handleInputChange('maintenanceMessage', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                        placeholder="Sistema em manutenção. Voltaremos em breve..."
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}