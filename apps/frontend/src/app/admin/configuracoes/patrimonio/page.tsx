// src/app/admin/configuracoes/patrimonio/page - Página Administrativa de Configurações dos Patrimônios
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  X,
  Check,
  AlertCircle,
  Monitor,
  Laptop,
  Printer,
  Tablet,
  Smartphone,
  Router,
  Server,
  HardDrive,
  Camera,
  Headphones,
  Shield,
  Wrench,
  CheckCircle,
  XCircle,
  Settings,
  ChevronRight
} from 'lucide-react'
import Link from 'next/link'

// Interfaces
interface Category {
  id: string
  name: string
  icon: string
  active: boolean
  createdAt?: string
  updatedAt?: string
}

interface Status {
  id: string
  name: string
  color: string
  icon: string
  active: boolean
  createdAt?: string
  updatedAt?: string
}

interface Condition {
  id: string
  name: string
  color: string
  active: boolean
  createdAt?: string
  updatedAt?: string
}

export default function PatrimonioConfigPage() {
  // Estados principais
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'categories' | 'statuses' | 'conditions'>('categories')
  
  // Dados
  const [categories, setCategories] = useState<Category[]>([])
  const [statuses, setStatuses] = useState<Status[]>([])
  const [conditions, setConditions] = useState<Condition[]>([])
  
  // Estados de edição
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editingStatus, setEditingStatus] = useState<Status | null>(null)
  const [editingCondition, setEditingCondition] = useState<Condition | null>(null)
  
  // Estados de novo item
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [showNewStatus, setShowNewStatus] = useState(false)
  const [showNewCondition, setShowNewCondition] = useState(false)
  
  // Form states
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryIcon, setNewCategoryIcon] = useState('Package')
  
  const [newStatusName, setNewStatusName] = useState('')
  const [newStatusColor, setNewStatusColor] = useState('bg-gray-100 text-gray-800')
  const [newStatusIcon, setNewStatusIcon] = useState('Shield')
  
  const [newConditionName, setNewConditionName] = useState('')
  const [newConditionColor, setNewConditionColor] = useState('bg-gray-100 text-gray-800')

  // Ícones disponíveis para categorias
  const availableIcons = [
    { name: 'Package', icon: Package, label: 'Pacote' },
    { name: 'Monitor', icon: Monitor, label: 'Monitor' },
    { name: 'Laptop', icon: Laptop, label: 'Notebook' },
    { name: 'Printer', icon: Printer, label: 'Impressora' },
    { name: 'Tablet', icon: Tablet, label: 'Tablet' },
    { name: 'Smartphone', icon: Smartphone, label: 'Smartphone' },
    { name: 'Router', icon: Router, label: 'Roteador' },
    { name: 'Server', icon: Server, label: 'Servidor' },
    { name: 'HardDrive', icon: HardDrive, label: 'HD/Storage' },
    { name: 'Camera', icon: Camera, label: 'Câmera' },
    { name: 'Headphones', icon: Headphones, label: 'Acessório' },
    { name: 'Shield', icon: Shield, label: 'Segurança' },
  ]

  // Ícones para status
  const statusIcons = [
    { name: 'CheckCircle', icon: CheckCircle, label: 'Ativo' },
    { name: 'XCircle', icon: XCircle, label: 'Inativo' },
    { name: 'Wrench', icon: Wrench, label: 'Manutenção' },
    { name: 'AlertCircle', icon: AlertCircle, label: 'Alerta' },
    { name: 'Shield', icon: Shield, label: 'Padrão' }
  ]

  // Cores disponíveis
  const availableColors = [
    { value: 'bg-green-100 text-green-800', label: 'Verde', preview: 'bg-green-500' },
    { value: 'bg-blue-100 text-blue-800', label: 'Azul', preview: 'bg-blue-500' },
    { value: 'bg-yellow-100 text-yellow-800', label: 'Amarelo', preview: 'bg-yellow-500' },
    { value: 'bg-red-100 text-red-800', label: 'Vermelho', preview: 'bg-red-500' },
    { value: 'bg-purple-100 text-purple-800', label: 'Roxo', preview: 'bg-purple-500' },
    { value: 'bg-gray-100 text-gray-800', label: 'Cinza', preview: 'bg-gray-500' },
    { value: 'bg-orange-100 text-orange-800', label: 'Laranja', preview: 'bg-orange-500' },
    { value: 'bg-indigo-100 text-indigo-800', label: 'Índigo', preview: 'bg-indigo-500' }
  ]

  useEffect(() => {
    loadData()
  }, [])

  // Carregar dados da API
  const loadData = async () => {
    setLoading(true)
    try {
      // Carregar categorias
      const catResponse = await fetch('http://localhost:3001/api/config/categories', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      if (catResponse.ok) {
        const catData = await catResponse.json()
        setCategories(catData.length ? catData : getDefaultCategories())
      } else {
        setCategories(getDefaultCategories())
      }

      // Carregar status
      const statusResponse = await fetch('http://localhost:3001/api/config/statuses', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      if (statusResponse.ok) {
        const statusData = await statusResponse.json()
        setStatuses(statusData.length ? statusData : getDefaultStatuses())
      } else {
        setStatuses(getDefaultStatuses())
      }

      // Carregar condições
      const condResponse = await fetch('http://localhost:3001/api/config/conditions', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      if (condResponse.ok) {
        const condData = await condResponse.json()
        setConditions(condData.length ? condData : getDefaultConditions())
      } else {
        setConditions(getDefaultConditions())
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      // Usar valores padrão em caso de erro
      setCategories(getDefaultCategories())
      setStatuses(getDefaultStatuses())
      setConditions(getDefaultConditions())
    } finally {
      setLoading(false)
    }
  }

  // Valores padrão
  const getDefaultCategories = (): Category[] => [
    { id: '1', name: 'COMPUTADOR', icon: 'Monitor', active: true },
    { id: '2', name: 'NOTEBOOK', icon: 'Laptop', active: true },
    { id: '3', name: 'IMPRESSORA', icon: 'Printer', active: true },
    { id: '4', name: 'TABLET', icon: 'Tablet', active: true },
    { id: '5', name: 'SMARTPHONE', icon: 'Smartphone', active: true },
    { id: '6', name: 'ROTEADOR', icon: 'Router', active: true },
    { id: '7', name: 'SERVIDOR', icon: 'Server', active: true },
    { id: '8', name: 'STORAGE', icon: 'HardDrive', active: true },
    { id: '9', name: 'CAMERA', icon: 'Camera', active: true },
    { id: '10', name: 'ACESSORIO', icon: 'Headphones', active: true }
  ]

  const getDefaultStatuses = (): Status[] => [
    { id: '1', name: 'ATIVO', color: 'bg-green-100 text-green-800', icon: 'CheckCircle', active: true },
    { id: '2', name: 'INATIVO', color: 'bg-gray-100 text-gray-800', icon: 'XCircle', active: true },
    { id: '3', name: 'MANUTENCAO', color: 'bg-yellow-100 text-yellow-800', icon: 'Wrench', active: true },
    { id: '4', name: 'BAIXADO', color: 'bg-red-100 text-red-800', icon: 'AlertCircle', active: true }
  ]

  const getDefaultConditions = (): Condition[] => [
    { id: '1', name: 'OTIMO', color: 'bg-green-100 text-green-800', active: true },
    { id: '2', name: 'BOM', color: 'bg-blue-100 text-blue-800', active: true },
    { id: '3', name: 'REGULAR', color: 'bg-yellow-100 text-yellow-800', active: true },
    { id: '4', name: 'RUIM', color: 'bg-red-100 text-red-800', active: true }
  ]

  // Salvar alterações
  const saveChanges = async () => {
    setSaving(true)
    try {
      // Salvar categorias
      await fetch('http://localhost:3001/api/config/categories', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(categories)
      })

      // Salvar status
      await fetch('http://localhost:3001/api/config/statuses', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(statuses)
      })

      // Salvar condições
      await fetch('http://localhost:3001/api/config/conditions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(conditions)
      })

      alert('Configurações salvas com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar:', error)
      alert('Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  // Funções CRUD para Categorias
  const addCategory = () => {
    if (!newCategoryName.trim()) return
    
    const newCategory: Category = {
      id: Date.now().toString(),
      name: newCategoryName.toUpperCase(),
      icon: newCategoryIcon,
      active: true,
      createdAt: new Date().toISOString()
    }
    
    setCategories([...categories, newCategory])
    setNewCategoryName('')
    setNewCategoryIcon('Package')
    setShowNewCategory(false)
  }

  const updateCategory = (id: string, updates: Partial<Category>) => {
    setCategories(categories.map(cat => 
      cat.id === id ? { ...cat, ...updates, updatedAt: new Date().toISOString() } : cat
    ))
    setEditingCategory(null)
  }

  const deleteCategory = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta categoria?')) {
      setCategories(categories.filter(cat => cat.id !== id))
    }
  }

  // Funções CRUD para Status
  const addStatus = () => {
    if (!newStatusName.trim()) return
    
    const newStatus: Status = {
      id: Date.now().toString(),
      name: newStatusName.toUpperCase(),
      color: newStatusColor,
      icon: newStatusIcon,
      active: true,
      createdAt: new Date().toISOString()
    }
    
    setStatuses([...statuses, newStatus])
    setNewStatusName('')
    setNewStatusColor('bg-gray-100 text-gray-800')
    setNewStatusIcon('Shield')
    setShowNewStatus(false)
  }

  const updateStatus = (id: string, updates: Partial<Status>) => {
    setStatuses(statuses.map(status => 
      status.id === id ? { ...status, ...updates, updatedAt: new Date().toISOString() } : status
    ))
    setEditingStatus(null)
  }

  const deleteStatus = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este status?')) {
      setStatuses(statuses.filter(status => status.id !== id))
    }
  }

  // Funções CRUD para Condições
  const addCondition = () => {
    if (!newConditionName.trim()) return
    
    const newCondition: Condition = {
      id: Date.now().toString(),
      name: newConditionName.toUpperCase(),
      color: newConditionColor,
      active: true,
      createdAt: new Date().toISOString()
    }
    
    setConditions([...conditions, newCondition])
    setNewConditionName('')
    setNewConditionColor('bg-gray-100 text-gray-800')
    setShowNewCondition(false)
  }

  const updateCondition = (id: string, updates: Partial<Condition>) => {
    setConditions(conditions.map(cond => 
      cond.id === id ? { ...cond, ...updates, updatedAt: new Date().toISOString() } : cond
    ))
    setEditingCondition(null)
  }

  const deleteCondition = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta condição?')) {
      setConditions(conditions.filter(cond => cond.id !== id))
    }
  }

  // Obter ícone por nome
  const getIconComponent = (iconName: string, type: 'category' | 'status' = 'category') => {
    const icons = type === 'category' ? availableIcons : statusIcons
    const iconData = icons.find(i => i.name === iconName)
    return iconData ? iconData.icon : Package
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando configurações...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header com breadcrumb */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center text-sm text-gray-500 mb-2">
            <Link href="/admin/configuracoes" className="hover:text-gray-700">
              Configurações
            </Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <span className="text-gray-900">Patrimônio</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Package className="mr-3 h-7 w-7 text-gray-500" />
            Configurações de Patrimônio
          </h1>
          <p className="text-gray-600 mt-1">
            Gerencie categorias, status e condições dos ativos
          </p>
        </div>
        
        <button 
          onClick={saveChanges}
          disabled={saving}
          className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
            saving 
              ? 'bg-gray-300 text-gray-500' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Salvando...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Salvar Alterações</span>
            </>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('categories')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'categories'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Categorias de Ativos
          </button>
          <button
            onClick={() => setActiveTab('statuses')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'statuses'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Status dos Ativos
          </button>
          <button
            onClick={() => setActiveTab('conditions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'conditions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Condições dos Bens
          </button>
        </nav>
      </div>

      {/* Conteúdo das Tabs */}
      <div>
        {/* Tab Categorias */}
        {activeTab === 'categories' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Categorias de Ativos</h2>
                  <p className="text-gray-600 text-sm mt-1">
                    Defina as categorias disponíveis para classificação dos ativos
                  </p>
                </div>
                <button
                  onClick={() => setShowNewCategory(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Nova Categoria</span>
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Formulário de nova categoria */}
                {showNewCategory && (
                  <div className="col-span-full border-2 border-dashed border-blue-300 rounded-lg p-4 bg-blue-50">
                    <h3 className="font-medium text-gray-900 mb-3">Adicionar Nova Categoria</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nome da Categoria
                        </label>
                        <input
                          type="text"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Ex: PROJETOR"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ícone
                        </label>
                        <select
                          value={newCategoryIcon}
                          onChange={(e) => setNewCategoryIcon(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          {availableIcons.map(icon => (
                            <option key={icon.name} value={icon.name}>
                              {icon.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="flex items-end space-x-2">
                        <button
                          onClick={addCategory}
                          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                        >
                          <Check className="h-4 w-4" />
                          <span>Adicionar</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowNewCategory(false)
                            setNewCategoryName('')
                            setNewCategoryIcon('Package')
                          }}
                          className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Lista de categorias */}
                {categories.map(category => {
                  const Icon = getIconComponent(category.icon, 'category')
                  const isEditing = editingCategory?.id === category.id
                  
                  return (
                    <div
                      key={category.id}
                      className={`border rounded-lg p-4 ${
                        category.active ? 'bg-white' : 'bg-gray-50 opacity-60'
                      }`}
                    >
                      {isEditing ? (
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={editingCategory.name}
                            onChange={(e) => setEditingCategory({
                              ...editingCategory,
                              name: e.target.value
                            })}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                          <select
                            value={editingCategory.icon}
                            onChange={(e) => setEditingCategory({
                              ...editingCategory,
                              icon: e.target.value
                            })}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            {availableIcons.map(icon => (
                              <option key={icon.name} value={icon.name}>
                                {icon.label}
                              </option>
                            ))}
                          </select>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => updateCategory(category.id, editingCategory)}
                              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                            >
                              Salvar
                            </button>
                            <button
                              onClick={() => setEditingCategory(null)}
                              className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-3 py-1 rounded text-sm"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <Icon className="h-6 w-6 text-blue-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">
                                  {category.name}
                                </h3>
                                <p className="text-xs text-gray-500">
                                  {category.active ? 'Ativo' : 'Inativo'}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={category.active}
                                onChange={(e) => updateCategory(category.id, { active: e.target.checked })}
                                className="rounded"
                              />
                              <span className="text-sm text-gray-600">Ativo</span>
                            </label>
                            
                            <div className="flex space-x-1">
                              <button
                                onClick={() => setEditingCategory(category)}
                                className="p-1 hover:bg-gray-100 rounded"
                                title="Editar"
                              >
                                <Edit className="h-4 w-4 text-blue-600" />
                              </button>
                              <button
                                onClick={() => deleteCategory(category.id)}
                                className="p-1 hover:bg-gray-100 rounded"
                                title="Excluir"
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab Status */}
        {activeTab === 'statuses' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Status dos Ativos</h2>
                  <p className="text-gray-600 text-sm mt-1">
                    Configure os status disponíveis e suas cores
                  </p>
                </div>
                <button
                  onClick={() => setShowNewStatus(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Novo Status</span>
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Formulário de novo status */}
                {showNewStatus && (
                  <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 bg-blue-50">
                    <h3 className="font-medium text-gray-900 mb-3">Adicionar Novo Status</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nome do Status
                        </label>
                        <input
                          type="text"
                          value={newStatusName}
                          onChange={(e) => setNewStatusName(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Ex: EM_TRANSITO"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ícone
                        </label>
                        <select
                          value={newStatusIcon}
                          onChange={(e) => setNewStatusIcon(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          {statusIcons.map(icon => (
                            <option key={icon.name} value={icon.name}>
                              {icon.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Cor
                        </label>
                        <select
                          value={newStatusColor}
                          onChange={(e) => setNewStatusColor(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          {availableColors.map(color => (
                            <option key={color.value} value={color.value}>
                              {color.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="flex items-end space-x-2">
                        <button
                          onClick={addStatus}
                          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                        >
                          <Check className="h-4 w-4" />
                          <span>Adicionar</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowNewStatus(false)
                            setNewStatusName('')
                            setNewStatusColor('bg-gray-100 text-gray-800')
                            setNewStatusIcon('Shield')
                          }}
                          className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Lista de status */}
                {statuses.map(status => {
                  const Icon = getIconComponent(status.icon, 'status')
                  const isEditing = editingStatus?.id === status.id
                  
                  return (
                    <div
                      key={status.id}
                      className={`border rounded-lg p-4 ${
                        status.active ? 'bg-white' : 'bg-gray-50 opacity-60'
                      }`}
                    >
                      {isEditing ? (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          <input
                            type="text"
                            value={editingStatus.name}
                            onChange={(e) => setEditingStatus({
                              ...editingStatus,
                              name: e.target.value
                            })}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                          <select
                            value={editingStatus.icon}
                            onChange={(e) => setEditingStatus({
                              ...editingStatus,
                              icon: e.target.value
                            })}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            {statusIcons.map(icon => (
                              <option key={icon.name} value={icon.name}>
                                {icon.label}
                              </option>
                            ))}
                          </select>
                          <select
                            value={editingStatus.color}
                            onChange={(e) => setEditingStatus({
                              ...editingStatus,
                              color: e.target.value
                            })}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            {availableColors.map(color => (
                              <option key={color.value} value={color.value}>
                                {color.label}
                              </option>
                            ))}
                          </select>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => updateStatus(status.id, editingStatus)}
                              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                            >
                              Salvar
                            </button>
                            <button
                              onClick={() => setEditingStatus(null)}
                              className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-3 py-1 rounded text-sm"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <Icon className="h-5 w-5 text-gray-600" />
                              <span className="font-semibold text-gray-900">
                                {status.name}
                              </span>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                              Preview
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={status.active}
                                onChange={(e) => updateStatus(status.id, { active: e.target.checked })}
                                className="rounded"
                              />
                              <span className="text-sm text-gray-600">Ativo</span>
                            </label>
                            
                            <div className="flex space-x-1">
                              <button
                                onClick={() => setEditingStatus(status)}
                                className="p-1 hover:bg-gray-100 rounded"
                                title="Editar"
                              >
                                <Edit className="h-4 w-4 text-blue-600" />
                              </button>
                              <button
                                onClick={() => deleteStatus(status.id)}
                                className="p-1 hover:bg-gray-100 rounded"
                                title="Excluir"
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab Condições */}
        {activeTab === 'conditions' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Condições dos Bens</h2>
                  <p className="text-gray-600 text-sm mt-1">
                    Defina os estados de conservação dos ativos
                  </p>
                </div>
                <button
                  onClick={() => setShowNewCondition(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Nova Condição</span>
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Formulário de nova condição */}
                {showNewCondition && (
                  <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 bg-blue-50">
                    <h3 className="font-medium text-gray-900 mb-3">Adicionar Nova Condição</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nome da Condição
                        </label>
                        <input
                          type="text"
                          value={newConditionName}
                          onChange={(e) => setNewConditionName(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Ex: EXCELENTE"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Cor
                        </label>
                        <select
                          value={newConditionColor}
                          onChange={(e) => setNewConditionColor(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          {availableColors.map(color => (
                            <option key={color.value} value={color.value}>
                              {color.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="flex items-end space-x-2">
                        <button
                          onClick={addCondition}
                          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                        >
                          <Check className="h-4 w-4" />
                          <span>Adicionar</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowNewCondition(false)
                            setNewConditionName('')
                            setNewConditionColor('bg-gray-100 text-gray-800')
                          }}
                          className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Lista de condições */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {conditions.map(condition => {
                    const isEditing = editingCondition?.id === condition.id
                    
                    return (
                      <div
                        key={condition.id}
                        className={`border rounded-lg p-4 ${
                          condition.active ? 'bg-white' : 'bg-gray-50 opacity-60'
                        }`}
                      >
                        {isEditing ? (
                          <div className="space-y-3">
                            <input
                              type="text"
                              value={editingCondition.name}
                              onChange={(e) => setEditingCondition({
                                ...editingCondition,
                                name: e.target.value
                              })}
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                            <select
                              value={editingCondition.color}
                              onChange={(e) => setEditingCondition({
                                ...editingCondition,
                                color: e.target.value
                              })}
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                              {availableColors.map(color => (
                                <option key={color.value} value={color.value}>
                                  {color.label}
                                </option>
                              ))}
                            </select>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => updateCondition(condition.id, editingCondition)}
                                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                              >
                                Salvar
                              </button>
                              <button
                                onClick={() => setEditingCondition(null)}
                                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-3 py-1 rounded text-sm"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="text-center mb-4">
                              <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${condition.color}`}>
                                {condition.name}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <label className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={condition.active}
                                  onChange={(e) => updateCondition(condition.id, { active: e.target.checked })}
                                  className="rounded"
                                />
                                <span className="text-sm text-gray-600">Ativo</span>
                              </label>
                              
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => setEditingCondition(condition)}
                                  className="p-1 hover:bg-gray-100 rounded"
                                  title="Editar"
                                >
                                  <Edit className="h-4 w-4 text-blue-600" />
                                </button>
                                <button
                                  onClick={() => deleteCondition(condition.id)}
                                  className="p-1 hover:bg-gray-100 rounded"
                                  title="Excluir"
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Informação sobre integração */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900">Integração com Gestão de Ativos</h3>
              <p className="text-sm text-blue-700 mt-1">
                As configurações definidas aqui são automaticamente utilizadas na página de Gestão de Ativos.
                Todas as alterações serão refletidas nos formulários de cadastro e edição de ativos.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}