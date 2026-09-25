'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { useStore } from '@/lib/store';

export default function SplashPage() {
  const router = useRouter();
  const hasHydrated = useStore((s) => s.hasHydrated);
  const onboarded = useStore((s) => s.onboarded);

  useEffect(() => {
    if (!hasHydrated) return;
    const t = setTimeout(() => {
      router.replace(onboarded ? '/today' : '/onboarding');
    }, 700);
    return () => clearTimeout(t);
  }, [hasHydrated, onboarded, router]);

  return (
    <div className="app-shell items-center justify-center gap-3.5 text-center overflow-y-auto">
      <div className="w-[72px] h-[72px] rounded-[20px] bg-navy flex items-center justify-center">
        <Sparkles size={32} color="#fff" strokeWidth={1.6} />
      </div>
      <h1 className="font-display text-2xl font-medium">WearWise</h1>
      <p className="text-ink-soft text-[13px]">Open the app. Know what to wear.</p>
    </div>
  );
}
