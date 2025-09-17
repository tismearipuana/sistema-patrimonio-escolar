'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { AlertCircle, LogIn } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email || !password) {
      setError('Por favor, preencha o e-mail e a senha.');
      setIsLoading(false);
      return;
    }

    try {
      await login(email, password);
      router.push('/');
    } catch (err) {
      if (err instanceof Error) {
        // Trata erros genéricos de rede ou outros
        setError(err.message || 'Ocorreu um erro. Tente novamente.');
      } else {
        // Assume que pode ser um erro da API com estrutura específica
        const apiError = err as any;
        setError(apiError.response?.data?.message || 'Credenciais inválidas ou erro no servidor.');
      }
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800">Login</h1>
          <p className="text-gray-500">Acesse o painel de gerenciamento</p>
        </div>

        {error && (
          <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="text-sm font-medium text-gray-700 block mb-2"
            >
              Endereço de E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
              placeholder="seu.email@exemplo.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="text-sm font-medium text-gray-700 block mb-2"
            >
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
              placeholder="Sua senha"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-gray-400"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  Entrar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}