'use client';
import { useEffect } from 'react';
import { useStore } from '@/lib/store';

export default function ThemeSync() {
  const theme = useStore((s) => s.settings.theme);
  const hasHydrated = useStore((s) => s.hasHydrated);

  useEffect(() => {
    if (!hasHydrated) return;
    const root = document.documentElement;
    if (theme === 'light') root.setAttribute('data-theme', 'light');
    else if (theme === 'dark') root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');
  }, [theme, hasHydrated]);

  return null;
}
