/**
 * Datas da agenda (app e teclado). Nomes de mês e dia escritos à mão: o
 * Intl do Hermes no Android não garante pt-BR.
 */
import type { ScheduleItem } from '../types';

export const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
export const WEEKDAYS_SHORT = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const WEEKDAYS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

const pad = (n: number) => String(n).padStart(2, '0');

/** Date → "AAAA-MM-DD" (no fuso do aparelho). */
export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** "AAAA-MM-DD" → Date ao meio-dia (longe de virada de dia por horário de verão). */
export function parseISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function addDays(iso: string, days: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/** Semanas do mês (domingo a sábado); dias de fora do mês vêm como null. */
export function monthGrid(year: number, month: number): Array<Array<string | null>> {
  const first = new Date(year, month, 1, 12);
  const daysInMonth = new Date(year, month + 1, 0, 12).getDate();
  const cells: Array<string | null> = Array(first.getDay()).fill(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(toISODate(new Date(year, month, day, 12)));
  while (cells.length % 7) cells.push(null);
  const weeks: Array<Array<string | null>> = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/** "Hoje", "Amanhã" ou "quinta, 24 de outubro". */
export function formatDayLong(iso: string): string {
  if (iso === todayISO()) return 'Hoje';
  if (iso === addDays(todayISO(), 1)) return 'Amanhã';
  if (iso === addDays(todayISO(), -1)) return 'Ontem';
  const d = parseISODate(iso);
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()].toLowerCase()}`;
}

/** "24/10" (curto, para mensagens). */
export function formatDayShort(iso: string): string {
  const d = parseISODate(iso);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
}

/** Horários sugeridos: 07:00 a 21:30, de meia em meia hora. */
export const TIME_SLOTS: string[] = Array.from({ length: 30 }, (_, i) => `${pad(7 + Math.floor(i / 2))}:${i % 2 ? '30' : '00'}`);

/** Dias que têm algum compromisso (para as bolinhas do calendário). */
export function busyDays(items: ScheduleItem[]): Set<string> {
  return new Set(items.filter(i => !i.done).map(i => i.date));
}

export function itemsOn(items: ScheduleItem[], iso: string): ScheduleItem[] {
  return items.filter(i => i.date === iso);
}

/** Próximos compromissos em aberto (de hoje em diante). */
export function upcoming(items: ScheduleItem[], limit = 3): ScheduleItem[] {
  const today = todayISO();
  return items.filter(i => !i.done && i.date >= today).slice(0, limit);
}

/** Mensagem de confirmação da reunião para inserir na conversa. */
export function confirmationMessage(item: ScheduleItem): string {
  const who = item.clientName ? `, ${item.clientName.split(/\s+/)[0]}` : '';
  const when = `${formatDayLong(item.date).toLowerCase()}${item.date !== todayISO() ? ` (${formatDayShort(item.date)})` : ''}`;
  const at = item.time ? ` às ${item.time}` : '';
  return `Olá${who}! Passando para confirmar: ${item.title}, ${when}${at}. Tudo certo?`;
}

export function newAgendaId(): string {
  return `agenda-${Date.now()}`;
}
