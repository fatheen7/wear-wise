'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { User, Check, Shirt, CloudOff } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useTodayOutfit } from '@/lib/useTodayOutfit';
import { WeatherService } from '@/lib/weatherService';
import { CONTEXT_LABEL } from '@/lib/seedData';
import { ContextId, WardrobeItem } from '@/lib/types';
import BottomNav from '@/components/BottomNav';

export default function TodayPage() {
  const router = useRouter();
  const wardrobe = useStore((s) => s.wardrobe);
  const location = useStore((s) => s.location);
  const userName = useStore((s) => s.user.name);
  const defaultContext = useStore((s) => s.user.defaultContext);
  const setDefaultContext = useStore((s) => s.setDefaultContext);
  const currentOutfitIds = useStore((s) => s.currentOutfitIds);
  const markWorn = useStore((s) => s.markWorn);

  const { weather, weatherLoading } = useTodayOutfit();
  const [toast, setToast] = useState<string | null>(null);

  const outfitItems = useMemo<WardrobeItem[]>(() => {
    if (!currentOutfitIds) return [];
    return currentOutfitIds.map((id) => wardrobe.find((w) => w.id === id)).filter(Boolean) as WardrobeItem[];
  }, [currentOutfitIds, wardrobe]);

  const candidates = useStore((s) => s.candidates);
  const reasons = candidates.find((c) => c.itemIds.join(',') === (currentOutfitIds || []).join(','))?.reasons
    || candidates[0]?.reasons || [];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  function wear() {
    markWorn();
    setToast('Marked as worn — saved to history');
    setTimeout(() => setToast(null), 1800);
  }

  return (
    <div className="app-shell">
      <div className="flex-1 overflow-y-auto pb-4">
        <div className="topbar">
          <div>
            <div className="text-[12.5px] text-ink-soft">{greeting}{userName ? `, ${userName}` : ''}</div>
            <h1 className="font-display text-xl font-medium">{location.name}</h1>
          </div>
          <Link href="/profile" className="iconbtn"><User size={18} /></Link>
        </div>

        <div className="px-5 flex flex-col gap-3.5">
          {wardrobe.length === 0 ? (
            <div className="text-center py-12 px-6 text-ink-soft">
              <Shirt size={40} className="mx-auto mb-3.5 text-hair" />
              <p><strong className="text-ink">Your wardrobe is empty.</strong><br />Add a few pieces and I&apos;ll build today&apos;s outfit.</p>
              <Link href="/wardrobe/add" className="btn-primary mt-2.5 inline-block">Add your first item</Link>
            </div>
          ) : weatherLoading && !weather ? (
            <div className="card text-center py-10 text-ink-soft text-sm">Reading today&apos;s weather…</div>
          ) : outfitItems.length === 0 ? (
            <div className="card text-center py-10 text-ink-soft text-sm">
              Add at least one top, bottom, and pair of shoes to get a recommendation.
            </div>
          ) : (
            <>
              <div className="rounded-lg bg-navy text-white px-[22px] pt-[26px] pb-[22px] relative overflow-hidden">
                <div className="absolute top-0 right-[22px] w-[34px] h-[46px] bg-brass rounded-b-[6px]" />
                <div className="text-[12px] tracking-wide text-white/65 uppercase mb-3.5">
                  {CONTEXT_LABEL[defaultContext]} · Today&apos;s outfit
                </div>
                <div className="flex flex-col gap-2.5 mb-[18px]">
                  {outfitItems.map((it) => (
                    <div key={it.id} className="flex items-baseline gap-2.5">
                      <span className="w-[9px] h-[9px] rounded-full flex-none mb-0.5" style={{ background: it.hex }} />
                      <span>
                        <span className="font-display text-[19px] font-medium leading-tight block">{it.name}</span>
                        <span className="text-[11px] text-white/50">{it.sub}</span>
                      </span>
                    </div>
                  ))}
                </div>
                {weather && (
                  <div className="flex items-center gap-2.5 pt-3.5 border-t border-white/15">
                    <div className="font-display text-[26px] font-medium">{Math.round(weather.tempC)}°</div>
                    <div className="text-[12.5px] text-white/70 leading-snug">
                      Feels like {Math.round(weather.feelsLikeC)}° · {WeatherService.summary(weather)}
                      {weather.source !== 'live' && <span className="block text-white/50">Showing {weather.source === 'cached' ? 'last saved' : 'estimated'} weather</span>}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                {reasons.slice(0, 3).map((r, i) => (
                  <div key={i} className="flex gap-2.5 items-start text-sm leading-relaxed">
                    <Check size={15} className="text-good flex-none mt-0.5" />
                    <span>{r}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2.5 mt-1">
                <button className="btn-primary" onClick={wear}>Wear this</button>
                <Link href="/today/change" className="btn-ghost text-center">Change</Link>
              </div>
              <Link href="/today/why" className="btn-text w-full text-center block">Why this outfit?</Link>
            </>
          )}

          {wardrobe.length > 0 && (
            <div>
              <h2 className="section-title mb-2">Context</h2>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {(Object.keys(CONTEXT_LABEL) as ContextId[]).map((c) => (
                  <button key={c} className={`chip ${defaultContext === c ? 'chip-active' : ''}`} onClick={() => setDefaultContext(c)}>
                    {CONTEXT_LABEL[c]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-24 bg-ink text-paper px-[18px] py-2.5 rounded-full text-[13.5px] font-medium z-50 shadow-lg">
          {toast}
        </div>
      )}

      <BottomNav />
    </div>
  );
}
