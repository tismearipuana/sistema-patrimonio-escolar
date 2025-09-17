// src/app/login/page.tsx - Página de login moderna do Sistema
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  AlertCircle,
  Building2,
  ShieldCheck,
  Server,
  Globe,
  CheckCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react'
import axios from 'axios'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const router = useRouter()

  // Animação de gradiente
  useEffect(() => {
    const interval = setInterval(() => {
      const element = document.getElementById('gradient-bg')
      if (element) {
        element.style.transform = `rotate(${Math.random() * 360}deg)`
      }
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        email,
        password
      })

      if (response.data.error) {
        setError(response.data.message)
      } else {
        // Salva o token e dados do usuário
        localStorage.setItem('token', response.data.access_token)
        localStorage.setItem('user', JSON.stringify(response.data.user))

        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email)
        } else {
          localStorage.removeItem('rememberedEmail')
        }

        // Redireciona para o dashboard
        router.push('/')
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Erro ao fazer login. Verifique suas credenciais.'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  // Carregar email salvo se existir
  useEffect(() => {
    const remembered = localStorage.getItem('rememberedEmail')
    if (remembered) {
      setEmail(remembered)
      setRememberMe(true)
    }
  }, [])

  const features = [
    { icon: ShieldCheck, text: 'Segurança Avançada' },
    { icon: Server, text: 'Backup Automático' },
    { icon: Globe, text: 'Acesso Remoto' }
  ]

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Background animado */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          id="gradient-bg"
          className="absolute -inset-[10px] opacity-50 transition-transform duration-[10000ms] ease-linear"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-conic from-blue-500 via-purple-500 to-blue-500 rounded-full blur-3xl"></div>
        </div>

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 bg-center"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='60' height='60' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='white' stroke-width='0.5' opacity='0.05'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grid)'/%3E%3C/svg%3E")`
          }}
        ></div>
      </div>

      <div className="relative z-10 min-h-screen flex">
        {/* Lado esquerdo - Formulário */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* Logo e título */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-2xl mb-6 transform rotate-3 hover:rotate-6 transition-transform">
                <Building2 className="w-10 h-10 text-white" />
              </div>

              <h1 className="text-4xl font-bold text-white mb-2">
                Patrimônio Municipal
              </h1>
              <p className="text-blue-200">
                Sistema de Gestão de Ativos Educacionais
              </p>
            </div>

            {/* Card do formulário */}
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
              <form className="space-y-6" onSubmit={handleSubmit}>
                {error && (
                  <div className="bg-red-500/10 backdrop-blur border border-red-500/20 rounded-2xl p-4 flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-red-200 text-sm">{error}</span>
                  </div>
                )}

                {/* Campo de email */}
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-blue-100">
                    E-mail
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-blue-300 group-focus-within:text-blue-400 transition-colors" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur border border-white/20 rounded-xl text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>

                {/* Campo de senha */}
                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-medium text-blue-100">
                    Senha
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-blue-300 group-focus-within:text-blue-400 transition-colors" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-3 bg-white/10 backdrop-blur border border-white/20 rounded-xl text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-blue-300 hover:text-blue-400 transition-colors" />
                      ) : (
                        <Eye className="h-5 w-5 text-blue-300 hover:text-blue-400 transition-colors" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Lembrar-me e Esqueceu a senha */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                    />
                    <span className="ml-2 text-sm text-blue-200">Lembrar-me</span>
                  </label>

                  <button
                    type="button"
                    className="text-sm text-blue-300 hover:text-blue-400 transition-colors"
                    onClick={() => alert('Contate o administrador do sistema')}
                  >
                    Esqueceu a senha?
                  </button>
                </div>

                {/* Botão de login */}
                <button
                  type="submit"
                  disabled={loading}
                  className="relative w-full group"
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur opacity-60 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative w-full py-3.5 px-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl text-white font-semibold flex items-center justify-center space-x-2 hover:from-blue-600 hover:to-blue-700 transition-all">
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Entrando...</span>
                      </>
                    ) : (
                      <>
                        <span>Entrar no Sistema</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </div>
                </button>
              </form>

              {/* Divisor */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-transparent text-blue-300">Acesso seguro</span>
                </div>
              </div>

              {/* Features */}
              <div className="grid grid-cols-3 gap-4">
                {features.map((feature, index) => (
                  <div key={index} className="text-center">
                    <div className="inline-flex items-center justify-center w-10 h-10 bg-white/10 rounded-lg mb-2">
                      <feature.icon className="w-5 h-5 text-blue-300" />
                    </div>
                    <p className="text-xs text-blue-200">{feature.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <p className="text-center text-blue-200/60 text-sm mt-8">
              © 2025 Secretaria Municipal de Educação
            </p>
          </div>
        </div>

        {/* Lado direito - Informações (apenas desktop) */}
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-8">
          <div className="max-w-lg">
            <div className="flex items-center mb-6">
              <Sparkles className="w-8 h-8 text-yellow-400 mr-3" />
              <h2 className="text-3xl font-bold text-white">
                Sistema Moderno e Eficiente
              </h2>
            </div>

            <p className="text-blue-200 mb-8 text-lg leading-relaxed">
              {/*Sistema de Gestão do patrimônio educacional do município com segurança,
              agilidade e controle total. Nossa plataforma oferece recursos avançados
              para otimizar a gestão de ativos.*/}
            </p>

            <div className="space-y-4">
              {[
                'Controle completo de ativos e equipamentos',
                'Sistema de chamados integrado',
                'Relatórios detalhados e analytics',
                'QR Codes para rastreamento rápido',
                'Gestão multi-escolas centralizada'
              ].map((item, index) => (
                <div key={index} className="flex items-center text-blue-100">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            {/*
            <div className="mt-12 p-6 bg-white/10 backdrop-blur rounded-2xl border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <span className="text-blue-200">Ativos Gerenciados</span>
                <span className="text-2xl font-bold text-white">12,458</span>
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-blue-200">Escolas Conectadas</span>
                <span className="text-2xl font-bold text-white">47</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-blue-200">Chamados Resolvidos</span>
                <span className="text-2xl font-bold text-white">98.5%</span>
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  )
}