const fs = require('fs');
const esbuild = require('esbuild');
const { validateCatalog } = require('./catalog-validation');
async function build() {
  validateCatalog(JSON.parse(fs.readFileSync('app/data/catalog.json', 'utf8')));
  const source = fs.readFileSync('src/storefront.jsx', 'utf8') + '\n' + fs.readFileSync('src/reference-layout.jsx', 'utf8') + '\n' + fs.readFileSync('src/guide-page.jsx', 'utf8');
  const result = await esbuild.transform(source, { loader: 'jsx', jsxFactory: 'w.createElement', jsxFragment: 'w.Fragment', target: 'es2022', minify: true });
  let runtime = fs.readFileSync('src/legacy-runtime.js', 'utf8');
  runtime = runtime.replace('m.jsx(dr,{path:"*",', 'm.jsx(dr,{path:"/reviews",element:m.jsx(StoreReviews,{})}),m.jsx(dr,{path:"/category/:slug",element:m.jsx(StoreCatalog,{})}),m.jsx(dr,{path:"/shop",element:m.jsx(StoreCatalog,{})}),m.jsx(dr,{path:"*",');
  runtime = runtime.replace('m.jsx(dr,{path:"*",', 'm.jsx(dr,{path:"/checkout",element:m.jsx(StoreCheckout,{})}),m.jsx(dr,{path:"/reselling-guide",element:m.jsx(StoreGuidePage,{})}),m.jsx(dr,{path:"*",');
  const logic = fs.readFileSync('src/catalog-logic.js', 'utf8').replace(/module\.exports =[^\n]+/, '');
  fs.writeFileSync('app/assets/storefront.js', runtime + '\n' + logic + '\n' + result.code + '\nawait storeLoadCatalog();nk.createRoot(document.getElementById("root")).render(m.jsx(d3,{}));\n');
  fs.copyFileSync('src/storefront.css', 'app/assets/storefront.css');
  console.log('Storefront built; catalog validated.');
}
build().catch(error => { console.error(error); process.exit(1); });
