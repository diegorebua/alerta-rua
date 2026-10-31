import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SignIn } from '@clerk/clerk-react';
import {
  LogIn,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  ExternalLink,
  Check,
  MapPin,
  ShieldCheck,
  Radio,
  ArrowLeft,
  Navigation,
} from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { mockLogin, mockGoogleLogin } from '../lib/mockAuth';
import { setStoredClerkKey } from '../main';

interface LoginProps {
  clerkActive?: boolean;
}

export default function Login({ clerkActive = false }: LoginProps) {
  const navigate = useNavigate();
  const pageRef = useRef<HTMLDivElement | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [clerkKeyInput, setClerkKeyInput] = useState('');
  const [keyError, setKeyError] = useState('');
  const [showFallbackForm, setShowFallbackForm] = useState(false);

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.from('.login-hero-item', {
        y: 24,
        opacity: 0,
        duration: 0.65,
        stagger: 0.1,
      }).from(
        '.login-auth-box',
        {
          y: 28,
          opacity: 0,
          scale: 0.97,
          duration: 0.7,
        },
        '-=0.45'
      );

      gsap.to('.radar-pulse-ring', {
        scale: 1.8,
        opacity: 0,
        duration: 2.4,
        repeat: -1,
        stagger: 0.8,
        ease: 'power1.out',
      });
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
    <div
      ref={pageRef}
      className="min-h-[calc(100vh-65px)] bg-urban-grid text-zinc-100 flex flex-col lg:flex-row relative overflow-hidden"
    >
      {/* Luzes de ambiência urbana */}
      <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-amber-500/10 blur-[110px]"></div>
      <div className="pointer-events-none absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-blue-500/10 blur-[120px]"></div>

      {/* ── Coluna Esquerda: Painel de Inteligência Urbana ── */}
      <div className="lg:w-[52%] p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative border-b lg:border-b-0 lg:border-r border-zinc-800/80">
        <div>
          <Link
            to="/"
            className="login-hero-item inline-flex items-center gap-2 text-xs font-mono-tech uppercase tracking-wider text-zinc-400 hover:text-amber-400 transition mb-10 bg-zinc-900/80 border border-zinc-800 px-3.5 py-2 rounded-xl"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar ao Mapa da Cidade
          </Link>

          <div className="login-hero-item inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono-tech mb-5">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>CENTRAL CIDADÃ DE ZELADORIA • SP</span>
          </div>

          <h1 className="login-hero-item font-display text-3xl sm:text-4xl lg:text-[44px] font-bold text-white tracking-tight leading-[1.12] mb-5">
            Transforme a sua rua com{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300">
              monitoramento urbano
            </span>{' '}
            em tempo real.
          </h1>

          <p className="login-hero-item text-zinc-400 text-[15px] leading-relaxed max-w-xl mb-10">
            Acesse sua conta para registrar buracos na via, iluminação pública apagada, vazamentos e
            acompanhar a resolução diretamente no mapa colaborativo da cidade.
          </p>

          {/* Cards de telemetria / radar simulado */}
          <div className="login-hero-item grid grid-cols-1 sm:grid-cols-3 gap-3.5 max-w-xl">
            <div className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-800/90 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono-tech text-zinc-400 uppercase">Status</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              </div>
              <p className="font-display text-xl font-bold text-white">Georreferenciado</p>
              <p className="text-[11.5px] text-zinc-400 mt-0.5">Precisão por rua e bairro</p>
            </div>

            <div className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-800/90 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono-tech text-zinc-400 uppercase">Cobertura</span>
                <Navigation className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <p className="font-display text-xl font-bold text-white">24/7 Ativo</p>
              <p className="text-[11.5px] text-zinc-400 mt-0.5">Mapa sincronizado ao vivo</p>
            </div>

            <div className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-800/90 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono-tech text-zinc-400 uppercase">Acesso</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <p className="font-display text-xl font-bold text-white">Verificado</p>
              <p className="text-[11.5px] text-zinc-400 mt-0.5">Autenticação segura</p>
            </div>
          </div>
        </div>

        {/* Rodapé técnico com coordenadas e radar */}
        <div className="login-hero-item hidden sm:flex items-center justify-between pt-8 mt-10 border-t border-zinc-800/80 text-xs font-mono-tech text-zinc-500">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-6 h-6">
              <span className="radar-pulse-ring absolute inset-0 rounded-full border border-amber-500/50"></span>
              <MapPin className="w-4 h-4 text-amber-400 relative z-10" />
            </div>
            <span>LAT -23.5015° • LNG -47.4526°</span>
          </div>
          <span>SOROCABA • SP</span>
        </div>
      </div>

      {/* ── Coluna Direita: Autenticação Clerk ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 relative">
        <div className="login-auth-box w-full max-w-[430px] flex flex-col items-center">
          {clerkActive ? (
            <SignIn
              routing="path"
              path="/login"
              signUpUrl="/register"
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
              {/* Card de ativação rápida do Clerk */}
              <div className="bg-zinc-900/95 rounded-2xl border border-zinc-800 shadow-2xl p-7 text-zinc-100">
                <div className="text-center mb-6">
                  <div className="w-11 h-11 bg-amber-500/15 border border-amber-500/30 rounded-xl flex items-center justify-center mx-auto mb-3.5">
                    <KeyRound className="w-5 h-5 text-amber-400" />
                  </div>
                  <h2 className="font-display text-xl font-bold text-white">Login com Clerk</h2>
                  <p className="text-[13px] text-zinc-400 mt-1 leading-relaxed">
                    Cole sua <strong>Publishable Key</strong> do Clerk abaixo para carregar o widget
                    oficial de autenticação.
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
                    className="w-full bg-amber-500 text-zinc-950 text-sm font-bold py-2.5 rounded-lg hover:bg-amber-400 transition shadow-sm flex items-center justify-center gap-2"
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
                    {showFallbackForm ? 'Ocultar login local' : 'Usar login local'}
                  </button>
                </div>
              </div>

              {showFallbackForm && (
                <div className="bg-zinc-900/95 rounded-2xl border border-zinc-800 shadow-2xl p-7 text-zinc-100">
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center">
                      <LogIn className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-white">Acesso Local (Demo)</h2>
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
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-sm font-medium py-2.5 rounded-lg hover:border-zinc-700 hover:bg-zinc-800/60 transition flex items-center justify-center gap-2.5 disabled:opacity-50 mb-4"
                  >
                    <img
                      src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                      alt="Google"
                      className="w-4 h-4"
                    />
                    <span>Continuar com Google (Demo)</span>
                  </button>

                  <form onSubmit={handleLogin} className="space-y-3.5">
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
                          placeholder="••••••••"
                          autoComplete="current-password"
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

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-amber-500 text-zinc-950 text-sm font-bold py-2.5 rounded-lg hover:bg-amber-400 transition disabled:opacity-50"
                    >
                      {loading ? 'Entrando...' : 'Entrar'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
