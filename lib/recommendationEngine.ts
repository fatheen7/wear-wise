import { WardrobeItem, WeatherSnapshot, ContextId, HistoryEntry, UserPrefs, OutfitCandidate, ColorName } from './types';
import { colorScore, cap } from './colorData';
import { CONTEXT_FORMALITY, CONTEXT_LABEL } from './seedData';

function byCategory(wardrobe: WardrobeItem[], cat: string) {
  return wardrobe.filter((i) => i.category === cat && !i.archived);
}

function weatherPenalty(item: WardrobeItem, weather: WeatherSnapshot): number {
  let p = 0;
  if (weather.tempC >= 32 && item.color === 'black' && item.category === 'tops') p += 0.15;
  if (weather.rainChance >= 55 && /suede/i.test(item.sub)) p += 0.35;
  return p;
}

function recentPenalty(item: WardrobeItem, history: HistoryEntry[]): number {
  const recent = history.slice(-3);
  let hit = 0;
  recent.forEach((h) => { if (h.itemIds.includes(item.id)) hit++; });
  return hit * 0.18;
}

function preferencePenalty(item: WardrobeItem, prefs: UserPrefs): number {
  if (prefs.dislikedColors?.includes(item.color)) return 0.4;
  return 0;
}
function preferenceBonus(item: WardrobeItem, prefs: UserPrefs): number {
  if (prefs.favoriteColors?.includes(item.color)) return 0.15;
  return 0;
}

export function bestSock(socks: WardrobeItem[], bottom: WardrobeItem, shoe: WardrobeItem, context: ContextId): WardrobeItem | null {
  if (!socks.length) return null;
  let best: WardrobeItem | null = null;
  let bestScore = -1;
  socks.forEach((s) => {
    let sc = Math.max(colorScore(s.color, bottom.color), colorScore(s.color, shoe.color) * 0.9);
    const formalFloor = CONTEXT_FORMALITY[context]?.[0] ?? 1;
    if (s.color === 'white' && formalFloor >= 3) sc -= 0.6;
    if (sc > bestScore) { bestScore = sc; best = s; }
  });
  return best;
}
export function bestBelt(belts: WardrobeItem[], shoe: WardrobeItem): WardrobeItem | null {
  if (!belts.length) return null;
  return belts.find((b) => b.color === shoe.color) || belts[0];
}

function buildReasons(opts: {
  top: WardrobeItem; bottom: WardrobeItem; shoe: WardrobeItem; sock: WardrobeItem | null;
  weather: WeatherSnapshot; context: ContextId; cTopBottom: number; cBottomShoe: number;
}): string[] {
  const { top, bottom, shoe, sock, weather, context, cTopBottom, cBottomShoe } = opts;
  const r: string[] = [];
  if (weather.tempC >= 30) {
    r.push(`It's ${Math.round(weather.tempC)}°C and ${weather.humidity}% humid, so lighter, breathable pieces will be more comfortable.`);
  } else if (weather.tempC < 20) {
    r.push(`It's a cooler ${Math.round(weather.tempC)}°C — this combination keeps you comfortable without overdressing. Consider a layer for the evening.`);
  } else {
    r.push(`Today's weather is mild, so this combination stays comfortable through the day.`);
  }
  if (cTopBottom >= 1 || cBottomShoe >= 1) {
    r.push(`${cap(top.color)} pairs well with ${bottom.color} bottoms, and ${shoe.color} ${shoe.sub.toLowerCase()} complement the trousers.`);
  } else {
    r.push(`${cap(top.color)} and ${bottom.color} keep the palette simple and easy to wear together.`);
  }
  r.push(`Formality suits ${CONTEXT_LABEL[context].toLowerCase()} settings.`);
  if (weather.rainChance >= 45) {
    r.push(`Rain chance is ${weather.rainChance}% — closed, non-suede shoes are the safer pick today.`);
  }
  if (weather.uv >= 8) {
    r.push(`UV is high today — lighter colours and a bit of shade during peak hours will help.`);
  }
  if (sock) {
    r.push(`${cap(sock.color)} socks tie the ${bottom.color} trousers and ${shoe.color} shoes together.`);
  }
  return r.slice(0, 3);
}

export function generateCandidates(
  wardrobe: WardrobeItem[], weather: WeatherSnapshot, context: ContextId,
  history: HistoryEntry[], prefs: UserPrefs, limit = 6
): OutfitCandidate[] {
  const [fMin, fMax] = CONTEXT_FORMALITY[context] || [1, 5];
  const inRange = (it: WardrobeItem, slack = 1) => it.formality >= fMin - slack && it.formality <= fMax + slack;

  const tops = byCategory(wardrobe, 'tops').filter((i) => inRange(i));
  const bottoms = byCategory(wardrobe, 'bottoms').filter((i) => inRange(i));
  const shoes = byCategory(wardrobe, 'shoes').filter((i) => inRange(i));
  const socksPool = byCategory(wardrobe, 'accessories').filter((i) => i.sub === 'Socks');
  const belts = byCategory(wardrobe, 'accessories').filter((i) => i.sub === 'Belt');
  const watches = byCategory(wardrobe, 'accessories').filter((i) => i.sub === 'Watch');

  if (!tops.length || !bottoms.length || !shoes.length) return [];

  const combos: OutfitCandidate[] = [];
  tops.forEach((top) => {
    bottoms.forEach((bottom) => {
      shoes.forEach((shoe) => {
        let score = 0;
        const cTopBottom = colorScore(top.color, bottom.color);
        const cBottomShoe = colorScore(bottom.color, shoe.color);
        score += cTopBottom * 30 + cBottomShoe * 25;

        const avgF = (top.formality + bottom.formality + shoe.formality) / 3;
        const fitCenter = (fMin + fMax) / 2;
        score += Math.max(0, 20 - Math.abs(avgF - fitCenter) * 10);

        let weatherAdj = 25;
        weatherAdj -= weatherPenalty(top, weather) * 25;
        weatherAdj -= weatherPenalty(bottom, weather) * 25;
        if (weather.tempC >= 30 && top.formality >= 4 && (top.color === 'navy' || top.color === 'black')) weatherAdj -= 4;
        score += Math.max(0, weatherAdj);

        score -= recentPenalty(top, history) * 10;
        score -= recentPenalty(bottom, history) * 10;
        score -= preferencePenalty(top, prefs) * 10;
        score -= preferencePenalty(bottom, prefs) * 10;
        score += preferenceBonus(top, prefs) * 10;
        score += preferenceBonus(bottom, prefs) * 10;

        const sock = bestSock(socksPool, bottom, shoe, context);
        const belt = bestBelt(belts, shoe);
        const watch = watches[0] || null;

        const items = [top, bottom, shoe] as WardrobeItem[];
        if (sock) items.push(sock);
        if (belt) items.push(belt);
        if (watch) items.push(watch);

        const reasons = buildReasons({ top, bottom, shoe, sock, weather, context, cTopBottom, cBottomShoe });

        combos.push({ itemIds: items.map((i) => i.id), items, score: Math.round(score), context, reasons });
      });
    });
  });

  combos.sort((a, b) => b.score - a.score);
  const seen = new Set<string>();
  const out: OutfitCandidate[] = [];
  for (const c of combos) {
    const key = c.items[0].id + '_' + c.items[1].id;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
    if (out.length >= limit) break;
  }
  return out;
}

export interface ScoreBreakdown {
  label: string; colorHarmony: string; formality: string; weather: string; comfort: string; overall: number;
}
export function scoreBreakdown(itemIds: string[], wardrobe: WardrobeItem[], weather: WeatherSnapshot, context: ContextId): ScoreBreakdown | null {
  const items = itemIds.map((id) => wardrobe.find((w) => w.id === id)).filter(Boolean) as WardrobeItem[];
  const top = items.find((i) => i.category === 'tops');
  const bottom = items.find((i) => i.category === 'bottoms');
  const shoe = items.find((i) => i.category === 'shoes');
  if (!top || !bottom || !shoe) return null;
  const colorH = (colorScore(top.color, bottom.color) + colorScore(bottom.color, shoe.color)) / 2;
  const [fMin, fMax] = CONTEXT_FORMALITY[context] || [1, 5];
  const avgF = (top.formality + bottom.formality + shoe.formality) / 3;
  const formalityFit = Math.max(0, 1 - Math.abs(avgF - (fMin + fMax) / 2) / 3);
  const weatherFit = weather.tempC >= 32 && top.formality >= 4 ? 0.7 : 0.92;
  const comfort = (formalityFit + weatherFit) / 2;
  const overall = colorH * 0.35 + formalityFit * 0.3 + weatherFit * 0.2 + comfort * 0.15;
  const label = overall > 0.75 ? 'Strong combination' : overall > 0.55 ? 'Good combination' : 'Consider adjusting';
  return {
    label,
    colorHarmony: colorH > 0.75 ? 'Strong' : colorH > 0.5 ? 'Good' : 'Mixed',
    formality: formalityFit > 0.7 ? `${CONTEXT_LABEL[context]} appropriate` : 'Slightly off for this setting',
    weather: weatherFit > 0.8 ? 'Good' : 'Fair',
    comfort: comfort > 0.75 ? 'Good' : 'Fair',
    overall: Math.round(overall * 100),
  };
}

export function recommendSocksFor(bottomColor: ColorName, shoeColor: ColorName, context: ContextId, wardrobe: WardrobeItem[]) {
  const pool = byCategory(wardrobe, 'accessories').filter((i) => i.sub === 'Socks');
  const candidates = pool.length ? pool.map((s) => s.color) : (['navy', 'black', 'brown'] as ColorName[]);
  const ranked = candidates.map((color) => {
    let sc = Math.max(colorScore(color, bottomColor), colorScore(color, shoeColor) * 0.9);
    const formalFloor = CONTEXT_FORMALITY[context]?.[0] ?? 1;
    if (color === 'white' && formalFloor >= 3) sc -= 0.6;
    return { color, sc };
  }).sort((a, b) => b.sc - a.sc);
  const good = Array.from(new Set(ranked.filter((r) => r.sc >= 0.6).map((r) => r.color)));
  const avoid = Array.from(new Set(ranked.filter((r) => r.sc < 0.4).map((r) => r.color)));
  return { good: good.slice(0, 3), avoid: avoid.slice(0, 2) };
}

export function compareShoes(bottomColor: ColorName, topColor: ColorName, wardrobe: WardrobeItem[]) {
  const shoes = byCategory(wardrobe, 'shoes');
  const pool = shoes.length ? shoes.map((s) => ({ color: s.color, sub: s.sub })) : [
    { color: 'brown' as ColorName, sub: 'Loafers' }, { color: 'black' as ColorName, sub: 'Formal shoes' }, { color: 'white' as ColorName, sub: 'Sneakers' },
  ];
  return pool.map((s) => {
    const sc = (colorScore(s.color, bottomColor) + colorScore(s.color, topColor)) / 2;
    const verdict = /sneaker/i.test(s.sub) ? 'casual alternative' : sc >= 0.7 ? 'strong' : sc >= 0.4 ? 'workable' : 'clashes';
    return { name: `${cap(s.color)} ${s.sub.toLowerCase()}`, verdict };
  });
}
