<template>
  <div class="min-h-screen bg-[#fafafa] flex flex-col">
    <header class="bg-white/80 backdrop-blur-md border-b border-neutral-100 sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-15" style="height: 60px;">

          <!-- Logo -->
          <router-link to="/" class="flex items-center gap-2 group">
            <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm group-hover:bg-blue-700 transition">
              <MapPin class="text-white w-4 h-4" />
            </div>
            <span class="font-semibold text-[15px] tracking-tight text-neutral-900">Alerta Rua</span>
          </router-link>

          <!-- Nav central -->
          <nav class="hidden md:flex items-center gap-1">
            <router-link
              to="/"
              class="text-sm font-medium text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 px-3 py-1.5 rounded-lg transition"
              active-class="text-neutral-900 bg-neutral-100"
            >Início</router-link>
            <router-link
              to="/instructions"
              class="text-sm font-medium text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 px-3 py-1.5 rounded-lg transition"
              active-class="text-neutral-900 bg-neutral-100"
            >Como Funciona</router-link>
          </nav>

          <!-- Ações -->
          <div class="flex items-center gap-3">
            <template v-if="user">
              <!-- Avatar -->
              <div class="flex items-center gap-2.5">
                <img
                  v-if="user.photoURL"
                  :src="user.photoURL"
                  :alt="user.displayName"
                  class="w-7 h-7 rounded-full ring-2 ring-white shadow-sm"
                />
                <div v-else class="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold ring-2 ring-white shadow-sm">
                  {{ user.displayName?.charAt(0).toUpperCase() }}
                </div>
                <span class="hidden sm:inline text-sm font-medium text-neutral-700">{{ user.displayName }}</span>
              </div>

              <router-link
                to="/report"
                class="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-medium px-3.5 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm"
              >
                <PlusCircle class="w-3.5 h-3.5" />
                <span>Reportar</span>
              </router-link>

              <button
                @click="logout"
                class="text-neutral-400 hover:text-neutral-700 transition p-1.5 rounded-lg hover:bg-neutral-100"
                title="Sair"
              >
                <LogOut class="w-4 h-4" />
              </button>
            </template>

            <template v-else>
              <router-link to="/login" class="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition px-3 py-1.5 rounded-lg hover:bg-neutral-100">
                Entrar
              </router-link>
              <router-link to="/register" class="text-sm font-medium bg-neutral-900 text-white px-3.5 py-2 rounded-lg hover:bg-neutral-800 transition shadow-sm">
                Cadastrar
              </router-link>
            </template>
          </div>

        </div>
      </div>
    </header>

    <main class="flex-1 w-full max-w-7xl mx-auto">
      <router-view :user="user"></router-view>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { MapPin, LogOut, PlusCircle } from 'lucide-vue-next';
import { getMockUser, mockLogout, type MockUser } from './lib/mockAuth';

const user = ref<MockUser | null>(null);
const router = useRouter();
const route = useRoute();

const syncUser = () => {
  user.value = getMockUser();
};

onMounted(syncUser);

// Re-lê o usuário sempre que a rota mudar (ex: após login)
watch(() => route.path, syncUser);

const logout = () => {
  mockLogout();
  user.value = null;
  router.push('/');
};
</script>
