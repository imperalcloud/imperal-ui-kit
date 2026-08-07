import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
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
  },
}, null, 2));
writeFileSync(join(work, 'index.html'), '<div id="root"></div><script type="module" src="/src.tsx"></script>\n');
writeFileSync(join(work, 'src.tsx'), `import React from 'react';
import { createRoot } from 'react-dom/client';
import { DeclarativeRenderer, type UINode } from '@imperal/ui-kit';
import '@imperal/ui-kit/styles.css';
const node: UINode = { type: 'Page', props: { title: 'Packed consumer', children: [{ type: 'Alert', props: { message: 'Portable build', type: 'success' } }] } };
createRoot(document.getElementById('root')!).render(<DeclarativeRenderer node={node} />);
`);
writeFileSync(join(work, 'tsconfig.json'), JSON.stringify({
  compilerOptions: {
    target: 'ES2020', module: 'ESNext', moduleResolution: 'Bundler', jsx: 'react-jsx', strict: true, skipLibCheck: true,
  },
  include: ['src.tsx'],
}, null, 2));

execFileSync('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund'], { cwd: work, stdio: 'inherit' });
execFileSync('npm', ['run', 'check'], { cwd: work, stdio: 'inherit' });
console.log(`packed consumer ok: ${work}`);
