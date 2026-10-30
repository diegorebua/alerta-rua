import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { type Occurrence, occurrenceTypes } from '../lib/types';
import { MapPin, Search, Info, Clock, Trash2, Pencil, X, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getMockUser, type MockUser } from '../lib/mockAuth';

const MAP_DEFAULT_CENTER = { lat: -23.55052, lng: -46.633308 };

const DEMO_OCCURRENCES: Occurrence[] = [
  {
    id: 'demo-1',
    title: 'Buraco na Avenida Paulista',
    description: 'Grande buraco no meio da faixa da direita, próximo ao MASP. Risco para veículos e ciclistas.',
    type: 'pothole',
    status: 'open',
    lat: -23.5613,
    lng: -46.6566,
    address: 'Av. Paulista, 1578 - Bela Vista, São Paulo',
    neighborhood: 'Bela Vista',
    authorId: 'demo',
    createdAt: Timestamp.fromDate(new Date(Date.now() - 2 * 60 * 60 * 1000)),
    updatedAt: Timestamp.fromDate(new Date(Date.now() - 2 * 60 * 60 * 1000)),
  },
  {
    id: 'demo-2',
    title: 'Poste apagado na Rua Augusta',
    description: 'Trecho escuro de aproximadamente 50 metros na Rua Augusta. Perigoso à noite para pedestres.',
    type: 'light_out',
    status: 'in_progress',
    lat: -23.5585,
    lng: -46.6547,
    address: 'Rua Augusta, 843 - Consolação, São Paulo',
    neighborhood: 'Consolação',
    authorId: 'demo',
    createdAt: Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000)),
    updatedAt: Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000)),
  },
  {
    id: 'demo-3',
    title: 'Acúmulo de lixo no Ibirapuera',
    description: 'Lixo acumulado próximo ao portão 10. Situação resolvida pela equipe de limpeza.',
    type: 'trash',
    status: 'resolved',
    lat: -23.5874,
    lng: -46.6576,
    address: 'Parque Ibirapuera - Portão 10, São Paulo',
    neighborhood: 'Ibirapuera',
    authorId: 'demo',
    createdAt: Timestamp.fromDate(new Date(Date.now() - 48 * 60 * 60 * 1000)),
    updatedAt: Timestamp.fromDate(new Date(Date.now() - 48 * 60 * 60 * 1000)),
  },
];

// Ícones por tipo
const typeIcons: Record<string, string> = {
  pothole: '🕳️',
  light_out: '💡',
  trash: '🗑️',
  water_leak: '💧',
  other: '⚠️',
};

// Status
const statusOptions: Record<string, string> = {
  open: 'Aberta',
  in_progress: 'Em Andamento',
  resolved: 'Resolvida',
};

const statusActiveClass: Record<string, string> = {
  open: 'bg-red-50 border-red-400 text-red-700',
  in_progress: 'bg-amber-50 border-amber-400 text-amber-700',
  resolved: 'bg-emerald-50 border-emerald-400 text-emerald-700',
};

const MOCK_OCCURRENCES_KEY = 'alerta_rua_occurrences';

const getLocalOccurrences = (): Occurrence[] => {
  try {
    const raw = localStorage.getItem(MOCK_OCCURRENCES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const formatDate = (ts: unknown) => {
  try {
    const timestampObj = ts as { toMillis?: () => number; seconds?: number } | null | undefined;
    const ms = timestampObj?.toMillis
      ? timestampObj.toMillis()
      : timestampObj?.seconds
        ? timestampObj.seconds * 1000
        : Date.now();
    return formatDistanceToNow(ms, { addSuffix: true, locale: ptBR });
  } catch {
    return '';
  }
};

const getStatusClass = (status: string) => {
  const map: Record<string, string> = {
    open: 'status-open',
    in_progress: 'status-in_progress',
    resolved: 'status-resolved',
  };
  return map[status] || 'text-neutral-500 bg-neutral-100 border-neutral-200';
};

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    open: 'Aberta',
    in_progress: 'Andamento',
    resolved: 'Resolvida',
  };
  return map[status] || status;
};

const osmUrl = 'https://www.openstreetmap.org/export/embed.html?bbox=-46.7333%2C-23.6333%2C-46.5333%2C-23.4667&layer=mapnik';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [allOccurrences, setAllOccurrences] = useState<Occurrence[]>([]);
  const [currentZoom, setCurrentZoom] = useState(12);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Occurrence | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [currentUser] = useState<MockUser | null>(() => getMockUser());

  // Estado do modal de edição
  const [editTarget, setEditTarget] = useState<Occurrence | null>(null);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    type: 'pothole',
    address: '',
    neighborhood: '',
    status: 'open',
  });

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const firestoreDataRef = useRef<Occurrence[]>([]);

  const refreshOccurrences = useCallback((firestoreData?: Occurrence[]) => {
    if (firestoreData !== undefined) {
      firestoreDataRef.current = firestoreData;
    }
    const local = getLocalOccurrences();
    const merged = [...local, ...DEMO_OCCURRENCES, ...firestoreDataRef.current];
    setAllOccurrences(merged);
  }, []);

  const filteredOccurrences = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return allOccurrences;
    return allOccurrences.filter(
      (o) =>
        o.title.toLowerCase().includes(q) ||
        o.address.toLowerCase().includes(q) ||
        o.description.toLowerCase().includes(q)
    );
  }, [allOccurrences, searchQuery]);

  const updateMarkers = useCallback((occurrencesToRender: Occurrence[]) => {
    const mapInstance = mapInstanceRef.current;
    if (!mapInstance) return;
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    occurrencesToRender.forEach((occ) => {
      const color =
        occ.status === 'open' ? '#ef4444' : occ.status === 'in_progress' ? '#f59e0b' : '#10b981';
      const marker = new google.maps.Marker({
        position: { lat: occ.lat, lng: occ.lng },
        map: mapInstance,
        title: occ.title,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: color,
          fillOpacity: 1,
          strokeWeight: 2.5,
          strokeColor: '#ffffff',
          scale: 9,
        },
      });
      markersRef.current.push(marker);
    });
  }, []);

  useEffect(() => {
    updateMarkers(filteredOccurrences);
  }, [filteredOccurrences, mapLoaded, updateMarkers]);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | undefined;

    const initMap = async () => {
      let apiKey = '';
      try {
        const configRes = await fetch('/api/config');
        if (configRes.ok && configRes.headers.get('content-type')?.includes('application/json')) {
          const config = await configRes.json();
          apiKey = config.googleMapsApiKey || '';
        }
      } catch {
        // Erro de rede — cai no fallback abaixo
      }

      if (!apiKey) {
        apiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) || '';
      }

      if (apiKey) {
        try {
          const { setOptions, importLibrary } = await import('@googlemaps/js-api-loader');
          setOptions({ key: apiKey, v: 'weekly' });
          const { Map } = (await importLibrary('maps')) as google.maps.MapsLibrary;
          if (isMounted && mapContainerRef.current) {
            const map = new Map(mapContainerRef.current, {
              center: MAP_DEFAULT_CENTER,
              zoom: 12,
              disableDefaultUI: true,
              zoomControl: true,
              mapId: 'ALERTA_RUA_MAP',
            });
            map.addListener('zoom_changed', () => {
              setCurrentZoom(map.getZoom() || 12);
            });
            mapInstanceRef.current = map;
            setMapLoaded(true);
          }
        } catch (e) {
          console.warn('Google Maps não pôde ser carregado:', e);
        }
      } else {
        console.warn('API key do Google Maps não encontrada — usando OpenStreetMap como fallback.');
      }
    };

    initMap();
    refreshOccurrences([]);

    try {
      const q = query(collection(db, 'occurrences'), orderBy('createdAt', 'desc'));
      unsubscribe = onSnapshot(q, (snapshot) => {
        if (!isMounted) return;
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Occurrence));
        refreshOccurrences(data);
      });
    } catch (e) {
      console.warn('Firestore não disponível:', e);
    }

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [refreshOccurrences]);

  const focusMap = (lat: number, lng: number) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter({ lat, lng });
      mapInstanceRef.current.setZoom(16);
    }
  };

  const openEditModal = (occ: Occurrence) => {
    setEditTarget(occ);
    setEditForm({
      title: occ.title,
      description: occ.description,
      type: occ.type,
      address: occ.address,
      neighborhood: occ.neighborhood,
      status: occ.status,
    });
    setEditError('');
  };

  const closeEditModal = () => {
    setEditTarget(null);
    setEditError('');
  };

  const saveEdit = async () => {
    if (!editTarget) return;
    setEditError('');

    if (!editForm.title.trim()) {
      setEditError('Informe um título para a ocorrência.');
      return;
    }
    if (!editForm.description.trim()) {
      setEditError('Informe uma descrição.');
      return;
    }
    if (!editForm.address.trim()) {
      setEditError('Informe o endereço.');
      return;
    }

    setSaving(true);
    const occ = editTarget;

    try {
      const updatedFields = {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        type: editForm.type,
        address: editForm.address.trim(),
        neighborhood: editForm.neighborhood.trim() || 'Não informado',
        status: editForm.status,
      };

      if (occ.id?.startsWith('local-')) {
        const existing: Occurrence[] = JSON.parse(localStorage.getItem(MOCK_OCCURRENCES_KEY) || '[]');
        const idx = existing.findIndex((o) => o.id === occ.id);
        if (idx !== -1) {
          existing[idx] = { ...existing[idx], ...updatedFields };
          localStorage.setItem(MOCK_OCCURRENCES_KEY, JSON.stringify(existing));
        }
        refreshOccurrences();
      } else if (occ.id && !occ.id.startsWith('demo-')) {
        await updateDoc(doc(db, 'occurrences', occ.id), updatedFields);
      }

      closeEditModal();
    } catch (e) {
      console.error('Erro ao salvar edição:', e);
      setEditError('Não foi possível salvar as alterações. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (occ: Occurrence) => {
    setDeleteTarget(occ);
  };

  const deleteOccurrence = async () => {
    if (!deleteTarget) return;
    const occ = deleteTarget;
    setDeleting(true);

    try {
      if (occ.id?.startsWith('local-')) {
        const existing: Occurrence[] = JSON.parse(localStorage.getItem(MOCK_OCCURRENCES_KEY) || '[]');
        const updated = existing.filter((o) => o.id !== occ.id);
        localStorage.setItem(MOCK_OCCURRENCES_KEY, JSON.stringify(updated));
        refreshOccurrences();
      } else if (occ.id && !occ.id.startsWith('demo-')) {
        await deleteDoc(doc(db, 'occurrences', occ.id));
      }
      setDeleteTarget(null);
    } catch (e) {
      console.error('Erro ao excluir ocorrência:', e);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="flex flex-col md:flex-row h-[calc(100vh-60px)] w-full overflow-hidden">
        {/* ── Sidebar ──────────────────────────────────── */}
        <div className="w-full md:w-[380px] flex flex-col bg-white border-r border-neutral-100 z-10">
          {/* Cabeçalho */}
          <div className="px-5 py-4 border-b border-neutral-100">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-semibold text-[15px] text-neutral-900">Ocorrências</h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {filteredOccurrences.length} registro(s) encontrado(s)
                </p>
              </div>
              {/* Legend */}
              <div className="flex items-center gap-2 text-[10px] text-neutral-400">
                <span className="flex items-center gap-1">
                  <span className="status-dot open"></span>Aberta
                </span>
                <span className="flex items-center gap-1">
                  <span className="status-dot in_progress"></span>Andamento
                </span>
                <span className="flex items-center gap-1">
                  <span className="status-dot resolved"></span>Resolvida
                </span>
              </div>
            </div>

            {/* Busca */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                type="text"
                placeholder="Buscar por título ou endereço..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-lg placeholder:text-neutral-400 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
              />
            </div>
          </div>

          {/* Lista */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {filteredOccurrences.length === 0 ? (
              <div className="text-center text-neutral-400 py-16 flex flex-col items-center gap-3">
                <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center">
                  <MapPin className="w-5 h-5 opacity-40" />
                </div>
                <p className="text-sm">Nenhuma ocorrência encontrada.</p>
              </div>
            ) : (
              filteredOccurrences.map((occ) => (
                <div
                  key={occ.id}
                  className="card-hover bg-white border border-neutral-100 rounded-xl p-4 cursor-pointer group relative"
                  onClick={() => focusMap(occ.lat, occ.lng)}
                >
                  {/* Ações do autor (Editar + Excluir) — só aparecem ao passar o mouse */}
                  {currentUser && occ.authorId === currentUser.uid && !occ.id?.startsWith('demo-') && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Botão Editar */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(occ);
                        }}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-neutral-300 hover:text-blue-500 transition-colors"
                        title="Editar ocorrência"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {/* Botão Excluir */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmDelete(occ);
                        }}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-neutral-300 hover:text-red-500 transition-colors"
                        title="Excluir ocorrência"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Título + Badge */}
                  <div className="flex justify-between items-start gap-2 mb-2 pr-14">
                    <span className="font-medium text-[13.5px] text-neutral-900 leading-snug group-hover:text-blue-600 transition">
                      {occ.title}
                    </span>
                    <span
                      className={`shrink-0 flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium border ${getStatusClass(
                        occ.status
                      )}`}
                    >
                      <span className={`status-dot ${occ.status}`}></span>
                      {getStatusText(occ.status)}
                    </span>
                  </div>

                  {/* Descrição */}
                  <p className="text-[12.5px] text-neutral-500 line-clamp-2 mb-3 leading-relaxed">
                    {occ.description}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-[11px] text-neutral-400">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate max-w-[160px]">{occ.address}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-md font-medium">
                        {occurrenceTypes[occ.type] || occ.type}
                      </span>
                      <span className="text-[11px] text-neutral-400 flex items-center gap-0.5">
                        <Clock className="w-3 h-3" />
                        {formatDate(occ.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Mapa ──────────────────────────────────────── */}
        <div className="flex-1 relative h-full">
          {/* Mapa Google Maps (quando API key disponível) */}
          <div
            ref={mapContainerRef}
            className={`w-full h-full bg-neutral-100 ${!mapLoaded ? 'hidden' : ''}`}
          ></div>

          {/* Fallback: OpenStreetMap via iframe quando não há API key */}
          {!mapLoaded && (
            <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-50 relative">
              <iframe
                src={osmUrl}
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Mapa de ocorrências"
              ></iframe>
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm text-[11px] text-neutral-500 px-3 py-1.5 rounded-full shadow-sm border border-neutral-200">
                Mapa via OpenStreetMap
              </div>
            </div>
          )}

          {/* Tooltip de zoom (só quando Google Maps estiver ativo) */}
          {mapLoaded && (
            <div className="absolute top-4 left-4 pointer-events-none">
              <div className="bg-white/90 backdrop-blur-sm text-[11.5px] font-medium px-3 py-1.5 rounded-full shadow-sm text-neutral-600 flex items-center gap-1.5 border border-neutral-100 transition-opacity duration-300">
                <Info
                  className={`w-3.5 h-3.5 ${
                    currentZoom >= 16 ? 'text-blue-500' : 'text-neutral-400'
                  }`}
                />
                {currentZoom >= 16
                  ? 'Visualizando detalhes da área'
                  : 'Aproxime o zoom para ver detalhes'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal de confirmação de exclusão ─────────────── */}
      {deleteTarget &&
        createPortal(
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setDeleteTarget(null);
            }}
          >
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm pointer-events-none"></div>
            <div className="relative bg-white rounded-2xl shadow-xl border border-neutral-100 p-6 max-w-sm w-full">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="text-[15px] font-semibold text-neutral-900 text-center mb-1">
                Excluir Ocorrência
              </h3>
              <p className="text-sm text-neutral-500 text-center mb-5">
                Tem certeza que deseja excluir <strong>"{deleteTarget.title}"</strong>? Esta ação não
                pode ser desfeita.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 text-sm font-medium text-neutral-600 hover:text-neutral-900 px-4 py-2.5 rounded-lg hover:bg-neutral-100 transition border border-neutral-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={deleteOccurrence}
                  disabled={deleting}
                  className="flex-1 text-sm font-medium bg-red-500 text-white px-4 py-2.5 rounded-lg hover:bg-red-600 transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleting && (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                  )}
                  {deleting ? 'Excluindo...' : 'Excluir'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ── Modal de Edição ───────────────────────────────── */}
      {editTarget &&
        createPortal(
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) closeEditModal();
            }}
          >
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm pointer-events-none"></div>
            <div className="relative bg-white rounded-2xl shadow-xl border border-neutral-100 p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
              {/* Header do modal */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Pencil className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-semibold text-neutral-900">Editar Ocorrência</h3>
                    <p className="text-[12px] text-neutral-400">
                      Atualize as informações da ocorrência
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeEditModal}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Erro */}
              {editError && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-[13px] rounded-lg flex items-center gap-2 border border-red-100">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {editError}
                </div>
              )}

              <div className="space-y-4">
                {/* Título */}
                <div>
                  <label className="block text-[13px] font-medium text-neutral-700 mb-1.5">
                    Título <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={editForm.title}
                    onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                    type="text"
                    maxLength={150}
                    placeholder="Ex: Buraco perigoso na via"
                    className="w-full px-3.5 py-2.5 text-sm border border-neutral-200 rounded-lg placeholder:text-neutral-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-50 outline-none transition"
                  />
                </div>

                {/* Tipo */}
                <div>
                  <label className="block text-[13px] font-medium text-neutral-700 mb-1.5">
                    Tipo de Problema
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(occurrenceTypes).map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setEditForm((f) => ({ ...f, type: key }))}
                        className={`text-[13px] font-medium px-3 py-2 rounded-lg border transition text-left flex items-center gap-2 ${
                          editForm.type === key
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

                {/* Endereço */}
                <div>
                  <label className="block text-[13px] font-medium text-neutral-700 mb-1.5">
                    Endereço <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                    <input
                      value={editForm.address}
                      onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))}
                      type="text"
                      placeholder="Ex: Av. Paulista, 1578 - Bela Vista, São Paulo"
                      className="w-full pl-9 pr-4 py-2.5 text-sm border border-neutral-200 rounded-lg placeholder:text-neutral-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-50 outline-none transition"
                    />
                  </div>
                </div>

                {/* Bairro */}
                <div>
                  <label className="block text-[13px] font-medium text-neutral-700 mb-1.5">
                    Bairro
                  </label>
                  <input
                    value={editForm.neighborhood}
                    onChange={(e) => setEditForm((f) => ({ ...f, neighborhood: e.target.value }))}
                    type="text"
                    placeholder="Ex: Bela Vista"
                    className="w-full px-3.5 py-2.5 text-sm border border-neutral-200 rounded-lg placeholder:text-neutral-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-50 outline-none transition"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-[13px] font-medium text-neutral-700 mb-1.5">
                    Status
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(statusOptions).map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setEditForm((f) => ({ ...f, status: key }))}
                        className={`text-[12px] font-medium px-3 py-2 rounded-lg border transition text-center ${
                          editForm.status === key
                            ? statusActiveClass[key]
                            : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-[13px] font-medium text-neutral-700 mb-1.5">
                    Descrição <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                    rows={4}
                    maxLength={1000}
                    placeholder="Descreva o problema com o máximo de detalhes possível..."
                    className="w-full px-3.5 py-2.5 text-sm border border-neutral-200 rounded-lg placeholder:text-neutral-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-50 outline-none transition resize-none"
                  ></textarea>
                  <p className="text-[11px] text-neutral-400 mt-1 text-right">
                    {editForm.description.length}/1000
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex gap-3 mt-5 pt-4 border-t border-neutral-100">
                <button
                  onClick={closeEditModal}
                  className="flex-1 text-sm font-medium text-neutral-600 hover:text-neutral-900 px-4 py-2.5 rounded-lg hover:bg-neutral-100 transition border border-neutral-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveEdit}
                  disabled={saving}
                  className="flex-1 text-sm font-medium bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                  )}
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
