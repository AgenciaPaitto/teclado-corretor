import os
import re

pattern = re.compile(r'\bt\(\s*([\'"`])(.*?)\1', re.DOTALL)

keys = set()
for root, dirs, files in os.walk('src'):
    for f in files:
        if f.endswith(('.ts', '.tsx')) and not f.endswith(('en.ts', 'es.ts')):
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8', errors='ignore') as fp:
                content = fp.read()
                for match in pattern.finditer(content):
                    k = match.group(2).strip()
                    if k and '\n' not in k:
                        keys.add(k)

print(f"Total keys: {len(keys)}")
with open('scripts/keys_found.txt', 'w', encoding='utf-8') as out:
    for k in sorted(keys):
        out.write(k + '\n')
