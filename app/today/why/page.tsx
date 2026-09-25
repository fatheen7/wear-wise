'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useEffect } from 'react';
import { ChevronLeft, Check } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useTodayOutfit } from '@/lib/useTodayOutfit';
import { scoreBreakdown } from '@/lib/recommendationEngine';
import { WardrobeItem } from '@/lib/types';

export default function WhyOutfitPage() {
  const router = useRouter();
  const wardrobe = useStore((s) => s.wardrobe);
  const currentOutfitIds = useStore((s) => s.currentOutfitIds);
  const context = useStore((s) => s.user.defaultContext);
  const candidates = useStore((s) => s.candidates);
  const markWorn = useStore((s) => s.markWorn);
  const { weather } = useTodayOutfit();

  const items = useMemo<WardrobeItem[]>(() => (currentOutfitIds || [])
    .map((id) => wardrobe.find((w) => w.id === id))
    .filter(Boolean) as WardrobeItem[], [currentOutfitIds, wardrobe]);

  const reasons = candidates.find((c) => c.itemIds.join(',') === (currentOutfitIds || []).join(','))?.reasons || [];
  const sb = weather && currentOutfitIds ? scoreBreakdown(currentOutfitIds, wardrobe, weather, context) : null;

  useEffect(() => {
    if (!currentOutfitIds || items.length === 0) router.replace('/today');
  }, [currentOutfitIds, items.length, router]);

  if (!currentOutfitIds || items.length === 0) {
    return null;
  }

  const rows: [string, keyof NonNullable<typeof sb>][] = [
    ['Colour harmony', 'colorHarmony'], ['Formality', 'formality'], ['Weather suitability', 'weather'], ['Comfort', 'comfort'],
  ];

  return (
    <div className="app-shell">
      <div className="flex-1 overflow-y-auto">
        <div className="topbar">
          <Link href="/today" className="iconbtn"><ChevronLeft size={18} /></Link>
          <h1 className="font-display text-xl font-medium">Why this outfit</h1>
          <div className="w-10" />
        </div>
        <div className="px-5 flex flex-col gap-2.5 pb-6">
          <div className="card">
            <h2 className="section-title">The pieces</h2>
            <div className="flex flex-col gap-2.5 mt-2.5">
              {items.map((it) => (
                <div key={it.id} className="flex items-center justify-between">
                  <span className="flex items-center gap-2.5">
                    <span className="w-4 h-4 rounded-full inline-block" style={{ background: it.hex }} />
                    {it.name}
                  </span>
                  <span className="text-ink-soft text-[12.5px]">{it.sub}</span>
                </div>
              ))}
            </div>
          </div>

          {sb && (
            <div className="card">
              <div className="flex items-center justify-between">
                <h2 className="section-title">{sb.label}</h2>
                <span className="text-[10.5px] font-bold px-2 py-1 rounded-full bg-brass text-navy-ink">{sb.overall}</span>
              </div>
              <div className="flex flex-col gap-2.5 mt-3">
                {rows.map(([label, key]) => (
                  <div key={key} className="flex items-center justify-between text-[13.5px]">
                    <span className="text-ink-soft">{label}</span>
                    <strong>{sb[key]}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card">
            <h2 className="section-title">Reasoning</h2>
            <div className="flex flex-col gap-2.5 mt-2.5">
              {reasons.map((r, i) => (
                <div key={i} className="flex gap-2.5 items-start text-sm leading-relaxed">
                  <Check size={15} className="text-good flex-none mt-0.5" />
                  <span>{r}</span>
                </div>
              ))}
            </div>
          </div>

          <button className="btn-primary" onClick={() => { markWorn(); router.push('/today'); }}>Wear this</button>
          <Link href="/today/change" className="btn-ghost text-center">Try another combination</Link>
        </div>
      </div>
    </div>
  );
}
