import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  AlertCircle,
  Lock,
  CheckCircle,
  X,
  PlusCircle,
  Construction,
  LightbulbOff,
  Trash2,
  Droplets,
  AlertTriangle,
  type LucideIcon,
} from 'lucide-react';
import { occurrenceTypes } from '../lib/types';
import { getMockUser, type MockUser } from '../lib/mockAuth';
import {
  searchAddresses,
  resolveAddressCoords,
  extractNeighborhood,
  type NominatimResult,
} from '../lib/geocoding';

interface CreateOccurrenceProps {
  user: MockUser | null;
}

// Ícones por tipo (Lucide)
const typeIcons: Record<string, LucideIcon> = {
  pothole: Construction,
  light_out: LightbulbOff,
  trash: Trash2,
  water_leak: Droplets,
  other: AlertTriangle,
};

const MOCK_OCCURRENCES_KEY = 'alerta_rua_occurrences';

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

  const closeModal = () => {
    navigate('/');
  };

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (addressWrapperRef.current && !addressWrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !showSuggestions) {
        navigate('/');
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEsc);
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [navigate, showSuggestions]);

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
        const data = await searchAddresses(q, 6);
        setAddressSuggestions(data);
        setShowSuggestions(data.length > 0);
        setActiveSuggestionIndex(-1);
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

    const bairro = extractNeighborhood(s);
    if (bairro) {
      setNeighborhood(bairro);
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

    try {
      const resolved = await resolveAddressCoords(address, neighborhood, selectedCoords);
      const finalNeighborhood =
        neighborhood.trim() || resolved.resolvedNeighborhood || 'Não informado';

      const occurrence = {
        id: `local-${Date.now()}`,
        title: title.trim(),
        description: description.trim(),
        type,
        status: 'open',
        lat: resolved.lat,
        lng: resolved.lng,
        address: address.trim(),
        neighborhood: finalNeighborhood,
        authorId: currentUser.uid,
        authorName: currentUser.displayName,
        createdAt: { seconds: Math.floor(Date.now() / 1000), toMillis: () => Date.now() },
        updatedAt: { seconds: Math.floor(Date.now() / 1000), toMillis: () => Date.now() },
      };

      const existing = JSON.parse(localStorage.getItem(MOCK_OCCURRENCES_KEY) || '[]');
      existing.unshift(occurrence);
      localStorage.setItem(MOCK_OCCURRENCES_KEY, JSON.stringify(existing));
      window.dispatchEvent(
        new CustomEvent('alerta-rua:occurrence-created', { detail: occurrence })
      );
      setSuccess(true);
    } catch {
      setError('Não foi possível salvar a ocorrência. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      {/* Backdrop escuro com blur mantendo o app visível atrás */}
      <div className="modal-backdrop-enter absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-none"></div>

      {!user ? (
        <div className="modal-content-enter relative bg-white rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden max-w-sm w-full">
          <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400"></div>
          <div className="p-8 text-center">
            <button
              onClick={closeModal}
              className="absolute top-5 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Lock className="w-5 h-5 text-amber-400" />
            </div>
            <h2 className="font-display text-lg font-bold text-zinc-900 mb-1">Acesso Restrito</h2>
            <p className="text-sm text-zinc-500 mb-6">
              Você precisa estar logado para registrar uma ocorrência urbana.
            </p>
            <div className="flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 text-sm font-semibold text-zinc-600 hover:text-zinc-900 px-4 py-2.5 rounded-xl hover:bg-zinc-100 transition border border-zinc-200"
              >
                Cancelar
              </button>
              <button
                onClick={() => navigate('/login')}
                className="flex-1 bg-amber-500 text-zinc-950 text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-amber-400 transition shadow-sm"
              >
                Fazer Login
              </button>
            </div>
          </div>
        </div>
      ) : success ? (
        <div className="modal-content-enter relative bg-white rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden max-w-md w-full">
          <div className="h-1.5 w-full bg-emerald-500"></div>
          <div className="p-8 text-center">
            <button
              onClick={closeModal}
              className="absolute top-5 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-7 h-7 text-emerald-600" />
            </div>
            <h2 className="font-display text-xl font-bold text-zinc-900 mb-1">
              Ocorrência registrada!
            </h2>
            <p className="text-sm text-zinc-500 mb-6">
              Sua ocorrência foi georreferenciada e já está ativa no mapa ao fundo.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={closeModal}
                className="bg-zinc-900 text-amber-400 text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-zinc-800 transition shadow-sm"
              >
                Ver no Mapa
              </button>
              <button
                onClick={resetForm}
                className="text-sm font-semibold text-zinc-600 hover:text-zinc-900 px-5 py-2.5 rounded-xl hover:bg-zinc-100 transition border border-zinc-200"
              >
                Reportar outra
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="modal-content-enter relative bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden max-w-lg w-full max-h-[90vh] overflow-y-auto">
          <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400"></div>
          <div className="p-6">
            {/* Header do Modal */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center shadow-sm">
                  <PlusCircle className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h1 className="font-display text-[17px] font-bold text-zinc-900">
                    Reportar Ocorrência Urbana
                  </h1>
                  <p className="text-[12px] text-zinc-500">
                    Sinalize um problema na via para a comunidade
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition"
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-[13px] rounded-xl flex items-center gap-2 border border-red-100">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Título */}
              <div>
                <label
                  htmlFor="title"
                  className="block text-[13px] font-semibold text-zinc-700 mb-1.5"
                >
                  Título <span className="text-red-500">*</span>
                </label>
                <input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  type="text"
                  placeholder="Ex: Buraco perigoso na faixa da direita"
                  maxLength={150}
                  required
                  className="w-full px-3.5 py-2.5 text-sm border border-zinc-200 rounded-xl placeholder:text-zinc-400 focus:border-amber-500 outline-none transition"
                />
              </div>

              {/* Tipo */}
              <div>
                <label
                  htmlFor="type"
                  className="block text-[13px] font-semibold text-zinc-700 mb-1.5"
                >
                  Categoria de Zeladoria <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(occurrenceTypes).map(([key, label]) => {
                    const TypeIcon = typeIcons[key] || AlertTriangle;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setType(key)}
                        className={`text-[13px] font-medium px-3 py-2.5 rounded-xl border transition text-left flex items-center gap-2 ${
                          type === key
                            ? 'bg-zinc-900 border-zinc-900 text-amber-400 font-semibold shadow-xs'
                            : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50'
                        }`}
                      >
                        <TypeIcon className="w-4 h-4 shrink-0" />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Endereço com Autocomplete */}
              <div>
                <label
                  htmlFor="address"
                  className="block text-[13px] font-semibold text-zinc-700 mb-1.5"
                >
                  Endereço / Via <span className="text-red-500">*</span>
                </label>
                <div className="relative" ref={addressWrapperRef}>
                  <MapPin
                    className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10 ${
                      selectedCoords ? 'text-emerald-500' : 'text-zinc-400'
                    }`}
                  />
                  <input
                    id="address"
                    value={address}
                    type="text"
                    autoComplete="off"
                    placeholder="Ex: Av. Antônio Carlos Comitre, 540 - Parque Campolim, Sorocaba"
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
                    className="w-full pl-9 pr-4 py-2.5 text-sm border border-zinc-200 rounded-xl placeholder:text-zinc-400 focus:border-amber-500 outline-none transition"
                  />

                  {loadingAddress && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <span className="w-3.5 h-3.5 border-2 border-amber-200 border-t-amber-500 rounded-full animate-spin block"></span>
                    </div>
                  )}

                  {showSuggestions && addressSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-zinc-200 rounded-xl shadow-lg overflow-hidden z-50">
                      <ul role="listbox" className="divide-y divide-zinc-100">
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
                              idx === activeSuggestionIndex ? 'bg-amber-50' : 'hover:bg-zinc-50'
                            }`}
                          >
                            <MapPin className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-zinc-800 text-[13px] font-medium truncate">
                                {suggestion.display_name.split(',')[0]}
                              </p>
                              <p className="text-zinc-400 text-[11px] truncate">
                                {suggestion.display_name.split(',').slice(1).join(',').trim()}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-zinc-400 mt-1.5 flex items-center gap-1.5">
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full ${
                      selectedCoords ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  ></span>
                  {selectedCoords
                    ? 'Coordenadas GPS vinculadas com sucesso'
                    : 'Digite a rua e selecione uma sugestão para cravar o pino no endereço exato'}
                </p>
              </div>

              {/* Bairro */}
              <div>
                <label
                  htmlFor="neighborhood"
                  className="block text-[13px] font-semibold text-zinc-700 mb-1.5"
                >
                  Bairro
                </label>
                <input
                  id="neighborhood"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  type="text"
                  placeholder="Ex: Parque Campolim"
                  className="w-full px-3.5 py-2.5 text-sm border border-zinc-200 rounded-xl placeholder:text-zinc-400 focus:border-amber-500 outline-none transition"
                />
              </div>

              {/* Descrição */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-[13px] font-semibold text-zinc-700 mb-1.5"
                >
                  Descrição Detalhada <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva ponto de referência, gravidade e detalhes do problema..."
                  rows={4}
                  maxLength={1000}
                  className="w-full px-3.5 py-2.5 text-sm border border-zinc-200 rounded-xl placeholder:text-zinc-400 focus:border-amber-500 outline-none transition resize-none"
                ></textarea>
                <p className="text-[11px] font-mono-tech text-zinc-400 mt-1 text-right">
                  {description.length}/1000
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 mt-5 pt-4 border-t border-zinc-100">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 text-sm font-semibold text-zinc-600 hover:text-zinc-900 px-4 py-2.5 rounded-xl hover:bg-zinc-100 transition border border-zinc-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleSubmit}
                className="flex-1 text-sm font-bold bg-amber-500 text-zinc-950 px-4 py-2.5 rounded-xl hover:bg-amber-400 active:scale-[0.98] transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && (
                  <span className="w-4 h-4 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin"></span>
                )}
                {loading ? 'Registrando...' : 'Publicar no Mapa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
