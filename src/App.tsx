import React, { useState, useEffect } from 'react';
import { Link, NavLink, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { MapPin, LogOut, PlusCircle } from 'lucide-react';
import { getMockUser, mockLogout, type MockUser } from './lib/mockAuth';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Instructions from './pages/Instructions';
import CreateOccurrence from './pages/CreateOccurrence';

export default function App() {
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

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col">
      <header className="bg-white/80 backdrop-blur-md border-b border-neutral-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-15" style={{ height: '60px' }}>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm group-hover:bg-blue-700 transition">
                <MapPin className="text-white w-4 h-4" />
              </div>
              <span className="font-semibold text-[15px] tracking-tight text-neutral-900">Alerta Rua</span>
            </Link>

            {/* Nav central */}
            <nav className="hidden md:flex items-center gap-1">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `text-sm font-medium px-3 py-1.5 rounded-lg transition ${
                    isActive
                      ? 'text-neutral-900 bg-neutral-100'
                      : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
                  }`
                }
              >
                Início
              </NavLink>
              <NavLink
                to="/instructions"
                className={({ isActive }) =>
                  `text-sm font-medium px-3 py-1.5 rounded-lg transition ${
                    isActive
                      ? 'text-neutral-900 bg-neutral-100'
                      : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
                  }`
                }
              >
                Como Funciona
              </NavLink>
            </nav>

            {/* Ações */}
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  {/* Avatar */}
                  <div className="flex items-center gap-2.5">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName}
                        className="w-7 h-7 rounded-full ring-2 ring-white shadow-sm"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold ring-2 ring-white shadow-sm">
                        {user.displayName?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="hidden sm:inline text-sm font-medium text-neutral-700">{user.displayName}</span>
                  </div>

                  <Link
                    to="/report"
                    className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-medium px-3.5 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Reportar</span>
                  </Link>

                  <button
                    onClick={logout}
                    className="text-neutral-400 hover:text-neutral-700 transition p-1.5 rounded-lg hover:bg-neutral-100"
                    title="Sair"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition px-3 py-1.5 rounded-lg hover:bg-neutral-100"
                  >
                    Entrar
                  </Link>
                  <Link
                    to="/register"
                    className="text-sm font-medium bg-neutral-900 text-white px-3.5 py-2 rounded-lg hover:bg-neutral-800 transition shadow-sm"
                  >
                    Cadastrar
                  </Link>
                </>
              )}
            </div>

          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/instructions" element={<Instructions />} />
          <Route path="/report" element={<CreateOccurrence user={user} />} />
        </Routes>
      </main>
    </div>
  );
}
