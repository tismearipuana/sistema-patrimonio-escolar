//src/app/asset/id/page.tsx - Página de detalhes dos Ativos
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { 
  ArrowLeft, 
  AlertCircle, 
  MapPin, 
  Calendar, 
  Tag, 
  DollarSign, 
  User, 
  Building2, 
  Phone, 
  Mail, 
  FileText,
  QrCode,
  CheckCircle,
  XCircle,
  Clock,
  Wrench
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface Asset {
  id: string
  code: string
  serialNumber?: string
  name: string
  description?: string
  category: string
  brand?: string
  model?: string
  purchaseDate?: string
  purchaseValue?: number
  status: 'ATIVO' | 'INATIVO' | 'MANUTENCAO' | 'BAIXADO'
  location?: string
  responsible?: string
  notes?: string
  tenant: {
    id: string
    name: string
    type: string
    phone?: string
    email?: string
    address?: string
  }
  createdAt: string
  updatedAt: string
}

interface SystemConfig {
  institution?: {
    name: string
    contact: {
      email: string
      phone: string
    }
  }
  qrcode?: {
    includeContact: boolean
  }
}

export default function AssetViewPage() {
  const params = useParams()
  const assetId = params.id as string
  
  const [asset, setAsset] = useState<Asset | null>(null)
  const [config, setConfig] = useState<SystemConfig>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showReportForm, setShowReportForm] = useState(false)
  const [reportData, setReportData] = useState({
    title: '',
    description: '',
    category: 'MANUTENCAO'
  })
  const [submittingReport, setSubmittingReport] = useState(false)

  useEffect(() => {
    if (assetId) {
      loadAssetData()
      loadSystemConfig()
    }
  }, [assetId])

  const loadAssetData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/assets/${assetId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Ativo não encontrado')
        } else {
          setError('Erro ao carregar dados do ativo')
        }
        return
      }

      const data = await response.json()
      setAsset(data)
    } catch (error) {
      console.error('Erro ao carregar ativo:', error)
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  const loadSystemConfig = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/config`)
      if (response.ok) {
        const data = await response.json()
        setConfig(data.config || {})
      }
    } catch (error) {
      console.log('Configurações não disponíveis')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ATIVO': return 'text-green-600 bg-green-50 border-green-200'
      case 'INATIVO': return 'text-gray-600 bg-gray-50 border-gray-200'
      case 'MANUTENCAO': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'BAIXADO': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ATIVO': return <CheckCircle className="h-4 w-4" />
      case 'INATIVO': return <XCircle className="h-4 w-4" />
      case 'MANUTENCAO': return <Wrench className="h-4 w-4" />
      case 'BAIXADO': return <XCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const handleReportSubmit = async () => {
    if (!reportData.title.trim() || !reportData.description.trim()) {
      alert('Por favor, preencha título e descrição do problema')
      return
    }

    try {
      setSubmittingReport(true)
      
      const ticketData = {
        title: reportData.title,
        description: reportData.description,
        category: reportData.category,
        assetId: asset?.id,
        tenantId: asset?.tenant.id,
        priority: 'MEDIA' // Padrão
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ticketData)
      })

      if (!response.ok) {
        throw new Error('Erro ao criar chamado')
      }

      const result = await response.json()
      
      // Sucesso - mostrar feedback e resetar form
      alert('Chamado criado com sucesso! Você receberá um retorno em breve.')
      setShowReportForm(false)
      setReportData({ title: '', description: '', category: 'MANUTENCAO' })
      
    } catch (error) {
      console.error('Erro ao criar chamado:', error)
      alert('Erro ao criar chamado. Tente novamente.')
    } finally {
      setSubmittingReport(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="text-gray-600">Carregando informações do ativo...</span>
        </div>
      </div>
    )
  }

  if (error || !asset) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {error || 'Ativo não encontrado'}
            </h2>
            <p className="text-gray-600 mb-4">
              Verifique se o QR code está correto ou entre em contato com o suporte.
            </p>
            {config.institution?.contact && (
              <div className="space-y-2 text-sm">
                <p className="flex items-center justify-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>{config.institution.contact.phone}</span>
                </p>
                <p className="flex items-center justify-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>{config.institution.contact.email}</span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Mobile-First */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <QrCode className="h-6 w-6 text-blue-500" />
              <div>
                <h1 className="font-semibold text-gray-900">Patrimônio</h1>
                <p className="text-sm text-gray-500">{asset.code}</p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full border text-sm font-medium flex items-center space-x-1 ${getStatusColor(asset.status)}`}>
              {getStatusIcon(asset.status)}
              <span>{asset.status}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-4xl mx-auto">
        {/* Informações Principais */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900">{asset.name}</h2>
            {asset.description && (
              <p className="text-gray-600">{asset.description}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Tag className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Código</p>
                  <p className="text-sm text-gray-600">{asset.code}</p>
                </div>
              </div>

              {asset.serialNumber && (
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Número de Série</p>
                    <p className="text-sm text-gray-600">{asset.serialNumber}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-3">
                <Tag className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Categoria</p>
                  <p className="text-sm text-gray-600">{asset.category}</p>
                </div>
              </div>

              {asset.location && (
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Localização</p>
                    <p className="text-sm text-gray-600">{asset.location}</p>
                  </div>
                </div>
              )}

              {(asset.brand || asset.model) && (
                <div className="flex items-center space-x-3">
                  <Tag className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Marca/Modelo</p>
                    <p className="text-sm text-gray-600">
                      {[asset.brand, asset.model].filter(Boolean).join(' - ')}
                    </p>
                  </div>
                </div>
              )}

              {asset.responsible && (
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Responsável</p>
                    <p className="text-sm text-gray-600">{asset.responsible}</p>
                  </div>
                </div>
              )}

              {asset.purchaseDate && (
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Data de Aquisição</p>
                    <p className="text-sm text-gray-600">{formatDate(asset.purchaseDate)}</p>
                  </div>
                </div>
              )}

              {asset.purchaseValue && (
                <div className="flex items-center space-x-3">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Valor de Aquisição</p>
                    <p className="text-sm text-gray-600">{formatCurrency(Number(asset.purchaseValue))}</p>
                  </div>
                </div>
              )}
            </div>

            {asset.notes && (
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-900 mb-1">Observações</p>
                <p className="text-sm text-gray-600">{asset.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informações da Escola */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Building2 className="h-5 w-5 text-gray-400" />
              <span>{asset.tenant.name}</span>
            </h3>
          </CardHeader>
          <CardContent className="space-y-3">
            {asset.tenant.address && (
              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                <p className="text-sm text-gray-600">{asset.tenant.address}</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {asset.tenant.phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <p className="text-sm text-gray-600">{asset.tenant.phone}</p>
                </div>
              )}
              
              {asset.tenant.email && (
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <p className="text-sm text-gray-600">{asset.tenant.email}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Área de Ações */}
        <Card>
          <CardContent className="p-4">
            {!showReportForm ? (
              <button
                onClick={() => setShowReportForm(true)}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors"
              >
                <AlertCircle className="h-5 w-5" />
                <span>Reportar Problema</span>
              </button>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Reportar Problema</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título do Problema *
                  </label>
                  <input
                    type="text"
                    value={reportData.title}
                    onChange={(e) => setReportData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: Computador não liga"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoria
                  </label>
                  <select
                    value={reportData.category}
                    onChange={(e) => setReportData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="MANUTENCAO">Manutenção</option>
                    <option value="HARDWARE">Problema de Hardware</option>
                    <option value="SOFTWARE">Problema de Software</option>
                    <option value="REDE">Problema de Rede</option>
                    <option value="OUTROS">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição do Problema *
                  </label>
                  <textarea
                    value={reportData.description}
                    onChange={(e) => setReportData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Descreva detalhadamente o problema encontrado..."
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowReportForm(false)}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleReportSubmit}
                    disabled={submittingReport}
                    className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                  >
                    {submittingReport ? 'Enviando...' : 'Enviar Chamado'}
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contato de Suporte */}
        {config.qrcode?.includeContact && config.institution?.contact && (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Suporte Técnico</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-gray-400" />
                <p className="text-sm text-gray-600">{config.institution.contact.phone}</p>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-gray-400" />
                <p className="text-sm text-gray-600">{config.institution.contact.email}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-xs text-gray-500">
            Sistema de Gestão de Patrimônio<br />
            {config.institution?.name || 'Prefeitura Municipal'}
          </p>
        </div>
      </div>
    </div>
  )
}