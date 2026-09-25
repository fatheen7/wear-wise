'use client';
import { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Camera, Loader2, Lock } from 'lucide-react';
import { useStore, FREE_LIMITS } from '@/lib/store';
import { CATEGORY_SUBS, QUICK_COLORS } from '@/lib/seedData';
import { COLOR_HEX, cap } from '@/lib/colorData';
import { Category, ColorName } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default function AddItemPage() {
  return (
    <Suspense fallback={null}>
      <AddItemForm />
    </Suspense>
  );
}

function AddItemForm() {
  const router = useRouter();
  const params = useSearchParams();
  const editId = params.get('id');
  const hasHydrated = useStore((s) => s.hasHydrated);
  const wardrobe = useStore((s) => s.wardrobe);
  const plan = useStore((s) => s.subscription.plan);
  const addWardrobeItem = useStore((s) => s.addWardrobeItem);
  const updateWardrobeItem = useStore((s) => s.updateWardrobeItem);
  const deleteWardrobeItem = useStore((s) => s.deleteWardrobeItem);

  const editing = editId ? wardrobe.find((w) => w.id === editId) : null;

  const [category, setCategory] = useState<Category>(editing?.category || 'tops');
  const [sub, setSub] = useState(editing?.sub || CATEGORY_SUBS.tops[0]);
  const [color, setColor] = useState<ColorName>((editing?.color as ColorName) || 'navy');
  const [formality, setFormality] = useState<1 | 2 | 3 | 4 | 5>(editing?.formality || 3);
  const [name, setName] = useState(editing?.name || '');
  const [photo, setPhoto] = useState<string | undefined>(editing?.photo);
  const [scanning, setScanning] = useState(false);
  const [scanNote, setScanNote] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // On a fresh page load (direct link to ?id=..., or a refresh while
  // editing), `wardrobe` is still empty until the persisted store
  // rehydrates, so `editing` is undefined on first render and this form's
  // local state gets seeded with blank defaults. The effect used to key
  // only on `editId`, which never changes, so it never re-ran once
  // hydration filled `wardrobe` back in — the edit form silently stayed
  // blank. Re-run once hydration completes (and whenever the underlying
  // item's fields change) so the real saved values show up.
  useEffect(() => {
    if (!hasHydrated || !editing) return;
    setCategory(editing.category);
    setSub(editing.sub);
    setColor(editing.color as ColorName);
    setFormality(editing.formality);
    setName(editing.name);
    setPhoto(editing.photo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated, editId, editing?.category, editing?.sub, editing?.color, editing?.formality, editing?.name, editing?.photo]);

  const atCap = !editing && plan === 'free' && wardrobe.length >= FREE_LIMITS.wardrobeItems;

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setPhoto(dataUrl);
      setScanning(true);
      setScanNote(null);
      try {
        const base64 = dataUrl.split(',')[1];
        const mediaType = file.type || 'image/jpeg';
        const res = await fetch('/api/vision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64, mediaType }),
        });
        const data = await res.json();
        if (data.available && data.item) {
          setCategory(data.item.category);
          setSub(data.item.sub);
          setColor(data.item.color);
          setFormality(data.item.formality);
          setName(data.item.name);
          setScanNote('Identified automatically — check the details below.');
        } else {
          setScanNote('AI recognition isn\u2019t configured on this deployment — confirm the details manually below.');
        }
      } catch {
        setScanNote('Couldn\u2019t reach recognition — confirm the details manually below.');
      }
      setScanning(false);
    };
    reader.readAsDataURL(file);
  }

  function save() {
    const finalName = name.trim() || `${cap(color)} ${sub.toLowerCase()}`;
    const payload = { category, sub, color, formality, name: finalName, hex: COLOR_HEX[color], photo };
    if (editing) updateWardrobeItem(editing.id, payload);
    else addWardrobeItem(payload);
    router.push('/wardrobe');
  }
  function remove() {
    if (!editing) return;
    deleteWardrobeItem(editing.id);
    router.push('/wardrobe');
  }

  if (atCap) {
    return (
      <div className="app-shell">
        <div className="topbar">
          <Link href="/wardrobe" className="iconbtn"><ChevronLeft size={18} /></Link>
          <h1 className="font-display text-xl font-medium">Add item</h1>
          <div className="w-10" />
        </div>
        <div className="px-5">
          <div className="card text-center py-8 px-5">
            <Lock size={28} className="mx-auto" />
            <p className="font-semibold mt-3 mb-1">Free wardrobe limit reached</p>
            <p className="text-ink-soft text-[13.5px]">Upgrade to Premium for an unlimited wardrobe.</p>
            <Link href="/paywall" className="btn-primary mt-3.5 inline-block">See Premium</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="flex-1 overflow-y-auto pb-6">
        <div className="topbar">
          <Link href="/wardrobe" className="iconbtn"><ChevronLeft size={18} /></Link>
          <h1 className="font-display text-xl font-medium">{editing ? 'Edit item' : 'Add item'}</h1>
          <div className="w-10" />
        </div>
        <div className="px-5">
          <div className="card text-center p-5 mb-4">
            {photo ? (
              <img src={photo} alt="" className="w-full h-[130px] object-cover rounded-xl mb-2.5" />
            ) : (
              <div className="w-full h-[130px] rounded-xl mb-2.5 flex items-center justify-center" style={{ background: COLOR_HEX[color] }} />
            )}
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />
            <button className="btn-ghost flex items-center justify-center gap-2" onClick={() => fileRef.current?.click()} disabled={scanning}>
              {scanning ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
              {scanning ? 'Identifying…' : photo ? 'Retake photo' : 'Take or upload photo'}
            </button>
            {scanNote && <p className="text-ink-soft text-[12px] mt-2">{scanNote}</p>}
          </div>

          <Field label="Category">
            <div className="flex flex-wrap gap-2">
              {Object.keys(CATEGORY_SUBS).map((c) => (
                <button key={c} className={`opt ${category === c ? 'opt-active' : ''}`} onClick={() => { setCategory(c as Category); setSub(CATEGORY_SUBS[c][0]); }}>{cap(c)}</button>
              ))}
            </div>
          </Field>
          <Field label="Type">
            <div className="flex flex-wrap gap-2">
              {CATEGORY_SUBS[category].map((s) => (
                <button key={s} className={`opt ${sub === s ? 'opt-active' : ''}`} onClick={() => setSub(s)}>{s}</button>
              ))}
            </div>
          </Field>
          <Field label="Colour">
            <div className="flex flex-wrap gap-2.5">
              {QUICK_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c as ColorName)}
                  className="w-9 h-9 rounded-full relative border-2"
                  style={{ background: COLOR_HEX[c as ColorName], borderColor: color === c ? 'rgb(var(--navy-ink))' : 'transparent' }}
                >
                  {color === c && <span className="absolute inset-0 flex items-center justify-center text-white text-xs">✓</span>}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Formality (1 casual — 5 formal)">
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} className={`opt ${formality === n ? 'opt-active' : ''}`} onClick={() => setFormality(n as 1 | 2 | 3 | 4 | 5)}>{n}</button>
              ))}
            </div>
          </Field>
          <Field label="Name (optional)">
            <input className="field-input" placeholder={`${cap(color)} ${sub.toLowerCase()}`} value={name} onChange={(e) => setName(e.target.value)} />
          </Field>

          <button className="btn-primary" onClick={save}>{editing ? 'Save changes' : 'Add to wardrobe'}</button>
          {editing && <button className="btn-text w-full text-center mt-2" style={{ color: 'rgb(176 69 61)' }} onClick={remove}>Delete item</button>}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="text-[12.5px] font-semibold text-ink-soft block mb-1.5">{label}</label>
      {children}
    </div>
  );
}
