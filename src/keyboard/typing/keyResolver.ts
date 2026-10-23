/**
 * Descobre qual tecla o dedo quis apertar.
 *
 * 1. Geometria: a tecla mais perto do ponto do toque (os espaços entre as
 *    teclas também contam — nenhum toque "cai no vazio").
 * 2. "Tecla invisível" (como no teclado do iPhone): entre letras vizinhas, a
 *    área de toque de cada uma cresce ou encolhe conforme a chance de ela ser
 *    a próxima letra da palavra. Se a pessoa digitou "obrigad" e o dedo cai
 *    entre O e P, vence o O. Um toque bem no meio de uma tecla continua sendo
 *    aquela tecla — o ajuste só decide os toques na fronteira.
 */
import { nextLetterLogProb } from './lexicon';

export interface KeyRect<T> {
  x: number;
  y: number;
  w: number;
  h: number;
  key: T;
}

/** Quanto o toque pode "desviar" (fração do tamanho da tecla). */
const SPREAD = 0.5;
/**
 * Peso do dicionário em relação à posição do dedo. Com 0,3, mesmo a letra
 * mais improvável continua com o miolo da própria tecla: ela perde no máximo
 * a faixa de ~1/4 da largura do lado da letra provável.
 */
const LANGUAGE_WEIGHT = 0.3;
/** Prefixo vazio (1ª letra da palavra): o palpite é bem mais fraco. */
const FIRST_LETTER_WEIGHT = 0.15;
/** Limite do palpite, para uma letra "impossível" ainda poder ser digitada. */
const MIN_LOG_PROB = -6;

function distanceTo(r: KeyRect<unknown>, x: number, y: number) {
  const dx = x < r.x ? r.x - x : x > r.x + r.w ? x - (r.x + r.w) : 0;
  const dy = y < r.y ? r.y - y : y > r.y + r.h ? y - (r.y + r.h) : 0;
  return dx * dx + dy * dy;
}

/** Tecla mais próxima do ponto (geometria pura). */
export function nearestKey<T>(rects: KeyRect<T>[], x: number, y: number): KeyRect<T> | null {
  let best: KeyRect<T> | null = null;
  let bestDist = Infinity;
  for (const r of rects) {
    const d = distanceTo(r, x, y);
    if (d < bestDist) {
      best = r;
      bestDist = d;
      if (d === 0) break;
    }
  }
  return best;
}

/**
 * Escolhe a letra combinando posição do dedo e dicionário.
 * `letterOf` devolve a letra da tecla (ou null para teclas que não são letra).
 */
export function resolveLetter<T>(
  rects: KeyRect<T>[],
  x: number,
  y: number,
  wordPrefix: string,
  letterOf: (key: T) => string | null,
): KeyRect<T> | null {
  const geometric = nearestKey(rects, x, y);
  if (!geometric || letterOf(geometric.key) === null) return geometric;

  const weight = wordPrefix ? LANGUAGE_WEIGHT : FIRST_LETTER_WEIGHT;
  let best = geometric;
  let bestScore = -Infinity;
  for (const r of rects) {
    const letter = letterOf(r.key);
    if (letter === null) continue;
    const cx = r.x + r.w / 2;
    const cy = r.y + r.h / 2;
    const nx = (x - cx) / (r.w * SPREAD);
    const ny = (y - cy) / (r.h * SPREAD);
    // Só as teclas encostadas no toque entram na disputa
    if (Math.abs(nx) > 3 || Math.abs(ny) > 3) continue;
    const touchScore = -(nx * nx + ny * ny) / 2;
    const logProb = nextLetterLogProb(wordPrefix, letter);
    const languageScore = logProb === null ? 0 : Math.max(MIN_LOG_PROB, logProb) * weight;
    const score = touchScore + languageScore;
    if (score > bestScore) {
      best = r;
      bestScore = score;
    }
  }
  return best;
}
