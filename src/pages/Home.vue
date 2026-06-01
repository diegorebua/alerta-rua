<template>
  <div class="flex flex-col md:flex-row h-[calc(100vh-60px)] w-full overflow-hidden">

    <!-- ── Sidebar ──────────────────────────────────── -->
    <div class="w-full md:w-[380px] flex flex-col bg-white border-r border-neutral-100 z-10">

      <!-- Cabeçalho -->
      <div class="px-5 py-4 border-b border-neutral-100">
        <div class="flex items-center justify-between mb-3">
          <div>
            <h2 class="font-semibold text-[15px] text-neutral-900">Ocorrências</h2>
            <p class="text-xs text-neutral-400 mt-0.5">{{ filteredOccurrences.length }} registro(s) encontrado(s)</p>
          </div>
          <!-- Legend -->
          <div class="flex items-center gap-2 text-[10px] text-neutral-400">
            <span class="flex items-center gap-1"><span class="status-dot open"></span>Aberta</span>
            <span class="flex items-center gap-1"><span class="status-dot in_progress"></span>Andamento</span>
            <span class="flex items-center gap-1"><span class="status-dot resolved"></span>Resolvida</span>
          </div>
        </div>

        <!-- Busca -->
        <div class="relative">
          <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            v-model="searchQuery"
            @input="handleSearch"
            type="text"
            placeholder="Buscar por título ou endereço..."
            class="w-full pl-9 pr-4 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-lg placeholder:text-neutral-400 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
          />
        </div>
      </div>

      <!-- Lista -->
      <div class="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        <div v-if="filteredOccurrences.length === 0" class="text-center text-neutral-400 py-16 flex flex-col items-center gap-3">
          <div class="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center">
            <MapPin class="w-5 h-5 opacity-40" />
          </div>
          <p class="text-sm">Nenhuma ocorrência encontrada.</p>
        </div>

        <div
          v-for="occ in filteredOccurrences"
          :key="occ.id"
          class="card-hover bg-white border border-neutral-100 rounded-xl p-4 cursor-pointer group relative"
          @click="focusMap(occ.lat, occ.lng)"
        >
          <!-- Botão Excluir — só para o autor da ocorrência -->
          <button
            v-if="currentUser && occ.authorId === currentUser.uid && !occ.id?.startsWith('demo-')"
            @click.stop="confirmDelete(occ)"
            class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-50 text-neutral-300 hover:text-red-500"
            title="Excluir ocorrência"
          >
            <Trash2 class="w-3.5 h-3.5" />
          </button>

          <!-- Título + Badge -->
          <div class="flex justify-between items-start gap-2 mb-2 pr-6">
            <span class="font-medium text-[13.5px] text-neutral-900 leading-snug group-hover:text-blue-600 transition">
              {{ occ.title }}
            </span>
            <span :class="['shrink-0 flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium border', getStatusClass(occ.status)]">
              <span :class="['status-dot', occ.status]"></span>
              {{ getStatusText(occ.status) }}
            </span>
          </div>

          <!-- Descrição -->
          <p class="text-[12.5px] text-neutral-500 line-clamp-2 mb-3 leading-relaxed">{{ occ.description }}</p>

          <!-- Footer -->
          <div class="flex items-center justify-between">
            <span class="inline-flex items-center gap-1 text-[11px] text-neutral-400">
              <MapPin class="w-3 h-3" />
              <span class="truncate max-w-[160px]">{{ occ.address }}</span>
            </span>
            <div class="flex items-center gap-2">
              <span class="text-[10px] bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-md font-medium">
                {{ occurrenceTypes[occ.type] || occ.type }}
              </span>
              <span class="text-[11px] text-neutral-400 flex items-center gap-0.5">
                <Clock class="w-3 h-3" />
                {{ formatDate(occ.createdAt) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Mapa ──────────────────────────────────────── -->
    <div class="flex-1 relative h-full">
      <!-- Mapa Google Maps (quando API key disponível) -->
      <div ref="mapContainer" class="w-full h-full bg-neutral-100" :class="{ hidden: !mapLoaded }"></div>

      <!-- Fallback: OpenStreetMap via iframe quando não há API key -->
      <div v-if="!mapLoaded" class="w-full h-full flex flex-col items-center justify-center bg-neutral-50 relative">
        <iframe
          :src="osmUrl"
          class="w-full h-full border-0"
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
          title="Mapa de ocorrências"
        ></iframe>
        <div class="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm text-[11px] text-neutral-500 px-3 py-1.5 rounded-full shadow-sm border border-neutral-200">
          Mapa via OpenStreetMap
        </div>
      </div>

      <!-- Tooltip de zoom (só quando Google Maps estiver ativo) -->
      <div v-if="mapLoaded" class="absolute top-4 left-4 pointer-events-none">
        <transition name="fade">
          <div
            :key="currentZoom >= 16 ? 'zoomed' : 'far'"
            class="bg-white/90 backdrop-blur-sm text-[11.5px] font-medium px-3 py-1.5 rounded-full shadow-sm text-neutral-600 flex items-center gap-1.5 border border-neutral-100"
          >
            <Info class="w-3.5 h-3.5" :class="currentZoom >= 16 ? 'text-blue-500' : 'text-neutral-400'" />
            {{ currentZoom >= 16 ? 'Visualizando detalhes da área' : 'Aproxime o zoom para ver detalhes' }}
          </div>
        </transition>
      </div>
    </div>

  </div>

  <!-- ── Modal de confirmação de exclusão ─────────────── -->
  <Teleport to="body">
    <div
      v-if="deleteTarget"
      class="fixed inset-0 z-[200] flex items-center justify-center p-4"
      @click.self="deleteTarget = null"
    >
      <div class="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
      <div class="relative bg-white rounded-2xl shadow-xl border border-neutral-100 p-6 max-w-sm w-full">
        <div class="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 class="w-5 h-5 text-red-500" />
        </div>
        <h3 class="text-[15px] font-semibold text-neutral-900 text-center mb-1">Excluir Ocorrência</h3>
        <p class="text-sm text-neutral-500 text-center mb-5">
          Tem certeza que deseja excluir <strong>"{{ deleteTarget?.title }}"</strong>? Esta ação não pode ser desfeita.
        </p>
        <div class="flex gap-3">
          <button
            @click="deleteTarget = null"
            class="flex-1 text-sm font-medium text-neutral-600 hover:text-neutral-900 px-4 py-2.5 rounded-lg hover:bg-neutral-100 transition border border-neutral-200"
          >
            Cancelar
          </button>
          <button
            @click="deleteOccurrence"
            :disabled="deleting"
            class="flex-1 text-sm font-medium bg-red-500 text-white px-4 py-2.5 rounded-lg hover:bg-red-600 transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span v-if="deleting" class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
            {{ deleting ? 'Excluindo...' : 'Excluir' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db, OperationType } from '../lib/firebase';
import { type Occurrence, occurrenceTypes } from '../lib/types';
import { MapPin, Search, Info, Clock, Trash2 } from 'lucide-vue-next';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';
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

const searchQuery = ref('');
const allOccurrences = ref<Occurrence[]>([]);
const filteredOccurrences = ref<Occurrence[]>([]);
const currentZoom = ref(12);
const mapContainer = ref<HTMLElement | null>(null);
const mapLoaded = ref(false);
const deleteTarget = ref<Occurrence | null>(null);
const deleting = ref(false);
const currentUser = ref<MockUser | null>(null);

// URL do OpenStreetMap centralizada em SP como fallback
const osmUrl = computed(() => {
  return `https://www.openstreetmap.org/export/embed.html?bbox=-46.7333%2C-23.6333%2C-46.5333%2C-23.4667&layer=mapnik`;
});

let mapInstance: google.maps.Map | null = null;
let markers: google.maps.Marker[] = [];

const formatDate = (ts: any) => {
  try {
    const ms = ts?.toMillis ? ts.toMillis() : ts?.seconds ? ts.seconds * 1000 : Date.now();
    return formatDistanceToNow(ms, { addSuffix: true, locale: ptBR });
  } catch { return ''; }
};

const handleSearch = () => {
  const q = searchQuery.value.toLowerCase();
  filteredOccurrences.value = !q
    ? allOccurrences.value
    : allOccurrences.value.filter(o =>
        o.title.toLowerCase().includes(q) ||
        o.address.toLowerCase().includes(q) ||
        o.description.toLowerCase().includes(q)
      );
  updateMarkers();
};

const MOCK_OCCURRENCES_KEY = 'alerta_rua_occurrences';

const getLocalOccurrences = (): Occurrence[] => {
  try {
    const raw = localStorage.getItem(MOCK_OCCURRENCES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

const refreshOccurrences = (firestoreData: Occurrence[] = []) => {
  const local = getLocalOccurrences();
  allOccurrences.value = [...local, ...DEMO_OCCURRENCES, ...firestoreData];
  filteredOccurrences.value = [...local, ...DEMO_OCCURRENCES, ...firestoreData];
  updateMarkers();
};

onMounted(async () => {
  currentUser.value = getMockUser();

  // Tenta carregar Google Maps
  try {
    const { setOptions, importLibrary } = await import('@googlemaps/js-api-loader');
    // Tenta primeiro import.meta.env, depois process.env (injetado pelo vite.config)
    const apiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string)
      || (typeof process !== 'undefined' && (process.env as any).VITE_GOOGLE_MAPS_API_KEY)
      || '';

    if (apiKey) {
      setOptions({ key: apiKey, version: 'weekly' });
      const { Map } = await importLibrary('maps') as google.maps.MapsLibrary;
      if (mapContainer.value) {
        mapInstance = new Map(mapContainer.value, {
          center: MAP_DEFAULT_CENTER,
          zoom: 12,
          disableDefaultUI: true,
          zoomControl: true,
          mapId: 'ALERTA_RUA_MAP',
        });
        mapInstance.addListener('zoom_changed', () => {
          currentZoom.value = mapInstance!.getZoom() || 12;
        });
        mapLoaded.value = true;
      }
    } else {
      console.warn('VITE_GOOGLE_MAPS_API_KEY não configurada — usando OpenStreetMap como fallback.');
    }
  } catch (e) {
    console.warn('Google Maps não pôde ser carregado:', e);
  }

  refreshOccurrences();

  try {
    const q = query(collection(db, 'occurrences'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Occurrence));
      refreshOccurrences(data);
    });
    onUnmounted(() => unsubscribe());
  } catch (e) {
    console.warn('Firestore não disponível:', e);
  }
});

watch(filteredOccurrences, () => updateMarkers());

const updateMarkers = () => {
  if (!mapInstance) return;
  markers.forEach(m => m.setMap(null));
  markers = [];
  filteredOccurrences.value.forEach(occ => {
    const color = occ.status === 'open' ? '#ef4444' : occ.status === 'in_progress' ? '#f59e0b' : '#10b981';
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
      }
    });
    markers.push(marker);
  });
};

const focusMap = (lat: number, lng: number) => {
  if (mapInstance) { mapInstance.setCenter({ lat, lng }); mapInstance.setZoom(16); }
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
  const map: Record<string, string> = { open: 'Aberta', in_progress: 'Andamento', resolved: 'Resolvida' };
  return map[status] || status;
};

// ── Exclusão de ocorrências ───────────────────────────────────────
const confirmDelete = (occ: Occurrence) => {
  deleteTarget.value = occ;
};

const deleteOccurrence = async () => {
  if (!deleteTarget.value) return;
  const occ = deleteTarget.value;
  deleting.value = true;

  try {
    if (occ.id?.startsWith('local-')) {
      // Remove do localStorage
      const existing: Occurrence[] = JSON.parse(localStorage.getItem(MOCK_OCCURRENCES_KEY) || '[]');
      const updated = existing.filter(o => o.id !== occ.id);
      localStorage.setItem(MOCK_OCCURRENCES_KEY, JSON.stringify(updated));
      refreshOccurrences();
    } else if (occ.id && !occ.id.startsWith('demo-')) {
      // Remove do Firestore
      await deleteDoc(doc(db, 'occurrences', occ.id));
      // O listener onSnapshot vai atualizar automaticamente
    }
    deleteTarget.value = null;
  } catch (e) {
    console.error('Erro ao excluir ocorrência:', e);
  } finally {
    deleting.value = false;
  }
};
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
