'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
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
  const [locName, setLocName] = useState(location.name);
  const [savedTick, setSavedTick] = useState(false);

  // The store persists to localStorage and rehydrates asynchronously after
  // mount. Until hasHydrated flips true, `user`/`location` are still the
  // pre-hydration defaults, so this form's local state — seeded once above
  // — would otherwise show blank/default values and silently overwrite the
  // real saved data on Save. Re-sync as soon as hydration completes.
  useEffect(() => {
    if (!hasHydrated) return;
    setName(user.name);
    setLocName(location.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated]);

  function save() {
    setUser({ name });
    if (locName !== location.name) setLocation({ ...location, name: locName });
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
            <input className="field-input" value={locName} disabled={!hasHydrated} onChange={(e) => setLocName(e.target.value)} />
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
