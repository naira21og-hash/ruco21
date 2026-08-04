const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 8000;
const workspaceRoot = __dirname;
const appDir = path.join(workspaceRoot, 'app');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

function isAllowedPath(candidatePath) {
  const resolved = path.resolve(candidatePath);
  return resolved === workspaceRoot || resolved.startsWith(workspaceRoot + path.sep);
}

function resolveFile(reqPath) {
  const normalizedPath = decodeURIComponent(reqPath).split('?')[0];
  const cleanPath = normalizedPath === '/' ? '/index.html' : normalizedPath;
  const relativePath = cleanPath.replace(/^\/+/, '');

  const candidates = [];

  if (cleanPath === '/index.html') {
    candidates.push(path.join(appDir, 'index.html'));
  }

  if (relativePath.startsWith('app/')) {
    candidates.push(path.join(workspaceRoot, relativePath));
  } else {
    candidates.push(path.join(appDir, relativePath));
    candidates.push(path.join(workspaceRoot, relativePath));
  }

  for (const candidate of candidates) {
    if (isAllowedPath(candidate) && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }

  return null;
}

http.createServer((req, res) => {
  const reqPath = req.url || '/';
  const filePath = resolveFile(reqPath);

  if (!filePath) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
}).listen(port, () => {
  console.log(`Local preview running at http://127.0.0.1:${port}`);
});
