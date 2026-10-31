import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SignUp } from '@clerk/clerk-react';
import {
  UserPlus,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle,
  KeyRound,
  ExternalLink,
  Check,
  MapPin,
  ArrowLeft,
  Radio,
  Users,
  Sparkles,
} from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { mockRegister, mockGoogleLogin } from '../lib/mockAuth';
import { setStoredClerkKey } from '../main';

interface RegisterProps {
  clerkActive?: boolean;
}

export default function Register({ clerkActive = false }: RegisterProps) {
  const navigate = useNavigate();
  const pageRef = useRef<HTMLDivElement | null>(null);

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

  const [clerkKeyInput, setClerkKeyInput] = useState('');
  const [keyError, setKeyError] = useState('');
  const [showFallbackForm, setShowFallbackForm] = useState(false);

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.from('.register-hero-item', {
        y: 24,
        opacity: 0,
        duration: 0.65,
        stagger: 0.1,
      }).from(
        '.register-auth-box',
        {
          y: 28,
          opacity: 0,
          scale: 0.97,
          duration: 0.7,
        },
        '-=0.45'
      );
    },
    { scope: pageRef }
  );

  const handleActivateClerkKey = (e: React.FormEvent) => {
    e.preventDefault();
    setKeyError('');
    const clean = clerkKeyInput.trim();
    if (!/^pk_(test|live)_/.test(clean)) {
      setKeyError('A chave deve começar com pk_test_ ou pk_live_');
      return;
    }
    setStoredClerkKey(clean);
  };

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
    <div
      ref={pageRef}
      className="min-h-[calc(100vh-65px)] bg-urban-grid text-zinc-100 flex flex-col lg:flex-row relative overflow-hidden"
    >
      <div className="pointer-events-none absolute -top-32 right-1/3 w-96 h-96 rounded-full bg-amber-500/10 blur-[110px]"></div>
      <div className="pointer-events-none absolute bottom-0 left-10 w-96 h-96 rounded-full bg-emerald-500/10 blur-[120px]"></div>

      {/* ── Coluna Esquerda: Comunidade Urbana ── */}
      <div className="lg:w-[52%] p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative border-b lg:border-b-0 lg:border-r border-zinc-800/80">
        <div>
          <Link
            to="/"
            className="register-hero-item inline-flex items-center gap-2 text-xs font-mono-tech uppercase tracking-wider text-zinc-400 hover:text-amber-400 transition mb-10 bg-zinc-900/80 border border-zinc-800 px-3.5 py-2 rounded-xl"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar ao Mapa da Cidade
          </Link>

          <div className="register-hero-item inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono-tech mb-5">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>CADASTRO CIDADÃO • ZELADORIA URBANA</span>
          </div>

          <h1 className="register-hero-item font-display text-3xl sm:text-4xl lg:text-[42px] font-bold text-white tracking-tight leading-[1.12] mb-5">
            Faça parte da rede que{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300">
              fiscaliza e melhora
            </span>{' '}
            cada bairro.
          </h1>

          <p className="register-hero-item text-zinc-400 text-[15px] leading-relaxed max-w-xl mb-10">
            Ao criar sua conta gratuita, você pode sinalizar problemas na infraestrutura da sua rua,
            atualizar o andamento das ocorrências e dar visibilidade às prioridades do seu bairro.
          </p>

          <div className="register-hero-item grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-xl">
            <div className="bg-zinc-900/80 border border-zinc-800/90 rounded-2xl p-4 flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h3 className="font-display font-bold text-white text-sm">Voz Ativa no Bairro</h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Suas ocorrências ficam visíveis instantaneamente para todos os moradores.
                </p>
              </div>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800/90 rounded-2xl p-4 flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-display font-bold text-white text-sm">Histórico Transparente</h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Acompanhe desde a abertura até a resolução completa pela equipe urbana.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="register-hero-item hidden sm:flex items-center justify-between pt-8 mt-10 border-t border-zinc-800/80 text-xs font-mono-tech text-zinc-500">
          <span className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-400" />
            PLATAFORMA COLABORATIVA DE ZELADORIA
          </span>
          <span>SOROCABA • SP</span>
        </div>
      </div>

      {/* ── Coluna Direita: Componente Clerk SignUp ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 relative">
        <div className="register-auth-box w-full max-w-[430px] flex flex-col items-center">
          {clerkActive ? (
            <SignUp
              routing="path"
              path="/register"
              signInUrl="/login"
              forceRedirectUrl="/"
              appearance={{
                layout: {
                  unsafe_disableDevelopmentModeWarnings: true,
                },
                variables: {
                  colorPrimary: '#f59e0b',
                  colorTextOnPrimaryBackground: '#09090b',
                  borderRadius: '0.875rem',
                  fontFamily: 'Inter, system-ui, sans-serif',
                },
                elements: {
                  rootBox: 'mx-auto w-full flex justify-center',
                  card: 'shadow-2xl border border-zinc-800 rounded-2xl bg-white',
                  headerTitle: 'font-display font-bold text-zinc-900',
                  formButtonPrimary:
                    'bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold shadow-none',
                },
              }}
            />
          ) : (
            <div className="w-full space-y-4">
              {success ? (
                <div className="bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl p-8 text-center">
                  <div className="w-12 h-12 bg-emerald-500/15 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-5">
                    <CheckCircle className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h1 className="font-display text-xl font-bold text-white mb-1">Conta criada!</h1>
                  <p className="text-sm text-zinc-400 mb-6">
                    Bem-vindo(a) ao Alerta Rua, <strong className="text-white">{createdName}</strong>.
                  </p>
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 bg-amber-500 text-zinc-950 text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-amber-400 transition"
                  >
                    Ir para o Mapa
                  </Link>
                </div>
              ) : (
                <>
                  <div className="bg-zinc-900/95 rounded-2xl border border-zinc-800 shadow-2xl p-7 text-zinc-100">
                    <div className="text-center mb-6">
                      <div className="w-11 h-11 bg-amber-500/15 border border-amber-500/30 rounded-xl flex items-center justify-center mx-auto mb-3.5">
                        <KeyRound className="w-5 h-5 text-amber-400" />
                      </div>
                      <h2 className="font-display text-xl font-bold text-white">
                        Cadastro com Clerk
                      </h2>
                      <p className="text-[13px] text-zinc-400 mt-1 leading-relaxed">
                        Cole sua <strong>Publishable Key</strong> do Clerk abaixo para ativar o
                        cadastro oficial.
                      </p>
                    </div>

                    {keyError && (
                      <div className="mb-4 p-3 bg-red-950/60 text-red-300 text-[12.5px] rounded-lg flex items-center gap-2 border border-red-800/60">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {keyError}
                      </div>
                    )}

                    <form onSubmit={handleActivateClerkKey} className="space-y-3">
                      <div>
                        <label className="block text-[12.5px] font-medium text-zinc-300 mb-1.5">
                          Clerk Publishable Key
                        </label>
                        <input
                          value={clerkKeyInput}
                          onChange={(e) => setClerkKeyInput(e.target.value)}
                          type="text"
                          placeholder="pk_test_..."
                          required
                          className="w-full px-3.5 py-2.5 text-sm font-mono bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder:text-zinc-600 focus:border-amber-500 transition"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-amber-500 text-zinc-950 text-sm font-bold py-2.5 rounded-lg hover:bg-amber-400 transition flex items-center justify-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        Ativar Clerk Agora
                      </button>
                    </form>

                    <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
                      <a
                        href="https://dashboard.clerk.com"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-amber-400 hover:underline font-medium"
                      >
                        Abrir Dashboard do Clerk
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <button
                        type="button"
                        onClick={() => setShowFallbackForm(!showFallbackForm)}
                        className="text-zinc-500 hover:text-zinc-300 transition"
                      >
                        {showFallbackForm ? 'Ocultar cadastro local' : 'Usar cadastro local'}
                      </button>
                    </div>
                  </div>

                  {showFallbackForm && (
                    <div className="bg-zinc-900/95 rounded-2xl border border-zinc-800 shadow-2xl p-7 text-zinc-100">
                      <div className="flex items-center gap-2.5 mb-5">
                        <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center">
                          <UserPlus className="w-4 h-4 text-amber-400" />
                        </div>
                        <div>
                          <h2 className="text-sm font-semibold text-white">Cadastro Local (Demo)</h2>
                          <p className="text-xs text-zinc-400">Modo offline de demonstração</p>
                        </div>
                      </div>

                      {error && (
                        <div className="mb-4 p-3 bg-red-950/60 text-red-300 text-[13px] rounded-lg flex items-center gap-2 border border-red-800/60">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          {error}
                        </div>
                      )}

                      <button
                        onClick={handleGoogleRegister}
                        disabled={loading}
                        className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-sm font-medium py-2.5 rounded-lg hover:border-zinc-700 transition flex items-center justify-center gap-2.5 disabled:opacity-50 mb-4"
                      >
                        <img
                          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                          alt="Google"
                          className="w-4 h-4"
                        />
                        <span>Continuar com Google (Demo)</span>
                      </button>

                      <form onSubmit={handleRegister} className="space-y-3.5">
                        <div>
                          <label
                            htmlFor="name"
                            className="block text-[13px] font-medium text-zinc-300 mb-1"
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
                            className="w-full px-3.5 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder:text-zinc-600 focus:border-amber-500 transition"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="email"
                            className="block text-[13px] font-medium text-zinc-300 mb-1"
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
                            className="w-full px-3.5 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder:text-zinc-600 focus:border-amber-500 transition"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="password"
                            className="block text-[13px] font-medium text-zinc-300 mb-1"
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
                              className="w-full px-3.5 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder:text-zinc-600 focus:border-amber-500 transition pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition"
                            >
                              {!showPassword ? (
                                <Eye className="w-4 h-4" />
                              ) : (
                                <EyeOff className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor="confirm"
                            className="block text-[13px] font-medium text-zinc-300 mb-1"
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
                              className="w-full px-3.5 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder:text-zinc-600 focus:border-amber-500 transition pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirm(!showConfirm)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition"
                            >
                              {!showConfirm ? (
                                <Eye className="w-4 h-4" />
                              ) : (
                                <EyeOff className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full bg-amber-500 text-zinc-950 text-sm font-bold py-2.5 rounded-lg hover:bg-amber-400 transition disabled:opacity-50"
                        >
                          {loading ? 'Criando conta...' : 'Criar conta'}
                        </button>
                      </form>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
