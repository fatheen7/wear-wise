'use client';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import { LocationInfo } from '@/lib/types';
import BottomNav from '@/components/BottomNav';

export default function ProfilePage() {
  const hasHydrated = useStore((s) => s.hasHydrated);
  const user = useStore((s) => s.user);
  const location = useStore((s) => s.location);
  const settings = useStore((s) => s.settings);
  const plan = useStore((s) => s.subscription.plan);
  const setUser = useStore((s) => s.setUser);
  const setLocation = useStore((s) => s.setLocation);
  const setSettings = useStore((s) => s.setSettings);
  const resetAll = useStore((s) => s.resetAll);

  const [name, setName] = useState(user.name);
  const [savedTick, setSavedTick] = useState(false);

  // Location editing: a free-text field can't update the coordinates the
  // weather lookup actually uses (that was the bug — typing a new city
  // relabeled the old lat/lon instead of geocoding a new one). This now
  // mirrors onboarding's flow: search returns real coordinates, and only
  // picking a result changes location. The current location is shown
  // read-only above the search so it's clear what's actually in effect.
  const [locQuery, setLocQuery] = useState('');
  const [locResults, setLocResults] = useState<LocationInfo[]>([]);
  const [locLoading, setLocLoading] = useState(false);
  const [locSavedTick, setLocSavedTick] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The store persists to localStorage and rehydrates asynchronously after
  // mount. Until hasHydrated flips true, `user` is still the pre-hydration
  // default, so this form's local state — seeded once above — would
  // otherwise show a blank value and silently overwrite the real saved
  // name on Save. Re-sync as soon as hydration completes.
  useEffect(() => {
    if (!hasHydrated) return;
    setName(user.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (locQuery.trim().length < 2) { setLocResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLocLoading(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(locQuery)}`);
        const data = await res.json();
        setLocResults(data.results || []);
      } catch { setLocResults([]); }
      setLocLoading(false);
    }, 350);
  }, [locQuery]);

  function pickLocation(loc: LocationInfo) {
    setLocation(loc);
    setLocQuery('');
    setLocResults([]);
    setLocSavedTick(true);
    setTimeout(() => setLocSavedTick(false), 1500);
  }

  function useMyLocation() {
    if (!navigator.geolocation) return;
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(`/api/geocode?lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          const name = data.results?.[0]?.name || 'Current location';
          pickLocation({ name, lat: latitude, lon: longitude });
        } catch {
          pickLocation({ name: 'Current location', lat: latitude, lon: longitude });
        }
        setLocLoading(false);
      },
      () => setLocLoading(false),
      { timeout: 8000 }
    );
  }

  function save() {
    setUser({ name });
    setSavedTick(true);
    setTimeout(() => setSavedTick(false), 1500);
  }

  function reset() {
    if (confirm('Reset all WearWise data on this device? This cannot be undone.')) {
      resetAll();
      window.location.href = '/';
    }
  }

  return (
    <div className="app-shell">
      <div className="flex-1 overflow-y-auto pb-6">
        <div className="topbar">
          <h1 className="font-display text-xl font-medium">Profile</h1>
        </div>
        <div className="px-5 flex flex-col gap-2.5">
          <div className="card">
            <label className="text-[12.5px] font-semibold text-ink-soft block mb-1.5">Name</label>
            <input className="field-input" value={name} disabled={!hasHydrated} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="card">
            <label className="text-[12.5px] font-semibold text-ink-soft block mb-1.5">Location</label>
            <div className="flex items-center gap-2 text-sm mb-2.5">
              <MapPin size={16} className="text-navy-ink flex-none" />
              <span>{hasHydrated ? location.name : 'Loading…'}</span>
              {locSavedTick && <span className="text-good text-[12px] font-semibold ml-auto">Updated ✓</span>}
            </div>
            <input
              className="field-input mb-2"
              placeholder="Search for a new city"
              value={locQuery}
              disabled={!hasHydrated}
              onChange={(e) => setLocQuery(e.target.value)}
            />
            {locLoading && <div className="text-ink-soft text-[12.5px] flex items-center gap-1.5"><Loader2 size={13} className="animate-spin" />Searching…</div>}
            {locResults.length > 0 && (
              <div className="border border-hair rounded-sm overflow-hidden mb-2">
                {locResults.map((r, i) => (
                  <button
                    key={i}
                    className="w-full text-left px-3 py-2.5 text-sm active:bg-surface-2 block"
                    onClick={() => pickLocation(r)}
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            )}
            <button className="btn-ghost flex items-center justify-center gap-2 !py-2.5 !text-[13.5px]" onClick={useMyLocation} disabled={!hasHydrated || locLoading}>
              <MapPin size={14} />
              Use my current location
            </button>
          </div>

          <div className="card">
            <h2 className="section-title mb-2.5">Preferences</h2>
            <Row label="Notifications">
              <Switch on={settings.notifications} onClick={() => setSettings({ notifications: !settings.notifications })} />
            </Row>
            <div className="h-3" />
            <Row label="Dark mode">
              <Switch on={settings.theme === 'dark'} onClick={() => setSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })} />
            </Row>
            <div className="h-3" />
            <Row label="Units">
              <div className="flex gap-1.5">
                <button className={`opt !py-1.5 !px-3 !text-[12.5px] ${settings.units === 'metric' ? 'opt-active' : ''}`} onClick={() => setSettings({ units: 'metric' })}>°C</button>
                <button className={`opt !py-1.5 !px-3 !text-[12.5px] ${settings.units === 'imperial' ? 'opt-active' : ''}`} onClick={() => setSettings({ units: 'imperial' })}>°F</button>
              </div>
            </Row>
          </div>

          <div className="card flex items-center justify-between">
            <span>Plan</span>
            <span className={`text-[10.5px] font-bold px-2 py-1 rounded-full ${plan === 'free' ? 'border border-hair text-ink-soft' : 'bg-brass text-navy-ink'}`}>
              {plan === 'free' ? 'Free' : 'Premium'}
            </span>
          </div>
          {plan === 'free' && <Link href="/paywall" className="btn-primary text-center">Upgrade to Premium</Link>}

          <button className="btn-ghost" onClick={save} disabled={!hasHydrated}>{savedTick ? 'Saved ✓' : 'Save changes'}</button>
          <button className="btn-text w-full text-center mt-1" style={{ color: 'rgb(176 69 61)' }} onClick={reset}>Reset app data</button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      {children}
    </div>
  );
}
function Switch({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-11 h-[26px] rounded-full relative flex-none transition-colors"
      style={{ background: on ? 'rgb(var(--navy))' : 'rgb(var(--hair))' }}
    >
      <span
        className="absolute top-[3px] w-5 h-5 rounded-full bg-white transition-[left]"
        style={{ left: on ? '21px' : '3px' }}
      />
    </button>
  );
}
