const { test } = require('node:test');
const assert = require('node:assert/strict');
const { storeProductAvailable, storeRestoreCart, storeAddCartItem, storeSetCartQuantity } = require('../src/catalog-logic');
const product = { id: 1, name: 'Stock rule fixture', price: 10, inStock: true, inventory: 3, image: '/images/test.jpg', variants: [{ type: 'colour', options: ['Black', 'White'] }] };
test('Different variants share the listing stock limit', () => {
  const black = storeAddCartItem([], product, 2, { colour: 'Black' });
  const white = storeAddCartItem(black.items, product, 2, { colour: 'White' });
  assert.equal(white.added, 1);
  assert.equal(white.items.reduce((sum, item) => sum + item.quantity, 0), 3);
  assert.equal(storeAddCartItem(white.items, product, 1, { colour: 'Black' }).added, 0);
  assert.equal(storeSetCartQuantity(white.items, white.items[0].itemId, 99)[0].quantity, 2);
});
test('Reload reflects price changes, stock reductions and removed products', () => {
  const first = storeAddCartItem([], product, 2, { colour: 'Black' });
  const saved = storeAddCartItem(first.items, product, 1, { colour: 'White' }).items;
  const restored = storeRestoreCart(saved, [{ ...product, price: 15, inventory: 1 }]);
  assert.equal(restored.length, 1); assert.equal(restored[0].price, 15); assert.equal(restored[0].quantity, 1);
  assert.deepEqual(storeRestoreCart(saved, []), []);
  assert.deepEqual(storeRestoreCart(saved, [{ ...product, inStock: false }]), []);
  assert.deepEqual(storeRestoreCart({}, [product]), []);
});
test('Order limits, minimum quantities and variant validation are respected', () => {
  assert.equal(storeAddCartItem([], product, 1, {}).added, 0);
  assert.equal(storeAddCartItem([], product, 1, { colour: 'invalid' }).added, 0);
  assert.equal(storeProductAvailable({ ...product, minOrder: 4 }), false);
  assert.equal(storeAddCartItem([], { ...product, minOrder: 2 }, 1, { colour: 'Black' }).added, 2);
  assert.equal(storeAddCartItem([], { ...product, maxPerOrder: 1 }, 5, { colour: 'Black' }).added, 1);
});
