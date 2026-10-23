export type ColorKey = 'black' | 'brown' | 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'violet' | 'grey' | 'white' | 'gold' | 'silver' | 'pink' | 'none';
export type ToleranceKey = Exclude<ColorKey, 'black' | 'orange' | 'yellow' | 'white' | 'pink'> | 'none';
export type BandCount = 4 | 5;
export type Bands = ColorKey[];
export type Series = 'e24' | 'all';

export interface ResistorColor {
  key: ColorKey;
  label: string;
  hex: string;
  digit?: number;
  multiplier?: number;
  tolerance?: number;
}

export const COLORS: ResistorColor[] = [
  { key: 'black', label: 'Siyah', hex: '#252827', digit: 0, multiplier: 1 },
  { key: 'brown', label: 'Kahverengi', hex: '#805033', digit: 1, multiplier: 10, tolerance: 1 },
  { key: 'red', label: 'Kırmızı', hex: '#c8473d', digit: 2, multiplier: 100, tolerance: 2 },
  { key: 'orange', label: 'Turuncu', hex: '#e77d31', digit: 3, multiplier: 1_000 },
  { key: 'yellow', label: 'Sarı', hex: '#e6bb42', digit: 4, multiplier: 10_000 },
  { key: 'green', label: 'Yeşil', hex: '#47865c', digit: 5, multiplier: 100_000, tolerance: 0.5 },
  { key: 'blue', label: 'Mavi', hex: '#477caa', digit: 6, multiplier: 1_000_000, tolerance: 0.25 },
  { key: 'violet', label: 'Mor', hex: '#8663a3', digit: 7, multiplier: 10_000_000, tolerance: 0.1 },
  { key: 'grey', label: 'Gri', hex: '#929899', digit: 8, multiplier: 100_000_000, tolerance: 0.05 },
  { key: 'white', label: 'Beyaz', hex: '#faf9f3', digit: 9, multiplier: 1_000_000_000 },
  { key: 'gold', label: 'Altın', hex: '#bb9850', multiplier: 0.1, tolerance: 5 },
  { key: 'silver', label: 'Gümüş', hex: '#b9c0c4', multiplier: 0.01, tolerance: 10 },
  { key: 'pink', label: 'Pembe', hex: '#e99aad', multiplier: 0.001 },
  { key: 'none', label: 'Renksiz', hex: 'transparent', tolerance: 20 },
];

export const colorByKey = Object.fromEntries(COLORS.map(color => [color.key, color])) as Record<ColorKey, ResistorColor>;
export const DIGIT_COLORS = COLORS.filter(color => color.digit !== undefined).map(color => color.key);
export const FIRST_COLORS = DIGIT_COLORS.filter(key => key !== 'black');
export const MULTIPLIER_COLORS: ColorKey[] = ['pink', 'silver', 'gold', ...DIGIT_COLORS];
export const TOLERANCE_COLORS: ToleranceKey[] = ['grey', 'violet', 'blue', 'green', 'brown', 'red', 'gold', 'silver'];
export const TOLERANCE_OPTIONS: ToleranceKey[] = ['none', ...TOLERANCE_COLORS];
export const FOUR_BAND_OPTIONS: ColorKey[][] = [FIRST_COLORS, DIGIT_COLORS, MULTIPLIER_COLORS, TOLERANCE_OPTIONS];
export const FIVE_BAND_OPTIONS: ColorKey[][] = [FIRST_COLORS, DIGIT_COLORS, DIGIT_COLORS, MULTIPLIER_COLORS, TOLERANCE_COLORS];
export const BAND_OPTIONS = FIVE_BAND_OPTIONS;
export const DEFAULT_BANDS: Bands = ['yellow', 'violet', 'black', 'red', 'brown'];
export const DEFAULT_FOUR_BANDS: Bands = ['yellow', 'violet', 'orange', 'none'];

export function bandOptions(count: BandCount): ColorKey[][] {
  return count === 4 ? FOUR_BAND_OPTIONS : FIVE_BAND_OPTIONS;
}

export function bandTitle(index: number, count: BandCount): string {
  if (index < count - 2) return `${index + 1}. rakam`;
  if (index === count - 2) return 'Çarpan';
  return 'Tolerans';
}

export interface Resistor {
  bands: Bands;
  ohms: number;
  tolerance: number;
  min: number;
  max: number;
}

function toleranceFor(key: ColorKey): number {
  const tolerance = colorByKey[key].tolerance;
  if (tolerance === undefined) throw new RangeError(`${colorByKey[key].label} tolerans rengi değil`);
  return tolerance;
}

export function calculate(bands: Bands): Resistor {
  if (bands.length !== 4 && bands.length !== 5) throw new RangeError('Direnç 4 veya 5 bantlı olmalı');
  const count = bands.length as BandCount;
  const options = bandOptions(count);
  bands.forEach((key, index) => {
    if (!options[index].includes(key)) throw new RangeError(`${index + 1}. bantta ${colorByKey[key].label} kullanılamaz`);
  });

  const digitCount = count - 2;
  const digits = bands.slice(0, digitCount).map(key => colorByKey[key].digit!);
  const significand = digits.reduce((value, digit) => value * 10 + digit, 0);
  const multiplier = colorByKey[bands[digitCount]].multiplier;
  if (multiplier === undefined) throw new RangeError('Geçersiz çarpan rengi');
  const ohms = significand * multiplier;
  const tolerance = toleranceFor(bands[count - 1]);
  return {
    bands,
    ohms,
    tolerance,
    min: ohms * (1 - tolerance / 100),
    max: ohms * (1 + tolerance / 100),
  };
}

export function formatOhms(value: number): string {
  const units: Array<[number, string]> = [[1e9, 'GΩ'], [1e6, 'MΩ'], [1e3, 'kΩ'], [1, 'Ω']];
  const [scale, unit] = units.find(([limit]) => value >= limit) ?? [1, 'Ω'];
  const scaled = value / scale;
  const maximumFractionDigits = scaled < 1 ? 5 : scaled < 10 ? 4 : scaled < 100 ? 3 : 2;
  return `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits }).format(scaled)} ${unit}`;
}

export const E24 = [10, 11, 12, 13, 15, 16, 18, 20, 22, 24, 27, 30, 33, 36, 39, 43, 47, 51, 56, 62, 68, 75, 82, 91];

export function searchResistors(targetOhms: number, series: Series, toleranceColor: ToleranceKey, bandCount: BandCount = 5): Resistor[] {
  if (bandCount === 5 && toleranceColor === 'none') return [];
  const significands = series === 'e24'
    ? (bandCount === 4 ? E24 : E24.map(value => value * 10))
    : Array.from({ length: bandCount === 4 ? 90 : 900 }, (_, i) => i + (bandCount === 4 ? 10 : 100));
  const tolerance = toleranceFor(toleranceColor);
  const results: Resistor[] = [];

  for (const significand of significands) {
    const digits = String(significand).split('').map(Number);
    for (const multiplierColor of MULTIPLIER_COLORS) {
      const factor = colorByKey[multiplierColor].multiplier!;
      const ohms = significand * factor;
      const min = ohms * (1 - tolerance / 100);
      const max = ohms * (1 + tolerance / 100);
      const epsilon = Math.max(1e-10, targetOhms * 1e-12);
      if (targetOhms < min - epsilon || targetOhms > max + epsilon) continue;
      const digitColors = digits.map(digit => COLORS.find(color => color.digit === digit)!.key);
      const bands = [...digitColors, multiplierColor, toleranceColor];
      results.push({ bands, ohms, tolerance, min, max });
    }
  }

  return results.sort((a, b) => Math.abs(a.ohms - targetOhms) - Math.abs(b.ohms - targetOhms) || a.ohms - b.ohms);
}

export function parseTarget(input: string, unit: number): number | null {
  const cleaned = input.trim().replace(/\s/g, '').replace(',', '.');
  if (!/^(?:\d+\.?\d*|\.\d+)$/.test(cleaned)) return null;
  const value = Number(cleaned) * unit;
  return Number.isFinite(value) && value > 0 && value <= 1e12 ? value : null;
}
