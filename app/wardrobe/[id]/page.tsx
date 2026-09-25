'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Edit } from 'lucide-react';
import { useStore } from '@/lib/store';
import { cap } from '@/lib/colorData';

export default function ItemDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const item = useStore((s) => s.wardrobe.find((w) => w.id === params.id));

  if (!item) {
    if (typeof window !== 'undefined') router.replace('/wardrobe');
    return null;
  }

  return (
    <div className="app-shell">
      <div className="flex-1 overflow-y-auto pb-6">
        <div className="topbar">
          <Link href="/wardrobe" className="iconbtn"><ChevronLeft size={18} /></Link>
          <h1 className="font-display text-xl font-medium truncate px-2">{item.name}</h1>
          <Link href={`/wardrobe/add?id=${item.id}`} className="iconbtn"><Edit size={16} /></Link>
        </div>
        <div className="px-5">
          {item.photo ? (
            <img src={item.photo} alt="" className="w-full h-40 object-cover rounded-2xl mb-4" />
          ) : (
            <div className="w-full h-40 rounded-2xl mb-4" style={{ background: item.hex }} />
          )}
          <div className="card flex flex-col gap-2.5">
            <Row label="Category" value={cap(item.category)} />
            <Row label="Type" value={item.sub} />
            <Row label="Colour" value={cap(item.color)} />
            <Row label="Formality" value={`${item.formality}/5`} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-soft">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
