import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, AlertCircle, Lock, CheckCircle } from 'lucide-react';
import { occurrenceTypes } from '../lib/types';
import { getMockUser, type MockUser } from '../lib/mockAuth';

interface CreateOccurrenceProps {
  user: MockUser | null;
}

// Ícones por tipo
const typeIcons: Record<string, string> = {
  pothole: '🕳️',
  light_out: '💡',
  trash: '🗑️',
  water_leak: '💧',
  other: '⚠️',
};

const MOCK_OCCURRENCES_KEY = 'alerta_rua_occurrences';

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    suburb?: string;
    neighbourhood?: string;
    city_district?: string;
    quarter?: string;
  };
}

// Coordenadas demo por bairro — fallback para centro de SP
const BAIRRO_COORDS: Record<string, { lat: number; lng: number }> = {
  'bela vista': { lat: -23.5613, lng: -46.6433 },
  'consolação': { lat: -23.5517, lng: -46.6601 },
  'jardins': { lat: -23.5697, lng: -46.6500 },
  'pinheiros': { lat: -23.5629, lng: -46.6890 },
  'ibirapuera': { lat: -23.5874, lng: -46.6576 },
  'mooca': { lat: -23.5524, lng: -46.5932 },
  'vila madalena': { lat: -23.5522, lng: -46.6908 },
  'centro': { lat: -23.5505, lng: -46.6333 },
};

export default function CreateOccurrence({ user }: CreateOccurrenceProps) {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('pothole');
  const [address, setAddress] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const addressWrapperRef = useRef<HTMLDivElement | null>(null);
  const [addressSuggestions, setAddressSuggestions] = useState<NominatimResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (addressWrapperRef.current && !addressWrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, []);

  const onAddressInput = (value: string) => {
    setAddress(value);
    setSelectedCoords(null);
    const q = value.trim();

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    if (q.length < 3) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoadingAddress(true);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          q: `${q}, São Paulo, Brasil`,
          format: 'json',
          addressdetails: '1',
          limit: '6',
          countrycodes: 'br',
        });

        const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
          headers: { 'Accept-Language': 'pt-BR,pt;q=0.9' },
        });

        if (res.ok) {
          const data: NominatimResult[] = await res.json();
          setAddressSuggestions(data);
          setShowSuggestions(data.length > 0);
          setActiveSuggestionIndex(-1);
        }
      } catch (e) {
        console.warn('Autocomplete indisponível:', e);
      } finally {
        setLoadingAddress(false);
      }
    }, 400);
  };

  const selectSuggestion = (idx: number) => {
    const s = addressSuggestions[idx >= 0 ? idx : 0];
    if (!s) return;

    setAddress(s.display_name);
    setSelectedCoords({ lat: parseFloat(s.lat), lng: parseFloat(s.lon) });

    const addr = s.address;
    if (addr) {
      const bairro = addr.suburb || addr.neighbourhood || addr.city_district || addr.quarter || '';
      if (bairro && !neighborhood) {
        setNeighborhood(bairro);
      }
    }

    setShowSuggestions(false);
    setAddressSuggestions([]);
  };

  const moveSuggestion = (dir: 1 | -1) => {
    const max = addressSuggestions.length - 1;
    setActiveSuggestionIndex((prev) => Math.max(0, Math.min(max, prev + dir)));
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setType('pothole');
    setAddress('');
    setNeighborhood('');
    setError('');
    setSuccess(false);
    setAddressSuggestions([]);
    setSelectedCoords(null);
  };

  const getCoords = () => {
    if (selectedCoords) return selectedCoords;
    const key = neighborhood.trim().toLowerCase();
    return BAIRRO_COORDS[key] ?? { lat: -23.55052, lng: -46.633308 };
  };

  const handleSubmit = async () => {
    setError('');

    if (!title.trim()) {
      setError('Informe um título para a ocorrência.');
      return;
    }
    if (!description.trim()) {
      setError('Informe uma descrição.');
      return;
    }
    if (!address.trim()) {
      setError('Informe o endereço.');
      return;
    }

    const currentUser = user ?? getMockUser();
    if (!currentUser) {
      navigate('/login');
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));

    const coords = getCoords();
    const occurrence = {
      id: `local-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      type,
      status: 'open',
      lat: coords.lat,
      lng: coords.lng,
      address: address.trim(),
      neighborhood: neighborhood.trim() || 'Não informado',
      authorId: currentUser.uid,
      authorName: currentUser.displayName,
      createdAt: { seconds: Math.floor(Date.now() / 1000), toMillis: () => Date.now() },
      updatedAt: { seconds: Math.floor(Date.now() / 1000), toMillis: () => Date.now() },
    };

    try {
      const existing = JSON.parse(localStorage.getItem(MOCK_OCCURRENCES_KEY) || '[]');
      existing.unshift(occurrence);
      localStorage.setItem(MOCK_OCCURRENCES_KEY, JSON.stringify(existing));
      setSuccess(true);
    } catch {
      setError('Não foi possível salvar a ocorrência. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] p-4 bg-[#fafafa]">
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-10 text-center max-w-sm w-full">
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <Lock className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold text-neutral-900 mb-1">Acesso Restrito</h2>
          <p className="text-sm text-neutral-500 mb-6">
            Você precisa estar logado para reportar uma ocorrência.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="bg-blue-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-blue-700 transition shadow-sm"
          >
            Fazer Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-60px)] bg-[#fafafa] py-10 px-4">
      <div className="max-w-xl mx-auto">
        {success ? (
          <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-10 text-center">
            <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-7 h-7 text-emerald-500" />
            </div>
            <h2 className="text-xl font-semibold text-neutral-900 mb-1">Ocorrência registrada!</h2>
            <p className="text-sm text-neutral-500 mb-6">
              Sua ocorrência foi salva e já aparece no mapa.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link
                to="/"
                className="bg-blue-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-blue-700 transition shadow-sm"
              >
                Ver no Mapa
              </Link>
              <button
                onClick={resetForm}
                className="text-sm font-medium text-neutral-600 hover:text-neutral-900 px-5 py-2.5 rounded-lg hover:bg-neutral-100 transition"
              >
                Reportar outra
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-7">
              <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">
                Reportar Ocorrência
              </h1>
              <p className="text-sm text-neutral-500 mt-1">
                Ajude a melhorar a cidade descrevendo o problema encontrado.
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3 bg-red-50 text-red-600 text-[13px] rounded-lg flex items-center gap-2 border border-red-100">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6 space-y-5">
              {/* Título */}
              <div>
                <label
                  htmlFor="title"
                  className="block text-[13px] font-medium text-neutral-700 mb-1.5"
                >
                  Título <span className="text-red-400">*</span>
                </label>
                <input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  type="text"
                  placeholder="Ex: Buraco perigoso na via"
                  maxLength={150}
                  required
                  className="w-full px-3.5 py-2.5 text-sm border border-neutral-200 rounded-lg placeholder:text-neutral-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-50 outline-none transition"
                />
              </div>

              {/* Tipo */}
              <div>
                <label
                  htmlFor="type"
                  className="block text-[13px] font-medium text-neutral-700 mb-1.5"
                >
                  Tipo de Problema <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(occurrenceTypes).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setType(key)}
                      className={`text-[13px] font-medium px-3 py-2.5 rounded-lg border transition text-left flex items-center gap-2 ${
                        type === key
                          ? 'bg-blue-50 border-blue-400 text-blue-700'
                          : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50'
                      }`}
                    >
                      <span>{typeIcons[key]}</span>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Endereço com Autocomplete */}
              <div>
                <label
                  htmlFor="address"
                  className="block text-[13px] font-medium text-neutral-700 mb-1.5"
                >
                  Endereço <span className="text-red-400">*</span>
                </label>
                <div className="relative" ref={addressWrapperRef}>
                  <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none z-10" />
                  <input
                    id="address"
                    value={address}
                    type="text"
                    autoComplete="off"
                    placeholder="Ex: Av. Paulista, 1578 - Bela Vista, São Paulo"
                    onChange={(e) => onAddressInput(e.target.value)}
                    onFocus={() => setShowSuggestions(addressSuggestions.length > 0)}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        moveSuggestion(1);
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        moveSuggestion(-1);
                      } else if (e.key === 'Enter') {
                        e.preventDefault();
                        selectSuggestion(activeSuggestionIndex);
                      } else if (e.key === 'Escape') {
                        setShowSuggestions(false);
                      }
                    }}
                    className="w-full pl-9 pr-4 py-2.5 text-sm border border-neutral-200 rounded-lg placeholder:text-neutral-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-50 outline-none transition"
                  />

                  {loadingAddress && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <span className="w-3.5 h-3.5 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin block"></span>
                    </div>
                  )}

                  {showSuggestions && addressSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-neutral-200 rounded-xl shadow-lg overflow-hidden z-50">
                      <ul role="listbox" className="divide-y divide-neutral-50">
                        {addressSuggestions.map((suggestion, idx) => (
                          <li
                            key={suggestion.place_id}
                            role="option"
                            aria-selected={idx === activeSuggestionIndex}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              selectSuggestion(idx);
                            }}
                            onMouseOver={() => setActiveSuggestionIndex(idx)}
                            className={`flex items-start gap-2.5 px-3 py-2.5 cursor-pointer transition-colors text-sm ${
                              idx === activeSuggestionIndex ? 'bg-blue-50' : 'hover:bg-neutral-50'
                            }`}
                          >
                            <MapPin className="w-3.5 h-3.5 text-neutral-400 mt-0.5 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-neutral-800 text-[13px] font-medium truncate">
                                {suggestion.display_name.split(',')[0]}
                              </p>
                              <p className="text-neutral-400 text-[11px] truncate">
                                {suggestion.display_name.split(',').slice(1).join(',').trim()}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-neutral-400 mt-1.5 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-neutral-300"></span>
                  Comece a digitar para ver sugestões de endereços
                </p>
              </div>

              {/* Bairro */}
              <div>
                <label
                  htmlFor="neighborhood"
                  className="block text-[13px] font-medium text-neutral-700 mb-1.5"
                >
                  Bairro
                </label>
                <input
                  id="neighborhood"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  type="text"
                  placeholder="Ex: Bela Vista"
                  className="w-full px-3.5 py-2.5 text-sm border border-neutral-200 rounded-lg placeholder:text-neutral-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-50 outline-none transition"
                />
              </div>

              {/* Descrição */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-[13px] font-medium text-neutral-700 mb-1.5"
                >
                  Descrição <span className="text-red-400">*</span>
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva o problema com o máximo de detalhes possível..."
                  rows={4}
                  maxLength={1000}
                  className="w-full px-3.5 py-2.5 text-sm border border-neutral-200 rounded-lg placeholder:text-neutral-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-50 outline-none transition resize-none"
                ></textarea>
                <p className="text-[11px] text-neutral-400 mt-1 text-right">
                  {description.length}/1000
                </p>
              </div>

              {/* Divider */}
              <div className="border-t border-neutral-100 pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="text-sm font-medium text-neutral-600 hover:text-neutral-900 px-4 py-2.5 rounded-lg hover:bg-neutral-100 transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleSubmit}
                  className="text-sm font-medium bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 active:scale-[0.98] transition shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {loading && (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                  )}
                  {loading ? 'Salvando...' : 'Enviar Ocorrência'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
