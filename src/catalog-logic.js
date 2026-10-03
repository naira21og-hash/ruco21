// Shared stock rules for every variant of a listing. No separate catalog data.
function storeProductLimit(product) {
  return Math.min(product.inventory ?? 99, product.maxPerOrder ?? 99);
}
function storeProductAvailable(product) {
  return !product.priceOnRequest && product.inStock && product.availability !== 'sold_out' && storeProductLimit(product) >= (product.minOrder || 1);
}
function storeRestoreCart(saved, products) {
  if (!Array.isArray(saved)) return [];
  const restored = [], used = new Map();
  for (const item of saved) {
    const product = products.find(p => p.id === item?.productId);
    if (!product || !storeProductAvailable(product) || typeof item.itemId !== 'string' || restored.some(p => p.itemId === item.itemId)) continue;
    const minOrder = product.minOrder || 1, inventory = storeProductLimit(product);
    const remaining = inventory - (used.get(product.id) || 0);
    if (remaining < minOrder) continue;
    const quantity = Math.min(remaining, Math.max(minOrder, Math.floor(Number(item.quantity) || minOrder)));
    restored.push({ ...item, name: product.name, image: product.image, imageFit: product.imageFit, price: product.price, minOrder, inventory, quantity, variantLabel: typeof item.variantLabel === 'string' ? item.variantLabel : '' });
    used.set(product.id, (used.get(product.id) || 0) + quantity);
  }
  return restored;
}
function storeAddCartItem(items, product, requested, variants = {}) {
  if (!storeProductAvailable(product)) return { items, added: 0, error: 'This listing is currently unavailable.' };
  if ((product.variants || []).some(v => !v.options.includes(variants[v.type]))) return { items, added: 0, error: 'Please select each available product option.' };
  const inventory = storeProductLimit(product), minOrder = product.minOrder || 1;
  const variantLabel = Object.entries(variants).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}: ${value}`).join(', ');
  const itemId = `${product.id}-${variantLabel || 'default'}`;
  const remaining = inventory - items.filter(item => item.productId === product.id).reduce((sum, item) => sum + item.quantity, 0);
  const existing = items.find(item => item.itemId === itemId);
  if (remaining <= 0 || (!existing && remaining < minOrder)) return { items, added: 0, error: 'Your cart already contains the available quantity for this listing.' };
  const added = Math.min(remaining, Math.max(existing ? 1 : minOrder, Math.floor(Number(requested) || minOrder)));
  const next = existing ? items.map(item => item.itemId === itemId ? { ...item, quantity: item.quantity + added } : item) : [...items, { itemId, productId: product.id, name: product.name, image: product.image, imageFit: product.imageFit, price: product.price, inventory, minOrder, quantity: added, variantLabel }];
  return { items: next, added };
}
function storeSetCartQuantity(items, id, requested) {
  const item = items.find(item => item.itemId === id);
  if (!item) return items;
  const others = items.filter(other => other.productId === item.productId && other.itemId !== id).reduce((sum, other) => sum + other.quantity, 0);
  const quantity = Math.max(item.minOrder, Math.min(Math.floor(Number(requested) || item.minOrder), item.inventory - others));
  return items.map(other => other.itemId === id ? { ...other, quantity } : other);
}
module.exports = { storeProductLimit, storeProductAvailable, storeRestoreCart, storeAddCartItem, storeSetCartQuantity };
