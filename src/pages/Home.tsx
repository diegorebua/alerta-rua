import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { type Occurrence, occurrenceTypes } from '../lib/types';
import {
  MapPin,
  Search,
  Info,
  Clock,
  Trash2,
  Pencil,
  X,
  AlertCircle,
  User,
  Navigation,
  Activity,
  Construction,
  LightbulbOff,
  Droplets,
  AlertTriangle,
  type LucideIcon,
} from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getMockUser, resolveAuthorName, type MockUser } from '../lib/mockAuth';
import {
  searchAddresses,
  resolveAddressCoords,
  extractNeighborhood,
  DEFAULT_SOROCABA_COORDS,
  type NominatimResult,
} from '../lib/geocoding';
import seedData from '../lib/seedData.json';

const MAP_DEFAULT_CENTER = seedData.center || DEFAULT_SOROCABA_COORDS;

const SEED_OCCURRENCES: Occurrence[] = seedData.occurrences.map((item) => ({
  id: item.id,
  title: item.title,
  description: item.description,
  type: item.type as Occurrence['type'],
  status: item.status as Occurrence['status'],
  lat: item.lat,
  lng: item.lng,
  address: item.address,
  neighborhood: item.neighborhood,
  authorId: item.authorId,
  authorName: item.authorName,
  createdAt: Timestamp.fromDate(new Date(Date.now() - item.hoursAgo * 60 * 60 * 1000)),
  updatedAt: Timestamp.fromDate(new Date(Date.now() - item.hoursAgo * 60 * 60 * 1000)),
}));

// Ícones por tipo (Lucide)
const typeIcons: Record<string, LucideIcon> = {
  pothole: Construction,
  light_out: LightbulbOff,
  trash: Trash2,
  water_leak: Droplets,
  other: AlertTriangle,
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
const SEED_VERSION_KEY = 'alerta_rua_seed_version';

const getLocalOccurrences = (): Occurrence[] => {
  try {
    const currentSeedVersion = localStorage.getItem(SEED_VERSION_KEY);
    if (currentSeedVersion !== seedData.seededAt) {
      localStorage.setItem(MOCK_OCCURRENCES_KEY, JSON.stringify(SEED_OCCURRENCES));
      localStorage.setItem(SEED_VERSION_KEY, seedData.seededAt);
      return [...SEED_OCCURRENCES];
    }
    const raw = localStorage.getItem(MOCK_OCCURRENCES_KEY);
    if (!raw) {
      localStorage.setItem(MOCK_OCCURRENCES_KEY, JSON.stringify(SEED_OCCURRENCES));
      return [...SEED_OCCURRENCES];
    }
    return JSON.parse(raw);
  } catch {
    return [...SEED_OCCURRENCES];
  }
};

const getTimestampMillis = (ts: unknown): number => {
  const timestampObj = ts as { toMillis?: () => number; seconds?: number } | null | undefined;
  return timestampObj?.toMillis
    ? timestampObj.toMillis()
    : timestampObj?.seconds
      ? timestampObj.seconds * 1000
      : Date.now();
};

const formatDate = (ts: unknown) => {
  try {
    return formatDistanceToNow(getTimestampMillis(ts), { addSuffix: true, locale: ptBR });
  } catch {
    return '';
  }
};

const formatFullDate = (ts: unknown) => {
  try {
    return format(getTimestampMillis(ts), "dd 'de' MMM 'às' HH:mm", { locale: ptBR });
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
  return map[status] || 'text-zinc-500 bg-zinc-100 border-zinc-200';
};

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    open: 'Aberta',
    in_progress: 'Andamento',
    resolved: 'Resolvida',
  };
  return map[status] || status;
};

const osmUrl =
  'https://www.openstreetmap.org/export/embed.html?bbox=-47.5400%2C-23.5600%2C-47.3900%2C-23.4300&layer=mapnik';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [allOccurrences, setAllOccurrences] = useState<Occurrence[]>([]);
  const [selectedOccurrenceId, setSelectedOccurrenceId] = useState<string | null>(null);
  const [currentZoom, setCurrentZoom] = useState(13);
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
  const [editCoords, setEditCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [editAddressSuggestions, setEditAddressSuggestions] = useState<NominatimResult[]>([]);
  const [showEditSuggestions, setShowEditSuggestions] = useState(false);
  const [loadingEditAddress, setLoadingEditAddress] = useState(false);
  const editSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const firestoreDataRef = useRef<Occurrence[]>([]);
  const repairedIdsRef = useRef<Set<string>>(new Set());

  const refreshOccurrences = useCallback((firestoreData?: Occurrence[]) => {
    if (firestoreData !== undefined) {
      firestoreDataRef.current = firestoreData;
    }
    const local = getLocalOccurrences();
    const sorocabaFirestore = firestoreDataRef.current.filter(
      (o) => /sorocaba/i.test(o.address || '') || (o.lat < -23.35 && o.lng < -47.3)
    );
    const merged = [...local, ...sorocabaFirestore];
    setAllOccurrences(merged);
  }, []);

  // Animação GSAP nos cards ao carregar
  useGSAP(
    () => {
      if (allOccurrences.length > 0) {
        gsap.fromTo(
          '.occurrence-card-item',
          { y: 14, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: 'power2.out', overwrite: 'auto' }
        );
      }
    },
    { scope: sidebarRef, dependencies: [allOccurrences.length, statusFilter] }
  );

  // Repara automaticamente ocorrências locais que caíram na coordenada padrão sem endereço correspondente
  useEffect(() => {
    let cancelled = false;
    const repairLegacyLocalCoords = async () => {
      const local = getLocalOccurrences();
      const needsRepair = local.filter(
        (occ) =>
          occ.id &&
          occ.id.startsWith('local-') &&
          !repairedIdsRef.current.has(occ.id) &&
          Math.abs(occ.lat - DEFAULT_SOROCABA_COORDS.lat) < 0.0001 &&
          Math.abs(occ.lng - DEFAULT_SOROCABA_COORDS.lng) < 0.0001 &&
          occ.address
      );

      if (needsRepair.length === 0) return;

      let updatedAny = false;
      const updatedLocal = [...local];

      for (const occ of needsRepair) {
        if (cancelled || !occ.id) break;
        repairedIdsRef.current.add(occ.id);
        const resolved = await resolveAddressCoords(occ.address, occ.neighborhood || '', null);
        if (
          Math.abs(resolved.lat - DEFAULT_SOROCABA_COORDS.lat) > 0.0001 ||
          Math.abs(resolved.lng - DEFAULT_SOROCABA_COORDS.lng) > 0.0001
        ) {
          const idx = updatedLocal.findIndex((o) => o.id === occ.id);
          if (idx !== -1) {
            updatedLocal[idx] = {
              ...updatedLocal[idx],
              lat: resolved.lat,
              lng: resolved.lng,
              neighborhood:
                updatedLocal[idx].neighborhood === 'Não informado' && resolved.resolvedNeighborhood
                  ? resolved.resolvedNeighborhood
                  : updatedLocal[idx].neighborhood,
            };
            updatedAny = true;
          }
        }
      }

      if (!cancelled && updatedAny) {
        localStorage.setItem(MOCK_OCCURRENCES_KEY, JSON.stringify(updatedLocal));
        refreshOccurrences();
      }
    };

    repairLegacyLocalCoords();
    return () => {
      cancelled = true;
    };
  }, [allOccurrences.length, refreshOccurrences]);

  const counts = React.useMemo(() => {
    return {
      all: allOccurrences.length,
      open: allOccurrences.filter((o) => o.status === 'open').length,
      in_progress: allOccurrences.filter((o) => o.status === 'in_progress').length,
      resolved: allOccurrences.filter((o) => o.status === 'resolved').length,
    };
  }, [allOccurrences]);

  const filteredOccurrences = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return allOccurrences.filter((o) => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (!q) return true;
      return (
        o.title.toLowerCase().includes(q) ||
        o.address.toLowerCase().includes(q) ||
        o.description.toLowerCase().includes(q) ||
        (o.neighborhood && o.neighborhood.toLowerCase().includes(q))
      );
    });
  }, [allOccurrences, searchQuery, statusFilter]);

  const selectedOccurrence = React.useMemo(
    () => allOccurrences.find((o) => o.id === selectedOccurrenceId) || null,
    [allOccurrences, selectedOccurrenceId]
  );

  const selectAndFocusOccurrence = useCallback((occ: Occurrence) => {
    setSelectedOccurrenceId(occ.id || null);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo({ lat: occ.lat, lng: occ.lng });
      const current = mapInstanceRef.current.getZoom() || 12;
      if (current < 16) {
        mapInstanceRef.current.setZoom(16);
      }
    }
  }, []);

  const updateMarkers = useCallback(
    (occurrencesToRender: Occurrence[], activeId: string | null) => {
      const mapInstance = mapInstanceRef.current;
      if (!mapInstance) return;
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      occurrencesToRender.forEach((occ) => {
        const isSelected = Boolean(occ.id && occ.id === activeId);
        const color =
          occ.status === 'open' ? '#ef4444' : occ.status === 'in_progress' ? '#f59e0b' : '#10b981';
        const marker = new google.maps.Marker({
          position: { lat: occ.lat, lng: occ.lng },
          map: mapInstance,
          title: occ.title,
          zIndex: isSelected ? 100 : 1,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: color,
            fillOpacity: 1,
            strokeWeight: isSelected ? 4 : 2.5,
            strokeColor: isSelected ? '#09090b' : '#ffffff',
            scale: isSelected ? 12 : 9,
          },
        });
        marker.addListener('click', () => {
          selectAndFocusOccurrence(occ);
        });
        markersRef.current.push(marker);
      });
    },
    [selectAndFocusOccurrence]
  );

  useEffect(() => {
    updateMarkers(filteredOccurrences, selectedOccurrenceId);
  }, [filteredOccurrences, selectedOccurrenceId, mapLoaded, updateMarkers]);

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
              zoom: 13,
              disableDefaultUI: true,
              zoomControl: true,
              mapId: 'ALERTA_RUA_MAP',
            });
            map.addListener('zoom_changed', () => {
              setCurrentZoom(map.getZoom() || 13);
            });
            map.addListener('click', () => {
              setSelectedOccurrenceId(null);
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

    const handleOccurrenceCreated = (e: Event) => {
      const customEvent = e as CustomEvent<Occurrence>;
      refreshOccurrences();
      if (customEvent.detail && mapInstanceRef.current) {
        mapInstanceRef.current.panTo({ lat: customEvent.detail.lat, lng: customEvent.detail.lng });
        mapInstanceRef.current.setZoom(16);
      }
    };
    window.addEventListener('alerta-rua:occurrence-created', handleOccurrenceCreated);

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
      window.removeEventListener('alerta-rua:occurrence-created', handleOccurrenceCreated);
      if (unsubscribe) unsubscribe();
    };
  }, [refreshOccurrences, selectAndFocusOccurrence]);

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
    setEditCoords({ lat: occ.lat, lng: occ.lng });
    setEditAddressSuggestions([]);
    setShowEditSuggestions(false);
    setEditError('');
  };

  const closeEditModal = () => {
    setEditTarget(null);
    setEditError('');
    setEditAddressSuggestions([]);
    setShowEditSuggestions(false);
  };

  const onEditAddressChange = (value: string) => {
    setEditForm((f) => ({ ...f, address: value }));
    setEditCoords(null);

    if (editSearchTimerRef.current) clearTimeout(editSearchTimerRef.current);
    const q = value.trim();
    if (q.length < 3) {
      setEditAddressSuggestions([]);
      setShowEditSuggestions(false);
      return;
    }

    setLoadingEditAddress(true);
    editSearchTimerRef.current = setTimeout(async () => {
      try {
        const data = await searchAddresses(q, 5);
        setEditAddressSuggestions(data);
        setShowEditSuggestions(data.length > 0);
      } finally {
        setLoadingEditAddress(false);
      }
    }, 400);
  };

  const selectEditSuggestion = (s: NominatimResult) => {
    const bairro = extractNeighborhood(s);
    setEditForm((f) => ({
      ...f,
      address: s.display_name,
      neighborhood: bairro || f.neighborhood,
    }));
    setEditCoords({ lat: parseFloat(s.lat), lng: parseFloat(s.lon) });
    setShowEditSuggestions(false);
    setEditAddressSuggestions([]);
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
      const addressChanged = editForm.address.trim() !== occ.address.trim();
      const coordsToUse = addressChanged ? editCoords : editCoords ?? { lat: occ.lat, lng: occ.lng };
      const resolved = await resolveAddressCoords(
        editForm.address,
        editForm.neighborhood,
        coordsToUse
      );

      const updatedFields = {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        type: editForm.type,
        address: editForm.address.trim(),
        neighborhood:
          editForm.neighborhood.trim() || resolved.resolvedNeighborhood || 'Não informado',
        status: editForm.status,
        lat: resolved.lat,
        lng: resolved.lng,
      };

      if (occ.id?.startsWith('local-') || occ.id?.startsWith('sorocaba-seed-')) {
        const existing = getLocalOccurrences();
        const idx = existing.findIndex((o) => o.id === occ.id);
        if (idx !== -1) {
          existing[idx] = { ...existing[idx], ...updatedFields };
          localStorage.setItem(MOCK_OCCURRENCES_KEY, JSON.stringify(existing));
        }
        refreshOccurrences();
      } else if (occ.id && !occ.id.startsWith('demo-')) {
        await updateDoc(doc(db, 'occurrences', occ.id), updatedFields);
      }

      if (mapInstanceRef.current && selectedOccurrenceId === occ.id) {
        mapInstanceRef.current.panTo({ lat: resolved.lat, lng: resolved.lng });
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
      if (occ.id?.startsWith('local-') || occ.id?.startsWith('sorocaba-seed-')) {
        const existing = getLocalOccurrences();
        const updated = existing.filter((o) => o.id !== occ.id);
        localStorage.setItem(MOCK_OCCURRENCES_KEY, JSON.stringify(updated));
        refreshOccurrences();
      } else if (occ.id && !occ.id.startsWith('demo-')) {
        await deleteDoc(doc(db, 'occurrences', occ.id));
      }
      if (selectedOccurrenceId === occ.id) {
        setSelectedOccurrenceId(null);
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
      <div className="flex flex-col md:flex-row h-[calc(100vh-65px)] w-full overflow-hidden">
        {/* ── Sidebar: Central de Ocorrências Urbanas ──────────────────── */}
        <div
          ref={sidebarRef}
          className="w-full md:w-[410px] flex flex-col bg-white border-r border-zinc-200/80 z-10 shadow-[4px_0_24px_rgba(0,0,0,0.03)]"
        >
          {/* Cabeçalho Técnico */}
          <div className="px-5 pt-4 pb-3.5 border-b border-zinc-200/80 bg-zinc-50/70">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-zinc-900 text-amber-400 flex items-center justify-center shadow-sm">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-[15px] text-zinc-900 leading-tight">
                    Radar de Ocorrências
                  </h2>
                  <p className="text-[11px] font-mono-tech text-zinc-500">
                    {filteredOccurrences.length} REGISTRO(S) NA REGIÃO
                  </p>
                </div>
              </div>

              {/* Pílulas rápidas de filtro de status */}
              <div className="flex items-center gap-1 bg-zinc-200/70 p-0.5 rounded-lg text-[10.5px] font-medium">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-2 py-1 rounded-md transition ${
                    statusFilter === 'all'
                      ? 'bg-zinc-900 text-amber-400 shadow-xs font-semibold'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  Todas ({counts.all})
                </button>
                <button
                  onClick={() => setStatusFilter(statusFilter === 'open' ? 'all' : 'open')}
                  title="Filtrar abertas"
                  className={`px-1.5 py-1 rounded-md flex items-center gap-1 transition ${
                    statusFilter === 'open'
                      ? 'bg-red-600 text-white font-semibold'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                  {counts.open}
                </button>
                <button
                  onClick={() =>
                    setStatusFilter(statusFilter === 'in_progress' ? 'all' : 'in_progress')
                  }
                  title="Filtrar em andamento"
                  className={`px-1.5 py-1 rounded-md flex items-center gap-1 transition ${
                    statusFilter === 'in_progress'
                      ? 'bg-amber-500 text-zinc-950 font-semibold'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  {counts.in_progress}
                </button>
                <button
                  onClick={() => setStatusFilter(statusFilter === 'resolved' ? 'all' : 'resolved')}
                  title="Filtrar resolvidas"
                  className={`px-1.5 py-1 rounded-md flex items-center gap-1 transition ${
                    statusFilter === 'resolved'
                      ? 'bg-emerald-600 text-white font-semibold'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  {counts.resolved}
                </button>
              </div>
            </div>

            {/* Busca */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                type="text"
                placeholder="Buscar rua, bairro ou tipo de problema..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-zinc-200 rounded-xl placeholder:text-zinc-400 focus:border-amber-500 transition shadow-2xs"
              />
            </div>
          </div>

          {/* Lista de Ocorrências */}
          <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-2.5 bg-urban-grid-light">
            {filteredOccurrences.length === 0 ? (
              <div className="text-center text-zinc-400 py-16 flex flex-col items-center gap-3">
                <div className="w-12 h-12 bg-zinc-200/70 rounded-2xl flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-zinc-500" />
                </div>
                <p className="text-sm font-medium text-zinc-500">Nenhuma ocorrência encontrada.</p>
              </div>
            ) : (
              filteredOccurrences.map((occ) => {
                const isSelected = occ.id === selectedOccurrenceId;
                const authorDisplay = resolveAuthorName(occ.authorId, occ.authorName);
                const OccTypeIcon = typeIcons[occ.type] || AlertTriangle;
                const accentBorder =
                  occ.status === 'open'
                    ? 'border-l-red-500'
                    : occ.status === 'in_progress'
                      ? 'border-l-amber-500'
                      : 'border-l-emerald-500';

                return (
                  <div
                    key={occ.id}
                    className={`occurrence-card-item card-hover bg-white border border-l-4 ${accentBorder} rounded-xl p-4 cursor-pointer group relative ${
                      isSelected
                        ? 'border-zinc-900 ring-2 ring-amber-400/60 shadow-md'
                        : 'border-zinc-200/90'
                    }`}
                    onClick={() => selectAndFocusOccurrence(occ)}
                  >
                    {/* Ações do autor (Editar + Excluir) */}
                    {currentUser && occ.authorId === currentUser.uid && !occ.id?.startsWith('demo-') && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-xs px-1 py-0.5 rounded-lg border border-zinc-200 shadow-2xs">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(occ);
                          }}
                          className="p-1 rounded-md hover:bg-amber-50 text-zinc-400 hover:text-amber-600 transition-colors"
                          title="Editar ocorrência"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmDelete(occ);
                          }}
                          className="p-1 rounded-md hover:bg-red-50 text-zinc-400 hover:text-red-600 transition-colors"
                          title="Excluir ocorrência"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Título + Badge */}
                    <div className="flex justify-between items-start gap-2 mb-1.5 pr-12">
                      <span className="font-display font-bold text-[14px] text-zinc-900 leading-snug group-hover:text-amber-600 transition">
                        {occ.title}
                      </span>
                      <span
                        className={`shrink-0 flex items-center gap-1.5 text-[10.5px] px-2 py-0.5 rounded-full font-semibold border ${getStatusClass(
                          occ.status
                        )}`}
                      >
                        <span className={`status-dot ${occ.status}`}></span>
                        {getStatusText(occ.status)}
                      </span>
                    </div>

                    {/* Descrição */}
                    <p className="text-[12.5px] text-zinc-500 line-clamp-2 mb-2.5 leading-relaxed">
                      {occ.description}
                    </p>

                    {/* Autor + Bairro */}
                    <div className="flex items-center justify-between text-[11px] text-zinc-500 mb-2">
                      <span className="inline-flex items-center gap-1.5 truncate">
                        <User className="w-3 h-3 text-amber-500 shrink-0" />
                        <span>
                          Por <strong className="font-semibold text-zinc-700">{authorDisplay}</strong>
                        </span>
                      </span>
                      {occ.neighborhood && (
                        <span className="font-mono-tech text-[10px] uppercase tracking-wider text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded">
                          {occ.neighborhood}
                        </span>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
                      <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500">
                        <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
                        <span className="truncate max-w-[160px]">{occ.address}</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10.5px] bg-zinc-900 text-zinc-100 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                          <OccTypeIcon className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>{occurrenceTypes[occ.type] || occ.type}</span>
                        </span>
                        <span className="text-[10.5px] font-mono-tech text-zinc-400 flex items-center gap-0.5">
                          <Clock className="w-3 h-3" />
                          {formatDate(occ.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Mapa ──────────────────────────────────────── */}
        <div className="flex-1 relative h-full">
          {/* Mapa Google Maps (quando API key disponível) */}
          <div
            ref={mapContainerRef}
            className={`w-full h-full bg-zinc-200 ${!mapLoaded ? 'hidden' : ''}`}
          ></div>

          {/* Fallback: OpenStreetMap via iframe quando não há API key */}
          {!mapLoaded && (
            <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-100 relative">
              <iframe
                src={osmUrl}
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Mapa de ocorrências"
              ></iframe>
              <div className="absolute bottom-4 left-4 bg-zinc-950/90 backdrop-blur-sm text-[11px] font-mono-tech text-zinc-300 px-3 py-1.5 rounded-full shadow-md border border-zinc-800">
                MAPA VIA OPENSTREETMAP
              </div>
            </div>
          )}

          {/* HUD Urbano no topo do mapa */}
          {mapLoaded && (
            <div className="absolute top-4 left-4 pointer-events-none z-10 flex items-center gap-2">
              <div className="bg-zinc-950/90 backdrop-blur-md text-[11.5px] font-medium px-3.5 py-2 rounded-xl shadow-lg text-zinc-200 flex items-center gap-2 border border-zinc-800">
                <Info
                  className={`w-3.5 h-3.5 ${
                    currentZoom >= 16 ? 'text-amber-400' : 'text-zinc-400'
                  }`}
                />
                <span>
                  {currentZoom >= 16
                    ? 'Zoom de inspeção ativo — clique nas marcações'
                    : 'Clique nas bolinhas no mapa para abrir a ficha da ocorrência'}
                </span>
              </div>
            </div>
          )}

          {/* ── Painel Lateral Direito (Drop-Left Drawer) de Detalhes da Ocorrência ── */}
          {selectedOccurrence && (
            <div
              key={selectedOccurrence.id}
              className="drawer-right-enter absolute top-3 bottom-3 right-3 w-[calc(100%-24px)] sm:w-[370px] z-20 flex flex-col bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_12px_40px_rgba(9,9,11,0.18)] border border-zinc-200/90 overflow-hidden"
            >
              {/* Faixa de sinalização urbana */}
              <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 shrink-0"></div>

              {/* Header fixo do drawer */}
              <div className="px-5 pt-4 pb-3 border-b border-zinc-100 flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-zinc-900 text-amber-400 px-2.5 py-1 rounded-lg">
                    {React.createElement(typeIcons[selectedOccurrence.type] || AlertTriangle, {
                      className: 'w-3.5 h-3.5 shrink-0',
                    })}
                    <span>
                      {occurrenceTypes[selectedOccurrence.type] || selectedOccurrence.type}
                    </span>
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-semibold border ${getStatusClass(
                      selectedOccurrence.status
                    )}`}
                  >
                    <span className={`status-dot ${selectedOccurrence.status}`}></span>
                    {statusOptions[selectedOccurrence.status] ||
                      getStatusText(selectedOccurrence.status)}
                  </span>
                </div>

                <button
                  onClick={() => setSelectedOccurrenceId(null)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition shrink-0"
                  title="Fechar painel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Corpo rolável com todas as informações */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div>
                  <span className="text-[10px] font-mono-tech uppercase tracking-widest text-zinc-400 block mb-1">
                    FICHA DA OCORRÊNCIA
                  </span>
                  <h3 className="font-display text-[18px] font-bold text-zinc-900 leading-snug">
                    {selectedOccurrence.title}
                  </h3>
                </div>

                {/* Descrição completa */}
                <div className="bg-zinc-50/80 border border-zinc-200/70 rounded-xl p-3.5">
                  <p className="text-[10.5px] font-mono-tech uppercase tracking-wider text-zinc-400 mb-1">
                    Relato do problema
                  </p>
                  <p className="text-[13px] text-zinc-700 leading-relaxed whitespace-pre-line">
                    {selectedOccurrence.description}
                  </p>
                </div>

                {/* Quem abriu */}
                <div className="bg-zinc-50/80 rounded-xl p-3.5 border border-zinc-200/70 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-zinc-900 text-amber-400 flex items-center justify-center text-xs font-bold shrink-0">
                    {resolveAuthorName(selectedOccurrence.authorId, selectedOccurrence.authorName)
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10.5px] font-mono-tech uppercase tracking-wider text-zinc-400 leading-none mb-1">
                      Aberta por
                    </p>
                    <p className="text-[13.5px] font-semibold text-zinc-900 truncate">
                      {resolveAuthorName(
                        selectedOccurrence.authorId,
                        selectedOccurrence.authorName
                      )}
                    </p>
                  </div>
                </div>

                {/* Localização & Telemetria */}
                <div className="bg-zinc-50/80 rounded-xl p-3.5 space-y-3 border border-zinc-200/70">
                  <div className="flex items-start gap-2.5 text-[12.5px]">
                    <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-[10.5px] font-mono-tech uppercase tracking-wider text-zinc-400 mb-0.5">
                        Endereço registrado
                      </p>
                      <p className="font-semibold text-zinc-800 leading-snug break-words">
                        {selectedOccurrence.address}
                      </p>
                      {selectedOccurrence.neighborhood && (
                        <span className="inline-block mt-1.5 text-[10.5px] font-mono-tech uppercase bg-zinc-200/80 text-zinc-700 px-2 py-0.5 rounded">
                          Bairro: {selectedOccurrence.neighborhood}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-zinc-200/70 flex items-center justify-between text-[11px] text-zinc-500">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                      {formatFullDate(selectedOccurrence.createdAt)}
                    </span>
                    <span className="font-mono-tech text-[10.5px] text-zinc-400">
                      {formatDate(selectedOccurrence.createdAt)}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-zinc-200/70 flex items-center justify-between text-[11px]">
                    <span className="text-zinc-400 font-mono-tech uppercase text-[10px]">
                      Coordenadas GPS
                    </span>
                    <button
                      type="button"
                      onClick={() => selectAndFocusOccurrence(selectedOccurrence)}
                      className="inline-flex items-center gap-1 font-mono-tech text-[10.5px] bg-zinc-900 text-amber-400 px-2 py-0.5 rounded hover:bg-zinc-800 transition"
                      title="Centralizar no pino"
                    >
                      <Navigation className="w-3 h-3" />
                      {selectedOccurrence.lat.toFixed(4)}, {selectedOccurrence.lng.toFixed(4)}
                    </button>
                  </div>
                </div>
              </div>

              {/* Rodapé do drawer com ações */}
              <div className="p-4 border-t border-zinc-100 bg-zinc-50/60 flex items-center gap-2 shrink-0">
                {currentUser &&
                  selectedOccurrence.authorId === currentUser.uid &&
                  !selectedOccurrence.id?.startsWith('demo-') && (
                    <>
                      <button
                        onClick={() => openEditModal(selectedOccurrence)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-950 bg-amber-400 hover:bg-amber-300 px-3 py-2.5 rounded-xl transition"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Editar
                      </button>
                      <button
                        onClick={() => confirmDelete(selectedOccurrence)}
                        className="inline-flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-600 bg-red-50 hover:bg-red-100 px-3.5 py-2.5 rounded-xl transition border border-red-200/60"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Excluir
                      </button>
                    </>
                  )}
                <button
                  onClick={() => setSelectedOccurrenceId(null)}
                  className="flex-1 text-xs font-semibold text-zinc-600 hover:text-zinc-900 px-3 py-2.5 rounded-xl hover:bg-zinc-200/60 transition border border-zinc-200 bg-white"
                >
                  Fechar
                </button>
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
            <div className="modal-backdrop-enter absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-none"></div>
            <div className="modal-content-enter relative bg-white rounded-2xl shadow-xl border border-zinc-200 p-6 max-w-sm w-full">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="font-display text-[16px] font-bold text-zinc-900 text-center mb-1">
                Excluir Ocorrência
              </h3>
              <p className="text-sm text-zinc-500 text-center mb-5">
                Tem certeza que deseja excluir <strong>"{deleteTarget.title}"</strong>? Esta ação não
                pode ser desfeita.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 text-sm font-medium text-zinc-600 hover:text-zinc-900 px-4 py-2.5 rounded-xl hover:bg-zinc-100 transition border border-zinc-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={deleteOccurrence}
                  disabled={deleting}
                  className="flex-1 text-sm font-semibold bg-red-600 text-white px-4 py-2.5 rounded-xl hover:bg-red-700 transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
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
            <div className="modal-backdrop-enter absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-none"></div>
            <div className="modal-content-enter relative bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400"></div>
              <div className="p-6">
                {/* Header do modal */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-zinc-900 rounded-xl flex items-center justify-center">
                      <Pencil className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="font-display text-[16px] font-bold text-zinc-900">
                        Editar Ocorrência
                      </h3>
                      <p className="text-[12px] text-zinc-500">
                        Atualize as informações e localização
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={closeEditModal}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition"
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
                    <label className="block text-[13px] font-semibold text-zinc-700 mb-1.5">
                      Título <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={editForm.title}
                      onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                      type="text"
                      maxLength={150}
                      placeholder="Ex: Buraco perigoso na via"
                      className="w-full px-3.5 py-2.5 text-sm border border-zinc-200 rounded-xl placeholder:text-zinc-400 focus:border-amber-500 outline-none transition"
                    />
                  </div>

                  {/* Tipo */}
                  <div>
                    <label className="block text-[13px] font-semibold text-zinc-700 mb-1.5">
                      Tipo de Problema
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(occurrenceTypes).map(([key, label]) => {
                        const EditTypeIcon = typeIcons[key] || AlertTriangle;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setEditForm((f) => ({ ...f, type: key }))}
                            className={`text-[13px] font-medium px-3 py-2 rounded-xl border transition text-left flex items-center gap-2 ${
                              editForm.type === key
                                ? 'bg-zinc-900 border-zinc-900 text-amber-400 font-semibold'
                                : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50'
                            }`}
                          >
                            <EditTypeIcon className="w-4 h-4 shrink-0" />
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Endereço com Autocomplete */}
                  <div>
                    <label className="block text-[13px] font-semibold text-zinc-700 mb-1.5">
                      Endereço <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <MapPin
                        className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${
                          editCoords ? 'text-emerald-500' : 'text-zinc-400'
                        }`}
                      />
                      <input
                        value={editForm.address}
                        onChange={(e) => onEditAddressChange(e.target.value)}
                        onFocus={() => setShowEditSuggestions(editAddressSuggestions.length > 0)}
                        type="text"
                        placeholder="Ex: Av. Antônio Carlos Comitre, 540 - Parque Campolim, Sorocaba"
                        className="w-full pl-9 pr-4 py-2.5 text-sm border border-zinc-200 rounded-xl placeholder:text-zinc-400 focus:border-amber-500 outline-none transition"
                      />
                      {loadingEditAddress && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <span className="w-3.5 h-3.5 border-2 border-amber-200 border-t-amber-500 rounded-full animate-spin block"></span>
                        </div>
                      )}
                      {showEditSuggestions && editAddressSuggestions.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-zinc-200 rounded-xl shadow-lg overflow-hidden z-50">
                          <ul className="divide-y divide-zinc-100">
                            {editAddressSuggestions.map((s) => (
                              <li
                                key={s.place_id}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  selectEditSuggestion(s);
                                }}
                                className="flex items-start gap-2.5 px-3 py-2.5 cursor-pointer hover:bg-amber-50 transition-colors text-sm"
                              >
                                <MapPin className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-zinc-800 text-[13px] font-medium truncate">
                                    {s.display_name.split(',')[0]}
                                  </p>
                                  <p className="text-zinc-400 text-[11px] truncate">
                                    {s.display_name.split(',').slice(1).join(',').trim()}
                                  </p>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bairro */}
                  <div>
                    <label className="block text-[13px] font-semibold text-zinc-700 mb-1.5">
                      Bairro
                    </label>
                    <input
                      value={editForm.neighborhood}
                      onChange={(e) => setEditForm((f) => ({ ...f, neighborhood: e.target.value }))}
                      type="text"
                      placeholder="Ex: Parque Campolim"
                      className="w-full px-3.5 py-2.5 text-sm border border-zinc-200 rounded-xl placeholder:text-zinc-400 focus:border-amber-500 outline-none transition"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-[13px] font-semibold text-zinc-700 mb-1.5">
                      Status
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(statusOptions).map(([key, label]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setEditForm((f) => ({ ...f, status: key }))}
                          className={`text-[12px] font-semibold px-3 py-2 rounded-xl border transition text-center ${
                            editForm.status === key
                              ? statusActiveClass[key]
                              : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Descrição */}
                  <div>
                    <label className="block text-[13px] font-semibold text-zinc-700 mb-1.5">
                      Descrição <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                      rows={4}
                      maxLength={1000}
                      placeholder="Descreva o problema com o máximo de detalhes possível..."
                      className="w-full px-3.5 py-2.5 text-sm border border-zinc-200 rounded-xl placeholder:text-zinc-400 focus:border-amber-500 outline-none transition resize-none"
                    ></textarea>
                    <p className="text-[11px] font-mono-tech text-zinc-400 mt-1 text-right">
                      {editForm.description.length}/1000
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 mt-5 pt-4 border-t border-zinc-100">
                  <button
                    onClick={closeEditModal}
                    className="flex-1 text-sm font-semibold text-zinc-600 hover:text-zinc-900 px-4 py-2.5 rounded-xl hover:bg-zinc-100 transition border border-zinc-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={saveEdit}
                    disabled={saving}
                    className="flex-1 text-sm font-bold bg-amber-500 text-zinc-950 px-4 py-2.5 rounded-xl hover:bg-amber-400 transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving && (
                      <span className="w-4 h-4 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin"></span>
                    )}
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
