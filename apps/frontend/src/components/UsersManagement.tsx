// apps/frontend/src/components/UsersManagement.tsx
'use client'

import { useState, useEffect } from 'react'
import { Users, Plus, Edit, Trash2, Search, Filter, UserCheck, Shield, X, Save, AlertCircle, Building2, Mail, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface User {
  id: string
  name: string
  email: string
  role: 'SOLICITANTE' | 'TECNICO' | 'GESTOR' | 'DIRETOR' | 'AUDITOR' | 'ADMIN'
  createdAt: string
  updatedAt: string
  tenant: {
    id: string
    name: string
    type: string
    code?: string
  }
  _count: {
    tickets: number
    assignedTickets: number
  }
}

interface Tenant {
  id: string
  name: string
  type: string
  code?: string
}

interface Role {
  value: string
  label: string
  description: string
  color: string
}

interface UserFormData {
  name: string
  email: string
  role: 'SOLICITANTE' | 'TECNICO' | 'GESTOR' | 'DIRETOR' | 'AUDITOR' | 'ADMIN'
  tenantId: string
}

interface UsersManagementProps {
  tenants: Tenant[]
}

export default function UsersManagement({ tenants }: UsersManagementProps) {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('TODOS')
  const [tenantFilter, setTenantFilter] = useState('TODOS')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    role: 'SOLICITANTE',
    tenantId: ''
  })

  useEffect(() => {
    loadUsers()
    loadRoles()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`)
      const data = await response.json()
      
      if (data.users) {
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
      setError('Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }

  const loadRoles = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/roles/available`)
      const data = await response.json()
      
      if (data.roles) {
        setRoles(data.roles)
      }
    } catch (error) {
      console.error('Erro ao carregar roles:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const url = editingUser 
        ? `${process.env.NEXT_PUBLIC_API_URL}/users/${editingUser.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/users`
      
      const method = editingUser ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (result.error) {
        setError(result.message)
        return
      }

      await loadUsers()
      resetForm()
    } catch (error: any) {
      setError(error.message || 'Erro ao salvar usuário')
      console.error('Erro ao salvar usuário:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenant.id
    })
    setShowForm(true)
  }

  const handleDelete = async (userId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.error) {
        alert(result.message)
        if (result.details) {
          console.log('Detalhes:', result.details)
        }
        return
      }

      await loadUsers()
      setShowDeleteConfirm(null)
    } catch (error) {
      console.error('Erro ao excluir usuário:', error)
      alert('Erro ao excluir usuário')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: 'SOLICITANTE',
      tenantId: ''
    })
    setEditingUser(null)
    setShowForm(false)
    setError('')
  }

  const handleInputChange = (field: keyof UserFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const getRoleInfo = (role: string) => {
    return roles.find(r => r.value === role) || {
      label: role,
      description: '',
      color: 'bg-gray-100 text-gray-700'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Filtros
  const filteredUsers = users.filter(user => {
    const matchSearch = searchTerm === '' || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchRole = roleFilter === 'TODOS' || user.role === roleFilter
    const matchTenant = tenantFilter === 'TODOS' || user.tenant.id === tenantFilter
    
    return matchSearch && matchRole && matchTenant
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Carregando usuários...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Gestão de Usuários
          </h3>
          <p className="text-sm text-gray-600">Gerencie contas de usuário e permissões</p>
        </div>
        
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Novo Usuário</span>
        </button>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Usuários</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Técnicos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => ['TECNICO', 'ADMIN'].includes(u.role)).length}
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Diretores</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.role === 'DIRETOR').length}
                </p>
              </div>
              <Shield className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Solicitantes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.role === 'SOLICITANTE').length}
                </p>
              </div>
              <Users className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome ou email..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="TODOS">Todos os Papéis</option>
              {roles.map(role => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>

            <select
              value={tenantFilter}
              onChange={(e) => setTenantFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="TODOS">Todas as Escolas</option>
              {tenants.map(tenant => (
                <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
              ))}
            </select>

            <div className="text-sm text-gray-600">
              {filteredUsers.length} de {users.length} usuários
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Usuários */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Papel
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Escola
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Atividade
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Criado
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map(user => {
                  const roleInfo = getRoleInfo(user.role)
                  return (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            {user.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleInfo.color}`}>
                          {roleInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center text-sm text-gray-900">
                          <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                          {user.tenant.name}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        <div>
                          {user._count.tickets > 0 && (
                            <div>Criou: {user._count.tickets} chamados</div>
                          )}
                          {user._count.assignedTickets > 0 && (
                            <div>Resolveu: {user._count.assignedTickets} chamados</div>
                          )}
                          {user._count.tickets === 0 && user._count.assignedTickets === 0 && (
                            <span className="text-gray-400">Sem atividade</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(user.createdAt)}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded"
                            title="Editar usuário"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(user.id)}
                            className="text-red-600 hover:text-red-800 p-1 rounded"
                            title="Excluir usuário"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {users.length === 0 ? 'Nenhum usuário cadastrado' : 'Nenhum usuário encontrado'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {users.length === 0 
                    ? 'Comece criando o primeiro usuário do sistema.'
                    : 'Ajuste os filtros para ver outros usuários.'
                  }
                </p>
                {users.length === 0 && (
                  <button
                    onClick={() => setShowForm(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg inline-flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Criar Primeiro Usuário</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <h3 className="text-lg font-semibold text-red-600">Confirmar Exclusão</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
                >
                  Excluir
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal do Formulário */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                </h3>
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
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nome do usuário"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="email@exemplo.com"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Papel/Função *
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => handleInputChange('role', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      {roles.map(role => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                    {formData.role && (
                      <p className="text-xs text-gray-500 mt-1">
                        {getRoleInfo(formData.role).description}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Escola *
                    </label>
                    <select
                      value={formData.tenantId}
                      onChange={(e) => handleInputChange('tenantId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Selecione uma escola</option>
                      {tenants.map(tenant => (
                        <option key={tenant.id} value={tenant.id}>
                          {tenant.name} {tenant.code && `(${tenant.code})`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex space-x-3 pt-6">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving || !formData.name || !formData.email || !formData.tenantId}
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
                        <span>{editingUser ? 'Atualizar' : 'Criar'} Usuário</span>
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