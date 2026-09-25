'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Shirt, MessageCircle, History as HistoryIcon, User } from 'lucide-react';
import clsx from 'clsx';

const TABS = [
  { href: '/today', label: 'Today', icon: Home },
  { href: '/wardrobe', label: 'Wardrobe', icon: Shirt },
  { href: '/assistant', label: 'Assistant', icon: MessageCircle },
  { href: '/history', label: 'History', icon: HistoryIcon },
  { href: '/profile', label: 'Profile', icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="tabbar">
      {TABS.map((t) => {
        const active = pathname === t.href || pathname.startsWith(t.href + '/');
        const Icon = t.icon;
        return (
          <Link key={t.href} href={t.href} className={clsx('tab', active && 'tab-active')}>
            <Icon size={21} strokeWidth={1.8} />
            <span>{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
