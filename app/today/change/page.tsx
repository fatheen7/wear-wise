'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Shirt } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useTodayOutfit } from '@/lib/useTodayOutfit';

export default function ChangeOutfitPage() {
  const router = useRouter();
  const setCurrentOutfit = useStore((s) => s.setCurrentOutfit);
  const context = useStore((s) => s.user.defaultContext);
  useTodayOutfit();
  const candidates = useStore((s) => s.candidates);

  function pick(idx: number) {
    setCurrentOutfit(candidates[idx].itemIds, context);
    router.push('/today');
  }

  return (
    <div className="app-shell">
      <div className="flex-1 overflow-y-auto">
        <div className="topbar">
          <Link href="/today" className="iconbtn"><ChevronLeft size={18} /></Link>
          <h1 className="font-display text-xl font-medium">Other combinations</h1>
          <div className="w-10" />
        </div>
        <div className="px-5 flex flex-col gap-2.5 pb-6">
          {candidates.length === 0 ? (
            <div className="text-center py-12 text-ink-soft">
              <Shirt size={34} className="mx-auto mb-3.5 text-hair" />
              <p>Add a few more items to unlock alternate combinations.</p>
            </div>
          ) : candidates.map((c, i) => (
            <button key={i} className="card text-left" onClick={() => pick(i)}>
              <div className="flex items-center justify-between">
                <span className="text-[12.5px] text-ink-soft">Option {i + 1}</span>
                <span className="text-[10.5px] font-bold px-2 py-1 rounded-full bg-hair text-ink-soft">{c.score}</span>
              </div>
              <div className="flex flex-col gap-1.5 mt-2">
                {c.items.slice(0, 4).map((it) => (
                  <div key={it.id} className="flex items-center gap-2.5 text-sm">
                    <span className="w-3 h-3 rounded-full inline-block flex-none" style={{ background: it.hex }} />
                    {it.name}
                  </div>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
