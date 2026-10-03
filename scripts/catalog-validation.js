function validateCatalog(catalog) {
  if (!Array.isArray(catalog.categories) || !Array.isArray(catalog.products)) throw new Error('Catalog requires categories and products arrays.');
  const categories = new Set();
  for (const c of catalog.categories) {
    if (!/^[a-z0-9-]+$/.test(c.id) || !c.name || categories.has(c.id)) throw new Error('Invalid or duplicate category: ' + c.id);
    categories.add(c.id);
  }
  const ids = new Set();
  for (const p of catalog.products) {
    if (!Number.isInteger(p.id) || ids.has(p.id) || !p.name || !categories.has(p.category)) throw new Error('Invalid product identity/category: ' + p.id);
    ids.add(p.id);
    if (p.priceOnRequest ? p.price !== null || p.inStock !== false : !Number.isFinite(p.price) || p.price < 0) throw new Error('Invalid price or unconfirmed stock: ' + p.id);
    if (typeof p.inStock !== 'boolean') throw new Error('Stock status must be boolean: ' + p.id);
    if (p.inventory != null && (!Number.isInteger(p.inventory) || p.inventory < 0)) throw new Error('Invalid inventory: ' + p.id);
    for (const field of ['minOrder', 'maxPerOrder']) if (p[field] != null && (!Number.isInteger(p[field]) || p[field] < 1)) throw new Error('Invalid ' + field + ': ' + p.id);
    if (p.maxPerOrder != null && p.maxPerOrder < (p.minOrder || 1)) throw new Error('Maximum order is smaller than minimum order: ' + p.id);
    if (!Array.isArray(p.images) || (!p.images.length && !p.priceOnRequest) || p.images.some(url => !/^\/(?!\/)|^https:\/\//.test(url))) throw new Error('Invalid images: ' + p.id);
    for (const v of p.variants || []) if (!v.type || !v.options?.length) throw new Error('Invalid variant: ' + p.id);
    if (p.marketRange && (!Number.isFinite(p.marketRange.min) || !Number.isFinite(p.marketRange.max) || p.marketRange.min < 0 || p.marketRange.max < p.marketRange.min)) throw new Error('Invalid market range: ' + p.id);
  }
  return catalog;
}
module.exports = { validateCatalog };
