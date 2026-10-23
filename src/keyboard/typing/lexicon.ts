/**
 * Motor de palavras do teclado (português do Brasil).
 *
 *  - suggest(): completa a palavra, corrige erro de digitação e devolve o
 *    acento ("voce" → "você") para a barra de sugestões;
 *  - nextLetterLogProb(): chance de cada letra ser a próxima da palavra — é o
 *    que deixa a "área invisível" da tecla provável maior (ver keyResolver).
 *
 * Tudo roda no próprio aparelho, sem internet. O índice é montado uma vez
 * (buildLexicon), fora do primeiro toque, e cada consulta leva < 1 ms.
 */
import { WORDS_PT } from './wordsPt';

const ACCENT_MAP: Record<string, string> = {
  á: 'a', à: 'a', â: 'a', ã: 'a', ä: 'a',
  é: 'e', è: 'e', ê: 'e', ë: 'e',
  í: 'i', ì: 'i', î: 'i', ï: 'i',
  ó: 'o', ò: 'o', ô: 'o', õ: 'o', ö: 'o',
  ú: 'u', ù: 'u', û: 'u', ü: 'u',
  ç: 'c', ñ: 'n',
};

/** Minúsculas e sem acento: "Você" → "voce" (chave de busca). */
export function toKey(word: string): string {
  const lower = word.toLowerCase();
  let out = '';
  for (let i = 0; i < lower.length; i++) {
    const c = lower[i];
    out += ACCENT_MAP[c] ?? c;
  }
  return out;
}

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';

/** Teclas vizinhas no QWERTY: trocar por uma delas é o erro mais comum. */
const NEIGHBORS: Record<string, string> = {
  q: 'wa', w: 'qeas', e: 'wrsd', r: 'etdf', t: 'ryfg', y: 'tugh', u: 'yihj', i: 'uojk', o: 'ipkl', p: 'ol',
  a: 'qwsz', s: 'awedxz', d: 'serfcx', f: 'drtgvc', g: 'ftyhbv', h: 'gyujnb', j: 'huikmn', k: 'jiolm', l: 'kop',
  z: 'asx', x: 'zsdc', c: 'xdfv', v: 'cfgb', b: 'vghn', n: 'bhjm', m: 'njk',
};

/** Palavras que nunca aparecem como sugestão (continuam contando para a "tecla invisível"). */
const NEVER_SUGGEST = new Set([
  'porra', 'caralho', 'merda', 'puta', 'puto', 'foda', 'foder', 'fodido', 'fodeu', 'cacete', 'buceta',
  'viado', 'bosta', 'piroca', 'cu', 'xoxota', 'vagabunda',
]);

/** Abreviações de conversa → palavra completa (aparece como 1ª sugestão). */
const ABBREVIATIONS: Record<string, string> = {
  vc: 'você', vcs: 'vocês', tb: 'também', tbm: 'também', obg: 'obrigado', obgd: 'obrigado',
  pq: 'porque', q: 'que', blz: 'beleza', msg: 'mensagem', td: 'tudo', hj: 'hoje', cmg: 'comigo',
  ctg: 'contigo', mt: 'muito', mto: 'muito', dps: 'depois', vdd: 'verdade', fds: 'fim de semana',
  qdo: 'quando', qnd: 'quando', tmj: 'tamo junto', pfv: 'por favor', pf: 'por favor', add: 'adicionar',
};

interface Entry {
  word: string;
  key: string;
  rank: number;
}

interface Lexicon {
  /** Entradas em ordem alfabética da chave. */
  sorted: Entry[];
  /** Soma acumulada dos pesos na ordem de `sorted` (para somar faixas em O(1)). */
  cumulative: Float64Array;
  /** Chave → formas reais (mais usada primeiro). Ex.: "e" → ["é", "e"]. */
  byKey: Map<string, Entry[]>;
  /** Palavras reais conhecidas, em minúsculas. */
  words: Set<string>;
}

const weightOf = (rank: number) => 1 / (rank + 50);

let lexicon: Lexicon | null = null;

/** Monta o índice (uma vez). Chame cedo, fora do caminho do primeiro toque. */
export function buildLexicon(): void {
  if (lexicon) return;
  const list = WORDS_PT.split(' ');
  const byKey = new Map<string, Entry[]>();
  for (let rank = 0; rank < list.length; rank++) {
    const word = list[rank];
    const key = toKey(word);
    const forms = byKey.get(key);
    // A lista vem de legendas e tem erros de acento ("voce", "nâo"): uma forma
    // muito mais rara que a principal com a mesma chave é descartada. Formas
    // de uso parecido ficam as duas ("e" / "é", "esta" / "está").
    if (forms && rank > 15 * (forms[0].rank + 20)) continue;
    const entry = { word, key, rank };
    if (forms) forms.push(entry);
    else byKey.set(key, [entry]);
  }
  const entries = [...byKey.values()].flat();
  const sorted = entries.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : a.rank - b.rank));
  const cumulative = new Float64Array(sorted.length + 1);
  for (let i = 0; i < sorted.length; i++) cumulative[i + 1] = cumulative[i] + weightOf(sorted[i].rank);
  lexicon = { sorted, cumulative, byKey, words: new Set(entries.map(e => e.word)) };
}

export const isLexiconReady = () => lexicon !== null;

/** Primeira posição em `sorted` cuja chave é >= `key`. */
function lowerBound(sorted: Entry[], key: string): number {
  let lo = 0;
  let hi = sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (sorted[mid].key < key) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/** Faixa [início, fim) das palavras que começam com `prefix` (chave). */
function prefixRange(lex: Lexicon, prefix: string): [number, number] {
  return [lowerBound(lex.sorted, prefix), lowerBound(lex.sorted, prefix + '￿')];
}

function rangeWeight(lex: Lexicon, [start, end]: [number, number]): number {
  return lex.cumulative[end] - lex.cumulative[start];
}

/**
 * log P(próxima letra = `letter` | palavra começa com `prefix`), suavizado.
 * Devolve null quando o dicionário não sabe nada sobre o prefixo (sem palpite).
 */
export function nextLetterLogProb(prefix: string, letter: string): number | null {
  const lex = lexicon;
  if (!lex) return null;
  const p = toKey(prefix);
  const total = rangeWeight(lex, prefixRange(lex, p));
  if (total <= 0) return null;
  const hit = rangeWeight(lex, prefixRange(lex, p + toKey(letter)));
  const smoothing = 0.003;
  return Math.log((hit + smoothing * total) / (total * (1 + ALPHABET.length * smoothing)));
}

/** Palavra conhecida do jeito que foi digitada (ignorando maiúsculas)? */
export function isKnownWord(word: string): boolean {
  return !!lexicon && lexicon.words.has(word.toLowerCase());
}

/** Mantém o jeito que a pessoa escreveu: "Voce" → "Você", "VOCE" → "VOCÊ". */
function matchCase(typed: string, suggestion: string): string {
  if (typed.length > 1 && typed === typed.toUpperCase() && typed !== typed.toLowerCase()) {
    return suggestion.toUpperCase();
  }
  if (typed[0] && typed[0] !== typed[0].toLowerCase()) {
    return suggestion[0].toUpperCase() + suggestion.slice(1);
  }
  return suggestion;
}

/** Variações a 1 erro de distância (troca, falta, sobra, inversão), com o custo de cada uma. */
function editsOf(key: string): Array<[string, number]> {
  const out: Array<[string, number]> = [];
  for (let i = 0; i <= key.length; i++) {
    const head = key.slice(0, i);
    const tail = key.slice(i);
    if (tail) out.push([head + tail.slice(1), 1.8]); // letra a mais
    if (tail.length > 1) out.push([head + tail[1] + tail[0] + tail.slice(2), 1.2]); // letras invertidas
    for (const c of ALPHABET) {
      if (tail && c !== tail[0]) {
        const near = NEIGHBORS[tail[0]]?.includes(c);
        out.push([head + c + tail.slice(1), near ? 1.0 : 2.6]); // tecla errada
      }
      out.push([head + c + tail, 1.8]); // letra faltando
    }
  }
  return out;
}

export interface Suggestions {
  /** O que foi digitado não está no dicionário (mostra a palavra "entre aspas"). */
  unknown: boolean;
  /** Até 3 sugestões, a melhor primeiro, já com maiúsculas como a digitada. */
  words: string[];
}

/** Sugestões para a palavra que está sendo digitada. */
export function suggest(typed: string, limit = 3): Suggestions {
  const lex = lexicon;
  const lowerTyped = typed.toLowerCase();
  if (!lex || !typed) return { unknown: false, words: [] };

  const key = toKey(typed);
  const known = lex.words.has(lowerTyped);
  const scores = new Map<string, number>();
  const offer = (entry: Entry, score: number) => {
    if (entry.word === lowerTyped || NEVER_SUGGEST.has(entry.word)) return;
    const prev = scores.get(entry.word);
    if (prev === undefined || score > prev) scores.set(entry.word, score);
  };
  const freq = (e: Entry) => Math.log(weightOf(e.rank));

  // 0) Abreviação de conversa: "vc" → "você"
  const expanded = ABBREVIATIONS[lowerTyped];
  if (expanded) scores.set(expanded, 100);

  // 1) Mesma palavra com acento: "voce" → "você", "nao" → "não"
  for (const e of lex.byKey.get(key) ?? []) offer(e, freq(e) + (known ? 0.5 : 4));

  // 2) Completar a palavra (as mais usadas que começam assim)
  const [start, end] = prefixRange(lex, key);
  const best: Entry[] = [];
  for (let i = start; i < end; i++) {
    const e = lex.sorted[i];
    if (e.key.length === key.length) continue;
    if (best.length < 8) {
      best.push(e);
      best.sort((a, b) => a.rank - b.rank);
    } else if (e.rank < best[7].rank) {
      best[7] = e;
      best.sort((a, b) => a.rank - b.rank);
    }
  }
  for (const e of best) offer(e, freq(e) - 0.15 * (e.key.length - key.length));

  // 3) Corrigir erro de digitação (só se a palavra não existe)
  if (!known && key.length >= 2) {
    for (const [candidate, cost] of editsOf(key)) {
      const forms = lex.byKey.get(candidate);
      if (forms) for (const e of forms) offer(e, freq(e) - cost + 1);
    }
  }

  const words = [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => matchCase(typed, word));
  return { unknown: !known && words.length > 0, words };
}
