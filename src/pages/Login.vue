<template>
  <div class="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
    <div class="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-neutral-200 text-center">
      <div class="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
        <LogIn class="w-6 h-6" />
      </div>
      
      <h1 class="text-2xl font-bold text-neutral-900 mb-2">Bem-vindo de volta</h1>
      <p class="text-neutral-500 mb-8 text-sm">Faça login para reportar e acompanhar ocorrências na sua cidade.</p>

      <div v-if="error" class="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center justify-center gap-2 border border-red-100">
        <AlertCircle class="w-4 h-4" />
        {{ error }}
      </div>

      <button 
        @click="handleGoogleLogin"
        :disabled="loading"
        class="w-full bg-white border border-neutral-300 text-neutral-700 py-3 rounded-xl font-medium hover:bg-neutral-50 transition flex items-center justify-center gap-3 disabled:opacity-50"
      >
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google Logo" class="w-5 h-5" />
        <span>{{ loading ? 'Aguarde...' : 'Entrar com Google' }}</span>
      </button>

      <p class="mt-8 text-sm text-neutral-500">
        Não tem uma conta? <router-link to="/register" class="text-blue-600 font-medium hover:underline">Cadastre-se</router-link>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { LogIn, AlertCircle } from 'lucide-vue-next';

const router = useRouter();
const error = ref('');
const loading = ref(false);

const handleGoogleLogin = async () => {
  loading.value = true;
  try {
    await signInWithPopup(auth, googleProvider);
    router.push('/');
  } catch (err: any) {
    if (err.code === 'auth/popup-closed-by-user') {
      error.value = 'Login cancelado pelo usuário.';
    } else {
      error.value = 'Ocorreu um erro ao fazer login. Tente novamente.';
      console.error(err);
    }
  } finally {
    loading.value = false;
  }
};
</script>
