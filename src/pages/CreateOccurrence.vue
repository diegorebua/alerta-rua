<template>
  <div v-if="!user" class="flex justify-center items-center h-[50vh]">
    <div class="text-center space-y-4">
      <AlertCircle class="w-12 h-12 text-blue-600 mx-auto" />
      <h2 class="text-2xl font-bold">Acesso Restrito</h2>
      <p class="text-neutral-500">Você precisa estar logado para reportar uma ocorrência.</p>
      <button @click="$router.push('/login')" class="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium">Fazer Login</button>
    </div>
  </div>

  <div v-else class="max-w-2xl mx-auto py-12 px-4">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-neutral-900 tracking-tight">Reportar Ocorrência</h1>
      <p class="text-neutral-500 mt-2">Ajude a melhorar a cidade reportando problemas estruturais ou de zeladoria.</p>
    </div>

    <div v-if="error" class="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-3">
      <AlertCircle class="w-5 h-5 mt-0.5 shrink-0" />
      <p class="text-sm font-medium">{{ error }}</p>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-6 bg-white p-6 md:p-8 rounded-2xl border border-neutral-200 shadow-sm">
      
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-semibold text-neutral-900 mb-1">Título</label>
          <input 
            type="text"
            v-model="title"
            placeholder="Ex: Buraco perigoso na via"
            maxlength="150"
            class="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
          />
        </div>

        <div>
          <label class="block text-sm font-semibold text-neutral-900 mb-1">Tipo de Problema</label>
          <select 
            v-model="type"
            class="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none transition bg-white"
          >
            <option v-for="(label, key) in occurrenceTypes" :key="key" :value="key">{{ label }}</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-semibold text-neutral-900 mb-1">Localização Exata</label>
          <p class="text-xs text-neutral-500 mb-2">Digite o endereço ou nome do estabelecimento para buscar.</p>
          <PlaceAutocomplete 
            @placeSelect="handlePlaceSelect" 
            placeholder="Buscar endereço..."
            className="border-neutral-300 rounded-lg"
          />
          <div v-if="location" class="mt-3 bg-neutral-50 p-3 rounded-lg border border-neutral-200 flex items-start gap-2">
            <MapPin class="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div class="text-sm">
              <p class="font-medium text-neutral-900">{{ location.address }}</p>
              <p class="text-neutral-500">Bairro: {{ location.neighborhood }}</p>
            </div>
          </div>
        </div>

        <div>
          <label class="block text-sm font-semibold text-neutral-900 mb-1">Descrição Detalhada</label>
          <textarea 
            v-model="description"
            placeholder="Descreva o problema com o máximo de detalhes possível..."
            rows="4"
            maxlength="1000"
            class="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition resize-none"
          ></textarea>
        </div>
      </div>

      <div class="pt-4 border-t border-neutral-100 flex justify-end gap-3">
        <button 
          type="button" 
          @click="$router.push('/')"
          class="px-5 py-2.5 text-neutral-600 font-medium hover:bg-neutral-100 rounded-lg transition"
        >
          Cancelar
        </button>
        <button 
          type="submit" 
          :disabled="loading"
          class="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
        >
          {{ loading ? 'Salvando...' : 'Enviar Ocorrência' }}
        </button>
      </div>

    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps } from 'vue';
import { useRouter } from 'vue-router';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { occurrenceTypes } from '../lib/types';
import PlaceAutocomplete from '../components/PlaceAutocomplete.vue';
import { MapPin, AlertCircle } from 'lucide-vue-next';

const props = defineProps<{
  user: User | null;
}>();

const router = useRouter();
const loading = ref(false);
const error = ref('');

const title = ref('');
const description = ref('');
const type = ref('pothole');
const location = ref<{lat: number, lng: number, address: string, neighborhood: string} | null>(null);

const handlePlaceSelect = (place: google.maps.places.PlaceResult | null) => {
  if (place && place.geometry?.location) {
    let neighborhood = 'Desconhecido';
    place.address_components?.forEach(comp => {
      if (comp.types.includes('sublocality') || comp.types.includes('neighborhood')) {
        neighborhood = comp.long_name;
      }
    });

    location.value = {
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
      address: place.formatted_address || place.name || '',
      neighborhood
    };
  } else {
    location.value = null;
  }
};

const handleSubmit = async () => {
  if (!title.value || !description.value || !type.value || !location.value) {
    error.value = 'Por favor, preencha todos os campos e selecione um local válido no mapa.';
    return;
  }

  if (!props.user) return;
  
  loading.value = true;
  error.value = '';

  try {
    const newDocRef = doc(collection(db, 'occurrences'));
    await setDoc(newDocRef, {
      title: title.value,
      description: description.value,
      type: type.value,
      status: 'open',
      lat: location.value.lat,
      lng: location.value.lng,
      address: location.value.address,
      neighborhood: location.value.neighborhood,
      authorId: props.user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    router.push('/');
  } catch (err) {
    error.value = 'Ocorreu um erro ao salvar sua ocorrência. Tente novamente.';
    handleFirestoreError(err, OperationType.WRITE, 'occurrences');
  } finally {
    loading.value = false;
  }
};
</script>
