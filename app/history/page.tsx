'use client';
import { History as HistoryIcon, Heart, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { useStore, FREE_LIMITS } from '@/lib/store';
import { CONTEXT_LABEL } from '@/lib/seedData';
import BottomNav from '@/components/BottomNav';

export default function HistoryPage() {
  const wardrobe = useStore((s) => s.wardrobe);
  const history = useStore((s) => s.history);
  const plan = useStore((s) => s.subscription.plan);
  const toggleFavorite = useStore((s) => s.toggleFavorite);
  const rateHistory = useStore((s) => s.rateHistory);
  const deleteHistory = useStore((s) => s.deleteHistory);
  const setCurrentOutfit = useStore((s) => s.setCurrentOutfit);

  const cutoff = Date.now() - FREE_LIMITS.historyDays * 24 * 3600 * 1000;
  const visible = useMemo(() => {
    const filtered = plan === 'free' ? history.filter((h) => h.date >= cutoff) : history;
    return [...filtered].reverse();
  }, [history, plan, cutoff]);

  function reuse(itemIds: string[], context: any) {
    setCurrentOutfit(itemIds, context);
  }

  return (
    <div className="app-shell">
      <div className="flex-1 overflow-y-auto pb-4">
        <div className="topbar">
          <h1 className="font-display text-xl font-medium">History</h1>
        </div>
        <div className="px-5">
          {plan === 'free' && (
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-ink-soft text-[12.5px]">Free shows the last {FREE_LIMITS.historyDays} days</span>
              <Link href="/paywall" className="btn-text py-0">Upgrade</Link>
            </div>
          )}
          {visible.length === 0 ? (
            <div className="text-center py-12 text-ink-soft">
              <HistoryIcon size={34} className="mx-auto mb-3.5 text-hair" />
              <p>Outfits you wear will show up here.</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {visible.map((h) => {
                const items = h.itemIds.map((id) => wardrobe.find((w) => w.id === id)).filter(Boolean) as { id: string; name: string; hex: string }[];
                return (
                  <div key={h.id} className="py-3 border-b border-hair">
                    <div className="flex gap-3 items-center">
                      <div className="flex">
                        {items.slice(0, 4).map((it, i) => (
                          <div key={it.id} className="w-[26px] h-[26px] rounded-full border-2 border-surface" style={{ background: it.hex, marginLeft: i === 0 ? 0 : -9 }} />
                        ))}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">{items.slice(0, 3).map((i) => i.name).join(', ')}</div>
                        <div className="text-ink-soft text-xs">
                          {new Date(h.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} · {CONTEXT_LABEL[h.context] || ''}
                        </div>
                      </div>
                      <button className="iconbtn" onClick={() => toggleFavorite(h.id)}>
                        <Heart size={16} fill={h.favorite ? 'currentColor' : 'none'} className={h.favorite ? 'text-clay' : ''} />
                      </button>
                      <button className="iconbtn" onClick={() => deleteHistory(h.id)}><Trash2 size={16} /></button>
                    </div>
                    <div className="flex items-center gap-2 mt-2 pl-[26px]">
                      <button className="chip !py-1 !px-2.5 !text-[11.5px]" onClick={() => reuse(h.itemIds, h.context)}>Wear again</button>
                      {(['great', 'okay', 'not-for-me'] as const).map((r) => (
                        <button
                          key={r}
                          className={`chip !py-1 !px-2.5 !text-[11.5px] ${h.rating === r ? 'chip-active' : ''}`}
                          onClick={() => rateHistory(h.id, r)}
                        >
                          {r === 'great' ? 'Great' : r === 'okay' ? 'Okay' : 'Not for me'}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
