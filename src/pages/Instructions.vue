<template>
  <div class="max-w-3xl mx-auto py-12 px-4 space-y-12">
    <div class="text-center">
      <h1 class="text-4xl font-bold text-neutral-900 mb-4 tracking-tight">Como o Alerta rua Funciona?</h1>
      <p class="text-neutral-500 text-lg">Um guia rápido para ajudar você a cuidar melhor da sua cidade.</p>
    </div>

    <div class="grid gap-8 md:grid-cols-2">
      <div class="bg-white p-6 rounded-2xl border border-neutral-200">
        <div class="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
          <PlusCircle class="w-5 h-5" />
        </div>
        <h3 class="text-xl font-bold text-neutral-900 mb-2">1. Reporte um Problema</h3>
        <p class="text-neutral-600 leading-relaxed">
          Encontrou um buraco, uma lâmpada queimada ou lixo acumulado? Faça login e crie uma nova ocorrência. Descreva o problema e marque a localização exata no mapa.
        </p>
      </div>

      <div class="bg-white p-6 rounded-2xl border border-neutral-200">
        <div class="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
          <Search class="w-5 h-5" />
        </div>
        <h3 class="text-xl font-bold text-neutral-900 mb-2">2. Acompanhe a Região</h3>
        <p class="text-neutral-600 leading-relaxed">
          Use a barra de pesquisa na página inicial para encontrar sua rua ou bairro. O mapa dará zoom automaticamente e exibirá as ocorrências daquela área, além de pontos de interesse próximos ao aproximar a câmera.
        </p>
      </div>

      <div class="bg-white p-6 rounded-2xl border border-neutral-200">
        <div class="w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4">
          <MapPin class="w-5 h-5" />
        </div>
        <h3 class="text-xl font-bold text-neutral-900 mb-2">3. O Mapa Interativo</h3>
        <p class="text-neutral-600 leading-relaxed">
          Navegue livremente pelo mapa. Cada marcador representa uma ocorrência com seu status atual (aberta, em andamento, resolvida). Ao dar um zoom profundo, você também verá estabelecimentos comerciais locais.
        </p>
      </div>

      <div class="bg-white p-6 rounded-2xl border border-neutral-200">
        <div class="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 class="w-5 h-5" />
        </div>
        <h3 class="text-xl font-bold text-neutral-900 mb-2">4. Ações e Resoluções</h3>
        <p class="text-neutral-600 leading-relaxed">
          As ocorrências ficam salvas em nosso banco de dados público (Firebase) para que demais cidadãos, a prefeitura e instituições privadas possam visualizar e agir para solucionar os problemas reportados.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { MapPin, PlusCircle, CheckCircle2, Search } from 'lucide-vue-next';
</script>
