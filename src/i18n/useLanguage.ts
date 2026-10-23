import { useEffect, useState } from 'react';
import { getLanguage, onLanguageChange } from './index';
import type { Lang } from './index';

/** Idioma das telas; o componente redesenha quando ele muda. */
export function useLanguage(): Lang {
  const [lang, setLang] = useState<Lang>(getLanguage);
  useEffect(() => onLanguageChange(setLang), []);
  return lang;
}
