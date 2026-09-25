'use client';
import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { useStore, FREE_LIMITS } from '@/lib/store';
import { useTodayOutfit } from '@/lib/useTodayOutfit';
import BottomNav from '@/components/BottomNav';

export default function AssistantPage() {
  const wardrobe = useStore((s) => s.wardrobe);
  const context = useStore((s) => s.user.defaultContext);
  const currentOutfitIds = useStore((s) => s.currentOutfitIds);
  const plan = useStore((s) => s.subscription.plan);
  const assistantLog = useStore((s) => s.assistantLog);
  const pushChat = useStore((s) => s.pushChat);
  const assistantCountToday = useStore((s) => s.assistantCountToday);
  const incAssistantCount = useStore((s) => s.incAssistantCount);
  const resetAssistantCountIfNewDay = useStore((s) => s.resetAssistantCountIfNewDay);
  const { weather } = useTodayOutfit();

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => { resetAssistantCountIfNewDay(); }, [resetAssistantCountIfNewDay]);
  useEffect(() => { logRef.current?.scrollTo({ top: logRef.current.scrollHeight }); }, [assistantLog, sending]);

  const remaining = plan === 'free' ? Math.max(0, FREE_LIMITS.assistantPerDay - assistantCountToday) : null;
  const disabled = sending || (remaining !== null && remaining <= 0);

  async function send() {
    const text = input.trim();
    if (!text || disabled) return;
    pushChat({ role: 'user', text });
    setInput('');
    setSending(true);

    const outfit = currentOutfitIds?.map((id) => wardrobe.find((w) => w.id === id)).filter(Boolean) || [];
    const top = outfit.find((i) => i?.category === 'tops')?.color;
    const bottom = outfit.find((i) => i?.category === 'bottoms')?.color;
    const shoe = outfit.find((i) => i?.category === 'shoes')?.color;

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, context: { wardrobe, weather, context, currentOutfit: { top, bottom, shoe } } }),
      });
      const data = await res.json();
      pushChat({ role: 'assistant', text: data.reply || 'Sorry, I couldn\u2019t work that out — try rephrasing.' });
    } catch {
      pushChat({ role: 'assistant', text: 'I\u2019m having trouble reaching the stylist service right now — try again in a moment.' });
    }
    incAssistantCount();
    setSending(false);
  }

  return (
    <div className="app-shell">
      <div className="topbar">
        <h1 className="font-display text-xl font-medium">Stylist assistant</h1>
        {plan === 'free' ? (
          <span className="text-[10.5px] font-bold px-2 py-1 rounded-full border border-hair text-ink-soft">{remaining} left today</span>
        ) : (
          <span className="text-[10.5px] font-bold px-2 py-1 rounded-full bg-brass text-navy-ink">Premium</span>
        )}
      </div>
      <div ref={logRef} className="flex-1 overflow-y-auto px-5 pb-4">
        <div className="flex flex-col gap-3 pt-1">
          {assistantLog.length === 0 && (
            <div className="max-w-[82%] px-4 py-2.5 rounded-2xl rounded-bl-[5px] bg-surface border border-hair text-[14.5px] leading-relaxed">
              Ask me things like &quot;navy shirt and grey trousers — what socks?&quot; or &quot;brown loafers or black shoes with these jeans?&quot;
            </div>
          )}
          {assistantLog.map((m, i) => (
            <div
              key={i}
              className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-[14.5px] leading-relaxed whitespace-pre-wrap ${
                m.role === 'user' ? 'self-end bg-navy text-white rounded-br-[5px]' : 'self-start bg-surface border border-hair rounded-bl-[5px]'
              }`}
            >
              {m.text}
            </div>
          ))}
          {sending && (
            <div className="self-start px-4 py-2.5 rounded-2xl rounded-bl-[5px] bg-surface border border-hair text-[14.5px] text-ink-soft">
              Thinking…
            </div>
          )}
        </div>
      </div>
      <div className="sticky bottom-[56px] flex gap-2 px-3.5 py-2.5 bg-paper border-t border-hair">
        <input
          className="flex-1 border border-hair bg-surface rounded-full px-4 py-2.5 text-[14.5px]"
          placeholder={disabled && remaining === 0 ? 'Daily limit reached — upgrade for more' : 'Ask about socks, shoes, colours…'}
          value={input}
          disabled={remaining === 0}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
        />
        <button className="w-[42px] h-[42px] rounded-full bg-navy text-white flex-none flex items-center justify-center disabled:opacity-40" onClick={send} disabled={disabled}>
          <Send size={17} />
        </button>
      </div>
      <BottomNav />
    </div>
  );
}
