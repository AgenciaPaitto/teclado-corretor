/**
 * Formatadores de mensagens — Minimalista, sem emojis.
 */
import { getSegment } from '../segments/segments';
import type { SegmentProfile } from '../segments/segments';
import type { Product, ProductAttribute, ProductFolder, SegmentId, SellerProfile } from '../types';

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

/**
 * Preço como o ramo mostra: "R$ 450.000,00", "a partir de R$ 89,90/mês",
 * "R$ 2.500,00/mês" (locação). Preço 0 = "Sob consulta".
 */
export function formatPrice(
  p: Pick<Product, 'price' | 'attributes'>,
  segment: SegmentId | SegmentProfile = 'general',
): string {
  if (!(p.price > 0)) return 'Sob consulta';
  const { prefix, suffix } = (typeof segment === 'string' ? getSegment(segment) : segment).price;
  const after = typeof suffix === 'function' ? suffix(p) : suffix ?? '';
  return `${prefix ? `${prefix} ` : ''}${formatBRL(p.price)}${after}`;
}

/** "Área: 85 m²" (a unidade vem do campo do ramo, quando houver). */
export function formatAttribute(a: ProductAttribute, segment: SegmentId | SegmentProfile = 'general'): string {
  const profile = typeof segment === 'string' ? getSegment(segment) : segment;
  const unit = profile.fields.find(f => f.key === a.key)?.unit;
  return `${a.label}: ${a.value}${unit ? ` ${unit}` : ''}`;
}

/** Características preenchidas do produto, já formatadas. */
export function attributeLines(p: Pick<Product, 'attributes'>, segment: SegmentId | SegmentProfile = 'general'): string[] {
  return (p.attributes ?? []).filter(a => a.value.trim()).map(a => formatAttribute(a, segment));
}

/** Mensagem limpa formatada para envio no WhatsApp (sem emojis). */
export function formatProductMessage(
  p: Product,
  folder?: ProductFolder,
  segment: SegmentId | SegmentProfile = 'general',
): string {
  const details = attributeLines(p, segment);
  return [
    `*${p.title}*`,
    folder ? folder.name : null,
    `*${formatPrice(p, segment)}*`,
    ...(details.length ? ['', ...details] : []),
    '',
    p.shortDescription,
    // Sem link cadastrado, a mensagem termina na descrição
    ...(p.datasheetUrl ? ['', `Veja mais: ${p.datasheetUrl}`] : []),
  ]
    .filter(line => line !== null)
    .join('\n')
    // Descrição vazia não deixa linha em branco sobrando
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Mensagem de retorno do CRM ({{cliente}} = nome do cliente). */
export function formatFollowUp(clientName: string, segment: SegmentId): string {
  return getSegment(segment).followUp.replace(/\{\{cliente\}\}/g, clientName);
}

/**
 * Normaliza um link colado pelo usuário (Drive, Dropbox, site da loja…).
 * Aceita com ou sem "https://". Retorna null se não parecer um link válido.
 */
export function normalizeUrl(input: string): string | null {
  const s = input.trim();
  if (!s || /\s/.test(s)) return null;
  const withScheme = /^https?:\/\//i.test(s) ? s : `https://${s}`;
  return /^https?:\/\/[^/.\s]+\.\S+/i.test(withScheme) ? withScheme : null;
}

/**
 * Substitui {{variáveis}} das mensagens prontas pelos dados do perfil.
 * {{corretor}} e {{imobiliaria}} continuam valendo para mensagens antigas.
 */
export function applyTemplate(body: string, seller: SellerProfile): string {
  const vars: Record<string, string> = {
    nome: seller.name,
    empresa: seller.business,
    telefone: seller.phone,
    corretor: seller.name,
    imobiliaria: seller.business,
    creci: '',
  };
  return body.replace(/\{\{(\w+)\}\}/g, (_, k: string) => vars[k] ?? `{{${k}}}`);
}
