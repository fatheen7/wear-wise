'use client';
import { useEffect, useState, useCallback } from 'react';
import { useStore } from './store';
import { WeatherService } from './weatherService';
import { generateCandidates } from './recommendationEngine';
import { WeatherSnapshot } from './types';

export function useTodayOutfit() {
  const location = useStore((s) => s.location);
  const wardrobe = useStore((s) => s.wardrobe);
  const context = useStore((s) => s.user.defaultContext);
  const history = useStore((s) => s.history);
  const user = useStore((s) => s.user);
  const candidates = useStore((s) => s.candidates);
  const currentOutfitIds = useStore((s) => s.currentOutfitIds);
  const setCandidates = useStore((s) => s.setCandidates);
  const setCurrentOutfit = useStore((s) => s.setCurrentOutfit);
  const hasHydrated = useStore((s) => s.hasHydrated);

  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState(false);

  const loadWeather = useCallback(async () => {
    setWeatherLoading(true);
    setWeatherError(false);
    try {
      const w = await WeatherService.getToday(location);
      setWeather(w);
      if (w.source === 'mock') setWeatherError(false);
    } catch {
      setWeatherError(true);
    }
    setWeatherLoading(false);
  }, [location]);

  useEffect(() => { loadWeather(); }, [loadWeather]);

  // Recompute candidates whenever weather/wardrobe/context change, and set
  // the top pick as current outfit if none is chosen yet for this context.
  useEffect(() => {
    if (!hasHydrated || !weather || wardrobe.length === 0) return;
    const cands = generateCandidates(wardrobe, weather, context, history, user, 6);
    setCandidates(cands);
    if (!currentOutfitIds && cands.length) {
      setCurrentOutfit(cands[0].itemIds, context);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated, weather, wardrobe.length, context]);

  const regenerate = useCallback(() => {
    if (!weather) return;
    const cands = generateCandidates(wardrobe, weather, context, history, user, 6);
    setCandidates(cands);
    if (cands.length) setCurrentOutfit(cands[0].itemIds, context);
  }, [weather, wardrobe, context, history, user, setCandidates, setCurrentOutfit]);

  return { weather, weatherLoading, weatherError, candidates, retryWeather: loadWeather, regenerate };
}
