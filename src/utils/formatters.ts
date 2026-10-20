/**
 * Formatadores de mensagens — Minimalista, sem emojis.
 */
import type { BrokerProfile, Product, ProductFolder } from '../types';

export function formatBRL(value: number): string {
  const [int, dec] = value.toFixed(2).split('.');
  const withDots = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `R$ ${withDots},${dec}`;
}

/**
 * Converte um valor digitado em formato brasileiro para número.
 * Aceita "850000", "850.000", "850.000,50", "R$ 1.200,00" e "1200.50".
 * Retorna null se não houver um número válido maior que zero.
 */
export function parseBRL(input: string): number | null {
  let s = input.replace(/[^\d.,]/g, '');
  if (!s) return null;
  if (s.includes(',')) {
    // Vírgula = separador decimal; pontos = milhar
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (/\.\d{3}(\.|$)/.test(s)) {
    // "850.000" → pontos são separadores de milhar
    s = s.replace(/\./g, '');
  }
  const n = parseFloat(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function formatPrice(p: Pick<Product, 'price' | 'dealType'>): string {
  const base = formatBRL(p.price);
  return p.dealType === 'locacao' ? `${base}/mês` : base;
}

/** Mensagem limpa formatada para envio no WhatsApp (sem emojis). */
export function formatProductMessage(p: Product, folder?: ProductFolder): string {
  const specs = [
    p.bedrooms ? `${p.bedrooms} dormitórios` : null,
    p.areaM2 ? `${p.areaM2} m²` : null,
  ]
    .filter(Boolean)
    .join(' | ');

  const folderLine = folder ? `${folder.name}${folder.neighborhood ? ` — ${folder.neighborhood}` : ''}` : '';

  return [
    `*${p.title}*`,
    folderLine || null,
    `*${formatPrice(p)}*`,
    specs || null,
    '',
    p.shortDescription,
    '',
    `Fotos e vídeos completos: ${p.datasheetUrl}`,
  ]
    .filter(line => line !== null)
    .join('\n');
}


/** Substitui {{variáveis}} dos templates pelos dados do corretor. */
export function applyTemplate(body: string, broker: BrokerProfile): string {
  const vars: Record<string, string> = {
    corretor: broker.name,
    imobiliaria: broker.agency,
    creci: broker.creci,
    telefone: broker.phone,
  };
  return body.replace(/\{\{(\w+)\}\}/g, (_, k: string) => vars[k] ?? `{{${k}}}`);
}

