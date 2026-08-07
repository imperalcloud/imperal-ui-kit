import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, basename } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const work = mkdtempSync(join(tmpdir(), 'imperal-ui-kit-consumer-'));
const tarball = execFileSync('npm', ['pack', '--pack-destination', work, '--silent'], {
  cwd: root,
  encoding: 'utf8',
}).trim();

writeFileSync(join(work, 'package.json'), JSON.stringify({
  name: 'imperal-ui-kit-packed-consumer',
  private: true,
  type: 'module',
  scripts: { check: 'tsc --noEmit && vite build' },
  dependencies: {
    '@imperal/ui-kit': `file:./${basename(tarball)}`,
    '@types/react': 'latest',
    '@types/react-dom': 'latest',
    react: '19.2.0',
    'react-dom': '19.2.0',
    typescript: 'latest',
    vite: 'latest',
    next: 'latest',
  },
}, null, 2));
writeFileSync(join(work, 'index.html'), '<div id="root"></div><script type="module" src="/src.tsx"></script>\n');
writeFileSync(join(work, 'lazy.html'), '<div id="root"></div><script type="module" src="/lazy.tsx"></script>\n');
writeFileSync(join(work, 'src.tsx'), `import React from 'react';
import { createRoot } from 'react-dom/client';
import { DeclarativeRenderer } from '@imperal/ui-kit';
import { ImperalUIRoot, Skeleton } from '@imperal/ui-kit/provider';
import type { UINode } from '@imperal/ui-kit/types';
import '@imperal/ui-kit/styles.css';
const node: UINode = { type: 'Page', props: { title: 'Packed consumer', children: [{ type: 'Alert', props: { message: 'Portable build', type: 'success' } }] } };
createRoot(document.getElementById('root')!).render(<ImperalUIRoot><Skeleton className="h-4 w-24" /><DeclarativeRenderer root={false} node={node} /></ImperalUIRoot>);
`);
writeFileSync(join(work, 'lazy.tsx'), `import React from 'react';
import { createRoot } from 'react-dom/client';
import { ImperalUIRoot, Skeleton } from '@imperal/ui-kit/provider';
import { LazyDeclarativeRenderer } from '@imperal/ui-kit/lazy';
import type { UINode } from '@imperal/ui-kit/types';
import '@imperal/ui-kit/styles.css';
const node: UINode = { type: 'Chart', props: { data: [{ name: 'A', value: 1 }] } };
createRoot(document.getElementById('root')!).render(<ImperalUIRoot><LazyDeclarativeRenderer root={false} node={node} fallback={<Skeleton className="min-h-32" />} /></ImperalUIRoot>);
`);
writeFileSync(join(work, 'vite.config.js'), `import { defineConfig } from 'vite';
import { resolve } from 'node:path';
export default defineConfig({ build: { chunkSizeWarningLimit: 2000, rollupOptions: { input: { main: resolve(import.meta.dirname, 'index.html'), lazy: resolve(import.meta.dirname, 'lazy.html') } } } });
`);
writeFileSync(join(work, 'tsconfig.json'), JSON.stringify({
  compilerOptions: {
    target: 'ES2020', module: 'ESNext', moduleResolution: 'Bundler', jsx: 'react-jsx', strict: true, skipLibCheck: true,
  },
  include: ['src.tsx', 'lazy.tsx'],
}, null, 2));

execFileSync('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund'], { cwd: work, stdio: 'inherit' });
execFileSync('npm', ['run', 'check'], { cwd: work, stdio: 'inherit' });
execFileSync('node', ['--input-type=module', '--eval', "await import('@imperal/ui-kit'); await import('@imperal/ui-kit/provider'); await import('@imperal/ui-kit/lazy'); console.log('runtime exports resolve')"], { cwd: work, stdio: 'inherit' });
const assets = join(work, 'dist', 'assets');
const jsSizes = readdirSync(assets).filter(name => name.endsWith('.js')).map(name => ({ name, size: statSync(join(assets, name)).size }));
const lazyEntry = jsSizes.find(asset => asset.name.startsWith('lazy-'));
if (!lazyEntry || lazyEntry.size > 100000) throw new Error(`packed lazy entry budget exceeded: ${lazyEntry?.size ?? 'missing'} / 100000`);
if (jsSizes.length < 3) throw new Error(`packed lazy build did not split: ${jsSizes.length} JS chunks`);
console.log(`packed lazy entry JS: ${lazyEntry.size}/100000; split chunks: ${jsSizes.length}`);
console.log(`packed consumer ok: ${work}`);
