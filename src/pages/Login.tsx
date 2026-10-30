import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { mockLogin, mockGoogleLogin } from '../lib/mockAuth';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    await new Promise((r) => setTimeout(r, 500));
    const user = mockLogin(email, password);
    setLoading(false);
    if (user) {
      navigate('/');
    } else {
      setError('Email ou senha incorretos.');
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    mockGoogleLogin();
    setLoading(false);
    navigate('/');
  };

  return (
    <div className="min-h-[calc(100vh-60px)] flex items-center justify-center p-4 bg-[#fafafa]">
      <div className="w-full max-w-[400px]">
        {/* Card */}
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-8">
          {/* Header */}
          <div className="text-center mb-7">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-5 h-5 text-blue-600" />
            </div>
            <h1 className="text-xl font-semibold text-neutral-900">Bem-vindo de volta</h1>
            <p className="text-sm text-neutral-500 mt-1">Entre na sua conta para continuar.</p>
          </div>

          {/* Erro */}
          {error && (
            <div className="mb-5 p-3 bg-red-50 text-red-600 text-[13px] rounded-lg flex items-center gap-2 border border-red-100">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Google */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white border border-neutral-200 text-neutral-700 text-sm font-medium py-2.5 rounded-lg hover:border-neutral-300 hover:bg-neutral-50 transition flex items-center justify-center gap-2.5 disabled:opacity-50 mb-5 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
              className="w-4 h-4"
            />
            <span>Continuar com Google</span>
          </button>

          {/* Divisor */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-neutral-100"></div>
            <span className="text-[11px] text-neutral-400 font-medium">ou</span>
            <div className="flex-1 h-px bg-neutral-100"></div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-[13px] font-medium text-neutral-700 mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="seu@email.com"
                autoComplete="email"
                required
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-neutral-200 rounded-lg placeholder:text-neutral-400 focus:border-blue-400 transition"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-[13px] font-medium text-neutral-700 mb-1.5"
              >
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-neutral-200 rounded-lg placeholder:text-neutral-400 focus:border-blue-400 transition pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition"
                >
                  {!showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-blue-700 active:scale-[0.98] transition disabled:opacity-50 shadow-sm"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        {/* Footer link */}
        <p className="text-center text-[13px] text-neutral-500 mt-5">
          Não tem uma conta?{' '}
          <Link to="/register" className="text-blue-600 font-medium hover:underline">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}
