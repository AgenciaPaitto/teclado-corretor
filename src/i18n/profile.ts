/**
 * Liga o perfil do usuário aos idiomas e à moeda (app e teclado chamam ao
 * carregar ou trocar o perfil).
 */
import type { SellerProfile } from '../types';
import { setLanguage, setSellingLanguage } from './index';
import { getMarket, setCurrentMarket } from './markets';

export function applyProfileLanguages(profile: Pick<SellerProfile, 'language' | 'market'>): void {
  const market = getMarket(profile.market);
  setCurrentMarket(market.id);
  setSellingLanguage(market.language);
  setLanguage(profile.language);
}
