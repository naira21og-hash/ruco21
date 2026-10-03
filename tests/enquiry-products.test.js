const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const catalog=require('../app/data/catalog.json');
const {validateCatalog}=require('../scripts/catalog-validation');
const {storeProductAvailable,storeAddCartItem}=require('../src/catalog-logic');
test('Imported electronic listings have no invented price, stock or photographs',()=>{
  const listings=catalog.products.filter(p=>p.priceOnRequest);
  assert.deepEqual(listings.map(p=>p.id),[]);
  assert.equal(catalog.products.find(p=>p.id===8).price,220);
  assert.deepEqual(catalog.products.filter(p=>p.bestSeller).map(p=>p.id).sort((a,b)=>a-b),[6]);
  for(const p of listings){assert.equal(p.price,null);assert.equal(p.inStock,false);assert.equal(p.imageType,'illustration');assert.equal(p.images.length,1);assert.ok(fs.existsSync(path.join(__dirname,'..',p.images[0])));assert.equal(storeProductAvailable(p),false);assert.equal(storeAddCartItem([],p,1).added,0);}
  assert.equal(catalog.products.filter(p=>/iphone 17 pro max/i.test(p.name)).length,1);
});
test('Reject an enquiry listing marked available or priced at zero',()=>{
  for(const update of [{inStock:true},{price:0}]){const copy=structuredClone(catalog);Object.assign(copy.products.find(p=>p.id===8),{priceOnRequest:true,price:null,inStock:false},update);assert.throws(()=>validateCatalog(copy));}
});
