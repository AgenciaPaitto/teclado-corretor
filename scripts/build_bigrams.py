"""Gera a tabela de palavras seguintes (bigramas) do teclado a partir das frases
em português do Tatoeba (CC BY 2.0 FR). Só pares de palavras do dicionário.

Uso: python -I build_bigrams.py <por_sentences.tsv.bz2> <wordsPt.ts> <saída.ts>
"""
import bz2
import collections
import re
import sys

src, words_ts, out = sys.argv[1:4]
TOP = 6          # seguintes guardadas por palavra
MIN_PAIR = 3     # par visto pelo menos 3 vezes
MIN_PREV = 8     # palavra anterior vista pelo menos 8 vezes

text = open(words_ts, encoding='utf-8').read()
m = re.search(r'WORDS_PT\s*=\s*([`\'"])(.*?)\1', text, re.S)
lexicon = set(m.group(2).split())
print('dicionário:', len(lexicon))

WORD = re.compile(r"[a-zà-öø-ÿ]+(?:-[a-zà-öø-ÿ]+)*")
START = '^'  # começo de frase
# Nomes de exemplo muito repetidos no Tatoeba: não são palavras da conversa real
NAMES = {'tom', 'mary', 'john', 'ken', 'jim', 'mike', 'bob', 'alice', 'jack', 'jane', 'tony', 'bill', 'dan', 'sami', 'layla', 'mennad', 'baya', 'yanni', 'skura', 'rima', 'ziri', 'lucy', 'emily', 'tatoeba'}
pairs = collections.Counter()
prev_count = collections.Counter()
n = 0
with bz2.open(src, 'rt', encoding='utf-8', errors='replace') as f:
    for line in f:
        parts = line.rstrip('\n').split('\t')
        if len(parts) < 3:
            continue
        n += 1
        # Cada trecho entre pontuação forte é uma frase
        for chunk in re.split(r'[.!?;:…()"«»—]+', parts[2].lower()):
            toks = WORD.findall(chunk)
            if not toks:
                continue
            prev = START
            for t in toks:
                if t not in lexicon or t in NAMES:
                    prev = None  # palavra fora do dicionário quebra a sequência
                    continue
                if prev is not None:
                    pairs[(prev, t)] += 1
                    prev_count[prev] += 1
                prev = t
print('frases:', n, 'pares distintos:', len(pairs))

followers = collections.defaultdict(list)
for (a, b), c in pairs.items():
    if c >= MIN_PAIR and prev_count[a] >= MIN_PREV:
        followers[a].append((c, b))

lines = []
for a in sorted(followers):
    top = sorted(followers[a], reverse=True)[:TOP]
    total = prev_count[a]
    # força 1–9: quanto da continuação de "a" essa palavra representa
    enc = ' '.join(f'{b}:{max(1, min(9, round(9 * c / total * 3)))}' for c, b in top)
    lines.append(f'{a}\t{enc}')
body = '\n'.join(lines)
print('palavras com seguintes:', len(lines), 'tamanho:', len(body.encode('utf-8')) // 1024, 'KB')

header = '''/**
 * Palavras que costumam vir depois de cada palavra (bigramas), para o
 * corretor entender a frase. Gerado por build_bigrams.py a partir das frases
 * em português do Tatoeba (https://tatoeba.org), licença CC BY 2.0 FR.
 *
 * Formato: uma linha por palavra: "palavra<TAB>seguinte:força seguinte:força".
 * "^" = começo de frase. Força de 1 a 9 (quanto aquela continuação é comum).
 */
// prettier-ignore
'''
with open(out, 'w', encoding='utf-8') as f:
    f.write(header + 'export const BIGRAMS_PT = `' + body.replace('\\', '\\\\').replace('`', '\\`').replace('${', '\\${') + '`;\n')
print('ok')
