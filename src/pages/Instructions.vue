<template>
  <div class="max-w-2xl mx-auto py-16 px-4">

    <!-- Hero -->
    <div class="text-center mb-14">
      <h1 class="text-3xl font-semibold text-neutral-900 tracking-tight mb-3">Como funciona o Alerta Rua?</h1>
      <p class="text-neutral-500 text-[15px] leading-relaxed">
        Um guia rápido para ajudar você a cuidar melhor da sua cidade.
      </p>
    </div>

    <!-- Steps -->
    <div class="space-y-4">
      <div
        v-for="step in steps"
        :key="step.number"
        class="card-hover flex items-start gap-5 bg-white border border-neutral-100 rounded-2xl p-6"
      >
        <!-- Icon -->
        <div :class="['w-10 h-10 rounded-xl flex items-center justify-center shrink-0', step.iconBg]">
          <component :is="step.icon" class="w-5 h-5" :class="step.iconColor" />
        </div>

        <!-- Content -->
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest">Passo {{ step.number }}</span>
          </div>
          <h3 class="text-[15px] font-semibold text-neutral-900 mb-1.5">{{ step.title }}</h3>
          <p class="text-sm text-neutral-500 leading-relaxed">{{ step.description }}</p>
        </div>
      </div>
    </div>

    <!-- CTA -->
    <div class="mt-10 text-center">
      <router-link
        to="/"
        class="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-6 py-3 rounded-xl hover:bg-blue-700 transition shadow-sm"
      >
        <MapPin class="w-4 h-4" />
        Ver o Mapa Agora
      </router-link>
    </div>

  </div>
</template>

<script setup lang="ts">
import { MapPin, PlusCircle, Search, CheckCircle2, Bell } from 'lucide-vue-next';

const steps = [
  {
    number: 1,
    title: 'Reporte um Problema',
    description: 'Encontrou um buraco, uma lâmpada queimada ou lixo acumulado? Faça login e crie uma nova ocorrência com descrição e localização exata no mapa.',
    icon: PlusCircle,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    number: 2,
    title: 'Acompanhe a Região',
    description: 'Use a barra de pesquisa na página inicial para encontrar sua rua ou bairro. O mapa exibe as ocorrências daquela área com marcadores coloridos por status.',
    icon: Search,
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
  },
  {
    number: 3,
    title: 'Mapa Interativo',
    description: 'Navegue livremente. Cada marcador representa uma ocorrência — vermelho para aberta, laranja para em andamento, verde para resolvida.',
    icon: MapPin,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
  },
  {
    number: 4,
    title: 'Ações e Resoluções',
    description: 'As ocorrências ficam salvas em banco de dados público para que cidadãos, a prefeitura e instituições possam visualizar e agir para resolver os problemas.',
    icon: CheckCircle2,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
];
</script>
