const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateCatalog } = require('../scripts/catalog-validation');
const catalog = require('../app/data/catalog.json');
test('Existing inventory remains intact and each listing has a valid category and images', () => {
  assert.equal(validateCatalog(catalog), catalog);
  assert.deepEqual(catalog.products.slice(0,7).map(p => p.id), [1, 2, 3, 4, 5, 6, 7]);
  assert.deepEqual(catalog.products.slice(0,7).map(p => p.price), [3.5, 38.97, 189.97, 119.97, 199.98, 49.99, 90]);
});
test('Reject invalid prices, duplicate IDs and malformed image URLs before building', () => {
  for (const change of [p => p.price = -1, p => p.id = 2, p => p.images = ['javascript:alert(1)'], p => p.category = 'missing']) {
    const copy = structuredClone(catalog); change(copy.products[0]); assert.throws(() => validateCatalog(copy));
  }
});
test('Reject misleading or malformed market ranges', () => {
  const copy = structuredClone(catalog); copy.products[0].marketRange = { min: 500, max: 100 }; assert.throws(() => validateCatalog(copy));
});
