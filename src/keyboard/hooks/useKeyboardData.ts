import { useEffect, useState } from 'react';
import { KeyboardBridge } from '../../native/KeyboardBridge';
import { Repo } from '../../storage/storage';
import type { KeyboardData } from '../../types';

/**
 * Carrega o snapshot do MMKV (síncrono) e recarrega toda vez que o teclado
 * reaparece — o corretor pode ter editado o catálogo no app entre um uso e
 * outro, e o componente RN do IME permanece montado em memória.
 */
export function useKeyboardData() {
  const [data, setData] = useState<KeyboardData>(() => Repo.loadAll());
  const [targetApp, setTargetApp] = useState<string | null>(null);

  useEffect(() => {
    return KeyboardBridge.onKeyboardShow(e => {
      setData(Repo.loadAll());
      setTargetApp(e.targetPackage);
    });
  }, []);

  return { data, targetApp };
}
