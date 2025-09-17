//src/app/admin/ativos/page.tsx - Página de Ativos separada por perfis.
'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { 
  Package, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  QrCode, 
  Monitor,
  Printer,
  Router,
  Server,
  HardDrive,
  Laptop,
  Tablet,
  Smartphone,
  Headphones,
  Camera,
  Shield,
  AlertCircle,
  CheckCircle,
  XCircle,
  Wrench,
  Eye,
  Download,
  X,
  ArrowLeftRight,
  ImageIcon,
  Check,
  Clock
} from 'lucide-react'
import QRCodeStyling from 'qr-code-styling'

interface Asset {
  id: string
  code: string
  name: string
  description?: string
  category: string
  brand?: string
  model?: string
  serialNumber?: string
  purchaseValue?: number
  status: string
  condition?: string
  imageUrl?: string
  location?: string
  responsible?: string
  createdAt: string
  tenant: {
    id: string
    name: string
    code: string
  }
}

interface FormData {
  code: string
  name: string
  description: string
  category: string
  brand: string
  model: string
  serialNumber: string
  purchaseValue: string
  status: 'ATIVO' | 'INATIVO' | 'MANUTENCAO' | 'BAIXADO'
  condition: 'OTIMO' | 'BOM' | 'REGULAR' | 'RUIM' | ''
  imageUrl: string
  location: string
  responsible: string
  tenantId: string
}

interface User {
  id: string
  email: string
  name: string
  role: string
  tenant?: {
    id: string
    name: string
    code: string
  }
}

interface School {
  id: string
  name: string
  code: string
}

export default function AtivosPage() {
  // Estados principais
  const [assets, setAssets] = useState<Asset[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [conditionFilter, setConditionFilter] = useState('')
  const [schoolFilter, setSchoolFilter] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [previewImage, setPreviewImage] = useState<string>('')
  const [showPhotoOptions, setShowPhotoOptions] = useState(false)
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  
  // Form data
  const [formData, setFormData] = useState<FormData>({
    code: '',
    name: '',
    description: '',
    category: 'COMPUTADOR',
    brand: '',
    model: '',
    serialNumber: '',
    purchaseValue: '',
    status: 'ATIVO',
    condition: 'BOM',
    imageUrl: '',
    location: '',
    responsible: '',
    tenantId: ''
  })

  // Modais
  const [qrModal, setQrModal] = useState({
    show: false,
    ativo: null as Asset | null
  })

  const [detailsModal, setDetailsModal] = useState({
    show: false,
    ativo: null as Asset | null
  })

  const [transferModal, setTransferModal] = useState({
    show: false,
    ativo: null as Asset | null,
    targetSchoolId: '',
    justification: ''
  })

  // Dados estáticos
  const categories = [
    { value: 'COMPUTADOR', label: 'Computador', icon: Monitor },
    { value: 'NOTEBOOK', label: 'Notebook', icon: Laptop },
    { value: 'IMPRESSORA', label: 'Impressora', icon: Printer },
    { value: 'TABLET', label: 'Tablet', icon: Tablet },
    { value: 'SMARTPHONE', label: 'Smartphone', icon: Smartphone },
    { value: 'ROTEADOR', label: 'Roteador', icon: Router },
    { value: 'SERVIDOR', label: 'Servidor', icon: Server },
    { value: 'STORAGE', label: 'Storage', icon: HardDrive },
    { value: 'CAMERA', label: 'Câmera', icon: Camera },
    { value: 'ACESSORIO', label: 'Acessório', icon: Headphones },
    { value: 'OUTRO', label: 'Outro', icon: Package }
  ]

  const statusOptions = [
    { value: 'ATIVO', label: 'Ativo', color: 'bg-green-100 text-green-800' },
    { value: 'INATIVO', label: 'Inativo', color: 'bg-gray-100 text-gray-800' },
    { value: 'MANUTENCAO', label: 'Em Manutenção', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'BAIXADO', label: 'Baixado', color: 'bg-red-100 text-red-800' }
  ]

  const conditionOptions = [
    { value: 'OTIMO', label: 'Ótimo', color: 'bg-green-100 text-green-800' },
    { value: 'BOM', label: 'Bom', color: 'bg-blue-100 text-blue-800' },
    { value: 'REGULAR', label: 'Regular', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'RUIM', label: 'Ruim', color: 'bg-red-100 text-red-800' }
  ]

  // UseEffect inicial
  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
    fetchAssets()
    fetchSchools()
  }, [])

  // Função para buscar ativos
  const fetchAssets = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/assets', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (!response.ok) {
        console.error('Erro na resposta:', response.status, response.statusText)
        setAssets([])
        setLoading(false)
        return
      }
      
      const data = await response.json()
      console.log('Resposta da API de assets:', data)
      
      // Garantir que sempre seja um array
      if (Array.isArray(data)) {
        setAssets(data)
      } else if (data && typeof data === 'object') {
        // Tentar diferentes formatos de resposta
        if (data.assets && Array.isArray(data.assets)) {
          setAssets(data.assets)
        } else if (data.data && Array.isArray(data.data)) {
          setAssets(data.data)
        } else if (data.items && Array.isArray(data.items)) {
          setAssets(data.items)
        } else {
          console.error('Formato de resposta inesperado:', data)
          setAssets([])
        }
      } else {
        console.error('Resposta inválida:', data)
        setAssets([])
      }
    } catch (error) {
      console.error('Erro ao buscar ativos:', error)
      setAssets([])
    } finally {
      setLoading(false)
    }
  }

  // Função para buscar escolas
  const fetchSchools = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/tenants', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const data = await response.json()
      
      if (Array.isArray(data)) {
        setSchools(data)
      } else if (data && data.tenants && Array.isArray(data.tenants)) {
        setSchools(data.tenants)
      } else if (data && data.data && Array.isArray(data.data)) {
        setSchools(data.data)
      } else {
        console.error('Formato de resposta de escolas inesperado:', data)
        setSchools([])
      }
    } catch (error) {
      console.error('Erro ao buscar escolas:', error)
      setSchools([])
    }
  }

  // Funções de manipulação de imagem
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        setPreviewImage(base64String)
        setFormData(prev => ({ ...prev, imageUrl: base64String }))
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setPreviewImage('')
    setFormData(prev => ({ ...prev, imageUrl: '' }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = ''
    }
  }

  // Função de submit do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    let finalTenantId = formData.tenantId
    if (user?.role === 'GESTOR_ESCOLAR' && user.tenant?.id) {
      finalTenantId = user.tenant.id
    }
    
    if (!finalTenantId) {
      alert('Por favor, selecione uma escola')
      return
    }
    
    const assetData = {
      ...formData,
      purchaseValue: formData.purchaseValue ? parseFloat(formData.purchaseValue) : null,
      tenantId: finalTenantId,
      condition: formData.condition || null,
      imageUrl: formData.imageUrl || null
    }

    try {
      const url = editingAsset 
        ? `http://localhost:3001/api/assets/${editingAsset.id}`
        : 'http://localhost:3001/api/assets'
      
      const method = editingAsset ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(assetData)
      })

      if (response.ok) {
        await fetchAssets()
        handleCloseForm()
        alert(editingAsset ? 'Ativo atualizado com sucesso!' : 'Ativo cadastrado com sucesso!')
      } else {
        const error = await response.json()
        alert(`Erro ao salvar ativo: ${error.message || 'Erro desconhecido'}`)
      }
    } catch (error) {
      console.error('Erro ao salvar ativo:', error)
      alert('Erro ao salvar ativo. Verifique a conexão com o servidor.')
    }
  }

  // Função de editar
  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset)
    setFormData({
      code: asset.code,
      name: asset.name,
      description: asset.description || '',
      category: asset.category,
      brand: asset.brand || '',
      model: asset.model || '',
      serialNumber: asset.serialNumber || '',
      purchaseValue: asset.purchaseValue?.toString() || '',
      status: asset.status as FormData['status'],
      condition: (asset.condition as FormData['condition']) || '',
      imageUrl: asset.imageUrl || '',
      location: asset.location || '',
      responsible: asset.responsible || '',
      tenantId: asset.tenant.id
    })
    setPreviewImage(asset.imageUrl || '')
    setShowPhotoOptions(false)
    setShowForm(true)
  }

  // Função de deletar
  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este ativo?')) {
      try {
        const response = await fetch(`http://localhost:3001/api/assets/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })

        if (response.ok) {
          await fetchAssets()
        }
      } catch (error) {
        console.error('Erro ao excluir ativo:', error)
      }
    }
  }

  // Função de fechar formulário
  const handleCloseForm = () => {
    setShowForm(false)
    setEditingAsset(null)
    setPreviewImage('')
    setShowPhotoOptions(false)
    setFormData({
      code: '',
      name: '',
      description: '',
      category: 'COMPUTADOR',
      brand: '',
      model: '',
      serialNumber: '',
      purchaseValue: '',
      status: 'ATIVO',
      condition: 'BOM',
      imageUrl: '',
      location: '',
      responsible: '',
      tenantId: ''
    })
  }

  // Função de transferir
  const handleTransfer = async () => {
    if (!transferModal.ativo || !transferModal.targetSchoolId) return

    try {
      const endpoint = user?.role === 'GESTOR_ESCOLAR' 
        ? `http://localhost:3001/api/assets/${transferModal.ativo.id}/request-transfer`
        : `http://localhost:3001/api/assets/${transferModal.ativo.id}/transfer`

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          targetTenantId: transferModal.targetSchoolId,
          justification: transferModal.justification
        })
      })

      if (response.ok) {
        await fetchAssets()
        setTransferModal({ show: false, ativo: null, targetSchoolId: '', justification: '' })
        alert(user?.role === 'GESTOR_ESCOLAR' 
          ? 'Solicitação de transferência enviada para aprovação!' 
          : 'Ativo transferido com sucesso!')
      }
    } catch (error) {
      console.error('Erro ao transferir ativo:', error)
    }
  }

  // Funções auxiliares
  const generateQRCode = (ativo: Asset) => {
    const qrCode = new QRCodeStyling({
      width: 300,
      height: 300,
      type: 'svg',
      data: `${window.location.origin}/asset/${ativo.id}`,
      dotsOptions: {
        color: '#1e40af',
        type: 'rounded'
      },
      backgroundOptions: {
        color: '#ffffff',
      },
      cornersSquareOptions: {
        type: 'extra-rounded'
      },
      cornersDotOptions: {
        type: 'dot'
      }
    })
    return qrCode
  }

  const downloadQRCode = (ativo: Asset) => {
    const qrCode = generateQRCode(ativo)
    qrCode.download({ 
      name: `qrcode-${ativo.code}`, 
      extension: 'png' 
    })
  }

  const getCategoryIcon = (category: string) => {
    const cat = categories.find(c => c.value === category)
    return cat ? cat.icon : Package
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ATIVO': return CheckCircle
      case 'INATIVO': return XCircle
      case 'MANUTENCAO': return Wrench
      case 'BAIXADO': return AlertCircle
      default: return Shield
    }
  }

  const getStatusColor = (status: string) => {
    const opt = statusOptions.find(o => o.value === status)
    return opt ? opt.color : 'bg-gray-100 text-gray-800'
  }

  const getConditionColor = (condition: string) => {
    const opt = conditionOptions.find(o => o.value === condition)
    return opt ? opt.color : 'bg-gray-100 text-gray-800'
  }

  // FILTRO CORRIGIDO - Garantir que assets é sempre um array
  const filteredAssets = (() => {
    // Primeiro, garantir que temos um array
    const assetsArray = Array.isArray(assets) ? assets : []
    
    // Depois aplicar os filtros
    return assetsArray.filter(asset => {
      if (!asset || typeof asset !== 'object') return false
      
      const matchesSearch = 
        (asset.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (asset.code?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (asset.brand?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (asset.model?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
      
      const matchesCategory = !categoryFilter || asset.category === categoryFilter
      const matchesStatus = !statusFilter || asset.status === statusFilter
      const matchesCondition = !conditionFilter || asset.condition === conditionFilter
      const matchesSchool = !schoolFilter || asset.tenant?.id === schoolFilter
      
      if (user?.role === 'GESTOR_ESCOLAR') {
        return matchesSearch && matchesCategory && matchesStatus && matchesCondition && 
               asset.tenant?.id === user.tenant?.id
      }
      
      return matchesSearch && matchesCategory && matchesStatus && matchesCondition && matchesSchool
    })
  })()

  // Renderização de loading
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando ativos...</p>
        </div>
      </div>
    )
  }

  // Renderização principal
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Ativos</h1>
          <p className="text-gray-600 mt-1">
            {user?.role === 'GESTOR_ESCOLAR' 
              ? `Ativos de ${user.tenant?.name}`
              : 'Gerencie todos os ativos de tecnologia'}
          </p>
        </div>
        {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'GESTOR_ESCOLAR') && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Novo Ativo</span>
          </button>
        )}
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome, código, marca..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && (
              <select
                value={schoolFilter}
                onChange={(e) => setSchoolFilter(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas as Escolas</option>
                {schools.map(school => (
                  <option key={school.id} value={school.id}>{school.name}</option>
                ))}
              </select>
            )}
            
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas as Categorias</option>
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os Status</option>
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <select
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas as Condições</option>
              {conditionOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Ativos */}
      {filteredAssets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAssets.map(asset => {
            const Icon = getCategoryIcon(asset.category)
            const StatusIcon = getStatusIcon(asset.status)
            
            return (
              <Card key={asset.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {asset.imageUrl ? (
                        <img 
                          src={asset.imageUrl} 
                          alt={asset.name}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Icon className="h-8 w-8 text-blue-600" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900">{asset.name}</h3>
                        <p className="text-sm text-gray-500">Código: {asset.code}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    {asset.brand && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Marca:</span> {asset.brand}
                      </p>
                    )}
                    {asset.model && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Modelo:</span> {asset.model}
                      </p>
                    )}
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Local:</span> {asset.location || 'Não especificado'}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Escola:</span> {asset.tenant.name}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 mb-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(asset.status)}`}>
                      <StatusIcon className="h-3 w-3" />
                      <span>{statusOptions.find(s => s.value === asset.status)?.label}</span>
                    </span>
                    {asset.condition && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConditionColor(asset.condition)}`}>
                        {conditionOptions.find(c => c.value === asset.condition)?.label}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => setDetailsModal({ show: true, ativo: asset })}
                        className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                        title="Ver Detalhes"
                      >
                        <Eye className="h-4 w-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => setQrModal({ show: true, ativo: asset })}
                        className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                        title="Ver QR Code"
                      >
                        <QrCode className="h-4 w-4 text-gray-600" />
                      </button>
                      {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'GESTOR_ESCOLAR') && (
                        <>
                          <button
                            onClick={() => handleEdit(asset)}
                            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4 text-blue-600" />
                          </button>
                          <button
                            onClick={() => setTransferModal({ 
                              show: true, 
                              ativo: asset, 
                              targetSchoolId: '', 
                              justification: '' 
                            })}
                            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                            title="Transferir"
                          >
                            <ArrowLeftRight className="h-4 w-4 text-green-600" />
                          </button>
                        </>
                      )}
                      {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && (
                        <button
                          onClick={() => handleDelete(asset.id)}
                          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum ativo encontrado</h3>
            <p className="text-sm text-gray-500 text-center max-w-sm">
              {searchTerm || categoryFilter || statusFilter || conditionFilter || schoolFilter
                ? 'Tente ajustar os filtros para ver mais resultados.'
                : 'Comece cadastrando o primeiro ativo do sistema.'}
            </p>
            {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'GESTOR_ESCOLAR') && !searchTerm && !categoryFilter && !statusFilter && !conditionFilter && !schoolFilter && (
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>Cadastrar Primeiro Ativo</span>
              </button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal de Formulário */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingAsset ? 'Editar Ativo' : 'Novo Ativo'}
                </h2>
                <button
                  onClick={handleCloseForm}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Código *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Foto do Equipamento
                  </label>
                  <div className="space-y-2">
                    {previewImage ? (
                      <div className="relative">
                        <img 
                          src={previewImage} 
                          alt="Preview" 
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div 
                        onClick={() => setShowPhotoOptions(true)}
                        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors"
                      >
                        <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Adicionar foto do equipamento</p>
                        <p className="text-xs text-gray-500 mt-1">Clique para selecionar uma opção</p>
                      </div>
                    )}
                    
                    {/* Inputs ocultos para câmera e galeria */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                  
                  {/* Modal de opções de foto */}
                  {showPhotoOptions && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
                      <Card className="w-full max-w-sm">
                        <CardHeader className="border-b border-gray-200">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">Adicionar Foto</h3>
                            <button
                              onClick={() => setShowPhotoOptions(false)}
                              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <button
                              type="button"
                              onClick={() => {
                                cameraInputRef.current?.click()
                                setShowPhotoOptions(false)
                              }}
                              className="w-full p-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-3"
                            >
                              <Camera className="h-5 w-5 text-blue-500" />
                              <span className="text-gray-700">Tirar Foto</span>
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => {
                                fileInputRef.current?.click()
                                setShowPhotoOptions(false)
                              }}
                              className="w-full p-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-3"
                            >
                              <ImageIcon className="h-5 w-5 text-green-500" />
                              <span className="text-gray-700">Escolher da Galeria</span>
                            </button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoria *
                    </label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {categories.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status *
                    </label>
                    <select
                      required
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as FormData['status'] })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {statusOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado do Bem
                    </label>
                    <select
                      value={formData.condition}
                      onChange={(e) => setFormData({ ...formData, condition: e.target.value as FormData['condition'] })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Selecione...</option>
                      {conditionOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {user?.role !== 'GESTOR_ESCOLAR' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Escola *
                      </label>
                      <select
                        required
                        value={formData.tenantId}
                        onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Selecione...</option>
                        {schools.map(school => (
                          <option key={school.id} value={school.id}>{school.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Marca
                    </label>
                    <input
                      type="text"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Modelo
                    </label>
                    <input
                      type="text"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número de Série
                    </label>
                    <input
                      type="text"
                      value={formData.serialNumber}
                      onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valor de Compra
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.purchaseValue}
                      onChange={(e) => setFormData({ ...formData, purchaseValue: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Localização
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Responsável
                    </label>
                    <input
                      type="text"
                      value={formData.responsible}
                      onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={handleCloseForm}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    {editingAsset ? 'Salvar Alterações' : 'Cadastrar Ativo'}
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de QR Code */}
      {qrModal.show && qrModal.ativo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader className="border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">QR Code do Ativo</h2>
                <button
                  onClick={() => setQrModal({ show: false, ativo: null })}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">{qrModal.ativo.name}</h3>
                  <p className="text-sm text-gray-600">Código: {qrModal.ativo.code}</p>
                </div>
                
                <div 
                  className="inline-block p-4 bg-white rounded-lg shadow-sm"
                  ref={(el) => {
                    if (el && qrModal.ativo) {
                      el.innerHTML = ''
                      const qrCode = generateQRCode(qrModal.ativo)
                      qrCode.append(el)
                    }
                  }}
                />
                
                <button
                  onClick={() => downloadQRCode(qrModal.ativo!)}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Baixar QR Code</span>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Detalhes */}
      {detailsModal.show && detailsModal.ativo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Monitor className="h-6 w-6 text-blue-500" />
                  <h2 className="text-xl font-semibold text-gray-900">Detalhes do Ativo</h2>
                </div>
                <button
                  onClick={() => setDetailsModal({ show: false, ativo: null })}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Foto e QR Code */}
                <div className="space-y-4">
                  {detailsModal.ativo.imageUrl ? (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Foto do Equipamento</h3>
                      <img 
                        src={detailsModal.ativo.imageUrl} 
                        alt={detailsModal.ativo.name}
                        className="w-full rounded-lg shadow-sm"
                      />
                    </div>
                  ) : (
                    <div className="bg-gray-100 rounded-lg p-8 flex items-center justify-center">
                      <ImageIcon className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">QR Code</h3>
                    <div 
                      className="bg-white p-4 rounded-lg shadow-sm border"
                      ref={(el) => {
                        if (el && detailsModal.ativo) {
                          el.innerHTML = ''
                          const qrCode = generateQRCode(detailsModal.ativo)
                          qrCode.update({ width: 200, height: 200 })
                          qrCode.append(el)
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Informações */}
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações Gerais</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Código</label>
                        <p className="mt-1 text-sm text-gray-900">{detailsModal.ativo.code}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Nome</label>
                        <p className="mt-1 text-sm text-gray-900">{detailsModal.ativo.name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Categoria</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {categories.find(c => c.value === detailsModal.ativo?.category)?.label}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Status</label>
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(detailsModal.ativo.status)}`}>
                          {statusOptions.find(s => s.value === detailsModal.ativo?.status)?.label}
                        </span>
                      </div>
                      {detailsModal.ativo.condition && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Condição</label>
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getConditionColor(detailsModal.ativo.condition)}`}>
                            {conditionOptions.find(c => c.value === detailsModal.ativo?.condition)?.label}
                          </span>
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Escola</label>
                        <p className="mt-1 text-sm text-gray-900">{detailsModal.ativo.tenant.name}</p>
                      </div>
                    </div>
                  </div>

                  {detailsModal.ativo.description && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Descrição</h3>
                      <p className="text-sm text-gray-600">{detailsModal.ativo.description}</p>
                    </div>
                  )}

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Especificações</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {detailsModal.ativo.brand && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Marca</label>
                          <p className="mt-1 text-sm text-gray-900">{detailsModal.ativo.brand}</p>
                        </div>
                      )}
                      {detailsModal.ativo.model && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Modelo</label>
                          <p className="mt-1 text-sm text-gray-900">{detailsModal.ativo.model}</p>
                        </div>
                      )}
                      {detailsModal.ativo.serialNumber && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Número de Série</label>
                          <p className="mt-1 text-sm text-gray-900">{detailsModal.ativo.serialNumber}</p>
                        </div>
                      )}
                      {detailsModal.ativo.purchaseValue && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Valor de Compra</label>
                          <p className="mt-1 text-sm text-gray-900">
                            {new Intl.NumberFormat('pt-BR', { 
                              style: 'currency', 
                              currency: 'BRL' 
                            }).format(detailsModal.ativo.purchaseValue)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Localização</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Local</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {detailsModal.ativo.location || 'Não especificado'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Responsável</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {detailsModal.ativo.responsible || 'Não especificado'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button
                      onClick={() => downloadQRCode(detailsModal.ativo!)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <Download className="h-4 w-4" />
                      <span>Baixar QR Code</span>
                    </button>
                    {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'GESTOR_ESCOLAR') && (
                      <>
                        <button
                          onClick={() => {
                            handleEdit(detailsModal.ativo!)
                            setDetailsModal({ show: false, ativo: null })
                          }}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center space-x-2"
                        >
                          <Edit className="h-4 w-4" />
                          <span>Editar</span>
                        </button>
                        <button
                          onClick={() => {
                            setTransferModal({ 
                              show: true, 
                              ativo: detailsModal.ativo!, 
                              targetSchoolId: '', 
                              justification: '' 
                            })
                            setDetailsModal({ show: false, ativo: null })
                          }}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center space-x-2"
                        >
                          <ArrowLeftRight className="h-4 w-4" />
                          <span>Transferir</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Transferência */}
      {transferModal.show && transferModal.ativo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-lg">
            <CardHeader className="border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <ArrowLeftRight className="h-6 w-6 text-green-500" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    {user?.role === 'GESTOR_ESCOLAR' ? 'Solicitar Transferência' : 'Transferir Ativo'}
                  </h2>
                </div>
                <button
                  onClick={() => setTransferModal({ show: false, ativo: null, targetSchoolId: '', justification: '' })}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900">{transferModal.ativo.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">Código: {transferModal.ativo.code}</p>
                  <p className="text-sm text-gray-600">De: {transferModal.ativo.tenant.name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Escola de Destino *
                  </label>
                  <select
                    required
                    value={transferModal.targetSchoolId}
                    onChange={(e) => setTransferModal({ ...transferModal, targetSchoolId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Selecione a escola...</option>
                    {schools
                      .filter(school => school.id !== transferModal.ativo?.tenant.id)
                      .map(school => (
                        <option key={school.id} value={school.id}>{school.name}</option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Justificativa *
                  </label>
                  <textarea
                    required
                    value={transferModal.justification}
                    onChange={(e) => setTransferModal({ ...transferModal, justification: e.target.value })}
                    rows={4}
                    placeholder="Descreva o motivo da transferência..."
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {user?.role === 'GESTOR_ESCOLAR' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="text-sm text-yellow-800 font-medium">Aguardando Aprovação</p>
                        <p className="text-xs text-yellow-700 mt-1">
                          Esta solicitação será enviada para aprovação do administrador
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={() => setTransferModal({ show: false, ativo: null, targetSchoolId: '', justification: '' })}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleTransfer}
                    disabled={!transferModal.targetSchoolId || !transferModal.justification}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {user?.role === 'GESTOR_ESCOLAR' ? (
                      <>
                        <Clock className="h-4 w-4" />
                        <span>Solicitar Transferência</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Confirmar Transferência</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}