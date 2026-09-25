'use client';
import Link from 'next/link';
import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useStore } from '@/lib/store';
import { scoreBreakdown } from '@/lib/recommendationEngine';
import { useTodayOutfit } from '@/lib/useTodayOutfit';
import { Category } from '@/lib/types';
import { cap } from '@/lib/colorData';

const GROUPS: Category[] = ['tops', 'bottoms', 'shoes'];

export default function BuilderPage() {
  const wardrobe = useStore((s) => s.wardrobe);
  const context = useStore((s) => s.user.defaultContext);
  const { weather } = useTodayOutfit();

  const [pick, setPick] = useState<{ tops?: string; bottoms?: string; shoes?: string; accessories: Record<string, boolean> }>({ accessories: {} });
  const [saved, setSaved] = useState(false);

  const byCat = (cat: Category) => wardrobe.filter((i) => i.category === cat && !i.archived);

  const ids = [pick.tops, pick.bottoms, pick.shoes, ...Object.keys(pick.accessories).filter((k) => pick.accessories[k])].filter(Boolean) as string[];
  const sb = pick.tops && pick.bottoms && pick.shoes && weather ? scoreBreakdown(ids, wardrobe, weather, context) : null;

  function saveOutfit() {
    if (!pick.tops || !pick.bottoms || !pick.shoes) return;
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
    useStore.setState((s) => ({
      history: [...s.history, { id: Math.random().toString(36).slice(2), date: Date.now(), context, itemIds: ids }],
    }));
  }

  return (
    <div className="app-shell">
      <div className="flex-1 overflow-y-auto pb-6">
        <div className="topbar">
          <Link href="/today" className="iconbtn"><ChevronLeft size={18} /></Link>
          <h1 className="font-display text-xl font-medium">Outfit builder</h1>
          <div className="w-10" />
        </div>
        <div className="px-5 flex flex-col gap-4">
          {GROUPS.map((g) => (
            <div key={g}>
              <h2 className="section-title mb-2 capitalize">{g}</h2>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {byCat(g).length === 0 && <span className="text-ink-soft text-[13px]">Add items to this category first.</span>}
                {byCat(g).map((it) => (
                  <button key={it.id} className={`chip ${pick[g] === it.id ? 'chip-active' : ''}`} onClick={() => setPick((p) => ({ ...p, [g]: p[g] === it.id ? undefined : it.id }))}>
                    {it.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div>
            <h2 className="section-title mb-2">Accessories</h2>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {byCat('accessories').length === 0 && <span className="text-ink-soft text-[13px]">None yet.</span>}
              {byCat('accessories').map((it) => (
                <button
                  key={it.id}
                  className={`chip ${pick.accessories[it.id] ? 'chip-active' : ''}`}
                  onClick={() => setPick((p) => ({ ...p, accessories: { ...p.accessories, [it.id]: !p.accessories[it.id] } }))}
                >
                  {it.name}
                </button>
              ))}
            </div>
          </div>

          {!sb ? (
            <div className="card text-ink-soft text-[13.5px]">Pick a top, bottom, and shoe to see your outfit score.</div>
          ) : (
            <div className="card">
              <div className="flex items-center justify-between">
                <h2 className="section-title">{sb.label}</h2>
                <span className="text-[10.5px] font-bold px-2 py-1 rounded-full bg-brass text-navy-ink">{sb.overall}</span>
              </div>
              <div className="flex flex-col gap-2.5 mt-3">
                <ScoreRow label="Colour harmony" value={sb.colorHarmony} />
                <ScoreRow label="Formality" value={sb.formality} />
                <ScoreRow label="Weather suitability" value={sb.weather} />
                <ScoreRow label="Comfort" value={sb.comfort} />
              </div>
              <button className="btn-primary mt-3.5" onClick={saveOutfit}>{saved ? 'Saved!' : 'Save this outfit'}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ScoreRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[13.5px]">
      <span className="text-ink-soft">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
