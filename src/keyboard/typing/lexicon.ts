/**
 * Motor de palavras do teclado (português, inglês e espanhol).
 *
 *  - suggest(): completa a palavra, corrige erro de digitação e devolve o
 *    acento ("voce" → "você") para a barra de sugestões, levando em conta a
 *    palavra anterior da frase (bigramas), e diz se dá para corrigir sozinho;
 *  - predictNext(): as próximas palavras prováveis, logo depois do espaço;
 *  - nextLetterLogProb(): chance de cada letra ser a próxima da palavra — é o
 *    que deixa a "área invisível" da tecla provável maior (ver keyResolver).
 *
 * Tudo roda no próprio aparelho, sem internet. O índice é montado fora do
 * caminho do primeiro toque e cada consulta leva < 1 ms. Respeita o idioma de
 * venda escolhido pelo usuário (português, inglês ou espanhol).
 */
import { getTypingLanguage, onTypingLanguageChange } from '../../i18n';
import type { Lang } from '../../i18n';
import { BIGRAMS_EN } from './bigramsEn';
import { BIGRAMS_ES } from './bigramsEs';
import { BIGRAMS_PT } from './bigramsPt';
import { WORDS_EN } from './wordsEn';
import { WORDS_ES } from './wordsEs';
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
const NEVER_SUGGEST_BY_LANG: Record<Lang, Set<string>> = {
  pt: new Set([
    'porra', 'caralho', 'merda', 'puta', 'puto', 'foda', 'foder', 'fodido', 'fodeu', 'cacete', 'buceta',
    'viado', 'bosta', 'piroca', 'cu', 'xoxota', 'vagabunda',
  ]),
  en: new Set([
    'fuck', 'fucking', 'fucked', 'fucker', 'shit', 'bitch', 'asshole', 'dick', 'pussy', 'bastard',
    'cunt', 'nigger', 'nigga', 'motherfucker', 'whore', 'slut', 'cock', 'tits',
  ]),
  es: new Set([
    'mierda', 'puta', 'puto', 'coño', 'joder', 'cabron', 'cabrón', 'carajo', 'verga', 'pendejo',
    'pendeja', 'culiao', 'chingar', 'chingada', 'marica', 'maricon', 'maricón', 'zorra', 'culo',
  ]),
};

/** Abreviações de conversa → palavra completa (aparece como 1ª sugestão). */
const ABBREVIATIONS_BY_LANG: Record<Lang, Record<string, string>> = {
  pt: {
    vc: 'você', vcs: 'vocês', tb: 'também', tbm: 'também', obg: 'obrigado', obgd: 'obrigado',
    pq: 'porque', q: 'que', blz: 'beleza', msg: 'mensagem', td: 'tudo', hj: 'hoje', cmg: 'comigo',
    ctg: 'contigo', mt: 'muito', mto: 'muito', dps: 'depois', vdd: 'verdade', fds: 'fim de semana',
    qdo: 'quando', qnd: 'quando', tmj: 'tamo junto', pfv: 'por favor', pf: 'por favor', add: 'adicionar',
  },
  en: {
    u: 'you', ur: 'your', pls: 'please', plz: 'please', thx: 'thanks', ty: 'thank you',
    idk: "i don't know", tbh: 'to be honest', btw: 'by the way', omg: 'oh my god',
    imo: 'in my opinion', brb: 'be right back', bc: 'because', cuz: 'because',
    msg: 'message', pic: 'picture', np: 'no problem', yw: "you're welcome",
    asap: 'as soon as possible', tmrw: 'tomorrow',
  },
  es: {
    q: 'que', k: 'que', pq: 'porque', pk: 'porque', xq: 'porque', tmb: 'también', tb: 'también',
    tbien: 'también', xfa: 'por favor', porfa: 'por favor', pf: 'por favor', msg: 'mensaje',
    msj: 'mensaje', bno: 'bueno', dnd: 'donde', vdd: 'verdad', grax: 'gracias', grx: 'gracias',
    ola: 'hola', ntp: 'no te preocupes',
  },
};

/**
 * Como a palavra aparece na tela. As listas de inglês guardam as contrações
 * sem apóstrofo ("dont", "im") e o pronome "i" minúsculo: aqui saem como
 * "don't", "I'm" e "I" — na barra e na correção ao apertar espaço. Ficam de
 * fora as que também são palavras ("ill", "id", "its", "were", "well").
 */
const DISPLAY_FORMS: Partial<Record<Lang, Record<string, string>>> = {
  en: {
    i: 'I', im: "I'm", ive: "I've", dont: "don't", doesnt: "doesn't", didnt: "didn't", cant: "can't",
    couldnt: "couldn't", wouldnt: "wouldn't", shouldnt: "shouldn't", isnt: "isn't", arent: "aren't",
    wasnt: "wasn't", werent: "weren't", wont: "won't", havent: "haven't", hasnt: "hasn't", hadnt: "hadn't",
    youre: "you're", youve: "you've", youll: "you'll", theyre: "they're", theyve: "they've", weve: "we've",
    thats: "that's", whats: "what's", theres: "there's", hes: "he's", shes: "she's", aint: "ain't",
  },
};

const displayForm = (word: string) => DISPLAY_FORMS[currentLexiconLang]?.[word] ?? word;

/** Chave da tabela de seguintes: "don't" está lá como "dont". */
const bigramKey = (word: string) => (currentLexiconLang === 'en' ? word.replace(/['’]/g, '') : word);

const WORDS_BY_LANG: Record<Lang, string> = {
  pt: WORDS_PT,
  en: WORDS_EN,
  es: WORDS_ES,
};

const BIGRAMS_BY_LANG: Record<Lang, string> = {
  pt: BIGRAMS_PT,
  en: BIGRAMS_EN,
  es: BIGRAMS_ES,
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

let currentLexiconLang: Lang = 'pt';
let lexicon: Lexicon | null = null;
let bigrams: Map<string, Map<string, number>> | null = null;
let seenInSentences: Set<string> | null = null;

const lexiconCache: Partial<Record<Lang, Lexicon>> = {};
const bigramsCache: Partial<Record<Lang, { bigrams: Map<string, Map<string, number>>; seen: Set<string> }>> = {};

/** Monta o índice para o idioma pedido (padrão: o de digitação, que começa no de venda). */
export function buildLexicon(targetLang?: Lang): void {
  const target = targetLang ?? getTypingLanguage();
  if (lexicon && currentLexiconLang === target) return;

  currentLexiconLang = target;

  if (lexiconCache[target]) {
    lexicon = lexiconCache[target]!;
  } else {
    const list = WORDS_BY_LANG[target].split(' ');
    const byKey = new Map<string, Entry[]>();
    for (let rank = 0; rank < list.length; rank++) {
      const word = list[rank];
      const key = toKey(word);
      const forms = byKey.get(key);
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
    lexiconCache[target] = lexicon;
  }

  if (bigramsCache[target]) {
    bigrams = bigramsCache[target]!.bigrams;
    seenInSentences = bigramsCache[target]!.seen;
  } else {
    bigrams = null;
    seenInSentences = null;
  }
}

// Troca o dicionário junto com o idioma de digitação (mercado novo ou espaço segurado)
onTypingLanguageChange(lang => {
  buildLexicon(lang);
});

function ensureLexicon(): Lexicon | null {
  const desired = getTypingLanguage();
  if (!lexicon || currentLexiconLang !== desired) {
    buildLexicon(desired);
  }
  return lexicon;
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
  const lex = ensureLexicon();
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
  const lex = ensureLexicon();
  return !!lex && lex.words.has(word.toLowerCase());
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
  /**
   * Correção que entra sozinha ao apertar espaço ou pontuação (é a 1ª de
   * `words`), ou null quando não há certeza suficiente.
   */
  autocorrect: string | null;
}

/** De onde veio cada candidata: só acento e erro de digitação corrigem sozinhos. */
type Kind = 'abbr' | 'accent' | 'complete' | 'fix';

interface Candidate {
  word: string;
  score: number;
  kind: Kind;
  /** Quanto a palavra anterior "pede" esta (0 = nada). */
  context: number;
}

/** Peso da frase: cada ponto de força (1–9) da palavra anterior vale isto no placar. */
const CONTEXT_WEIGHT = 0.45;
/** Vantagem mínima da melhor correção sobre a 2ª para corrigir sozinha. */
const AUTOCORRECT_MARGIN = 0.6;

const ONLY_LETTERS = /^[a-zà-öø-ÿ]+(?:-[a-zà-öø-ÿ]+)*$/i;

/** Até esta posição na lista de frequência, a palavra é comum o bastante para corrigir sozinha. */
const COMMON_RANK = 3000;

function loadBigrams(): Map<string, Map<string, number>> {
  if (bigrams) return bigrams;
  if (bigramsCache[currentLexiconLang]) {
    bigrams = bigramsCache[currentLexiconLang]!.bigrams;
    seenInSentences = bigramsCache[currentLexiconLang]!.seen;
    return bigrams;
  }
  const map = new Map<string, Map<string, number>>();
  const raw = BIGRAMS_BY_LANG[currentLexiconLang];
  for (const line of raw.split('\n')) {
    const tab = line.indexOf('\t');
    if (tab < 0) continue;
    const next = new Map<string, number>();
    for (const pair of line.slice(tab + 1).split(' ')) {
      const colon = pair.lastIndexOf(':');
      if (colon > 0) next.set(pair.slice(0, colon), Number(pair.slice(colon + 1)) || 1);
    }
    map.set(line.slice(0, tab), next);
  }
  bigrams = map;
  const seen = new Set<string>(map.keys());
  for (const next of map.values()) for (const w of next.keys()) seen.add(w);
  seenInSentences = seen;
  bigramsCache[currentLexiconLang] = { bigrams: map, seen };
  return map;
}

/** Força com que `prev` pede `word` (0 quando não há registro). */
function contextStrength(prev: string | undefined, word: string): number {
  if (!prev) return 0;
  return loadBigrams().get(prev)?.get(word) ?? 0;
}

/** Todas as candidatas para `typed`, com placar e origem. */
function candidatesFor(lex: Lexicon, typed: string, prev?: string): Candidate[] {
  const lowerTyped = typed.toLowerCase();
  const key = toKey(typed);
  const known = lex.words.has(lowerTyped);
  const found = new Map<string, Candidate>();
  const neverSuggest = NEVER_SUGGEST_BY_LANG[currentLexiconLang] ?? NEVER_SUGGEST_BY_LANG.pt;
  const abbreviations = ABBREVIATIONS_BY_LANG[currentLexiconLang] ?? ABBREVIATIONS_BY_LANG.pt;

  const offer = (word: string, base: number, kind: Kind) => {
    if (word === lowerTyped || neverSuggest.has(word)) return;
    const context = contextStrength(prev, word);
    const score = base + CONTEXT_WEIGHT * context;
    const old = found.get(word);
    if (!old || score > old.score) found.set(word, { word, score, kind, context });
  };
  const freq = (e: Entry) => Math.log(weightOf(e.rank));

  // 0) Abreviação de conversa (só na barra, nunca sozinha)
  const expanded = abbreviations[lowerTyped];
  if (expanded) offer(expanded, 100, 'abbr');

  // 1) Mesma palavra com acento: "voce" → "você", "nao" → "não"
  for (const e of lex.byKey.get(key) ?? []) offer(e.word, freq(e) + (known ? 0.5 : 4), 'accent');

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
  // A frase também entra aqui
  if (prev) {
    for (const [word] of loadBigrams().get(prev) ?? []) {
      const forms = lex.byKey.get(toKey(word));
      const e = forms?.find(f => f.word === word);
      if (e && e.key.startsWith(key) && e.key.length > key.length && !best.includes(e)) best.push(e);
    }
  }
  for (const e of best) offer(e.word, freq(e) - 0.15 * (e.key.length - key.length), 'complete');

  // 3) Corrigir erro de digitação (só se a palavra não existe)
  if (!known && key.length >= 2) {
    for (const [candidate, cost] of editsOf(key)) {
      const forms = lex.byKey.get(candidate);
      if (forms) for (const e of forms) offer(e.word, freq(e) - cost + 1, 'fix');
    }
  }
  return [...found.values()].sort((a, b) => b.score - a.score);
}

/**
 * Sugestões para a palavra que está sendo digitada.
 * `prev`: palavra anterior da frase, em minúsculas ("^" = começo de frase).
 */
export function suggest(typed: string, limit = 3, prevWord?: string): Suggestions {
  const lex = ensureLexicon();
  const prev = prevWord && bigramKey(prevWord);
  if (!lex || !typed) return { unknown: false, words: [], autocorrect: null };
  const known = lex.words.has(typed.toLowerCase());
  const all = candidatesFor(lex, typed, prev);
  const fix = pickAutocorrect(lex, typed, known, all);
  // A correção automática vai na frente (é a que aparece em destaque)
  const ordered = fix ? [fix, ...all.filter(c => c !== fix)] : all;
  // "dont" é palavra da lista, mas o certo na tela é "don't": vira a correção
  const form = DISPLAY_FORMS[currentLexiconLang]?.[typed.toLowerCase()];
  const autocorrect = fix ? matchCase(typed, displayForm(fix.word)) : form && form !== typed ? matchCase(typed, form) : null;
  const shown = ordered.map(c => matchCase(typed, displayForm(c.word)));
  const words = [...new Set(autocorrect ? [autocorrect, ...shown] : shown)].filter(w => w !== typed).slice(0, limit);
  return {
    unknown: !known && words.length > 0,
    words,
    autocorrect,
  };
}

/**
 * Correção automática: só quando a palavra digitada não existe, é uma palavra
 * de letras (sem número, link ou e-mail), não é abreviação e a melhor correção
 * (acento ou erro de digitação) ganha com folga das outras.
 */
function pickAutocorrect(lex: Lexicon, typed: string, known: boolean, all: Candidate[]): Candidate | null {
  if (known || typed.length < 2 || !ONLY_LETTERS.test(typed)) return null;
  const abbreviations = ABBREVIATIONS_BY_LANG[currentLexiconLang] ?? ABBREVIATIONS_BY_LANG.pt;
  if (abbreviations[typed.toLowerCase()]) return null;
  const typedLength = toKey(typed).length;
  loadBigrams();
  const fixes = all.filter(c => {
    const rank = lex.byKey.get(toKey(c.word))?.find(e => e.word === c.word)?.rank ?? Infinity;
    if (rank > COMMON_RANK && !seenInSentences?.has(c.word)) return false;
    if (c.kind === 'accent' || c.kind === 'fix') return true;
    // Faltou só a última letra: "obrigad" → "obrigado"
    return c.kind === 'complete' && toKey(c.word).length === typedLength + 1;
  });
  const best = fixes[0];
  if (!best) return null;
  // Acento é certeiro: "voce" → "você"
  if (best.kind === 'accent') return best;
  // Rival que só muda a última letra não trava: vale a mais comum
  const stem = (w: string) => toKey(w).slice(0, -1);
  const rival = fixes.slice(1).find(c => stem(c.word) !== stem(best.word));
  if (rival && best.score - rival.score < AUTOCORRECT_MARGIN && best.context <= rival.context) return null;
  return best;
}

/** Próximas palavras prováveis depois de `prev` (barra logo após o espaço). */
export function predictNext(prev: string, limit = 3): string[] {
  const lex = ensureLexicon();
  if (!lex) return [];
  const next = loadBigrams().get(bigramKey(prev));
  if (!next) return [];
  const neverSuggest = NEVER_SUGGEST_BY_LANG[currentLexiconLang] ?? NEVER_SUGGEST_BY_LANG.pt;
  return [...next.entries()]
    .filter(([w]) => !neverSuggest.has(w))
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([w]) => displayForm(w));
}

/** Mantém maiúsculas como a pessoa digitou (para quem aplica a correção). */
export { matchCase };
