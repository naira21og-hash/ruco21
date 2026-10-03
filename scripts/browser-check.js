// Read-only browser checks. The order test intercepts window.open and never sends an enquiry.
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const npx = path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npx-cli.js');
function browser(args, input) {
  const result = spawnSync(process.execPath, [npx, '--yes', 'agent-browser', ...args], { input, encoding: 'utf8', timeout: 45000 });
  if (result.status !== 0) throw new Error(result.stdout + result.stderr);
  return result.stdout.trim();
}
const helpers = `const assert=(value,message)=>{if(!value)throw new Error(message)};const wait=async(fn)=>{for(let i=0;i<100;i++){if(fn())return;await new Promise(r=>setTimeout(r,50));}throw new Error('Timed out waiting for UI')};const set=(el,value)=>{const proto=el.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(el,value);el.dispatchEvent(new Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}));};`;
function evaluate(label, code) {
  const output = browser(['eval', '--stdin'], `(async()=>{${helpers}${code};return ${JSON.stringify(label + ' passed')};})()`);
  console.log(output);
}
function open(route) { browser(['open', 'http://127.0.0.1:8000' + route]); browser(['wait', '--load', 'networkidle']); }
function basic(label) { evaluate(label, `assert(document.querySelector('h1'),'Missing h1');assert(document.querySelector('header'),'Missing header');assert(document.documentElement.scrollWidth<=innerWidth,'Horizontal overflow');assert(!document.querySelector('vite-error-overlay,[data-nextjs-dialog]'),'Error overlay');assert(!document.title.endsWith('| The considered collection'),'Metadata failed to update');`); const errors = browser(['errors']); if (errors) throw new Error(label + ': ' + errors); }
if(!process.argv.includes('--mobile-only')){
browser(['set', 'viewport', '1440', '1000']);
open('/'); basic('Desktop homepage');
open('/catalog'); basic('Catalog');
evaluate('Category, sorting, price and availability filters', `
 assert(document.querySelectorAll('.product-card').length===37,'Catalog inventory mismatch');document.querySelector('.filter-sidebar').open=true;
 set(document.querySelector('.filter-sidebar select'),'tech');await wait(()=>document.querySelectorAll('.product-card').length===29);
 set(document.querySelector('.sort-label select'),'price-low');await wait(()=>document.querySelector('.product-name').textContent==='Ruco AirPodz');
 document.querySelector('.filter-sidebar input[type=checkbox]').click();await wait(()=>document.querySelectorAll('.product-card').length===5);
 set(document.querySelector('.price-inputs input'),'100');await wait(()=>document.querySelectorAll('.product-card').length===3);
 assert(new URLSearchParams(location.search).get('category')==='tech','URL filters not retained');
`);
open('/catalog?q=s26'); evaluate('Search results', `assert(document.querySelectorAll('.product-card').length===1,'Search mismatch');assert(document.querySelector('.product-name').textContent==='S26 Ultra','Wrong search result');`);
open('/category/off-road'); basic('Empty category'); evaluate('Empty category fallback', `assert(document.querySelector('.empty-state'),'No empty category state');`);
open('/product/5'); basic('Original product route');
evaluate('Variant validation, stock limit, gallery zoom and cart', `
 document.querySelector('.purchase-row .button').click();await wait(()=>document.querySelector('[role=status]').textContent.includes('Please select'));
 document.querySelectorAll('.variant-options')[0].querySelector('button').click();document.querySelectorAll('.variant-options')[1].querySelector('button').click();
 set(document.querySelector('.quantity-label input'),'100');await wait(()=>document.querySelector('.quantity-label input').value==='25');
 set(document.querySelector('.quantity-label input'),'1');document.querySelector('.purchase-row .button').click();await wait(()=>document.querySelector('[role=status]').textContent.includes('Added'));
 assert(document.querySelector('.cart-count').textContent!=='0','Cart count is stale');
 document.querySelector('.gallery-main').click();await wait(()=>document.querySelector('dialog[open]'));assert(document.querySelector('dialog img'),'Zoom image missing');document.querySelector('dialog .icon-button').click();
`);
open('/cart'); basic('Cart persistence');
evaluate('Order form validation and enquiry generation', `
 assert(document.querySelectorAll('.cart-item').length>0,'Cart lost after reload');
 window.__testOrderURL=null;window.open=(url)=>{window.__testOrderURL=url;return null};
 document.querySelector('form button[type=submit]').click();assert(window.__testOrderURL===null,'Invalid order opened');
 const values={customerName:'Storefront Test',address:'1 Test Street',city:'Test City',postalCode:'TEST 123',trackingContact:'test@example.com'};
 for(const[id,value]of Object.entries(values))set(document.getElementById(id),value);
`);
// Country is a Radix select; drive its accessible trigger rather than inventing a native select.
browser(['find', 'role', 'combobox', 'click', '--name', 'Country *']);
browser(['find', 'role', 'option', 'click', '--name', 'United Kingdom']);
browser(['find', 'role', 'radio', 'click', '--name', 'First-time customer']);
browser(['find', 'role', 'radio', 'click', '--name', 'Direct Bank Transfer']);
evaluate('Telegram destination and cart retention', `
 document.querySelector('form button[type=submit]').click();await wait(()=>window.__testOrderURL);
 const url=new URL(window.__testOrderURL);assert(url.hostname==='t.me'&&url.pathname==='/rucodaog','Wrong enquiry destination');
 assert(url.searchParams.get('text').includes('S26 Ultra'),'Order missing product');assert(document.querySelectorAll('.cart-item').length>0,'Cart was cleared before sending');
`);
for (const route of ['/contact', '/about', '/privacy', '/terms', '/product/999']) { open(route); basic(route); }
for (const width of [320, 390, 430, 768, 1024, 1920]) {
  browser(['set', 'viewport', String(width), '900']);
  for (const route of ['/', '/catalog', '/product/5', '/cart']) { open(route); basic(`${route} at ${width}px`); }
}
}
browser(['set', 'viewport', '390', '844']);open('/catalog');
evaluate('Mobile filters', `document.querySelector('.filter-sidebar summary').click();assert(document.querySelector('.filter-sidebar').open,'Filters did not expand');set(document.querySelector('.filter-sidebar select'),'tech');await wait(()=>document.querySelectorAll('.product-card').length===29);document.querySelector('.filter-sidebar summary').click();`);
evaluate('Mobile menu and live search', `document.querySelector('.menu-toggle').click();await wait(()=>document.querySelector('.mobile-menu'));assert(document.querySelectorAll('.mobile-nav a').length===6,'Missing navigation');document.querySelector('.menu-toggle').click();await wait(()=>!document.querySelector('.mobile-menu'));document.querySelector('button[aria-label="Search products"]').click();await wait(()=>document.querySelector('.search-field input'));set(document.querySelector('.search-field input'),'S26');await wait(()=>document.querySelectorAll('.search-results>a').length===1);document.querySelector('.search-results>a').click();await wait(()=>document.querySelector('h1')?.textContent==='S26 Ultra');assert(!document.querySelector('dialog[open]'),'Search stayed open after navigation');`);
console.log('Browser verification completed. No message was sent.');
