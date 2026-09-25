import { WardrobeItem, ContextId } from './types';
import { COLOR_HEX } from './colorData';

export function makeId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function seedWardrobe(): WardrobeItem[] {
  const now = Date.now();
  const base: Omit<WardrobeItem, 'id' | 'hex' | 'createdAt'>[] = [
    { category: 'tops', sub: 'Formal shirt', color: 'navy', formality: 4, name: 'Navy formal shirt' },
    { category: 'tops', sub: 'Formal shirt', color: 'white', formality: 4, name: 'White formal shirt' },
    { category: 'tops', sub: 'Formal shirt', color: 'light blue', formality: 4, name: 'Light blue formal shirt' },
    { category: 'tops', sub: 'Polo', color: 'black', formality: 2, name: 'Black polo' },
    { category: 'tops', sub: 'T-shirt', color: 'grey', formality: 1, name: 'Grey t-shirt' },
    { category: 'bottoms', sub: 'Formal trousers', color: 'grey', formality: 4, name: 'Light grey trousers' },
    { category: 'bottoms', sub: 'Formal trousers', color: 'black', formality: 4, name: 'Black trousers' },
    { category: 'bottoms', sub: 'Chinos', color: 'navy', formality: 3, name: 'Navy chinos' },
    { category: 'bottoms', sub: 'Jeans', color: 'blue', formality: 2, name: 'Blue jeans' },
    { category: 'shoes', sub: 'Loafers', color: 'brown', formality: 4, name: 'Brown loafers' },
    { category: 'shoes', sub: 'Formal shoes', color: 'black', formality: 5, name: 'Black formal shoes' },
    { category: 'shoes', sub: 'Sneakers', color: 'white', formality: 1, name: 'White sneakers' },
    { category: 'accessories', sub: 'Belt', color: 'brown', formality: 4, name: 'Brown belt' },
    { category: 'accessories', sub: 'Belt', color: 'black', formality: 4, name: 'Black belt' },
    { category: 'accessories', sub: 'Socks', color: 'navy', formality: 3, name: 'Navy socks' },
    { category: 'accessories', sub: 'Socks', color: 'black', formality: 3, name: 'Black socks' },
    { category: 'accessories', sub: 'Socks', color: 'white', formality: 1, name: 'White socks' },
    { category: 'accessories', sub: 'Watch', color: 'silver', formality: 3, name: 'Silver watch' },
  ];
  return base.map((b) => ({ ...b, id: makeId(), hex: COLOR_HEX[b.color], createdAt: now }));
}

export const CONTEXT_LABEL: Record<ContextId, string> = {
  office: 'Office', college: 'College', casual: 'Casual', formal: 'Formal',
  interview: 'Interview', date: 'Date', dinner: 'Dinner', wedding: 'Wedding',
  travel: 'Travel', outdoor: 'Outdoor', home: 'Home',
};

export const CONTEXT_FORMALITY: Record<ContextId, [number, number]> = {
  office: [3, 4], college: [2, 3], casual: [1, 2], formal: [4, 5],
  interview: [4, 5], date: [2, 4], dinner: [3, 4], wedding: [4, 5],
  travel: [1, 3], outdoor: [1, 2], home: [1, 1],
};

export const CATEGORY_SUBS: Record<string, string[]> = {
  tops: ['Formal shirt', 'Casual shirt', 'Polo', 'T-shirt', 'Sweater', 'Jacket'],
  bottoms: ['Formal trousers', 'Chinos', 'Jeans', 'Shorts'],
  shoes: ['Formal shoes', 'Loafers', 'Sneakers', 'Boots', 'Sandals'],
  accessories: ['Belt', 'Watch', 'Socks', 'Sunglasses'],
};

export const QUICK_COLORS = ['navy', 'black', 'white', 'grey', 'brown', 'light blue', 'blue', 'tan', 'silver', 'beige', 'maroon', 'olive'] as const;
