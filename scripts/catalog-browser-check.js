// Temporarily mutate the one local catalog to test management-to-storefront propagation.
// Always restore the exact file; no fixtures are deployed or retained.
const { spawnSync } = require('child_process');
const fs = require('fs'), path = require('path');
const npx = path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npx-cli.js');
function browser(args, input) {
  const result = spawnSync(process.execPath, [npx, '--yes', 'agent-browser', ...args], { input, encoding: 'utf8', timeout: 45000 });
  if (result.status !== 0) throw new Error(result.stdout + result.stderr);
  return result.stdout.trim();
}
function check(code) { console.log(browser(['eval', '--stdin'], `(async()=>{const assert=(v,m)=>{if(!v)throw new Error(m)};${code};return 'Catalog propagation passed';})()`)); }
function open(route) { browser(['open', 'http://127.0.0.1:8000' + route]); browser(['wait', '--load', 'networkidle']); }
const file = 'app/data/catalog.json', original = fs.readFileSync(file, 'utf8');
try {
  const catalog = JSON.parse(original), p = catalog.products.find(p => p.id === 5);
  p.price = 219.98; p.inventory = 2; p.condition = 'Good'; p.images = [p.image, p.image];
  p.marketRange = { min: 250, max: 350, source: 'Temporary browser test fixture' };
  p.included = ['Test fixture accessory'];
  catalog.products.forEach(p => p.featured = false);
  catalog.products.push({ ...p, id: 999, name: 'Temporary integration fixture', category: 'gaming', brand: 'Integration fixture', sku: 'TEST-ONLY-999', featured: true });
  fs.writeFileSync(file, JSON.stringify(catalog));
  open('/product/5');
  check(`assert(document.querySelector('.detail-price').textContent.includes('219.98'),'Price did not update');assert(document.querySelector('.detail-status').textContent.includes('Good'),'Condition did not update');assert(document.querySelector('.detail-status .available').textContent==='Available','Availability indicator did not update');assert(document.querySelectorAll('.gallery-thumbnails button').length===2,'Multiple images missing');document.querySelector('[aria-label="Next product image"]').click();await new Promise(r=>setTimeout(r,50));assert(document.querySelectorAll('.gallery-thumbnails button')[1].getAttribute('aria-pressed')==='true','Gallery next control failed');assert(document.querySelector('.reseller-info'),'Reseller fields missing');assert(document.body.textContent.includes('profit is not guaranteed'),'Resale caveat missing');`);
  open('/category/gaming');check(`assert(document.querySelector('.product-name').textContent==='Temporary integration fixture','Added product/category did not propagate');`);
  open('/catalog?q=TEST-ONLY-999');check(`assert(document.querySelectorAll('.product-card').length===1,'SKU search failed');`);
  open('/');check(`assert(document.querySelector('.collection-section').textContent.includes('Temporary integration fixture'),'Featured flag did not propagate');`);
  catalog.products = catalog.products.filter(p => p.id !== 999);p.inStock = false;fs.writeFileSync(file, JSON.stringify(catalog));
  open('/product/5');check(`assert(document.querySelector('.purchase-row button').disabled,'Out of stock still purchasable');`);
  open('/category/gaming');check(`assert(document.querySelector('.empty-state'),'Removed product still shown');`);
} finally { fs.writeFileSync(file, original); }
open('/');
console.log('Shared catalog changes verified; original inventory restored. No admin exists in this repository, so this does not certify an external admin integration.');
