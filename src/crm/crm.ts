/**
 * Regras do CRM usadas pelo app e pelo teclado.
 */
import { t } from '../i18n';
import type { SegmentProfile } from '../segments/segments';
import type { CRMLead } from '../types';
import { parseISODate, toISODate, todayISO } from '../agenda/agenda';

export function newLeadId(): string {
  return `lead-${Date.now()}`;
}

/** "Ana Souza" → "AS". */
export function initials(name?: string): string {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

/** "Hoje", "Ontem", "Há 5 dias", "Sem contato". */
export function lastContactLabel(lead: CRMLead): string {
  if (!lead.lastContactAt) return lead.lastContact || t('Sem contato');
  const day = toISODate(new Date(lead.lastContactAt));
  const today = todayISO();
  if (day === today) return t('Hoje');
  const diff = Math.round((parseISODate(today).getTime() - parseISODate(day).getTime()) / 86_400_000);
  if (diff === 1) return t('Ontem');
  return diff > 1 ? t('Há {n} dias', { n: diff }) : t('Hoje');
}

/** Etapas do ramo + as que algum cliente antigo ainda usa (de outro ramo). */
export function stagesFor(segment: SegmentProfile, leads: CRMLead[] = []): string[] {
  const extra = (leads || []).map(l => l.stage).filter(s => s && !segment.crmStages.includes(s));
  return [...segment.crmStages, ...Array.from(new Set(extra))];
}

export function countByStage(leads: CRMLead[] = []): Map<string, number> {
  const out = new Map<string, number>();
  for (const l of (leads || [])) {
    if (l?.stage) out.set(l.stage, (out.get(l.stage) ?? 0) + 1);
  }
  return out;
}

/** Mais recentes primeiro (último contato, depois criação). */
export function sortLeads(leads: CRMLead[]): CRMLead[] {
  const key = (l: CRMLead) => l.lastContactAt ?? l.createdAt ?? '';
  return [...leads].sort((a, b) => key(b).localeCompare(key(a)));
}
