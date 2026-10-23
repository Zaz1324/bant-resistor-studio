import { isTauri } from '@tauri-apps/api/core';
import { load, type Store } from '@tauri-apps/plugin-store';
import { Bands, calculate } from './resistor';

export interface Favorite {
  id: string;
  name: string;
  category: string;
  bands: Bands;
  createdAt: string;
}

interface LibraryData {
  schemaVersion: 1;
  installationId: string;
  favorites: Favorite[];
}

const STORE_FILE = 'bant-library.json';
const BROWSER_KEY = 'bant.library.v1';
let desktopStore: Store | undefined;
let data: LibraryData | undefined;

function validFavorite(value: unknown): value is Favorite {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<Favorite>;
  if (typeof item.id !== 'string' || typeof item.name !== 'string' || typeof item.category !== 'string' || typeof item.createdAt !== 'string' || !Array.isArray(item.bands)) return false;
  if (!item.id || !item.name.trim() || !item.category.trim() || item.name.length > 80 || item.category.length > 40) return false;
  try { calculate(item.bands); return true; } catch { return false; }
}

function decode(raw: unknown): LibraryData | null {
  if (raw === null || raw === undefined) return null;
  if (!raw || typeof raw !== 'object') throw new Error('Favori verisi okunamadı. Veri dosyası korunuyor.');
  const record = raw as Partial<LibraryData>;
  if (record.schemaVersion !== 1) throw new Error('Favori verisi bu sürümden yeni. Veri dosyası korunuyor.');
  if (typeof record.installationId !== 'string' || !Array.isArray(record.favorites) || !record.favorites.every(validFavorite)) {
    throw new Error('Favori verisi geçersiz. Veri dosyası korunuyor.');
  }
  return record as LibraryData;
}

async function write(next: LibraryData): Promise<void> {
  if (desktopStore) {
    await desktopStore.set('library', next);
    await desktopStore.save();
  } else {
    localStorage.setItem(BROWSER_KEY, JSON.stringify(next));
  }
  data = next;
}

export async function loadLibrary(): Promise<Favorite[]> {
  if (isTauri()) {
    desktopStore = await load(STORE_FILE, { autoSave: false });
    data = decode(await desktopStore.get<LibraryData>('library')) ?? undefined;
  } else {
    const raw = localStorage.getItem(BROWSER_KEY);
    data = decode(raw ? JSON.parse(raw) : null) ?? undefined;
  }
  if (!data) await write({ schemaVersion: 1, installationId: crypto.randomUUID(), favorites: [] });
  return [...data!.favorites];
}

export async function saveFavorites(favorites: Favorite[]): Promise<void> {
  if (!data) throw new Error('Favoriler henüz yüklenmedi.');
  if (!favorites.every(validFavorite)) throw new Error('Favori bilgisi geçersiz.');
  await write({ ...data, favorites: [...favorites] });
}
