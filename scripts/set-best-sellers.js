const fs = require('node:fs');
const file = 'app/data/catalog.json';
const catalog = JSON.parse(fs.readFileSync(file, 'utf8'));
const template = catalog.products.find(p => p.id === 8);
for (const [id, name, subcategory] of [[9, 'Apple iPhone 17 Pro', 'Phones'], [26, 'Apple AirPods Pro 3', 'Audio']]) {
  if (!catalog.products.some(p => p.id === id)) catalog.products.push({ ...template, id, name, subcategory, keywords: [subcategory], image: `/images/product-${id}-outline.png`, images: [`/images/product-${id}-outline.png`] });
}
for (const p of catalog.products) p.bestSeller = [26, 9, 6].includes(p.id);
fs.writeFileSync(file, JSON.stringify(catalog, null, 2) + '\n');
let core = fs.readFileSync('src/storefront.jsx', 'utf8');
core = core.replace('let storeCatalogError = false;', 'let storeCatalogError = false;\nconst storePropsLast = (a, b) => Number(a.id === 7) - Number(b.id === 7);');
core = core.replace('    zx = storeCatalog.products;', '    storeCatalog.products.sort(storePropsLast);\n    zx = storeCatalog.products;');
core = core.replace('products.filter(p => p.bestSeller || p.featured)', 'products.filter(p => p.bestSeller)');
core = core.replace('  const active = [', '  products.sort(storePropsLast);\n  const active = [');
fs.writeFileSync('src/storefront.jsx', core);
let layout = fs.readFileSync('src/reference-layout.jsx', 'utf8');
layout = layout.replace('(b.createdAt || "").localeCompare(a.createdAt || "") || b.id - a.id,', 'storePropsLast(a, b) || (b.createdAt || "").localeCompare(a.createdAt || "") || b.id - a.id,');
layout = layout.replace(/  const featured = \[[\s\S]*?\]\.slice\(0, 4\);/, '  const featured = products.filter(p => p.bestSeller);');
layout = layout.replace('products.filter((p) => p.bestSeller || p.featured).slice(0, 4)', 'products.filter((p) => p.bestSeller)');
fs.writeFileSync('src/reference-layout.jsx', layout);
