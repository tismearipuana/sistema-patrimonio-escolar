// src/app/admin/escolas/page - Página de Gestão das Escolas
'use client'

import { useState, useEffect } from 'react'
import { School, Plus, Edit, Trash2, MapPin, Phone, Mail, X, Save, AlertCircle } from 'lucide-react'
import axios from 'axios'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { DeleteConfirmation } from '@/components/ui/delete-confirmation'

interface Tenant {
  id: string
  name: string
  type: string
  code: string
  address?: string
  phone?: string
  email?: string
  createdAt: string
  _count?: {
    users: number
    assets: number
    tickets: number
  }
}

interface FormData {
  name: string
  type: 'SECRETARIA' | 'REGIONAL' | 'ESCOLA'
  code: string
  address: string
  phone: string
  email: string
}

export default function EscolasPage() {
  const [escolas, setEscolas] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>('')
  
  // Estado para o modal de exclusão
  const [deleteModal, setDeleteModal] = useState<{
    show: boolean
    escola: Tenant | null
    loading: boolean
  }>({
    show: false,
    escola: null,
    loading: false
  })
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    type: 'ESCOLA',
    code: '',
    address: '',
    phone: '',
    email: ''
  })

  useEffect(() => {
    fetchEscolas()
  }, [])

  const fetchEscolas = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/tenants`)
      setEscolas(response.data.tenants)
    } catch (error) {
      console.error('Erro ao buscar escolas:', error)
      setError('Erro ao carregar escolas')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      if (editingId) {
        await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/tenants/${editingId}`, formData)
      } else {
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/tenants`, formData)
      }
      
      await fetchEscolas()
      resetForm()
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Erro ao salvar escola'
      setError(errorMsg)
      console.error('Erro ao salvar escola:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (escola: Tenant) => {
    setFormData({
      name: escola.name,
      type: escola.type as any,
      code: escola.code,
      address: escola.address || '',
      phone: escola.phone || '',
      email: escola.email || ''
    })
    setEditingId(escola.id)
    setShowForm(true)
  }

  const handleDelete = (escola: Tenant) => {
    setDeleteModal({
      show: true,
      escola: escola,
      loading: false
    })
  }

  const confirmDelete = async () => {
    if (!deleteModal.escola) return

    setDeleteModal(prev => ({ ...prev, loading: true }))

    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/tenants/${deleteModal.escola.id}`)
      await fetchEscolas()
      setDeleteModal({ show: false, escola: null, loading: false })
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Erro ao excluir escola'
      alert(errorMsg)
      console.error('Erro ao excluir escola:', error)
      setDeleteModal(prev => ({ ...prev, loading: false }))
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'ESCOLA',
      code: '',
      address: '',
      phone: '',
      email: ''
    })
    setEditingId(null)
    setShowForm(false)
    setError('')
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Carregando escolas...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <School className="mr-3 h-7 w-7 text-green-500" />
            Gestão de Escolas
          </h1>
          <p className="text-gray-600 mt-1">
            Gerencie as unidades educacionais do município
          </p>
        </div>
        
        <button 
          onClick={() => setShowForm(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors shadow-sm hover:shadow"
        >
          <Plus className="h-4 w-4" />
          <span>Nova Escola</span>
        </button>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total de Escolas</p>
                <p className="text-2xl font-bold">{escolas.length}</p>
              </div>
              <School className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Usuários</p>
                <p className="text-2xl font-bold">
                  {escolas.reduce((total, e) => total + (e._count?.users || 0), 0)}
                </p>
              </div>
              <School className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Ativos</p>
                <p className="text-2xl font-bold">
                  {escolas.reduce((total, e) => total + (e._count?.assets || 0), 0)}
                </p>
              </div>
              <School className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Chamados</p>
                <p className="text-2xl font-bold">
                  {escolas.reduce((total, e) => total + (e._count?.tickets || 0), 0)}
                </p>
              </div>
              <School className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Formulário Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingId ? 'Editar Escola' : 'Nova Escola'}
                </h2>
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

              <div className="space-y-4">
                {/* Nome */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da Escola *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: EMEF Maria José da Silva"
                    required
                  />
                </div>

                {/* Código */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código da Escola *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: ESC002"
                    required
                  />
                </div>

                {/* Tipo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo da Unidade *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="ESCOLA">Escola</option>
                    <option value="REGIONAL">Regional</option>
                    <option value="SECRETARIA">Secretaria</option>
                  </select>
                </div>

                {/* Endereço */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Endereço
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: Rua das Flores, 123 - Centro"
                  />
                </div>

                {/* Telefone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: (11) 99999-9999"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: escola@municipio.gov.br"
                  />
                </div>

                {/* Botões */}
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={resetForm}
                    type="button"
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={saving || !formData.name || !formData.code}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Salvando...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>{editingId ? 'Salvar' : 'Criar Escola'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista de Escolas */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">Lista de Escolas</h2>
          <p className="text-gray-600">Gerencie todas as unidades educacionais ({escolas.length} escolas)</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {escolas.map((escola) => (
              <div key={escola.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                        <School className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg">{escola.name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                          <span className="flex items-center">
                            <span className="font-medium">Código:</span>
                            <span className="ml-1 font-mono bg-gray-100 px-2 py-0.5 rounded">{escola.code}</span>
                          </span>
                          <span className="flex items-center">
                            <span className="font-medium">Tipo:</span>
                            <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                              escola.type === 'ESCOLA' ? 'bg-blue-100 text-blue-700' :
                              escola.type === 'REGIONAL' ? 'bg-purple-100 text-purple-700' :
                              'bg-orange-100 text-orange-700'
                            }`}>
                              {escola.type}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Informações de Contato */}
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      {escola.address && (
                        <div className="flex items-center text-gray-600">
                          <MapPin className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{escola.address}</span>
                        </div>
                      )}
                      {escola.phone && (
                        <div className="flex items-center text-gray-600">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{escola.phone}</span>
                        </div>
                      )}
                      {escola.email && (
                        <div className="flex items-center text-gray-600">
                          <Mail className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="truncate">{escola.email}</span>
                        </div>
                      )}
                    </div>

                    {/* Estatísticas */}
                    <div className="mt-3 flex space-x-6">
                      <div className="text-sm">
                        <span className="text-gray-600">Usuários:</span>
                        <span className="ml-1 font-semibold text-blue-600">{escola._count?.users || 0}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-600">Ativos:</span>
                        <span className="ml-1 font-semibold text-green-600">{escola._count?.assets || 0}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-600">Chamados:</span>
                        <span className="ml-1 font-semibold text-orange-600">{escola._count?.tickets || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex space-x-2 ml-4">
                    <button 
                      onClick={() => handleEdit(escola)}
                      className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar escola"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(escola)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir escola"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {escolas.length === 0 && (
              <div className="text-center py-12">
                <School className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma escola encontrada</h3>
                <p className="text-gray-600 mb-4">Comece criando sua primeira escola.</p>
                <button 
                  onClick={() => setShowForm(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg inline-flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Adicionar Escola</span>
                </button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Confirmação de Exclusão */}
      <DeleteConfirmation
        isOpen={deleteModal.show}
        onClose={() => setDeleteModal({ show: false, escola: null, loading: false })}
        onConfirm={confirmDelete}
        itemName={deleteModal.escola?.name || ''}
        itemType="escola"
        loading={deleteModal.loading}
        additionalInfo={
          deleteModal.escola && (deleteModal.escola._count?.users! > 0 || deleteModal.escola._count?.assets! > 0)
            ? `Esta escola possui ${deleteModal.escola._count?.users} usuários e ${deleteModal.escola._count?.assets} ativos vinculados.`
            : undefined
        }
      />
    </div>
  )
}