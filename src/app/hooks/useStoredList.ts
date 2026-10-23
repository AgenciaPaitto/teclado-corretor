import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

/**
 * Lista lida do armazenamento compartilhado com o teclado. Relê ao voltar
 * para o app: o que foi cadastrado pelo teclado (na conversa) aparece aqui.
 */
export function useStoredList<T>(read: () => T[]): [T[], () => void] {
  const [list, setList] = useState<T[]>(read);
  const reload = useCallback(() => setList(read()), [read]);
  useEffect(() => {
    const sub = AppState.addEventListener('change', s => s === 'active' && reload());
    return () => sub.remove();
  }, [reload]);
  return [list, reload];
}
