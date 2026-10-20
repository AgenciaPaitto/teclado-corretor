/**
 * Comparação de tipos de arquivo (MIME) com o mesmo critério do Android
 * (ClipDescription.compareMimeTypes): aceita curingas como "image/*" e "*\/*".
 */
export function mimeMatches(accepted: string, mime: string): boolean {
  const [aType, aSub] = accepted.toLowerCase().split('/');
  const [type, sub] = mime.toLowerCase().split('/');
  if (aType === '*') return true;
  return aType === type && (aSub === '*' || aSub === sub);
}

/** O campo (lista de formatos aceitos) recebe esse tipo de arquivo? */
export function acceptsMime(accepted: string[], mime: string): boolean {
  return accepted.some(a => mimeMatches(a, mime));
}
