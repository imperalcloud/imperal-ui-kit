import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

for (const file of ['index.js', 'provider.js', 'lazy.js']) {
  const path = resolve('dist', file);
  const source = readFileSync(path, 'utf8');
  if (!source.startsWith("'use client';")) {
    writeFileSync(path, `'use client';\n${source}`);
  }
}
console.log('marked 3 public JavaScript entrypoints as client modules');
