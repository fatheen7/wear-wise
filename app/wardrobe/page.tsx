'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Plus, Shirt, Search } from 'lucide-react';
import { useStore, FREE_LIMITS } from '@/lib/store';
import BottomNav from '@/components/BottomNav';

const CATS = [
  { id: 'all', label: 'All' }, { id: 'tops', label: 'Tops' }, { id: 'bottoms', label: 'Bottoms' },
  { id: 'shoes', label: 'Shoes' }, { id: 'accessories', label: 'Accessories' },
];

export default function WardrobePage() {
  const wardrobe = useStore((s) => s.wardrobe);
  const plan = useStore((s) => s.subscription.plan);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');

  const items = useMemo(() => wardrobe.filter((i) => {
    if (i.archived) return false;
    if (filter !== 'all' && i.category !== filter) return false;
    if (query && !`${i.name} ${i.sub} ${i.color}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  }), [wardrobe, filter, query]);

  const cap_ = plan === 'free' ? FREE_LIMITS.wardrobeItems : Infinity;

  return (
    <div className="app-shell">
      <div className="flex-1 overflow-y-auto pb-4">
        <div className="topbar">
          <h1 className="font-display text-xl font-medium">Wardrobe</h1>
          <Link href="/wardrobe/add" className="iconbtn"><Plus size={18} /></Link>
        </div>
        <div className="px-5">
          <div className="relative mb-3">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
            <input
              className="field-input pl-10"
              placeholder="Search your wardrobe"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 mb-3.5">
            {CATS.map((c) => (
              <button key={c.id} className={`chip ${filter === c.id ? 'chip-active' : ''}`} onClick={() => setFilter(c.id)}>{c.label}</button>
            ))}
          </div>
          {plan === 'free' && (
            <div className="flex items-center justify-between mb-3">
              <span className="text-ink-soft text-[12.5px]">{wardrobe.length}/{cap_} items on Free</span>
              <Link href="/paywall" className="btn-text py-0">Upgrade</Link>
            </div>
          )}
          {items.length === 0 ? (
            <div className="text-center py-12 text-ink-soft">
              <Shirt size={34} className="mx-auto mb-3.5 text-hair" />
              <p>No items here yet.</p>
              <Link href="/wardrobe/add" className="btn-primary mt-2.5 inline-block">Add item</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {items.map((it) => (
                <Link key={it.id} href={`/wardrobe/${it.id}`} className="card">
                  <div className="w-full h-16 rounded-[10px] mb-2.5" style={{ background: it.hex }} />
                  <div className="text-[13.5px] font-semibold leading-tight">{it.name}</div>
                  <div className="text-[11.5px] text-ink-soft mt-0.5">{it.sub} · F{it.formality}</div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
