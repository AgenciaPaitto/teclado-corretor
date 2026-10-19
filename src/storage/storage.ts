/**
 * Persistência local (offline-first) com MMKV.
 */
import { MMKV } from 'react-native-mmkv';
import type {
  AudioShortcut,
  BrokerProfile,
  CRMLead,
  KeyboardData,
  MediaItem,
  Product,
  ProductFolder,
  ScheduleItem,
  ShortcutsData,
  TextShortcut,
  ThemePreference,
} from '../types';

import { SEED_DATA } from './seed';

export const storage = new MMKV({ id: 'corretor-keyboard' });

const KEYS = {
  broker: 'broker.profile',
  folders: 'products.folders',
  shortcuts: 'user.shortcuts',
  agenda: 'user.agenda',
  crm: 'user.crm',
  theme: 'user.theme',
  authToken: 'auth.token',
} as const;

function getJSON<T>(key: string, fallback: T): T {
  const raw = storage.getString(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function setJSON<T>(key: string, value: T): void {
  storage.set(key, JSON.stringify(value));
}

export const Repo = {
  getBroker: (): BrokerProfile => getJSON(KEYS.broker, SEED_DATA.broker),
  setBroker: (b: BrokerProfile) => setJSON(KEYS.broker, b),

  getFolders: (): ProductFolder[] => getJSON(KEYS.folders, SEED_DATA.folders),
  setFolders: (f: ProductFolder[]) => setJSON(KEYS.folders, f),

  getShortcuts: (): ShortcutsData => getJSON(KEYS.shortcuts, SEED_DATA.shortcuts),
  setShortcuts: (s: ShortcutsData) => setJSON(KEYS.shortcuts, s),

  getAgenda: (): ScheduleItem[] => getJSON(KEYS.agenda, SEED_DATA.agenda),
  setAgenda: (a: ScheduleItem[]) => setJSON(KEYS.agenda, a),

  getCRM: (): CRMLead[] => getJSON(KEYS.crm, SEED_DATA.crm),
  setCRM: (c: CRMLead[]) => setJSON(KEYS.crm, c),

  getTheme: (): ThemePreference => (storage.getString(KEYS.theme) as ThemePreference) || SEED_DATA.theme,
  setTheme: (t: ThemePreference) => storage.set(KEYS.theme, t),

  getAuthToken: (): string | undefined => storage.getString(KEYS.authToken),
  setAuthToken: (t: string) => storage.set(KEYS.authToken, t),
  clearAuth: () => storage.delete(KEYS.authToken),

  addFolder(folder: ProductFolder): void {
    const folders = this.getFolders();
    this.setFolders([...folders, folder]);
  },

  addProduct(folderId: string, product: Product): void {
    const folders = this.getFolders().map(f => {
      if (f.id === folderId) {
        return { ...f, products: [...f.products, product] };
      }
      return f;
    });
    this.setFolders(folders);
  },

  addPhotoToProduct(folderId: string, productId: string, photo: MediaItem): void {
    const folders = this.getFolders().map(f => {
      if (f.id === folderId) {
        return {
          ...f,
          products: f.products.map(p => {
            if (p.id === productId) {
              return { ...p, photos: [...p.photos, photo] };
            }
            return p;
          }),
        };
      }
      return f;
    });
    this.setFolders(folders);
  },

  addTextShortcut(shortcut: TextShortcut): void {
    const sc = this.getShortcuts();
    this.setShortcuts({
      ...sc,
      texts: [...sc.texts, shortcut],
    });
  },

  addAudioShortcut(shortcut: AudioShortcut): void {
    const sc = this.getShortcuts();
    this.setShortcuts({
      ...sc,
      audios: [...sc.audios, shortcut],
    });
  },

  resetToDefaults(): void {
    this.setBroker(SEED_DATA.broker);
    this.setFolders(SEED_DATA.folders);
    this.setShortcuts(SEED_DATA.shortcuts);
    this.setAgenda(SEED_DATA.agenda);
    this.setCRM(SEED_DATA.crm);
    this.setTheme(SEED_DATA.theme);
  },

  loadAll(): KeyboardData {
    return {
      broker: this.getBroker(),
      folders: this.getFolders(),
      shortcuts: this.getShortcuts(),
      agenda: this.getAgenda(),
      crm: this.getCRM(),
      theme: this.getTheme(),
    };
  },
};

