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

  /** Atualiza nome e bairro da pasta (os imóveis dentro dela são mantidos). */
  updateFolder(folderId: string, changes: Pick<ProductFolder, 'name' | 'neighborhood'>): void {
    this.setFolders(this.getFolders().map(f => (f.id === folderId ? { ...f, ...changes } : f)));
  },

  /** Exclui a pasta e todos os imóveis dela. */
  deleteFolder(folderId: string): void {
    this.setFolders(this.getFolders().filter(f => f.id !== folderId));
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

  /** Aplica uma alteração em um imóvel específico de uma pasta. */
  mapProduct(folderId: string, productId: string, fn: (p: Product) => Product): void {
    const folders = this.getFolders().map(f => {
      if (f.id !== folderId) return f;
      return { ...f, products: f.products.map(p => (p.id === productId ? fn(p) : p)) };
    });
    this.setFolders(folders);
  },

  updateProduct(folderId: string, product: Product): void {
    this.mapProduct(folderId, product.id, () => product);
  },

  deleteProduct(folderId: string, productId: string): void {
    const folders = this.getFolders().map(f =>
      f.id === folderId ? { ...f, products: f.products.filter(p => p.id !== productId) } : f,
    );
    this.setFolders(folders);
  },

  /** Adiciona um link de foto ou vídeo ao imóvel (conforme media.type). */
  addMedia(folderId: string, productId: string, media: MediaItem): void {
    this.mapProduct(folderId, productId, p =>
      media.type === 'image'
        ? { ...p, photos: [...p.photos, media] }
        : { ...p, videos: [...p.videos, media] },
    );
  },

  deleteMedia(folderId: string, productId: string, mediaId: string): void {
    this.mapProduct(folderId, productId, p => ({
      ...p,
      photos: p.photos.filter(m => m.id !== mediaId),
      videos: p.videos.filter(m => m.id !== mediaId),
    }));
  },

  addTextShortcut(shortcut: TextShortcut): void {
    const sc = this.getShortcuts();
    this.setShortcuts({
      ...sc,
      texts: [...sc.texts, shortcut],
    });
  },

  updateTextShortcut(shortcut: TextShortcut): void {
    const sc = this.getShortcuts();
    this.setShortcuts({
      ...sc,
      texts: sc.texts.map(t => (t.id === shortcut.id ? shortcut : t)),
    });
  },

  deleteTextShortcut(id: string): void {
    const sc = this.getShortcuts();
    this.setShortcuts({ ...sc, texts: sc.texts.filter(t => t.id !== id) });
  },

  addAudioShortcut(shortcut: AudioShortcut): void {
    const sc = this.getShortcuts();
    this.setShortcuts({
      ...sc,
      audios: [...sc.audios, shortcut],
    });
  },

  updateAudioShortcut(shortcut: AudioShortcut): void {
    const sc = this.getShortcuts();
    this.setShortcuts({
      ...sc,
      audios: sc.audios.map(a => (a.id === shortcut.id ? shortcut : a)),
    });
  },

  deleteAudioShortcut(id: string): void {
    const sc = this.getShortcuts();
    this.setShortcuts({ ...sc, audios: sc.audios.filter(a => a.id !== id) });
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

