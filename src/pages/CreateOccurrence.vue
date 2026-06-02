<template>
  <!-- Acesso restrito -->
  <div v-if="!user" class="flex justify-center items-center min-h-[60vh] p-4 bg-[#fafafa]">
    <div class="bg-white rounded-2xl border border-neutral-100 shadow-sm p-10 text-center max-w-sm w-full">
      <div class="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-5">
        <Lock class="w-6 h-6 text-blue-600" />
      </div>
      <h2 class="text-lg font-semibold text-neutral-900 mb-1">Acesso Restrito</h2>
      <p class="text-sm text-neutral-500 mb-6">Você precisa estar logado para reportar uma ocorrência.</p>
      <button
        @click="$router.push('/login')"
        class="bg-blue-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-blue-700 transition shadow-sm"
      >
        Fazer Login
      </button>
    </div>
  </div>

  <!-- Formulário -->
  <div v-else class="min-h-[calc(100vh-60px)] bg-[#fafafa] py-10 px-4">
    <div class="max-w-xl mx-auto">

      <!-- Sucesso -->
      <div v-if="success" class="bg-white rounded-2xl border border-neutral-100 shadow-sm p-10 text-center">
        <div class="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle class="w-7 h-7 text-emerald-500" />
        </div>
        <h2 class="text-xl font-semibold text-neutral-900 mb-1">Ocorrência registrada!</h2>
        <p class="text-sm text-neutral-500 mb-6">Sua ocorrência foi salva e já aparece no mapa.</p>
        <div class="flex items-center justify-center gap-3">
          <router-link
            to="/"
            class="bg-blue-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-blue-700 transition shadow-sm"
          >
            Ver no Mapa
          </router-link>
          <button
            @click="resetForm"
            class="text-sm font-medium text-neutral-600 hover:text-neutral-900 px-5 py-2.5 rounded-lg hover:bg-neutral-100 transition"
          >
            Reportar outra
          </button>
        </div>
      </div>

      <!-- Header -->
      <template v-else>
        <div class="mb-7">
          <h1 class="text-2xl font-semibold text-neutral-900 tracking-tight">Reportar Ocorrência</h1>
          <p class="text-sm text-neutral-500 mt-1">Ajude a melhorar a cidade descrevendo o problema encontrado.</p>
        </div>

        <!-- Erro -->
        <div v-if="error" class="mb-5 p-3 bg-red-50 text-red-600 text-[13px] rounded-lg flex items-center gap-2 border border-red-100">
          <AlertCircle class="w-4 h-4 shrink-0" />
          {{ error }}
        </div>

        <!-- Card do form -->
        <div class="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6 space-y-5">

          <!-- Título -->
          <div>
            <label for="title" class="block text-[13px] font-medium text-neutral-700 mb-1.5">
              Título <span class="text-red-400">*</span>
            </label>
            <input
              id="title"
              v-model="title"
              type="text"
              placeholder="Ex: Buraco perigoso na via"
              maxlength="150"
              required
              class="w-full px-3.5 py-2.5 text-sm border border-neutral-200 rounded-lg placeholder:text-neutral-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-50 outline-none transition"
            />
          </div>

          <!-- Tipo -->
          <div>
            <label for="type" class="block text-[13px] font-medium text-neutral-700 mb-1.5">
              Tipo de Problema <span class="text-red-400">*</span>
            </label>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="(label, key) in occurrenceTypes"
                :key="key"
                type="button"
                @click="type = key"
                :class="[
                  'text-[13px] font-medium px-3 py-2.5 rounded-lg border transition text-left flex items-center gap-2',
                  type === key
                    ? 'bg-blue-50 border-blue-400 text-blue-700'
                    : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50'
                ]"
              >
                <span>{{ typeIcons[key] }}</span>
                {{ label }}
              </button>
            </div>
          </div>

          <!-- Endereço com Autocomplete -->
          <div>
            <label for="address" class="block text-[13px] font-medium text-neutral-700 mb-1.5">
              Endereço <span class="text-red-400">*</span>
            </label>
            <div class="relative" ref="addressWrapperRef">
              <MapPin class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none z-10" />
              <input
                id="address"
                v-model="address"
                type="text"
                autocomplete="off"
                placeholder="Ex: Av. Paulista, 1578 - Bela Vista, São Paulo"
                @input="onAddressInput"
                @focus="showSuggestions = addressSuggestions.length > 0"
                @keydown.down.prevent="moveSuggestion(1)"
                @keydown.up.prevent="moveSuggestion(-1)"
                @keydown.enter.prevent="selectSuggestion(activeSuggestionIndex)"
                @keydown.escape="showSuggestions = false"
                class="w-full pl-9 pr-4 py-2.5 text-sm border border-neutral-200 rounded-lg placeholder:text-neutral-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-50 outline-none transition"
              />

              <!-- Indicador de carregamento -->
              <div v-if="loadingAddress" class="absolute right-3 top-1/2 -translate-y-1/2">
                <span class="w-3.5 h-3.5 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin block"></span>
              </div>

              <!-- Dropdown de sugestões -->
              <div
                v-if="showSuggestions && addressSuggestions.length > 0"
                class="absolute left-0 right-0 top-full mt-1 bg-white border border-neutral-200 rounded-xl shadow-lg overflow-hidden z-50"
              >
                <ul role="listbox" class="divide-y divide-neutral-50">
                  <li
                    v-for="(suggestion, idx) in addressSuggestions"
                    :key="suggestion.place_id"
                    role="option"
                    :aria-selected="idx === activeSuggestionIndex"
                    @mousedown.prevent="selectSuggestion(idx)"
                    @mouseover="activeSuggestionIndex = idx"
                    :class="[
                      'flex items-start gap-2.5 px-3 py-2.5 cursor-pointer transition-colors text-sm',
                      idx === activeSuggestionIndex ? 'bg-blue-50' : 'hover:bg-neutral-50'
                    ]"
                  >
                    <MapPin class="w-3.5 h-3.5 text-neutral-400 mt-0.5 shrink-0" />
                    <div class="min-w-0">
                      <p class="text-neutral-800 text-[13px] font-medium truncate">{{ suggestion.display_name.split(',')[0] }}</p>
                      <p class="text-neutral-400 text-[11px] truncate">{{ suggestion.display_name.split(',').slice(1).join(',').trim() }}</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
            <p class="text-[11px] text-neutral-400 mt-1.5 flex items-center gap-1">
              <span class="inline-block w-1.5 h-1.5 rounded-full bg-neutral-300"></span>
              Comece a digitar para ver sugestões de endereços
            </p>
          </div>

          <!-- Bairro -->
          <div>
            <label for="neighborhood" class="block text-[13px] font-medium text-neutral-700 mb-1.5">Bairro</label>
            <input
              id="neighborhood"
              v-model="neighborhood"
              type="text"
              placeholder="Ex: Bela Vista"
              class="w-full px-3.5 py-2.5 text-sm border border-neutral-200 rounded-lg placeholder:text-neutral-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-50 outline-none transition"
            />
          </div>

          <!-- Descrição -->
          <div>
            <label for="description" class="block text-[13px] font-medium text-neutral-700 mb-1.5">
              Descrição <span class="text-red-400">*</span>
            </label>
            <textarea
              id="description"
              v-model="description"
              placeholder="Descreva o problema com o máximo de detalhes possível..."
              rows="4"
              maxlength="1000"
              class="w-full px-3.5 py-2.5 text-sm border border-neutral-200 rounded-lg placeholder:text-neutral-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-50 outline-none transition resize-none"
            ></textarea>
            <p class="text-[11px] text-neutral-400 mt-1 text-right">{{ description.length }}/1000</p>
          </div>

          <!-- Divider -->
          <div class="border-t border-neutral-100 pt-4 flex justify-end gap-3">
            <button
              type="button"
              @click="$router.push('/')"
              class="text-sm font-medium text-neutral-600 hover:text-neutral-900 px-4 py-2.5 rounded-lg hover:bg-neutral-100 transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              :disabled="loading"
              @click="handleSubmit"
              class="text-sm font-medium bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 active:scale-[0.98] transition shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              <span v-if="loading" class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
              {{ loading ? 'Salvando...' : 'Enviar Ocorrência' }}
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { MapPin, AlertCircle, Lock, CheckCircle } from 'lucide-vue-next';
import { occurrenceTypes } from '../lib/types';
import { getMockUser, type MockUser } from '../lib/mockAuth';

const props = defineProps<{ user: MockUser | null }>();
const router = useRouter();

// Ícones por tipo
const typeIcons: Record<string, string> = {
  pothole: '🕳️',
  light_out: '💡',
  trash: '🗑️',
  water_leak: '💧',
  other: '⚠️',
};

const MOCK_OCCURRENCES_KEY = 'alerta_rua_occurrences';

const title = ref('');
const description = ref('');
const type = ref('pothole');
const address = ref('');
const neighborhood = ref('');
const loading = ref(false);
const error = ref('');
const success = ref(false);

// ── Autocomplete de endereço (Nominatim / OSM) ────────────────────
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

const addressWrapperRef = ref<HTMLElement | null>(null);
const addressSuggestions = ref<NominatimResult[]>([]);
const showSuggestions = ref(false);
const loadingAddress = ref(false);
const activeSuggestionIndex = ref(-1);
const selectedCoords = ref<{ lat: number; lng: number } | null>(null);

let searchTimer: ReturnType<typeof setTimeout> | null = null;

const onAddressInput = () => {
  selectedCoords.value = null; // Limpa coords ao editar manualmente
  const q = address.value.trim();

  if (searchTimer) clearTimeout(searchTimer);

  if (q.length < 3) {
    addressSuggestions.value = [];
    showSuggestions.value = false;
    return;
  }

  loadingAddress.value = true;
  searchTimer = setTimeout(async () => {
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
        addressSuggestions.value = data;
        showSuggestions.value = data.length > 0;
        activeSuggestionIndex.value = -1;
      }
    } catch (e) {
      console.warn('Autocomplete indisponível:', e);
    } finally {
      loadingAddress.value = false;
    }
  }, 400);
};

const selectSuggestion = (idx: number) => {
  const s = addressSuggestions.value[idx >= 0 ? idx : 0];
  if (!s) return;

  address.value = s.display_name;
  selectedCoords.value = { lat: parseFloat(s.lat), lng: parseFloat(s.lon) };

  // Tenta preencher bairro automaticamente
  const addr = s.address;
  if (addr) {
    const bairro = addr.suburb || addr.neighbourhood || addr.city_district || addr.quarter || '';
    if (bairro && !neighborhood.value) {
      neighborhood.value = bairro;
    }
  }

  showSuggestions.value = false;
  addressSuggestions.value = [];
};

const moveSuggestion = (dir: 1 | -1) => {
  const max = addressSuggestions.value.length - 1;
  activeSuggestionIndex.value = Math.max(0, Math.min(max, activeSuggestionIndex.value + dir));
};

// Fecha sugestões ao clicar fora
const handleOutsideClick = (e: MouseEvent) => {
  if (addressWrapperRef.value && !addressWrapperRef.value.contains(e.target as Node)) {
    showSuggestions.value = false;
  }
};

onMounted(() => document.addEventListener('mousedown', handleOutsideClick));
onBeforeUnmount(() => document.removeEventListener('mousedown', handleOutsideClick));

const resetForm = () => {
  title.value = '';
  description.value = '';
  type.value = 'pothole';
  address.value = '';
  neighborhood.value = '';
  error.value = '';
  success.value = false;
  addressSuggestions.value = [];
  selectedCoords.value = null;
};

// Coordenadas demo por bairro — fallback para centro de SP
const BAIRRO_COORDS: Record<string, { lat: number; lng: number }> = {
  'bela vista':    { lat: -23.5613, lng: -46.6433 },
  'consolação':    { lat: -23.5517, lng: -46.6601 },
  'jardins':       { lat: -23.5697, lng: -46.6500 },
  'pinheiros':     { lat: -23.5629, lng: -46.6890 },
  'ibirapuera':    { lat: -23.5874, lng: -46.6576 },
  'mooca':         { lat: -23.5524, lng: -46.5932 },
  'vila madalena': { lat: -23.5522, lng: -46.6908 },
  'centro':        { lat: -23.5505, lng: -46.6333 },
};

const getCoords = () => {
  // Prioridade: coords selecionadas via autocomplete
  if (selectedCoords.value) return selectedCoords.value;
  // Fallback: bairro digitado manualmente
  const key = neighborhood.value.trim().toLowerCase();
  return BAIRRO_COORDS[key] ?? { lat: -23.55052, lng: -46.633308 };
};

const handleSubmit = async () => {
  error.value = '';

  if (!title.value.trim()) { error.value = 'Informe um título para a ocorrência.'; return; }
  if (!description.value.trim()) { error.value = 'Informe uma descrição.'; return; }
  if (!address.value.trim()) { error.value = 'Informe o endereço.'; return; }

  const user = props.user ?? getMockUser();
  if (!user) { router.push('/login'); return; }

  loading.value = true;
  await new Promise(r => setTimeout(r, 700));

  const coords = getCoords();
  const occurrence = {
    id: `local-${Date.now()}`,
    title: title.value.trim(),
    description: description.value.trim(),
    type: type.value,
    status: 'open',
    lat: coords.lat,
    lng: coords.lng,
    address: address.value.trim(),
    neighborhood: neighborhood.value.trim() || 'Não informado',
    authorId: user.uid,
    authorName: user.displayName,
    createdAt: { seconds: Math.floor(Date.now() / 1000), toMillis: () => Date.now() },
    updatedAt: { seconds: Math.floor(Date.now() / 1000), toMillis: () => Date.now() },
  };

  try {
    const existing = JSON.parse(localStorage.getItem(MOCK_OCCURRENCES_KEY) || '[]');
    existing.unshift(occurrence);
    localStorage.setItem(MOCK_OCCURRENCES_KEY, JSON.stringify(existing));
    success.value = true;
  } catch {
    error.value = 'Não foi possível salvar a ocorrência. Tente novamente.';
  } finally {
    loading.value = false;
  }
};
</script>
