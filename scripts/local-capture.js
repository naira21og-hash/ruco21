const { spawnSync } = require('child_process');
const fs = require('fs'), path = require('path');
const npx = path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npx-cli.js');
const out = 'docs/visual'; fs.mkdirSync(out, { recursive: true });
function call(args, input) {
  const result = spawnSync(process.execPath, [npx, '--yes', 'agent-browser', '--session', 'local', ...args], { input, encoding: 'utf8', timeout: 45000 });
  if (result.status !== 0) throw new Error(result.stdout + result.stderr);
  return result.stdout.trim();
}
const measure = `JSON.stringify((()=>{const box=e=>{if(!e)return null;const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {x:r.x,y:r.y,w:r.width,h:r.height,padding:s.padding,gap:s.gap,font:s.fontFamily,size:s.fontSize,weight:s.fontWeight,line:s.lineHeight,radius:s.borderRadius,background:s.backgroundColor,columns:s.gridTemplateColumns}};return {width:innerWidth,header:box(document.querySelector('header')),main:box(document.querySelector('main')),h1:box(document.querySelector('h1')),h2:box(document.querySelector('h2')),sections:Array.from(document.querySelectorAll('main section')).map(box),images:Array.from(document.querySelectorAll('main img')).slice(0,7).map(box),ancestors:Array.from((function*(e){for(let i=0;e&&i<5;i++,e=e.parentElement)yield e})(document.querySelector('h1'))).map(box),footer:box(document.querySelector('footer'))}})())`;
const results = [];
for (const width of [375, 430, 768, 1024, 1440, 1920]) {
  call(['set', 'viewport', String(width), '1000']);
  for (const [name, route] of [['home','/'],['catalog','/catalog'],['product','/product/5']]) {
    call(['open', 'http://localhost:8000' + route]);
    call(['wait', '--load', 'networkidle']);
    const raw = call(['eval', '--stdin'], measure);
    results.push({ page: name, ...JSON.parse(JSON.parse(raw)) });
    call(['screenshot', path.resolve(out, `local-${name}-${width}.png`)]);
    if (width === 1440 || width === 375) call(['screenshot', '--full', path.resolve(out, `local-${name}-${width}-full.png`)]);
  }
  console.log('Local measured at', width);
}
fs.writeFileSync(out + '/local-measurements.json', JSON.stringify(results, null, 2));
console.log('Local measurements and screenshots saved.');
