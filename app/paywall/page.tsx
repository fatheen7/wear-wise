'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X, Check } from 'lucide-react';
import { useStore } from '@/lib/store';

// Pricing is intentionally centralized here rather than hard-coded across
// the UI, per the product brief — swap these when wiring a real billing
// provider (Stripe/Razorpay) and everything below stays in sync.
const PLANS = {
  monthly: { price: '\u20b999', period: '/month' },
  yearly: { price: '\u20b9799', period: '/year' },
};

export default function PaywallPage() {
  const router = useRouter();
  const plan = useStore((s) => s.subscription.plan);
  const setSubscription = useStore((s) => s.setSubscription);

  function choose(p: 'monthly' | 'yearly') {
    setSubscription(p);
    router.push('/profile');
  }

  return (
    <div className="app-shell">
      <div className="flex-1 overflow-y-auto pb-6">
        <div className="topbar">
          <Link href="/profile" className="iconbtn"><X size={18} /></Link>
          <h1 className="font-display text-xl font-medium">WearWise Premium</h1>
          <div className="w-10" />
        </div>
        <div className="px-5 flex flex-col gap-2.5">
          <p className="text-ink-soft text-sm -mt-1">Unlimited wardrobe, unlimited stylist questions, and full outfit history.</p>

          <div className="card">
            <span className="font-semibold">Monthly</span>
            <div className="font-display text-[26px] mt-1">{PLANS.monthly.price}<span className="text-ink-soft text-[13px]">{PLANS.monthly.period}</span></div>
            <button className="btn-primary mt-3" onClick={() => choose('monthly')}>Choose monthly</button>
          </div>

          <div className="card relative" style={{ borderColor: 'rgb(var(--brass))', borderWidth: 1.5 }}>
            <span className="absolute -top-2.5 right-4 text-[10.5px] font-bold px-2 py-1 rounded-full bg-brass text-navy-ink">Best value</span>
            <span className="font-semibold">Yearly</span>
            <div className="font-display text-[26px] mt-1">{PLANS.yearly.price}<span className="text-ink-soft text-[13px]">{PLANS.yearly.period}</span></div>
            <ul className="flex flex-col gap-2 mt-3 text-[13.5px] text-ink-soft">
              {['Unlimited wardrobe', 'Unlimited stylist assistant', 'Full outfit history', 'Travel packing (coming soon)'].map((f) => (
                <li key={f} className="flex gap-2 items-start"><Check size={14} className="text-good flex-none mt-0.5" />{f}</li>
              ))}
            </ul>
            <button className="btn-primary mt-3.5" onClick={() => choose('yearly')}>Choose yearly</button>
          </div>

          {plan !== 'free' && <button className="btn-ghost" onClick={() => { setSubscription('free'); router.push('/profile'); }}>Cancel Premium</button>}

          <p className="text-ink-soft text-[11.5px] text-center mt-1">
            Demo only — no payment is processed. Wire this screen to Stripe, Razorpay, or RevenueCat before shipping.
          </p>
        </div>
      </div>
    </div>
  );
}
