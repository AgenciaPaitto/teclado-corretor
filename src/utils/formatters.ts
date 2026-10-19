/**
 * Formatadores de mensagens — Minimalista, sem emojis.
 */
import type { BrokerProfile, Product, ProductFolder } from '../types';

export function formatBRL(value: number): string {
  const [int, dec] = value.toFixed(2).split('.');
  const withDots = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `R$ ${withDots},${dec}`;
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

export const formatPropertyMessage = formatProductMessage;

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

