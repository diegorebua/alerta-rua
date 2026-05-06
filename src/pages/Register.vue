<template>
  <div class="min-h-[calc(100vh-60px)] flex items-center justify-center p-4 bg-[#fafafa]">
    <div class="w-full max-w-[400px]">

      <!-- Sucesso -->
      <div v-if="success" class="bg-white rounded-2xl border border-neutral-100 shadow-sm p-8 text-center">
        <div class="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle class="w-6 h-6 text-emerald-500" />
        </div>
        <h1 class="text-xl font-semibold text-neutral-900 mb-1">Conta criada!</h1>
        <p class="text-sm text-neutral-500 mb-6">Bem-vindo(a) ao Alerta Rua, <strong class="text-neutral-700">{{ createdName }}</strong>.</p>
        <router-link
          to="/"
          class="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-blue-700 transition shadow-sm"
        >
          Ir para o início
        </router-link>
      </div>

      <!-- Formulário -->
      <template v-else>
        <div class="bg-white rounded-2xl border border-neutral-100 shadow-sm p-8">

          <!-- Header -->
          <div class="text-center mb-7">
            <div class="w-10 h-10 bg-neutral-900 rounded-xl flex items-center justify-center mx-auto mb-4">
              <UserPlus class="w-5 h-5 text-white" />
            </div>
            <h1 class="text-xl font-semibold text-neutral-900">Criar conta</h1>
            <p class="text-sm text-neutral-500 mt-1">Junte-se à comunidade da cidade.</p>
          </div>

          <!-- Erro -->
          <div v-if="error" class="mb-5 p-3 bg-red-50 text-red-600 text-[13px] rounded-lg flex items-center gap-2 border border-red-100">
            <AlertCircle class="w-4 h-4 shrink-0" />
            {{ error }}
          </div>

          <!-- Google -->
          <button
            @click="handleGoogleRegister"
            :disabled="loading"
            class="w-full bg-white border border-neutral-200 text-neutral-700 text-sm font-medium py-2.5 rounded-lg hover:border-neutral-300 hover:bg-neutral-50 transition flex items-center justify-center gap-2.5 disabled:opacity-50 mb-5 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" class="w-4 h-4" />
            <span>Continuar com Google</span>
          </button>

          <!-- Divisor -->
          <div class="flex items-center gap-3 mb-5">
            <div class="flex-1 h-px bg-neutral-100"></div>
            <span class="text-[11px] text-neutral-400 font-medium">ou</span>
            <div class="flex-1 h-px bg-neutral-100"></div>
          </div>

          <!-- Form -->
          <form @submit.prevent="handleRegister" class="space-y-4">
            <div>
              <label for="name" class="block text-[13px] font-medium text-neutral-700 mb-1.5">Nome completo</label>
              <input id="name" v-model="name" type="text" placeholder="Seu nome"
                autocomplete="name" required
                class="w-full px-3.5 py-2.5 text-sm border border-neutral-200 rounded-lg placeholder:text-neutral-400 focus:border-blue-400 transition" />
            </div>

            <div>
              <label for="email" class="block text-[13px] font-medium text-neutral-700 mb-1.5">Email</label>
              <input id="email" v-model="email" type="email" placeholder="seu@email.com"
                autocomplete="email" required
                class="w-full px-3.5 py-2.5 text-sm border border-neutral-200 rounded-lg placeholder:text-neutral-400 focus:border-blue-400 transition" />
            </div>

            <div>
              <label for="password" class="block text-[13px] font-medium text-neutral-700 mb-1.5">Senha</label>
              <div class="relative">
                <input id="password" v-model="password" :type="showPassword ? 'text' : 'password'"
                  placeholder="Mínimo 6 caracteres" autocomplete="new-password" required
                  class="w-full px-3.5 py-2.5 text-sm border border-neutral-200 rounded-lg placeholder:text-neutral-400 focus:border-blue-400 transition pr-10" />
                <button type="button" @click="showPassword = !showPassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition">
                  <Eye v-if="!showPassword" class="w-4 h-4" /><EyeOff v-else class="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label for="confirm" class="block text-[13px] font-medium text-neutral-700 mb-1.5">Confirmar senha</label>
              <div class="relative">
                <input id="confirm" v-model="confirm" :type="showConfirm ? 'text' : 'password'"
                  placeholder="Repita a senha" autocomplete="new-password" required
                  class="w-full px-3.5 py-2.5 text-sm border border-neutral-200 rounded-lg placeholder:text-neutral-400 focus:border-blue-400 transition pr-10" />
                <button type="button" @click="showConfirm = !showConfirm"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition">
                  <Eye v-if="!showConfirm" class="w-4 h-4" /><EyeOff v-else class="w-4 h-4" />
                </button>
              </div>
            </div>

            <button type="submit" :disabled="loading"
              class="w-full bg-neutral-900 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-neutral-800 active:scale-[0.98] transition disabled:opacity-50 shadow-sm">
              {{ loading ? 'Criando conta...' : 'Criar conta' }}
            </button>
          </form>
        </div>

        <p class="text-center text-[13px] text-neutral-500 mt-5">
          Já tem uma conta?
          <router-link to="/login" class="text-blue-600 font-medium hover:underline">Fazer login</router-link>
        </p>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { UserPlus, AlertCircle, Eye, EyeOff, CheckCircle } from 'lucide-vue-next';
import { mockRegister, mockGoogleLogin } from '../lib/mockAuth';

const router = useRouter();
const name = ref(''); const email = ref(''); const password = ref(''); const confirm = ref('');
const showPassword = ref(false); const showConfirm = ref(false);
const error = ref(''); const loading = ref(false);
const success = ref(false); const createdName = ref('');

const handleRegister = async () => {
  error.value = '';
  if (password.value !== confirm.value) { error.value = 'As senhas não coincidem.'; return; }
  loading.value = true;
  await new Promise(r => setTimeout(r, 600));
  const err = mockRegister(email.value, password.value, name.value);
  loading.value = false;
  if (err) { error.value = err; }
  else { createdName.value = name.value || email.value.split('@')[0]; success.value = true; }
};

const handleGoogleRegister = async () => {
  loading.value = true;
  await new Promise(r => setTimeout(r, 700));
  mockGoogleLogin();
  loading.value = false;
  router.push('/');
};
</script>
