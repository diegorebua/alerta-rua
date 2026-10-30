import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, AlertCircle, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { mockRegister, mockGoogleLogin } from '../lib/mockAuth';

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdName, setCreatedName] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    const err = mockRegister(email, password, name);
    setLoading(false);
    if (err) {
      setError(err);
    } else {
      setCreatedName(name || email.split('@')[0]);
      setSuccess(true);
    }
  };

  const handleGoogleRegister = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    mockGoogleLogin();
    setLoading(false);
    navigate('/');
  };

  return (
    <div className="min-h-[calc(100vh-60px)] flex items-center justify-center p-4 bg-[#fafafa]">
      <div className="w-full max-w-[400px]">
        {success ? (
          <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-8 text-center">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-6 h-6 text-emerald-500" />
            </div>
            <h1 className="text-xl font-semibold text-neutral-900 mb-1">Conta criada!</h1>
            <p className="text-sm text-neutral-500 mb-6">
              Bem-vindo(a) ao Alerta Rua, <strong className="text-neutral-700">{createdName}</strong>.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-blue-700 transition shadow-sm"
            >
              Ir para o início
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-8">
              {/* Header */}
              <div className="text-center mb-7">
                <div className="w-10 h-10 bg-neutral-900 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-semibold text-neutral-900">Criar conta</h1>
                <p className="text-sm text-neutral-500 mt-1">Junte-se à comunidade da cidade.</p>
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
                onClick={handleGoogleRegister}
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
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-[13px] font-medium text-neutral-700 mb-1.5"
                  >
                    Nome completo
                  </label>
                  <input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    type="text"
                    placeholder="Seu nome"
                    autoComplete="name"
                    required
                    className="w-full px-3.5 py-2.5 text-sm border border-neutral-200 rounded-lg placeholder:text-neutral-400 focus:border-blue-400 transition"
                  />
                </div>

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
                    className="w-full px-3.5 py-2.5 text-sm border border-neutral-200 rounded-lg placeholder:text-neutral-400 focus:border-blue-400 transition"
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
                      placeholder="Mínimo 6 caracteres"
                      autoComplete="new-password"
                      required
                      className="w-full px-3.5 py-2.5 text-sm border border-neutral-200 rounded-lg placeholder:text-neutral-400 focus:border-blue-400 transition pr-10"
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

                <div>
                  <label
                    htmlFor="confirm"
                    className="block text-[13px] font-medium text-neutral-700 mb-1.5"
                  >
                    Confirmar senha
                  </label>
                  <div className="relative">
                    <input
                      id="confirm"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Repita a senha"
                      autoComplete="new-password"
                      required
                      className="w-full px-3.5 py-2.5 text-sm border border-neutral-200 rounded-lg placeholder:text-neutral-400 focus:border-blue-400 transition pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition"
                    >
                      {!showConfirm ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-neutral-900 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-neutral-800 active:scale-[0.98] transition disabled:opacity-50 shadow-sm"
                >
                  {loading ? 'Criando conta...' : 'Criar conta'}
                </button>
              </form>
            </div>

            <p className="text-center text-[13px] text-neutral-500 mt-5">
              Já tem uma conta?{' '}
              <Link to="/login" className="text-blue-600 font-medium hover:underline">
                Fazer login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
