import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useUser, useClerk, UserButton } from '@clerk/clerk-react';
import { MapPin, LogOut, PlusCircle, Compass, HelpCircle, LogIn, UserPlus, Download } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { getMockUser, mockLogout, setClerkSessionUser, type MockUser } from './lib/mockAuth';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Instructions from './pages/Instructions';
import CreateOccurrence from './pages/CreateOccurrence';

gsap.registerPlugin(useGSAP);

interface AppProps {
  clerkActive?: boolean;
}

function ClerkAuthAdapter() {
  const { user: clerkUser, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [user, setUser] = useState<MockUser | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoaded) return;
    if (clerkUser) {
      const mapped: MockUser = {
        uid: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress || '',
        displayName:
          clerkUser.fullName ||
          clerkUser.firstName ||
          clerkUser.username ||
          clerkUser.primaryEmailAddress?.emailAddress?.split('@')[0] ||
          'Usuário',
        photoURL: clerkUser.imageUrl || undefined,
      };
      setClerkSessionUser(mapped);
      setUser(mapped);
    } else {
      setClerkSessionUser(null);
      setUser(null);
    }
  }, [clerkUser, isLoaded]);

  const logout = async () => {
    await signOut();
    setClerkSessionUser(null);
    setUser(null);
    navigate('/');
  };

  return <AppLayout user={user} onLogout={logout} clerkActive={true} />;
}

function FallbackAuthAdapter() {
  const [user, setUser] = useState<MockUser | null>(() => getMockUser());
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setUser(getMockUser());
  }, [location.pathname]);

  const logout = () => {
    mockLogout();
    setUser(null);
    navigate('/');
  };

  return <AppLayout user={user} onLogout={logout} clerkActive={false} />;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface AppLayoutProps {
  user: MockUser | null;
  onLogout: () => void;
  clerkActive: boolean;
}

function AppLayout({ user, onLogout, clerkActive }: AppLayoutProps) {
  const location = useLocation();
  const headerRef = useRef<HTMLElement | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallPwa = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  useGSAP(
    () => {
      gsap.fromTo(
        '.urban-nav-item',
        { y: -10, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.45,
          stagger: 0.06,
          ease: 'power3.out',
          clearProps: 'opacity,transform',
        }
      );
    },
    { scope: headerRef }
  );

  return (
    <div className="min-h-screen bg-[#f4f4f5] flex flex-col">
      {/* Faixa superior fina de sinalização urbana */}
      <div className="h-[3px] w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400"></div>

      <header
        ref={headerRef}
        className="bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800/80 sticky top-0 z-50 text-zinc-100"
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-[62px]">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="urban-nav-item flex items-center gap-2.5 group">
                <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.3)] group-hover:bg-amber-400 group-hover:scale-105 transition">
                  <MapPin className="text-zinc-950 w-5 h-5 stroke-[2.4]" />
                </div>
                <span className="font-display font-bold text-[16px] tracking-tight text-white leading-none">
                  ALERTA RUA
                </span>
              </Link>
            </div>

            {/* Nav central */}
            <nav className="hidden md:flex items-center gap-1 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800/90">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `urban-nav-item flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-lg transition ${
                    isActive || location.pathname === '/report'
                      ? 'bg-zinc-800 text-amber-400 shadow-sm border border-zinc-700/60'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                  }`
                }
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Ocorrências e Mapa</span>
              </NavLink>
              <NavLink
                to="/instructions"
                className={({ isActive }) =>
                  `urban-nav-item flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-lg transition ${
                    isActive
                      ? 'bg-zinc-800 text-amber-400 shadow-sm border border-zinc-700/60'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                  }`
                }
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Como Funciona</span>
              </NavLink>
            </nav>

            {/* Ações */}
            <div className="flex items-center gap-2.5">
              {deferredPrompt && (
                <button
                  type="button"
                  onClick={handleInstallPwa}
                  className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-3 py-2 rounded-xl transition"
                  title="Instalar aplicativo Alerta Rua"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Instalar App</span>
                </button>
              )}
              {user ? (
                <>
                  {/* Avatar / Clerk UserButton */}
                  <div className="flex items-center gap-2.5 bg-zinc-900/90 border border-zinc-800 px-2.5 py-1 rounded-xl">
                    {clerkActive ? (
                      <UserButton
                        afterSignOutUrl="/"
                        appearance={{
                          layout: {
                            unsafe_disableDevelopmentModeWarnings: true,
                          },
                        }}
                      />
                    ) : user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName}
                        className="w-7 h-7 rounded-full ring-2 ring-amber-500/40"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-xs font-bold">
                        {user.displayName?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="hidden sm:flex flex-col pr-1">
                      <span className="text-[12px] font-medium text-zinc-100 leading-tight">
                        {user.displayName}
                      </span>
                      <span className="text-[10px] font-mono-tech text-emerald-400 leading-tight">
                        Cidadão Ativo
                      </span>
                    </div>
                  </div>

                  <Link
                    to="/report"
                    className="flex items-center gap-1.5 bg-amber-500 text-zinc-950 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl hover:bg-amber-400 hover:scale-[1.02] active:scale-[0.98] transition shadow-[0_0_20px_rgba(245,158,11,0.25)]"
                  >
                    <PlusCircle className="w-4 h-4 stroke-[2.2]" />
                    <span>Reportar</span>
                  </Link>

                  <button
                    onClick={onLogout}
                    className="text-zinc-400 hover:text-red-400 transition p-2 rounded-xl hover:bg-zinc-900 border border-transparent hover:border-zinc-800"
                    title="Sair"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/report"
                    className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-3.5 py-2.5 rounded-xl transition"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Reportar</span>
                  </Link>
                  <Link
                    to="/login"
                    className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-amber-500 text-zinc-950 px-4 py-2.5 rounded-xl hover:bg-amber-400 transition shadow-[0_0_16px_rgba(245,158,11,0.25)]"
                  >
                    <LogIn className="w-3.5 h-3.5 stroke-[2.2]" />
                    <span>Entrar</span>
                  </Link>
                  <Link
                    to="/register"
                    className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-zinc-200 hover:text-white px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-amber-400" />
                    <span>Criar Conta</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/report"
            element={
              <>
                <Home />
                <CreateOccurrence user={user} />
              </>
            }
          />
          <Route path="/login/*" element={<Login clerkActive={clerkActive} />} />
          <Route path="/register/*" element={<Register clerkActive={clerkActive} />} />
          <Route path="/instructions" element={<Instructions />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App({ clerkActive = false }: AppProps) {
  return clerkActive ? <ClerkAuthAdapter /> : <FallbackAuthAdapter />;
}
