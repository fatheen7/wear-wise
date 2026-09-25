import { ColorName } from './types';

export const COLOR_HEX: Record<ColorName, string> = {
  navy: '#2C3560',
  black: '#26262B',
  white: '#F4F3EF',
  grey: '#9C9C9C',
  brown: '#7A4B32',
  'light blue': '#A9C4DE',
  blue: '#3B5D82',
  tan: '#C9AD82',
  silver: '#C7C9CE',
  maroon: '#6E2E33',
  beige: '#D8CBB0',
  olive: '#6B6B45',
};

// Which colors work well together. Used for shirt/trouser/shoe harmony
// and for the sock/belt matching logic. Kept as an explicit, editable
// table rather than a generated score so the reasoning stays legible.
export const COLOR_FRIENDS: Partial<Record<ColorName, ColorName[]>> = {
  navy: ['grey', 'white', 'brown', 'tan', 'light blue', 'black', 'beige'],
  grey: ['navy', 'black', 'brown', 'white', 'light blue', 'maroon'],
  black: ['white', 'grey', 'black', 'silver'],
  white: ['navy', 'black', 'grey', 'brown', 'light blue', 'blue', 'olive', 'maroon'],
  brown: ['navy', 'grey', 'tan', 'white', 'light blue', 'beige', 'olive'],
  'light blue': ['navy', 'grey', 'brown', 'white', 'tan'],
  blue: ['white', 'grey', 'brown', 'tan'],
  tan: ['navy', 'brown', 'white', 'light blue'],
  silver: ['navy', 'grey', 'black', 'white', 'light blue', 'brown'],
  beige: ['navy', 'brown', 'white', 'olive'],
  maroon: ['grey', 'navy', 'white'],
  olive: ['white', 'brown', 'tan', 'beige'],
};

export function colorScore(a: ColorName, b: ColorName): number {
  if (a === b) return 0.6;
  const friends = COLOR_FRIENDS[a] || [];
  return friends.includes(b) ? 1 : 0.25;
}

export function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
