const fs = require('node:fs');
const path = require('node:path');
const file = path.join(__dirname, '../app/data/catalog.json');
const catalog = JSON.parse(fs.readFileSync(file, 'utf8'));
let count = 0;
for (const product of catalog.products) {
  if (!product.priceOnRequest) continue;
  const name = product.id === 28 ? 'airpods-4-outline.png' : `product-${product.id}-outline.png`;
  if (!fs.existsSync(path.join(__dirname, '../images', name))) continue;
  product.images = [`/images/${name}`];
  product.image = product.images[0];
  product.imageType = 'illustration';
  product.imageNote = 'Illustrative product sketch. Confirm the exact model, finish and included items before ordering.';
  count++;
}
fs.writeFileSync(file, JSON.stringify(catalog, null, 2) + '\n');
console.log(`Attached sketches to ${count} products.`);
