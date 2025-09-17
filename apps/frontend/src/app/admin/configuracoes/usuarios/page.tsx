// src/app/admin/configuracos/usuarios/page - Página Administrativa de Gestão de Usuários (Só Super Admin Acessa)
'use client'

import { useState, useEffect } from 'react'
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  UserCheck, 
  Mail, 
  X, 
  Save, 
  AlertCircle,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  Building,
  Shield,
  Key,
  UserX,
  PhoneCall,
  Info
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface User {
  id: string
  name: string
  email: string
  role: string
  isActive?: boolean
  canAcceptTickets?: boolean
  mustChangePassword?: boolean
  googleAuthEnabled?: boolean
  lastLogin?: string
  createdAt: string
  tenant?: {
    id: string
    name: string
    code: string
  } | null
  _count?: {
    createdTickets?: number
    assignedTickets?: number
    disposalRequests?: number
    reviewedDisposals?: number
    notifications?: number
    auditLogs?: number
  }
}

interface FormData {
  name: string
  email: string
  password: string
  confirmPassword: string
  role: 'SUPER_ADMIN' | 'ADMIN' | 'GESTOR_ESCOLAR' | 'SOLICITANTE'
  tenantId: string
  canAcceptTickets: boolean
  mustChangePassword: boolean
  googleAuthEnabled: boolean
  isActive: boolean
}

interface Tenant {
  id: string
  name: string
  code: string
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<User[]>([])
  const [escolas, setEscolas] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>('')
  const [roleFilter, setRoleFilter] = useState('TODOS')
  const [statusFilter, setStatusFilter] = useState('TODOS')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [generateRandomPassword, setGenerateRandomPassword] = useState(false)

  const [deleteModal, setDeleteModal] = useState<{
    show: boolean
    usuario: User | null
    loading: boolean
    type: 'delete' | 'deactivate'
  }>({
    show: false,
    usuario: null,
    loading: false,
    type: 'delete'
  })

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'SOLICITANTE',
    tenantId: '',
    canAcceptTickets: false,
    mustChangePassword: true,
    googleAuthEnabled: false,
    isActive: true
  })

  useEffect(() => {
    fetchUsuarios()
    fetchEscolas()
  }, [])

  // Atualizar canAcceptTickets quando mudar o role
  useEffect(() => {
    if (formData.role === 'ADMIN') {
      setFormData(prev => ({ ...prev, canAcceptTickets: true }))
    } else if (formData.role === 'SOLICITANTE') {
      setFormData(prev => ({ ...prev, canAcceptTickets: false }))
    }
  }, [formData.role])

  const fetchUsuarios = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const data = await response.json()
      console.log('Usuários carregados:', data)
      setUsuarios(Array.isArray(data) ? data : data.users || [])
    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
      setError('Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }

  const fetchEscolas = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/tenants', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const data = await response.json()
      setEscolas(Array.isArray(data) ? data : data.tenants || [])
    } catch (error) {
      console.error('Erro ao buscar escolas:', error)
    }
  }

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData(prev => ({
      ...prev,
      password: password,
      confirmPassword: password
    }))
    setGenerateRandomPassword(true)
    setShowPassword(true)
    setShowConfirmPassword(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    // Validações
    if (!editingId && formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem')
      setSaving(false)
      return
    }

    if (!editingId && formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      setSaving(false)
      return
    }

    // Validação de escola para perfis que precisam
    if (formData.role !== 'SUPER_ADMIN' && !formData.tenantId) {
      setError('Escola é obrigatória para este perfil')
      setSaving(false)
      return
    }

    try {
      const payload: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        tenantId: formData.role === 'SUPER_ADMIN' ? null : formData.tenantId,
        canAcceptTickets: formData.canAcceptTickets,
        mustChangePassword: formData.mustChangePassword,
        googleAuthEnabled: formData.googleAuthEnabled,
        isActive: formData.isActive
      }

      // Só envia senha se estiver criando ou se foi preenchida na edição
      if (!editingId || formData.password) {
        payload.password = formData.password
      }

      const url = editingId 
        ? `http://localhost:3001/api/users/${editingId}`
        : 'http://localhost:3001/api/users'
      
      const method = editingId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()
      console.log('Resposta do servidor:', data)

      if (!response.ok || data.error) {
        throw new Error(data.message || 'Erro ao salvar usuário')
      }

      await fetchUsuarios()
      resetForm()
      
      // Se gerou senha aleatória, mostrar alerta
      if (generateRandomPassword && !editingId) {
        alert(`Usuário criado com sucesso!\n\nSenha temporária: ${formData.password}\n\nForneça esta senha ao usuário. Ele será solicitado a alterá-la no primeiro login.`)
      }
    } catch (error: any) {
      setError(error.message || 'Erro ao salvar usuário')
      console.error('Erro ao salvar usuário:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (usuario: User) => {
    setFormData({
      name: usuario.name,
      email: usuario.email,
      password: '',
      confirmPassword: '',
      role: usuario.role as any,
      tenantId: usuario.tenant?.id || '',
      canAcceptTickets: usuario.canAcceptTickets || false,
      mustChangePassword: usuario.mustChangePassword || false,
      googleAuthEnabled: usuario.googleAuthEnabled || false,
      isActive: usuario.isActive !== false
    })
    setEditingId(usuario.id)
    setShowForm(true)
  }

  const handleDelete = (usuario: User) => {
    // Se usuário tem registros vinculados, sugerir desativar
    const hasLinkedRecords = usuario._count && Object.values(usuario._count).some(count => count > 0)
    
    setDeleteModal({
      show: true,
      usuario: usuario,
      loading: false,
      type: hasLinkedRecords ? 'deactivate' : 'delete'
    })
  }

  const confirmDelete = async () => {
    if (!deleteModal.usuario) return

    setDeleteModal(prev => ({ ...prev, loading: true }))

    try {
      if (deleteModal.type === 'deactivate') {
        // Desativar usuário
        const response = await fetch(`http://localhost:3001/api/users/${deleteModal.usuario.id}/deactivate`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })

        const data = await response.json()
        console.log('Resposta da desativação:', data)
        
        if (!response.ok || data.error) {
          throw new Error(data.message || 'Erro ao desativar usuário')
        }
      } else {
        // Excluir usuário
        const response = await fetch(`http://localhost:3001/api/users/${deleteModal.usuario.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })

        const data = await response.json()
        console.log('Resposta da exclusão:', data)
        
        if (!response.ok || data.error) {
          // Se tem registros vinculados, sugerir desativar
          if (data.details) {
            const details = Object.entries(data.details)
              .filter(([_, count]) => count > 0)
              .map(([key, count]) => `${key}: ${count}`)
              .join('\n')
            
            alert(`Não é possível excluir!\n\nUsuário possui registros vinculados:\n${details}\n\nUse a opção de desativar ao invés de excluir.`)
            setDeleteModal(prev => ({ ...prev, type: 'deactivate', loading: false }))
            return
          }
          throw new Error(data.message || 'Erro ao excluir usuário')
        }
      }

      await fetchUsuarios()
      setDeleteModal({ show: false, usuario: null, loading: false, type: 'delete' })
    } catch (error: any) {
      alert(error.message || 'Erro ao processar solicitação')
      setDeleteModal(prev => ({ ...prev, loading: false }))
    }
  }

  const reactivateUser = async (userId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ isActive: true })
      })

      if (response.ok) {
        await fetchUsuarios()
      }
    } catch (error) {
      console.error('Erro ao reativar usuário:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'SOLICITANTE',
      tenantId: '',
      canAcceptTickets: false,
      mustChangePassword: true,
      googleAuthEnabled: false,
      isActive: true
    })
    setEditingId(null)
    setShowForm(false)
    setError('')
    setShowPassword(false)
    setShowConfirmPassword(false)
    setGenerateRandomPassword(false)
  }

  const resetPassword = async (userId: string) => {
    if (!confirm('Deseja resetar a senha deste usuário? Uma nova senha será gerada.')) {
      return
    }

    try {
      const response = await fetch(`http://localhost:3001/api/users/${userId}/reset-password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) {
        throw new Error('Erro ao resetar senha')
      }

      const data = await response.json()
      alert(`Senha resetada com sucesso!\n\nNova senha: ${data.temporaryPassword}\n\nForneça esta senha ao usuário.`)
      await fetchUsuarios()
    } catch (error) {
      console.error('Erro ao resetar senha:', error)
      alert('Erro ao resetar senha')
    }
  }

  // Filtros
  const usuariosFiltrados = usuarios.filter(usuario => {
    const matchRole = roleFilter === 'TODOS' || usuario.role === roleFilter
    const matchStatus = statusFilter === 'TODOS' || 
                       (statusFilter === 'ATIVOS' && usuario.isActive !== false) ||
                       (statusFilter === 'INATIVOS' && usuario.isActive === false)
    return matchRole && matchStatus
  })

  // Roles únicas para filtro
  const roles = Array.from(new Set(usuarios.map(u => u.role)))

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'bg-purple-100 text-purple-700'
      case 'ADMIN': return 'bg-red-100 text-red-700'
      case 'GESTOR_ESCOLAR': return 'bg-blue-100 text-blue-700'
      case 'SOLICITANTE': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'Super Admin'
      case 'ADMIN': return 'Administrador'
      case 'GESTOR_ESCOLAR': return 'Gestor Escolar'
      case 'SOLICITANTE': return 'Solicitante'
      default: return role
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return Shield
      case 'ADMIN': return UserCheck
      case 'GESTOR_ESCOLAR': return Building
      default: return Users
    }
  }

  // Validação se pode aceitar chamados baseado no perfil
  const canToggleAcceptTickets = (role: string) => {
    switch (role) {
      case 'SOLICITANTE': return false // Nunca pode
      case 'GESTOR_ESCOLAR': return true // Opcional
      case 'ADMIN': return true // Sim por padrão
      case 'SUPER_ADMIN': return true // Opcional
      default: return false
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando usuários...</p>
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
            <Users className="mr-3 h-7 w-7 text-indigo-500" />
            Gestão de Usuários
          </h1>
          <p className="text-gray-600 mt-1">
            Gerencie os usuários e permissões do sistema
          </p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Novo Usuário</span>
        </button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {['SUPER_ADMIN', 'ADMIN', 'GESTOR_ESCOLAR', 'SOLICITANTE'].map(role => {
          const Icon = getRoleIcon(role)
          const count = usuarios.filter(u => u.role === role && u.isActive !== false).length
          const color = role === 'SUPER_ADMIN' ? 'purple' : 
                       role === 'ADMIN' ? 'red' : 
                       role === 'GESTOR_ESCOLAR' ? 'blue' : 'green'
          
          return (
            <Card key={role} className={`bg-gradient-to-r from-${color}-500 to-${color}-600 text-white`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-${color}-100 text-sm`}>{getRoleLabel(role)}</p>
                    <p className="text-2xl font-bold">{count}</p>
                  </div>
                  <Icon className={`h-8 w-8 text-${color}-200`} />
                </div>
              </CardContent>
            </Card>
          )
        })}
        
        <Card className="bg-gradient-to-r from-gray-500 to-gray-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-100 text-sm">Inativos</p>
                <p className="text-2xl font-bold">
                  {usuarios.filter(u => u.isActive === false).length}
                </p>
              </div>
              <UserX className="h-8 w-8 text-gray-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="TODOS">Todos os Perfis</option>
              {roles.map(role => (
                <option key={role} value={role}>{getRoleLabel(role)}</option>
              ))}
            </select>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="TODOS">Todos os Status</option>
              <option value="ATIVOS">Ativos</option>
              <option value="INATIVOS">Inativos</option>
            </select>
            
            <div className="text-sm text-gray-600 ml-auto">
              {usuariosFiltrados.length} de {usuarios.length} usuários
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Usuários */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {usuariosFiltrados.map((usuario) => {
          const RoleIcon = getRoleIcon(usuario.role)
          
          return (
            <Card key={usuario.id} className={`hover:shadow-lg transition-shadow ${usuario.isActive === false ? 'opacity-60' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                      <RoleIcon className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {usuario.name}
                        {usuario.isActive === false && (
                          <span className="ml-2 text-xs text-red-600">(Inativo)</span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-500">{usuario.email}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(usuario.role)}`}>
                      {getRoleLabel(usuario.role)}
                    </span>
                    {usuario.googleAuthEnabled && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        Google
                      </span>
                    )}
                  </div>
                  
                  {usuario.canAcceptTickets && (
                    <p className="text-xs text-blue-600 flex items-center">
                      <PhoneCall className="h-3 w-3 mr-1" />
                      Pode aceitar chamados
                    </p>
                  )}
                  
                  {usuario.tenant && (
                    <p className="text-sm text-gray-600">
                      <Building className="h-3 w-3 inline mr-1" />
                      {usuario.tenant.name}
                    </p>
                  )}
                  
                  {usuario.mustChangePassword && (
                    <p className="text-xs text-orange-600 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Deve alterar senha
                    </p>
                  )}
                  
                  {usuario.lastLogin && (
                    <p className="text-xs text-gray-500">
                      Último acesso: {new Date(usuario.lastLogin).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleEdit(usuario)}
                      className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                      title="Editar"
                    >
                      <Edit className="h-4 w-4 text-blue-600" />
                    </button>
                    <button
                      onClick={() => resetPassword(usuario.id)}
                      className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                      title="Resetar senha"
                    >
                      <RefreshCw className="h-4 w-4 text-orange-600" />
                    </button>
                    {usuario.isActive === false ? (
                      <button
                        onClick={() => reactivateUser(usuario.id)}
                        className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                        title="Reativar"
                      >
                        <UserCheck className="h-4 w-4 text-green-600" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDelete(usuario)}
                        className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                        title="Excluir/Desativar"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </button>
                    )}
                  </div>
                  
                  {usuario._count && Object.values(usuario._count).some(count => count > 0) && (
                    <div className="text-xs text-gray-500">
                      <Info className="h-3 w-3 inline mr-1" />
                      Possui registros
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Formulário Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingId ? 'Editar Usuário' : 'Novo Usuário'}
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

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nome */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    E-mail *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={editingId !== null}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Este e-mail será usado para login {formData.googleAuthEnabled && 'via Google'}
                  </p>
                </div>

                {/* Senha - apenas se criando ou se quiser alterar */}
                {!editingId && (
                  <>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium text-gray-700">
                          Senha *
                        </label>
                        <button
                          type="button"
                          onClick={generatePassword}
                          className="text-xs text-blue-600 hover:text-blue-700 flex items-center"
                        >
                          <Key className="h-3 w-3 mr-1" />
                          Gerar senha
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 pr-10"
                          required={!editingId}
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-2.5 text-gray-500 hover:text-gray-700"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirmar Senha *
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 pr-10"
                          required={!editingId}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-2 top-2.5 text-gray-500 hover:text-gray-700"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* Perfil */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Perfil de Acesso *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="SOLICITANTE">Solicitante</option>
                    <option value="GESTOR_ESCOLAR">Gestor Escolar</option>
                    <option value="ADMIN">Administrador</option>
                    <option value="SUPER_ADMIN">Super Administrador</option>
                  </select>
                </div>

                {/* Escola - obrigatório exceto para SUPER_ADMIN */}
                {formData.role !== 'SUPER_ADMIN' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Escola/Unidade *
                    </label>
                    <select
                      value={formData.tenantId}
                      onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Selecione...</option>
                      {escolas.map(escola => (
                        <option key={escola.id} value={escola.id}>
                          {escola.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Opções de segurança e permissões */}
                <div className="space-y-3 border-t pt-4">
                  {/* Pode aceitar chamados - baseado no perfil */}
                  {canToggleAcceptTickets(formData.role) && (
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.canAcceptTickets}
                        onChange={(e) => setFormData({ ...formData, canAcceptTickets: e.target.checked })}
                        className="rounded"
                        disabled={formData.role === 'SOLICITANTE'}
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700 flex items-center">
                          <PhoneCall className="h-4 w-4 mr-1" />
                          Pode aceitar chamados
                        </span>
                        <p className="text-xs text-gray-500">
                          {formData.role === 'ADMIN' 
                            ? 'Técnico pode aceitar e resolver chamados'
                            : formData.role === 'GESTOR_ESCOLAR'
                            ? 'Permite que o gestor ajude com chamados da escola'
                            : formData.role === 'SUPER_ADMIN'
                            ? 'Opcional - caso queira atender chamados'
                            : 'Solicitantes não podem aceitar chamados'}
                        </p>
                      </div>
                    </label>
                  )}

                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.mustChangePassword}
                      onChange={(e) => setFormData({ ...formData, mustChangePassword: e.target.checked })}
                      className="rounded"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Solicitar alteração de senha no primeiro login
                      </span>
                      <p className="text-xs text-gray-500">
                        O usuário será obrigado a criar uma nova senha ao fazer login
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.googleAuthEnabled}
                      onChange={(e) => setFormData({ ...formData, googleAuthEnabled: e.target.checked })}
                      className="rounded"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Permitir login via Google
                      </span>
                      <p className="text-xs text-gray-500">
                        O usuário poderá fazer login usando sua conta Google com este e-mail
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Usuário ativo
                      </span>
                      <p className="text-xs text-gray-500">
                        Usuários inativos não podem fazer login
                      </p>
                    </div>
                  </label>
                </div>

                {/* Botões */}
                <div className="flex space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Salvando...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>{editingId ? 'Salvar' : 'Criar Usuário'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão/Desativação */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {deleteModal.type === 'deactivate' ? 'Desativar Usuário' : 'Confirmar Exclusão'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {deleteModal.type === 'deactivate' 
                    ? `Deseja desativar o usuário ${deleteModal.usuario?.name}? O usuário não poderá mais fazer login.`
                    : `Tem certeza que deseja excluir o usuário ${deleteModal.usuario?.name}?`}
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  {deleteModal.type === 'deactivate'
                    ? 'Você poderá reativar o usuário posteriormente.'
                    : 'Esta ação não pode ser desfeita.'}
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setDeleteModal({ show: false, usuario: null, loading: false, type: 'delete' })}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    disabled={deleteModal.loading}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmDelete}
                    className={`flex-1 ${deleteModal.type === 'deactivate' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-red-500 hover:bg-red-600'} text-white px-4 py-2 rounded-lg`}
                    disabled={deleteModal.loading}
                  >
                    {deleteModal.loading 
                      ? 'Processando...' 
                      : deleteModal.type === 'deactivate' ? 'Desativar' : 'Excluir'}
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