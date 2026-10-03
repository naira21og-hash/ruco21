const fs = require('node:fs');
let core = fs.readFileSync('src/storefront.jsx', 'utf8');
core = core.replace(/  if \(params.slug === "resources"\) \{[\s\S]*?\n  \}\n  return \(/, '  if (params.slug === "resources") return <StoreGuidePage />;\n  return (');
fs.writeFileSync('src/storefront.jsx', core);
let layout = fs.readFileSync('src/reference-layout.jsx', 'utf8');
layout = layout.replaceAll('"/category/resources"', '"/reselling-guide"');
fs.writeFileSync('src/reference-layout.jsx', layout);
