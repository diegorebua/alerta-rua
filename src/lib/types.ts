import { Timestamp } from 'firebase/firestore';

export interface Occurrence {
  id?: string;
  title: string;
  description: string;
  type: string;
  status: string;
  lat: number;
  lng: number;
  address: string;
  neighborhood: string;
  authorId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export const occurrenceTypes: Record<string, string> = {
  pothole: "Buraco na via",
  light_out: "Poste apagado",
  trash: "Acúmulo de lixo",
  water_leak: "Vazamento de água",
  other: "Outro"
};
