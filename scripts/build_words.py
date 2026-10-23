"""Gera o dicionário do teclado (palavras por ordem de uso) a partir do
FrequencyWords (Hermit Dave, legendas do OpenSubtitles, CC BY-SA 4.0).

Uso: python -I build_words.py <lang> <xx_50k.txt> <saída.ts>
lang: en | es
"""
import re
import sys

lang, src, out = sys.argv[1:4]
LIMIT = 40000

PATTERN = {
    'en': re.compile(r'^[a-z]+$'),
    'es': re.compile(r'^[a-záéíóúüñ]+$'),
}[lang]
# Letras sozinhas que são palavras
SINGLE = {'en': {'a', 'i'}, 'es': {'a', 'e', 'o', 'u', 'y'}}[lang]
NAME = {'en': ('English', 'en', 'EN'), 'es': ('español', 'es', 'ES')}[lang]

words = []
seen = set()
for line in open(src, encoding='utf-8'):
    parts = line.split()
    if not parts:
        continue
    w = parts[0].lower()
    if w in seen or not PATTERN.match(w):
        continue
    if len(w) == 1 and w not in SINGLE:
        continue
    seen.add(w)
    words.append(w)
    if len(words) >= LIMIT:
        break

label, code, upper = NAME
header = f"""/**
 * Dicionário de {label} usado nas sugestões e na "tecla invisível" do
 * teclado: as {len(words) // 1000} mil palavras mais usadas, da MAIS para a MENOS
 * frequente (a posição na lista dá o peso de cada palavra).
 *
 * Fonte: FrequencyWords (Hermit Dave), {code} 2018, a partir das legendas do
 * OpenSubtitles — https://github.com/hermitdave/FrequencyWords
 * Licença do conteúdo: CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/).
 * Esta lista filtrada é distribuída sob a mesma licença.
 *
 * Gerado automaticamente (scripts/build_words.py): não editar à mão.
 */
export const WORDS_{upper} =
  '"""
with open(out, 'w', encoding='utf-8') as f:
    f.write(header + ' '.join(words) + "';\n")
print(lang, len(words), 'palavras')
