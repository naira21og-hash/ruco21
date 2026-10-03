const fs = require('fs');
const esbuild = require('esbuild');
const vm = require('vm');
const { validateCatalog } = require('./catalog-validation');
validateCatalog(JSON.parse(fs.readFileSync('app/data/catalog.json', 'utf8')));
esbuild.transformSync(fs.readFileSync('src/storefront.jsx', 'utf8') + '\n' + fs.readFileSync('src/reference-layout.jsx', 'utf8') + '\n' + fs.readFileSync('src/reference-layout.jsx', 'utf8'), { loader: 'jsx', jsxFactory: 'w.createElement', jsxFragment: 'w.Fragment' });
for (const file of ['src/storefront.jsx', 'src/storefront.css']) if (!fs.readFileSync(file, 'utf8').trim()) throw new Error(file + ' is empty');
for (const file of ['src/catalog-logic.js', 'server.js', 'scripts/build.js', 'scripts/catalog-validation.js']) new vm.Script(fs.readFileSync(file, 'utf8'), { filename: file });
console.log('JSX syntax and catalog schema checks passed. No TypeScript source is present.');
