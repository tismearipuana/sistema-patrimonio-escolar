'use client'

import { useState, useEffect } from 'react'
import { 
  AlertTriangle, 
  Database, 
  RefreshCw, 
  Shield, 
  Info,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  Copy,
  AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useRouter } from 'next/navigation'

interface ResetResponse {
  success: boolean
  message: string
  data?: {
    usuarios: Array<{
      email: string
      senha: string
      perfil: string
    }>
    estrutura: {
      secretaria: string
      escola: string
      categorias: number
      configuracoes: string
    }
  }
}

interface DatabaseStats {
  stats: {
    usuarios: number
    escolas: number
    ativos: number
    chamados: number
    categorias: number
  }
  ambiente: string
  resetPermitido: boolean
}

export default function ResetSystemPage() {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [stats, setStats] = useState<DatabaseStats | null>(null)
  const [resetResult, setResetResult] = useState<ResetResponse | null>(null)
  const [error, setError] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [copiedUser, setCopiedUser] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    checkPermissions()
    fetchDatabaseStats()
  }, [])

  const checkPermissions = () => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const user = JSON.parse(userData)
      setCurrentUser(user)
      
      // Apenas SUPER_ADMIN pode acessar esta página
      if (user.role !== 'SUPER_ADMIN') {
        router.push('/admin')
      }
    } else {
      router.push('/login')
    }
    setChecking(false)
  }

  const fetchDatabaseStats = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/system/database-stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
    }
  }

  const handleReset = async () => {
    if (!password) {
      setError('Digite a senha de reset')
      return
    }

    if (!confirmReset) {
      setError('Você precisa confirmar que deseja resetar o sistema')
      return
    }

    // Confirmação dupla
    const confirm1 = window.confirm(
      '⚠️ ATENÇÃO ⚠️\n\n' +
      'Esta ação irá APAGAR TODOS OS DADOS do sistema:\n' +
      '• Todos os usuários\n' +
      '• Todas as escolas\n' +
      '• Todos os ativos\n' +
      '• Todos os chamados\n' +
      '• Todas as configurações\n\n' +
      'Deseja continuar?'
    )

    if (!confirm1) return

    const confirm2 = window.confirm(
      '⚠️ ÚLTIMA CONFIRMAÇÃO ⚠️\n\n' +
      'Esta ação NÃO PODE SER DESFEITA!\n\n' +
      'Tem CERTEZA ABSOLUTA que deseja resetar o sistema?'
    )

    if (!confirm2) return

    setLoading(true)
    setError('')
    setResetResult(null)

    try {
      const response = await fetch('http://localhost:3001/api/system/reset-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          password,
          confirmReset: true
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setResetResult(data)
        setPassword('')
        setConfirmReset(false)
        
        // Fazer logout após reset
        setTimeout(() => {
          alert('Sistema resetado! Você será redirecionado para o login.')
          localStorage.clear()
          router.push('/login')
        }, 10000) // 10 segundos para ver as credenciais
      } else {
        setError(data.message || 'Erro ao resetar sistema')
      }
    } catch (error) {
      console.error('Erro ao resetar:', error)
      setError('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string, userId: string) => {
    navigator.clipboard.writeText(text)
    setCopiedUser(userId)
    setTimeout(() => setCopiedUser(null), 2000)
  }

  if (checking) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    )
  }

  if (currentUser?.role !== 'SUPER_ADMIN') {
    return null
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header com Aviso */}
      <Card className="border-red-500 bg-red-50">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-red-900">Reset do Sistema</h1>
              <p className="text-red-700 mt-1">Área extremamente perigosa - Apenas para desenvolvimento</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-white border border-red-200 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              Esta funcionalidade irá <strong>APAGAR COMPLETAMENTE</strong> todos os dados do sistema 
              e criar apenas os usuários básicos. Use apenas em ambiente de desenvolvimento ou teste.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas Atuais */}
      {stats && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold flex items-center">
              <Database className="mr-2 h-5 w-5" />
              Estado Atual do Banco de Dados
            </h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{stats.stats.usuarios}</p>
                <p className="text-sm text-gray-600">Usuários</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{stats.stats.escolas}</p>
                <p className="text-sm text-gray-600">Escolas</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{stats.stats.ativos}</p>
                <p className="text-sm text-gray-600">Ativos</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{stats.stats.chamados}</p>
                <p className="text-sm text-gray-600">Chamados</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{stats.stats.categorias}</p>
                <p className="text-sm text-gray-600">Categorias</p>
              </div>
            </div>
            
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Info className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-gray-600">
                  Ambiente: <strong className="text-gray-900">{stats.ambiente}</strong>
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {stats.resetPermitido ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600">Reset permitido</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-600">Reset bloqueado em produção</span>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulário de Reset */}
      {!resetResult && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold flex items-center">
              <Shield className="mr-2 h-5 w-5" />
              Autenticação Necessária
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
                <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Senha de Reset do Sistema
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 pr-10"
                  placeholder="Digite a senha de reset"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-2.5 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Esta senha foi definida no backend e é diferente da senha de usuário
              </p>
            </div>

            <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={confirmReset}
                  onChange={(e) => setConfirmReset(e.target.checked)}
                  className="mt-1 rounded border-red-300 text-red-600 focus:ring-red-500"
                />
                <div>
                  <span className="font-medium text-gray-900">
                    Eu entendo as consequências
                  </span>
                  <p className="text-sm text-gray-600 mt-1">
                    Confirmo que desejo APAGAR TODOS OS DADOS do sistema. Esta ação não pode ser desfeita.
                  </p>
                </div>
              </label>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => router.push('/admin/configuracoes')}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleReset}
                disabled={loading || !confirmReset || !password}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Resetando...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    <span>Resetar Sistema</span>
                  </>
                )}
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultado do Reset */}
      {resetResult && resetResult.success && (
        <Card className="border-green-500 bg-green-50">
          <CardHeader>
            <h2 className="text-lg font-semibold text-green-900 flex items-center">
              <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
              Sistema Resetado com Sucesso!
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <User className="mr-2 h-4 w-4" />
                Novos Usuários Criados
              </h3>
              
              <div className="space-y-2">
                {resetResult.data?.usuarios.map((user) => (
                  <div key={user.email} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="font-medium text-gray-900">{user.perfil}</p>
                        <p className="text-sm text-gray-600 flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {user.email}
                        </p>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Lock className="h-3 w-3 mr-1" />
                        {user.senha}
                      </div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(`${user.email} / ${user.senha}`, user.email)}
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                      title="Copiar credenciais"
                    >
                      {copiedUser === user.email ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4 text-gray-600" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Database className="mr-2 h-4 w-4" />
                Estrutura Criada
              </h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• {resetResult.data?.estrutura.secretaria}</li>
                <li>• {resetResult.data?.estrutura.escola}</li>
                <li>• {resetResult.data?.estrutura.categorias} categorias padrão</li>
                <li>• {resetResult.data?.estrutura.configuracoes}</li>
              </ul>
            </div>

            <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4">
              <p className="text-sm text-yellow-900">
                <strong>Importante:</strong> Você será redirecionado para o login em alguns segundos. 
                Anote as credenciais acima se necessário.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}