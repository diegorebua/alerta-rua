<template>
  <div class="flex flex-col md:flex-row h-[calc(100vh-64px)] w-full overflow-hidden">
    
    <div class="w-full md:w-[400px] flex flex-col bg-white border-r border-neutral-200 shadow-sm z-10">
      <div class="p-4 border-b border-neutral-200 space-y-4">
        <h2 class="font-semibold text-lg text-neutral-800">Ocorrências na Região</h2>
        
        <div class="relative">
          <Search class="w-5 h-5 absolute left-3 top-2.5 text-neutral-400 z-10" />
          <PlaceAutocomplete 
            @placeSelect="handlePlaceSelect" 
            placeholder="Pesquisar rua ou bairro..."
            className="pl-10 h-10 w-full text-sm"
          />
        </div>
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        <div v-if="filteredOccurrences.length === 0" class="text-center text-neutral-500 py-10 flex flex-col items-center gap-3">
          <MapPin class="w-8 h-8 opacity-20" />
          <p>Nenhuma ocorrência encontrada nesta área.</p>
        </div>
        <div v-else
          v-for="occ in filteredOccurrences" 
          :key="occ.id" 
          class="bg-white border border-neutral-200 rounded-xl p-4 hover:shadow-md transition cursor-pointer"
          @click="focusMap(occ.lat, occ.lng)"
        >
          <div class="flex justify-between items-start mb-2">
            <span class="font-semibold text-neutral-900 group-hover:text-blue-600">{{ occ.title }}</span>
            <span :class="['text-xs px-2 py-1 rounded-full font-medium border', getStatusColor(occ.status)]">
              {{ getStatusText(occ.status) }}
            </span>
          </div>
          
          <p class="text-sm text-neutral-600 line-clamp-2 mb-3">{{ occ.description }}</p>
          
          <div class="text-xs text-neutral-500 flex flex-col gap-1">
            <div class="flex items-center gap-1">
              <MapPin class="w-3 h-3" />
              <span class="truncate">{{ occ.address }}</span>
            </div>
            <div class="flex justify-between items-center mt-1">
              <span class="bg-neutral-100 px-2 py-1 rounded-md">{{ occurrenceTypes[occ.type] || occ.type }}</span>
              <span class="flex items-center gap-1">
                <Clock class="w-3 h-3" />
                {{ occ.createdAt?.toMillis ? formatDistanceToNow(occ.createdAt.toMillis(), { addSuffix: true, locale: ptBR }) : '' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="flex-1 relative h-full">
      <div ref="mapContainer" class="w-full h-full"></div>
      
      <div class="absolute top-4 left-4 right-4 md:right-auto pointer-events-none flex gap-2">
         <div v-if="currentZoom >= 16 && nearbyPlaces.length > 0" class="bg-white/90 backdrop-blur text-xs font-semibold px-3 py-2 rounded-full shadow-sm text-neutral-700 flex items-center gap-2 border border-white/40">
           <Info class="w-4 h-4 text-blue-500" />
           Mostrando estabelecimentos próximos
         </div>
         <div v-if="currentZoom < 16" class="bg-white/90 backdrop-blur text-xs font-medium px-3 py-2 rounded-full shadow-sm text-neutral-600 flex items-center gap-2 border border-white/40">
           <Info class="w-4 h-4 text-neutral-400" />
           Aproxime (zoom) para ver estabelecimentos próximos
         </div>
      </div>
    </div>
    
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { type Occurrence, occurrenceTypes } from '../lib/types';
import PlaceAutocomplete from '../components/PlaceAutocomplete.vue';
import { MapPin, Search, Info, Clock, CheckCircle2 } from 'lucide-vue-next';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const MAP_DEFAULT_CENTER = { lat: -23.55052, lng: -46.633308 };

const occurrences = ref<Occurrence[]>([]);
const filteredOccurrences = ref<Occurrence[]>([]);
const nearbyPlaces = ref<google.maps.places.PlaceResult[]>([]);
const currentZoom = ref(12);

const mapContainer = ref<HTMLElement | null>(null);
let mapInstance: google.maps.Map | null = null;
let placesService: google.maps.places.PlacesService | null = null;
let markers: google.maps.Marker[] = [];
let placeMarkers: google.maps.Marker[] = [];

onMounted(() => {
  const initMap = () => {
    if (!window.google || !window.google.maps) {
      setTimeout(initMap, 100);
      return;
    }

    if (mapContainer.value) {
      mapInstance = new google.maps.Map(mapContainer.value, {
        center: MAP_DEFAULT_CENTER,
        zoom: 12,
        disableDefaultUI: true,
        zoomControl: true,
        mapId: 'CITY_FIX_MAP_ID'
      });

      placesService = new google.maps.places.PlacesService(mapInstance);

      mapInstance.addListener('zoom_changed', () => {
        currentZoom.value = mapInstance!.getZoom() || 12;
        handleCameraChange();
      });

      mapInstance.addListener('center_changed', () => {
        handleCameraChange();
      });

      updateMarkers();
    }
  };

  initMap();

  const q = query(collection(db, 'occurrences'), orderBy('createdAt', 'desc'));
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Occurrence));
    occurrences.value = data;
    filteredOccurrences.value = data;
    updateMarkers();
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'occurrences');
  });

  onUnmounted(() => {
    unsubscribe();
  });
});

watch(filteredOccurrences, () => {
  updateMarkers();
});

watch(nearbyPlaces, () => {
  updatePlaceMarkers();
});

const handleCameraChange = () => {
  if (!mapInstance || !placesService) return;
  const zoom = mapInstance.getZoom() || 12;

  if (zoom >= 16) {
    const request = {
      location: mapInstance.getCenter()!,
      radius: 200,
      type: 'establishment'
    };
    
    placesService.nearbySearch(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        nearbyPlaces.value = results;
      } else {
        nearbyPlaces.value = [];
      }
    });
  } else {
    nearbyPlaces.value = [];
  }
};

const updateMarkers = () => {
  if (!mapInstance) return;
  markers.forEach(m => m.setMap(null));
  markers = [];

  filteredOccurrences.value.forEach(occ => {
    const marker = new google.maps.Marker({
      position: { lat: occ.lat, lng: occ.lng },
      map: mapInstance,
      title: occ.title,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: occ.status === 'open' ? '#dc2626' : occ.status === 'in_progress' ? '#d97706' : '#059669',
        fillOpacity: 1,
        strokeWeight: 2,
        strokeColor: '#ffffff',
        scale: 8,
      }
    });
    markers.push(marker);
  });
};

const updatePlaceMarkers = () => {
  if (!mapInstance) return;
  placeMarkers.forEach(m => m.setMap(null));
  placeMarkers = [];

  nearbyPlaces.value.forEach(place => {
    if (place.geometry?.location) {
      const marker = new google.maps.Marker({
        position: place.geometry.location,
        map: mapInstance,
        title: place.name,
        icon: {
          url: place.icon || '',
          scaledSize: new google.maps.Size(20, 20)
        }
      });
      placeMarkers.push(marker);
    }
  });
};

const handlePlaceSelect = (place: google.maps.places.PlaceResult | null) => {
  if (place && place.geometry?.location && mapInstance) {
    mapInstance.setCenter(place.geometry.location);
    mapInstance.setZoom(16);
    filterListByBounds({ lat: place.geometry.location.lat(), lng: place.geometry.location.lng() }, 10);
  }
};

const focusMap = (lat: number, lng: number) => {
  if (mapInstance) {
    mapInstance.setCenter({ lat, lng });
    mapInstance.setZoom(16);
  }
};

const filterListByBounds = (center: {lat: number, lng: number}, maxKmRule: number) => {
   const deg2rad = (deg: number) => deg * (Math.PI/180);
   const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
     const R = 6371;
     const dLat = deg2rad(lat2-lat1);  
     const dLon = deg2rad(lon2-lon1); 
     const a = 
       Math.sin(dLat/2) * Math.sin(dLat/2) +
       Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
       Math.sin(dLon/2) * Math.sin(dLon/2); 
     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
     const d = R * c;
     return d;
   }

   filteredOccurrences.value = occurrences.value.filter(occ => {
     const dist = getDistanceFromLatLonInKm(center.lat, center.lng, occ.lat, occ.lng);
     return dist <= maxKmRule;
   });
};

const getStatusColor = (status: string) => {
  switch(status) {
    case 'open': return 'text-red-600 bg-red-100 border-red-200';
    case 'in_progress': return 'text-amber-600 bg-amber-100 border-amber-200';
    case 'resolved': return 'text-emerald-600 bg-emerald-100 border-emerald-200';
    default: return 'text-gray-600 bg-gray-100 border-gray-200';
  }
}

const getStatusText = (status: string) => {
  switch(status) {
    case 'open': return 'Aberta';
    case 'in_progress': return 'Em Andamento';
    case 'resolved': return 'Resolvida';
    default: return status;
  }
}
</script>
