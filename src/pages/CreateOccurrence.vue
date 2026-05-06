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
              class="w-full px-3.5 py-2.5 text-sm border border-neutral-200 rounded-lg placeholder:text-neutral-400 focus:border-blue-400 transition"
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

          <!-- Endereço -->
          <div>
            <label for="address" class="block text-[13px] font-medium text-neutral-700 mb-1.5">
              Endereço <span class="text-red-400">*</span>
            </label>
            <div class="relative">
              <MapPin class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                id="address"
                v-model="address"
                type="text"
                placeholder="Ex: Av. Paulista, 1578 - Bela Vista, São Paulo"
                class="w-full pl-9 pr-4 py-2.5 text-sm border border-neutral-200 rounded-lg placeholder:text-neutral-400 focus:border-blue-400 transition"
              />
            </div>
          </div>

          <!-- Bairro -->
          <div>
            <label for="neighborhood" class="block text-[13px] font-medium text-neutral-700 mb-1.5">Bairro</label>
            <input
              id="neighborhood"
              v-model="neighborhood"
              type="text"
              placeholder="Ex: Bela Vista"
              class="w-full px-3.5 py-2.5 text-sm border border-neutral-200 rounded-lg placeholder:text-neutral-400 focus:border-blue-400 transition"
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
              class="w-full px-3.5 py-2.5 text-sm border border-neutral-200 rounded-lg placeholder:text-neutral-400 focus:border-blue-400 transition resize-none"
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
import { ref } from 'vue';
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

const resetForm = () => {
  title.value = '';
  description.value = '';
  type.value = 'pothole';
  address.value = '';
  neighborhood.value = '';
  error.value = '';
  success.value = false;
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
