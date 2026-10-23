import { useCallback, useEffect, useState } from 'react';
import { KeyboardBridge } from '../../native/KeyboardBridge';
import { Repo } from '../../storage/storage';
import type { KeyboardData, ThemePreference } from '../../types';

/** Pré-download no máximo a cada 2 min (abrir e fechar o teclado não refaz o trabalho). */
const PREFETCH_EVERY_MS = 2 * 60 * 1000;
let lastPrefetch = 0;

/**
 * Fotos, vídeos e áudios que o teclado pode enviar, na ordem em que aparecem
 * (fotos primeiro: são as mais enviadas e as mais leves).
 */
function mediaUrls(data: KeyboardData): string[] {
  const products = data.folders.flatMap(f => f.products);
  return [
    ...products.flatMap(p => p.photos.map(m => m.url)),
    ...data.files.files.filter(f => f.type === 'image').map(f => f.url),
    ...data.shortcuts.audios.map(a => a.audioUrl),
    ...products.flatMap(p => p.videos.map(m => m.url)),
    ...data.files.files.filter(f => f.type === 'video').map(f => f.url),
  ].filter(url => /^https?:\/\//i.test(url));
}

/** Baixa antes, em segundo plano, para o envio pelo teclado ser instantâneo. */
function prefetch(data: KeyboardData) {
  const now = Date.now();
  if (now - lastPrefetch < PREFETCH_EVERY_MS) return;
  lastPrefetch = now;
  const urls = mediaUrls(data);
  if (urls.length) KeyboardBridge.prefetchMedia(urls).catch(() => {});
}

/**
 * Carrega o snapshot do MMKV (síncrono) e recarrega toda vez que o teclado
 * reaparece — o usuário pode ter editado o catálogo no app entre um uso e
 * outro, e o componente RN do IME permanece montado em memória.
 */
export function useKeyboardData() {
  const [data, setData] = useState<KeyboardData>(() => Repo.loadAll());
  const [targetApp, setTargetApp] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState(() => Repo.isLoggedIn());

  useEffect(() => {
    const initial = Repo.loadAll();
    if (Repo.isLoggedIn()) prefetch(initial);
    return KeyboardBridge.onKeyboardShow(e => {
      const fresh = Repo.loadAll();
      const logged = Repo.isLoggedIn();
      setData(fresh);
      setLoggedIn(logged);
      setTargetApp(e.targetPackage);
      if (logged) prefetch(fresh);
    });
  }, []);

  /** Troca o tema a partir do próprio teclado (aba Mais → Configurações). */
  const setTheme = useCallback((theme: ThemePreference) => {
    Repo.setTheme(theme);
    setData(d => ({ ...d, theme }));
  }, []);

  /** Relê tudo (depois de o próprio teclado gravar um cliente ou compromisso). */
  const reload = useCallback(() => setData(Repo.loadAll()), []);

  return { data, targetApp, loggedIn, setTheme, reload };
}
