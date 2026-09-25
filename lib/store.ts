'use client';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  WardrobeItem, HistoryEntry, UserPrefs, LocationInfo, Settings, Subscription,
  ContextId, OutfitCandidate, WeatherSnapshot,
} from './types';
import { seedWardrobe, makeId } from './seedData';

export interface ChatMessage { role: 'user' | 'assistant'; text: string; }

interface WearWiseState {
  hasHydrated: boolean;
  onboarded: boolean;
  user: UserPrefs;
  location: LocationInfo;
  wardrobe: WardrobeItem[];
  history: HistoryEntry[];
  settings: Settings;
  subscription: Subscription;
  currentOutfitIds: string[] | null;
  currentOutfitContext: ContextId | null;
  candidates: OutfitCandidate[];
  assistantLog: ChatMessage[];
  assistantCountToday: number;
  assistantCountDate: string;

  setHasHydrated: (v: boolean) => void;
  completeOnboarding: (payload: { name: string; location: LocationInfo; favoriteColors: string[]; defaultContext: ContextId; seedStarter: boolean }) => void;
  setLocation: (loc: LocationInfo) => void;
  setUser: (u: Partial<UserPrefs>) => void;
  setDefaultContext: (c: ContextId) => void;
  addWardrobeItem: (item: Omit<WardrobeItem, 'id' | 'createdAt'>) => void;
  updateWardrobeItem: (id: string, patch: Partial<WardrobeItem>) => void;
  deleteWardrobeItem: (id: string) => void;
  setCandidates: (cands: OutfitCandidate[]) => void;
  setCurrentOutfit: (itemIds: string[], context: ContextId) => void;
  markWorn: () => void;
  toggleFavorite: (historyId: string) => void;
  rateHistory: (historyId: string, rating: HistoryEntry['rating']) => void;
  deleteHistory: (historyId: string) => void;
  rejectColor: (color: string) => void;
  likeColor: (color: string) => void;
  setSettings: (s: Partial<Settings>) => void;
  setSubscription: (s: Subscription['plan']) => void;
  pushChat: (m: ChatMessage) => void;
  incAssistantCount: () => void;
  resetAssistantCountIfNewDay: () => void;
  resetAll: () => void;
}

const DEFAULT_USER: UserPrefs = {
  name: '', favoriteColors: [], dislikedColors: [], defaultContext: 'office', tempComfort: 'average',
};
const DEFAULT_LOCATION: LocationInfo = { name: 'Chennai', lat: 13.0827, lon: 80.2707 };
const DEFAULT_SETTINGS: Settings = { notifications: true, theme: 'system', units: 'metric' };

export const useStore = create<WearWiseState>()(
  persist(
    (set, get) => ({
      hasHydrated: false,
      onboarded: false,
      user: DEFAULT_USER,
      location: DEFAULT_LOCATION,
      wardrobe: [],
      history: [],
      settings: DEFAULT_SETTINGS,
      subscription: { plan: 'free' },
      currentOutfitIds: null,
      currentOutfitContext: null,
      candidates: [],
      assistantLog: [],
      assistantCountToday: 0,
      assistantCountDate: '',

      setHasHydrated: (v) => set({ hasHydrated: v }),

      completeOnboarding: ({ name, location, favoriteColors, defaultContext, seedStarter }) => set((s) => ({
        onboarded: true,
        user: { ...s.user, name, favoriteColors: favoriteColors as any, defaultContext },
        location,
        wardrobe: seedStarter ? seedWardrobe() : s.wardrobe,
      })),

      setLocation: (loc) => set({ location: loc, currentOutfitIds: null }),
      setUser: (u) => set((s) => ({ user: { ...s.user, ...u } })),
      setDefaultContext: (c) => set((s) => ({ user: { ...s.user, defaultContext: c }, currentOutfitIds: null })),

      addWardrobeItem: (item) => set((s) => ({
        wardrobe: [...s.wardrobe, { ...item, id: makeId(), createdAt: Date.now() }],
        currentOutfitIds: null,
      })),
      updateWardrobeItem: (id, patch) => set((s) => ({
        wardrobe: s.wardrobe.map((w) => (w.id === id ? { ...w, ...patch } : w)),
        currentOutfitIds: null,
      })),
      deleteWardrobeItem: (id) => set((s) => ({
        wardrobe: s.wardrobe.filter((w) => w.id !== id),
        currentOutfitIds: null,
      })),

      setCandidates: (cands) => set({ candidates: cands }),
      setCurrentOutfit: (itemIds, context) => set({ currentOutfitIds: itemIds, currentOutfitContext: context }),

      markWorn: () => set((s) => {
        if (!s.currentOutfitIds || !s.currentOutfitContext) return {};
        const entry: HistoryEntry = {
          id: makeId(), date: Date.now(), context: s.currentOutfitContext, itemIds: s.currentOutfitIds,
        };
        return { history: [...s.history, entry] };
      }),
      toggleFavorite: (historyId) => set((s) => ({
        history: s.history.map((h) => (h.id === historyId ? { ...h, favorite: !h.favorite } : h)),
      })),
      rateHistory: (historyId, rating) => set((s) => ({
        history: s.history.map((h) => (h.id === historyId ? { ...h, rating } : h)),
      })),
      deleteHistory: (historyId) => set((s) => ({ history: s.history.filter((h) => h.id !== historyId) })),

      rejectColor: (color) => set((s) => ({
        user: { ...s.user, dislikedColors: Array.from(new Set([...s.user.dislikedColors, color])) as any },
      })),
      likeColor: (color) => set((s) => ({
        user: { ...s.user, favoriteColors: Array.from(new Set([...s.user.favoriteColors, color])) as any },
      })),

      setSettings: (s2) => set((s) => ({ settings: { ...s.settings, ...s2 } })),
      setSubscription: (plan) => set({ subscription: { plan } }),

      pushChat: (m) => set((s) => ({ assistantLog: [...s.assistantLog, m] })),
      incAssistantCount: () => set((s) => ({ assistantCountToday: s.assistantCountToday + 1 })),
      resetAssistantCountIfNewDay: () => set((s) => {
        const today = new Date().toDateString();
        if (s.assistantCountDate !== today) return { assistantCountDate: today, assistantCountToday: 0 };
        return {};
      }),

      resetAll: () => set({
        onboarded: false, user: DEFAULT_USER, location: DEFAULT_LOCATION, wardrobe: [], history: [],
        settings: DEFAULT_SETTINGS, subscription: { plan: 'free' }, currentOutfitIds: null,
        currentOutfitContext: null, candidates: [], assistantLog: [], assistantCountToday: 0, assistantCountDate: '',
      }),
    }),
    {
      name: 'wearwise_state_v2',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => { state?.setHasHydrated(true); },
      partialize: (s) => {
        const { hasHydrated, ...rest } = s;
        return rest;
      },
    }
  )
);

export const FREE_LIMITS = { wardrobeItems: 15, assistantPerDay: 5, historyDays: 7 };
