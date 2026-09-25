export type Category = 'tops' | 'bottoms' | 'shoes' | 'accessories';

export type ColorName =
  | 'navy' | 'black' | 'white' | 'grey' | 'brown' | 'light blue'
  | 'blue' | 'tan' | 'silver' | 'maroon' | 'beige' | 'olive';

export interface WardrobeItem {
  id: string;
  category: Category;
  sub: string;
  color: ColorName;
  hex: string;
  formality: 1 | 2 | 3 | 4 | 5; // 1 casual — 5 very formal
  name: string;
  photo?: string; // data URL, optional
  archived?: boolean;
  createdAt: number;
}

export type ContextId =
  | 'office' | 'college' | 'casual' | 'formal' | 'interview' | 'date'
  | 'dinner' | 'wedding' | 'travel' | 'outdoor' | 'home';

export interface WeatherSnapshot {
  tempC: number;
  feelsLikeC: number;
  humidity: number;
  rainChance: number;
  windKph: number;
  uv: number;
  condition: 'clear' | 'clouds' | 'rain' | 'storm' | 'humid' | 'hot' | 'cool';
  sunrise?: string;
  sunset?: string;
  source: 'live' | 'cached' | 'mock';
  fetchedAt: number;
}

export interface OutfitCandidate {
  itemIds: string[];
  items: WardrobeItem[];
  score: number;
  context: ContextId;
  reasons: string[];
}

export interface HistoryEntry {
  id: string;
  date: number;
  context: ContextId;
  itemIds: string[];
  rating?: 'great' | 'okay' | 'not-for-me';
  favorite?: boolean;
}

export interface UserPrefs {
  name: string;
  favoriteColors: ColorName[];
  dislikedColors: ColorName[];
  defaultContext: ContextId;
  tempComfort: 'runs-hot' | 'average' | 'runs-cold';
}

export interface LocationInfo {
  name: string;
  lat: number;
  lon: number;
}

export interface Settings {
  notifications: boolean;
  theme: 'system' | 'light' | 'dark';
  units: 'metric' | 'imperial';
}

export interface Subscription {
  plan: 'free' | 'monthly' | 'yearly';
}

export interface RejectionMemory {
  [color: string]: number; // rejection count
}
