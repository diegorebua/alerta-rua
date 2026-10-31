/**
 * Utilitário compartilhado de busca de endereços e geocodificação (Nominatim / OpenStreetMap).
 */

export interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    road?: string;
    house_number?: string;
    suburb?: string;
    neighbourhood?: string;
    city_district?: string;
    quarter?: string;
    city?: string;
    town?: string;
    municipality?: string;
    state?: string;
  };
}

// Coordenadas aproximadas de bairros conhecidos em Sorocaba (e SP como fallback adicional)
const BAIRRO_COORDS: Record<string, { lat: number; lng: number }> = {
  'parque campolim': { lat: -23.5338, lng: -47.4639 },
  'campolim': { lat: -23.5338, lng: -47.4639 },
  'centro': { lat: -23.5015, lng: -47.4581 },
  'jardim santa rosalia': { lat: -23.4892, lng: -47.4452 },
  'jardim santa rosália': { lat: -23.4892, lng: -47.4452 },
  'santa rosalia': { lat: -23.4892, lng: -47.4452 },
  'santa rosália': { lat: -23.4892, lng: -47.4452 },
  'mangal': { lat: -23.5078, lng: -47.4724 },
  'vila trujillo': { lat: -23.4958, lng: -47.4659 },
  'trujillo': { lat: -23.4958, lng: -47.4659 },
  'alem ponte': { lat: -23.5034, lng: -47.4368 },
  'além ponte': { lat: -23.5034, lng: -47.4368 },
  'alto da boa vista': { lat: -23.4712, lng: -47.4239 },
  'wanel ville': { lat: -23.4931, lng: -47.5103 },
  'vila hortencia': { lat: -23.5082, lng: -47.4418 },
  'vila hortência': { lat: -23.5082, lng: -47.4418 },
  'eden': { lat: -23.4285, lng: -47.4052 },
  'éden': { lat: -23.4285, lng: -47.4052 },
  'cerrado': { lat: -23.5131, lng: -47.4765 },
  'itavuvu': { lat: -23.4519, lng: -47.4769 },
  'ipanema': { lat: -23.4764, lng: -47.4882 },
};

export const DEFAULT_SOROCABA_COORDS = { lat: -23.5015, lng: -47.4526 };
export const DEFAULT_SP_COORDS = DEFAULT_SOROCABA_COORDS;

export function extractNeighborhood(result: NominatimResult): string {
  const addr = result.address;
  if (!addr) return '';
  return addr.suburb || addr.neighbourhood || addr.city_district || addr.quarter || '';
}

/**
 * Busca sugestões de endereços no Nominatim (priorizando Sorocaba - SP se a busca não especificar cidade).
 */
export async function searchAddresses(queryText: string, limit = 6): Promise<NominatimResult[]> {
  const q = queryText.trim();
  if (q.length < 3) return [];

  const hasCityContext = /sorocaba|s[aã]o paulo|sp|brasil|\b-\b|,/i.test(q);
  const queriesToTry = hasCityContext
    ? [q, `${q}, Brasil`]
    : [`${q}, Sorocaba, SP, Brasil`, `${q}, São Paulo, Brasil`, `${q}, Brasil`];

  for (const candidateQuery of queriesToTry) {
    try {
      const params = new URLSearchParams({
        q: candidateQuery,
        format: 'json',
        addressdetails: '1',
        limit: String(limit),
        countrycodes: 'br',
      });

      const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
        headers: { 'Accept-Language': 'pt-BR,pt;q=0.9' },
      });

      if (res.ok) {
        const data: NominatimResult[] = await res.json();
        if (data.length > 0) {
          return data;
        }
      }
    } catch {
      // Continua para próxima tentativa ou fallback
    }
  }

  return [];
}

/**
 * Resolve coordenadas precisas para um endereço/bairro quando o usuário não clicou em uma sugestão.
 */
export async function resolveAddressCoords(
  address: string,
  neighborhood: string,
  selectedCoords: { lat: number; lng: number } | null
): Promise<{ lat: number; lng: number; resolvedNeighborhood?: string }> {
  if (selectedCoords && Number.isFinite(selectedCoords.lat) && Number.isFinite(selectedCoords.lng)) {
    return selectedCoords;
  }

  const cleanAddress = address.trim();
  const cleanNeighborhood = neighborhood.trim();
  const fullQuery =
    cleanNeighborhood && !cleanAddress.toLowerCase().includes(cleanNeighborhood.toLowerCase())
      ? `${cleanAddress}, ${cleanNeighborhood}`
      : cleanAddress;

  if (fullQuery.length >= 3) {
    const results = await searchAddresses(fullQuery, 1);
    if (results.length > 0) {
      const first = results[0];
      const lat = parseFloat(first.lat);
      const lng = parseFloat(first.lon);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return {
          lat,
          lng,
          resolvedNeighborhood: extractNeighborhood(first) || undefined,
        };
      }
    }
  }

  const key = cleanNeighborhood.toLowerCase();
  if (BAIRRO_COORDS[key]) {
    return BAIRRO_COORDS[key];
  }

  return DEFAULT_SOROCABA_COORDS;
}
