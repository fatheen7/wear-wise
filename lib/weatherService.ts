import { WeatherSnapshot, LocationInfo } from './types';

const CACHE_KEY = 'wearwise_weather_cache_v1';

function readCache(): WeatherSnapshot | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as WeatherSnapshot) : null;
  } catch {
    return null;
  }
}
function writeCache(w: WeatherSnapshot) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(w));
  } catch {
    /* storage unavailable — non-fatal */
  }
}

/**
 * WeatherService — the app's only entry point for weather data.
 * Talks to /api/weather (server route) rather than a provider directly,
 * so the provider can be swapped without touching any UI or engine code.
 * Falls back to the last successfully cached reading, then to a clearly
 * labeled mock reading, so the UI never has to render a blank state.
 */
export const WeatherService = {
  async getToday(location: LocationInfo, signal?: AbortSignal): Promise<WeatherSnapshot> {
    try {
      const res = await fetch(`/api/weather?lat=${location.lat}&lon=${location.lon}`, { signal });
      if (!res.ok) throw new Error(`weather api ${res.status}`);
      const data = (await res.json()) as WeatherSnapshot;
      writeCache(data);
      return data;
    } catch (err) {
      const cached = readCache();
      if (cached) return { ...cached, source: 'cached' };
      return mockWeather(location);
    }
  },

  summary(w: WeatherSnapshot): string {
    const parts: string[] = [];
    if (w.tempC >= 33) parts.push('very hot');
    else if (w.tempC >= 28) parts.push('warm');
    else if (w.tempC < 18) parts.push('cool');
    if (w.humidity >= 70) parts.push('humid');
    if (w.rainChance >= 40) parts.push(`${w.rainChance}% rain`);
    return parts.length ? parts.join(' · ') : 'pleasant';
  },
};

function mockWeather(location: LocationInfo): WeatherSnapshot {
  // Deterministic per day+location so it's stable within a day; used only
  // when both the live API and the cache are unavailable (e.g. first run
  // with no network). Clearly tagged source:'mock' so the UI can note it.
  const dayKey = new Date().toDateString();
  let h = 0;
  const s = location.name + dayKey;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  const rnd = () => {
    h = (h * 1103515245 + 12345) | 0;
    return ((h >>> 0) % 1000) / 1000;
  };
  const tempC = Math.round((24 + rnd() * 12) * 10) / 10;
  const humidity = Math.round(45 + rnd() * 45);
  const rainChance = Math.round(rnd() * rnd() * 100);
  const windKph = Math.round(5 + rnd() * 20);
  const uv = Math.round(3 + rnd() * 8);
  const feelsLikeC = Math.round((tempC + (humidity > 65 ? (tempC > 28 ? 5 : 2) : 0)) * 10) / 10;
  const condition = rainChance > 55 ? 'rain' : humidity > 75 ? 'humid' : tempC > 34 ? 'hot' : 'clear';
  return { tempC, feelsLikeC, humidity, rainChance, windKph, uv, condition, source: 'mock', fetchedAt: Date.now() };
}
