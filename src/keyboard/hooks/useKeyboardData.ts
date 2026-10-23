import { useCallback, useEffect, useState } from 'react';
import { KeyboardBridge } from '../../native/KeyboardBridge';
import { Repo } from '../../storage/storage';
import type { KeyboardData, ThemePreference } from '../../types';

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
    return KeyboardBridge.onKeyboardShow(e => {
      setData(Repo.loadAll());
      setLoggedIn(Repo.isLoggedIn());
      setTargetApp(e.targetPackage);
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
