<template>
  <div class="autocomplete-container w-full">
    <input 
      ref="inputRef" 
      type="text"
      :placeholder="placeholder"
      class="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      :class="className"
      @keydown="handleKeyDown"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, defineProps, defineEmits } from 'vue';

const props = defineProps<{
  placeholder?: string;
  className?: string;
}>();

const emit = defineEmits<{
  (e: 'placeSelect', place: google.maps.places.PlaceResult | null): void
}>();

const inputRef = ref<HTMLInputElement | null>(null);
let autocomplete: google.maps.places.Autocomplete | null = null;

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') e.preventDefault();
};

onMounted(() => {
  const initAutocomplete = () => {
    if (!window.google || !window.google.maps || !window.google.maps.places) {
      setTimeout(initAutocomplete, 100);
      return;
    }

    if (inputRef.value) {
      autocomplete = new google.maps.places.Autocomplete(inputRef.value, {
        fields: ['geometry', 'name', 'formatted_address', 'address_components']
      });

      autocomplete.addListener('place_changed', () => {
        emit('placeSelect', autocomplete?.getPlace() || null);
      });
    }
  };

  initAutocomplete();
});
</script>
