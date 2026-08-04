const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');

const base = 'https://ruco-supply-mto9bx5ic-rucosupply.vercel.app';
const root = process.cwd();

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https:') ? https : http;
    const file = fs.createWriteStream(dest);
    const req = lib.get(url, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        resolve(download(new URL(res.headers.location, url).toString(), dest));
        return;
      }
      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error('status ' + res.statusCode));
        return;
      }
      res.pipe(file);
      file.on('finish', () => file.close(() => resolve()));
    });
    req.on('error', (err) => {
      fs.rmSync(dest, { force: true });
      reject(err);
    });
  });
}

(async () => {
  const html = await new Promise((resolve, reject) => {
    https.get(base, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });

  fs.writeFileSync(path.join(root, 'index.html'), html);

  const assetRe = /(?:href|src)=["']([^"']+)["']/g;
  const seen = new Set();
  let match;
  while ((match = assetRe.exec(html))) {
    const raw = match[1];
    if (raw.startsWith('#')) continue;
    const url = raw.startsWith('http') ? raw : new URL(raw, base).toString();
    if (!url.startsWith(base)) continue;
    if (seen.has(url)) continue;
    seen.add(url);

    const pathname = new URL(url).pathname.replace(/^\/+/, '');
    if (!pathname || !(/^(?:_next\/|.*\.(?:js|css|svg|png|jpg|jpeg|gif|webp|ico|json|txt))/.test(pathname))) {
      continue;
    }

    const dest = path.join(root, pathname);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    try {
      await download(url, dest);
      console.log('saved', pathname);
    } catch (err) {
      console.log('skip', pathname, err.message);
    }
  }

  console.log('done');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
