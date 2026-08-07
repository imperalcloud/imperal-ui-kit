import fs from 'node:fs';
const css=fs.readFileSync(new URL('../dist/styles.css',import.meta.url),'utf8');
const forbidden=[/(^|})\s*(html|body|button|input|select|textarea|a|img|svg|\*)\s*[{,]/m,/--color-(red|blue|gray|zinc|green|amber)-/];
for(const pattern of forbidden){if(pattern.test(css))throw new Error(`CSS isolation violation: ${pattern}`)}
if(!css.includes('.imperal-ui'))throw new Error('Scoped .imperal-ui boundary missing');
console.log('css isolation ok');
