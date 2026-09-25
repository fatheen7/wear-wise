import { WardrobeItem, WeatherSnapshot, ContextId, ColorName } from './types';
import { colorScore, cap, COLOR_FRIENDS } from './colorData';
import { recommendSocksFor, compareShoes } from './recommendationEngine';

const COLOR_WORDS = Object.keys(COLOR_FRIENDS).concat(['tan', 'maroon', 'beige', 'olive']);
function extractColors(text: string): ColorName[] {
  const t = text.toLowerCase();
  return COLOR_WORDS.filter((c) => t.includes(c)) as ColorName[];
}

export interface AssistantContext {
  wardrobe: WardrobeItem[];
  weather?: WeatherSnapshot;
  context: ContextId;
  currentOutfit?: { top?: string; bottom?: string; shoe?: string } | null;
}

/**
 * Deterministic fallback assistant. Used whenever ANTHROPIC_API_KEY is not
 * configured (see app/api/assistant/route.ts), and as the logic the AI
 * version is instructed to stay consistent with. Every reply is grounded
 * in the same recommendation engine the rest of the app uses.
 */
export function assistantReply(text: string, ctx: AssistantContext): string {
  const t = text.toLowerCase();
  const colors = extractColors(text);
  const lastTop = ctx.currentOutfit?.top;
  const lastBottom = ctx.currentOutfit?.bottom;
  const lastShoe = ctx.currentOutfit?.shoe;

  if (/rain/.test(t)) {
    const hasSuede = ctx.wardrobe.some((w) => /suede/i.test(w.sub));
    if (hasSuede) {
      return `Then I'd skip the suede pieces — leather or formal shoes handle wet weather much better. ${lastShoe ? `Swap out the ${lastShoe} for a closed leather pair.` : ''}`.trim();
    }
    return `Good call checking — with rain around, stick to closed, non-suede shoes and maybe keep a darker sock on hand in case of splashes.`;
  }

  if (/sock/.test(t)) {
    const bottom = colors[0] || (lastBottom as ColorName) || 'grey';
    const shoe = colors[1] || (lastShoe as ColorName) || 'brown';
    const rec = recommendSocksFor(bottom, shoe, ctx.context, ctx.wardrobe);
    let msg = `With ${bottom} trousers and ${shoe} shoes, go with ${rec.good.join(' or ') || 'navy or charcoal'} socks.`;
    if (rec.avoid.length) msg += ` I'd avoid ${rec.avoid.join(' or ')} — it breaks the formal line.`;
    return msg;
  }

  if (/shoe|loafer|sneaker|footwear/.test(t)) {
    const bottom = colors[0] || (lastBottom as ColorName) || 'grey';
    const top = colors[1] || (lastTop as ColorName) || 'navy';
    const options = compareShoes(bottom, top, ctx.wardrobe);
    const lines = options.map((o) => `${o.name} — ${o.verdict}`);
    return `For ${bottom} trousers and a ${top} top:\n${lines.join('\n')}`;
  }

  if (/hot|weather|today|humid/.test(t) && /wear|outfit/.test(t)) {
    if (ctx.weather) {
      const w = ctx.weather;
      return `It's ${Math.round(w.tempC)}°C and ${w.humidity}% humid right now, so I'd lean toward lighter colours and breathable formal pieces. Check the Today tab for the full pick, or tell me your context and I'll tailor it.`;
    }
    return `I'd lean toward lighter colours and breathable pieces today. Check the Today tab for the full recommendation.`;
  }

  if (colors.length >= 2) {
    const [a, b] = colors;
    const sc = colorScore(a, b);
    if (sc >= 0.9) return `${cap(a)} and ${b} is a safe, classic pairing — hard to get wrong.`;
    if (sc >= 0.6) return `${cap(a)} and ${b} works, though it reads a little more matched than contrasted.`;
    return `${cap(a)} and ${b} is a bold combination — fine for casual, but I wouldn't reach for it in a formal setting.`;
  }
  if (colors.length === 1) {
    const friends = COLOR_FRIENDS[colors[0]] || [];
    return `${cap(colors[0])} pairs best with ${friends.slice(0, 4).join(', ') || 'neutral tones'}.`;
  }
  if (/belt/.test(t)) {
    return `Match your belt to your shoes, not your trousers — brown shoes get a brown belt, black shoes get a black belt.`;
  }
  return `Tell me what you're wearing — like "navy shirt and grey trousers" — and I'll tell you what shoes, socks, or accessories to add.`;
}
