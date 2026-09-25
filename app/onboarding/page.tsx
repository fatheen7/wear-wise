'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, MapPin, Loader2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import { CONTEXT_LABEL } from '@/lib/seedData';
import { COLOR_HEX } from '@/lib/colorData';
import { ContextId, LocationInfo } from '@/lib/types';

const STEPS = ['welcome', 'location', 'style', 'wardrobe', 'context'] as const;
type Step = typeof STEPS[number];

const STYLE_COLORS = ['navy', 'black', 'grey', 'white', 'brown', 'light blue'] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const completeOnboarding = useStore((s) => s.completeOnboarding);
  const [stepIdx, setStepIdx] = useState(0);
  const step: Step = STEPS[stepIdx];

  const [name, setName] = useState('');
  const [location, setLocation] = useState<LocationInfo>({ name: 'Chennai', lat: 13.0827, lon: 80.2707 });
  const [locQuery, setLocQuery] = useState('');
  const [locResults, setLocResults] = useState<LocationInfo[]>([]);
  const [locLoading, setLocLoading] = useState(false);
  const [favoriteColors, setFavoriteColors] = useState<string[]>([]);
  const [defaultContext, setDefaultContext] = useState<ContextId>('office');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
          setLocation({ name, lat: latitude, lon: longitude });
        } catch {
          setLocation({ name: 'Current location', lat: latitude, lon: longitude });
        }
        setLocLoading(false);
      },
      () => setLocLoading(false),
      { timeout: 8000 }
    );
  }

  function next() { setStepIdx((i) => Math.min(i + 1, STEPS.length - 1)); }

  function finish(seedStarter: boolean) {
    completeOnboarding({ name, location, favoriteColors, defaultContext, seedStarter });
    router.replace('/today');
  }

  return (
    <div className="app-shell">
      <div className="h-3.5" />
      <div className="flex gap-1.5 px-5 mb-1.5">
        {STEPS.map((s, i) => (
          <i key={s} className={`flex-1 h-[3px] rounded-full ${i <= stepIdx ? 'bg-navy' : 'bg-hair'}`} />
        ))}
      </div>

      {step === 'welcome' && (
        <Center>
          <div className="w-[60px] h-[60px] rounded-[18px] bg-navy flex items-center justify-center mb-5">
            <Sparkles size={28} color="#fff" strokeWidth={1.6} />
          </div>
          <h1>Know what to wear,<br />before you open your closet.</h1>
          <p className="lede">WearWise reads today&apos;s weather, your wardrobe, and where you&apos;re headed — then tells you exactly what to put on.</p>
          <button className="btn-primary" onClick={next}>Get started</button>
        </Center>
      )}

      {step === 'location' && (
        <Center>
          <h1>Where should we check the weather?</h1>
          <p className="lede">We&apos;ll use this every morning to shape your outfit — you can change it anytime.</p>
          <button className="btn-ghost mb-3 flex items-center justify-center gap-2" onClick={useMyLocation} disabled={locLoading}>
            {locLoading ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
            Use my current location
          </button>
          <div className="field mb-4">
            <label>Or search for a city</label>
            <input className="field-input" value={locQuery} onChange={(e) => setLocQuery(e.target.value)} placeholder="e.g. Chennai" />
            {locResults.length > 0 && (
              <div className="card mt-1 p-1">
                {locResults.map((r, i) => (
                  <button
                    key={i}
                    className="w-full text-left px-3 py-2.5 text-sm rounded-sm active:bg-surface-2"
                    onClick={() => { setLocation(r); setLocQuery(''); setLocResults([]); }}
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="card mb-4 flex items-center gap-2 text-sm">
            <MapPin size={16} className="text-navy-ink flex-none" />
            <span>{location.name}</span>
          </div>
          <button className="btn-primary" onClick={next}>Use this location</button>
        </Center>
      )}

      {step === 'style' && (
        <Center>
          <h1>What&apos;s your style?</h1>
          <p className="lede">Pick a few colours you gravitate toward — we&apos;ll lean into them.</p>
          <div className="field mb-4">
            <label>Your name</label>
            <input className="field-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Aravind" />
          </div>
          <div className="field mb-2">
            <label>Colours you like</label>
            <div className="flex flex-wrap gap-2.5 mt-1">
              {STYLE_COLORS.map((c) => {
                const sel = favoriteColors.includes(c);
                return (
                  <button
                    key={c}
                    onClick={() => setFavoriteColors((fc) => sel ? fc.filter((x) => x !== c) : [...fc, c])}
                    className="w-9 h-9 rounded-full relative border-2"
                    style={{ background: COLOR_HEX[c], borderColor: sel ? 'rgb(var(--navy-ink))' : 'transparent' }}
                  >
                    {sel && <span className="absolute inset-0 flex items-center justify-center text-white text-xs">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="h-3" />
          <button className="btn-primary" onClick={next}>Continue</button>
        </Center>
      )}

      {step === 'wardrobe' && (
        <Center>
          <h1>Let&apos;s start your wardrobe.</h1>
          <p className="lede">We&apos;ve pre-loaded a few common pieces so you can try WearWise right away. Edit or add more anytime.</p>
          <div className="card mb-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Starter wardrobe</span>
              <span className="text-[10.5px] font-bold px-2 py-1 rounded-full bg-hair text-ink-soft">18 items</span>
            </div>
            <p className="text-ink-soft text-[13px] mt-2">Formal shirts, trousers, loafers, sneakers, belts, socks &amp; a watch.</p>
          </div>
          <button className="btn-primary" onClick={() => finish(true)}>Add starter wardrobe</button>
          <div className="h-2" />
          <button className="btn-ghost" onClick={() => setStepIdx(4)}>Start empty instead</button>
        </Center>
      )}

      {step === 'context' && (
        <Center>
          <h1>What&apos;s a typical day for you?</h1>
          <p className="lede">We&apos;ll default here — switch context anytime from Today.</p>
          <div className="flex flex-wrap gap-2 mb-5">
            {(Object.keys(CONTEXT_LABEL) as ContextId[]).map((c) => (
              <button key={c} className={`opt ${defaultContext === c ? 'opt-active' : ''}`} onClick={() => setDefaultContext(c)}>
                {CONTEXT_LABEL[c]}
              </button>
            ))}
          </div>
          <button className="btn-primary" onClick={() => finish(false)}>Show my first outfit</button>
        </Center>
      )}
    </div>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 overflow-y-auto flex flex-col justify-center px-6 py-6 [&>h1]:font-display [&>h1]:text-[28px] [&>h1]:font-medium [&>h1]:leading-tight [&>h1]:mb-2.5 [&>.lede]:text-[15px] [&>.lede]:text-ink-soft [&>.lede]:leading-relaxed [&>.lede]:mb-6 [&_label]:text-[12.5px] [&_label]:font-semibold [&_label]:text-ink-soft [&_label]:block [&_label]:mb-1.5 [&_.field]:flex [&_.field]:flex-col">
      {children}
    </div>
  );
}
