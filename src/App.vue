<template>
  <div class="min-h-screen bg-neutral-50 flex flex-col font-sans">
    <header class="bg-white border-b border-neutral-200 sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16 relative">
          
          <div class="flex items-center">
            <router-link to="/" class="flex items-center gap-2">
              <MapPin class="text-blue-600 w-6 h-6" />
              <span class="font-bold text-xl tracking-tight text-neutral-900">Alerta rua</span>
            </router-link>
          </div>
          
          <nav class="hidden md:flex flex-1 justify-center items-center gap-6">
            <router-link to="/" class="text-neutral-600 hover:text-blue-600 font-medium">Início</router-link>
            <router-link to="/instructions" class="text-neutral-600 hover:text-blue-600 font-medium">Como Funciona</router-link>
          </nav>

          <div class="flex items-center gap-4">
            <div v-if="user" class="flex items-center gap-4">
              <router-link to="/report" class="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition">
                <PlusCircle class="w-4 h-4" />
                <span>Reportar</span>
              </router-link>
              <button 
                @click="logout"
                class="text-neutral-500 hover:text-neutral-900 transition flex items-center gap-2"
              >
                <span class="hidden sm:inline text-sm">Sair</span>
                <LogOut class="w-5 h-5" />
              </button>
            </div>
            <div v-else class="flex items-center gap-3">
              <router-link to="/login" class="text-blue-600 font-medium hover:text-blue-700">Entrar</router-link>
              <router-link to="/register" class="bg-neutral-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-neutral-800 transition">Cadastrar</router-link>
            </div>
          </div>

        </div>
      </div>
    </header>

    <main class="flex-1 w-full max-w-7xl mx-auto">
      <div v-if="errorMsg" class="bg-white p-8 rounded-2xl shadow-sm border border-neutral-200 text-center m-8 max-w-md mx-auto">
        <AlertCircle class="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h1 class="text-xl font-bold text-neutral-900 mb-2">Erro de Configuração</h1>
        <p class="text-neutral-600 mb-6 text-sm">{{ errorMsg }}</p>
      </div>
      <router-view v-else :user="user"></router-view>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { auth } from './lib/firebase';
import { MapPin, LogOut, PlusCircle, AlertCircle } from 'lucide-vue-next';

const user = ref<User | null>(null);
const loading = ref(true);
const errorMsg = ref('');

const router = useRouter();

onMounted(() => {
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  if (!googleMapsApiKey || googleMapsApiKey === 'AIzaSy...') {
    errorMsg.value = 'A chave da API do Google Maps está ausente ou inválida. Configure a variável VITE_GOOGLE_MAPS_API_KEY no painel de Segredos.';
  }

  onAuthStateChanged(auth, (u) => {
    user.value = u;
    loading.value = false;
  });
});

const logout = async () => {
  await signOut(auth);
  router.push('/');
}
</script>
