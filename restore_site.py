import os
import re
import requests
from urllib.parse import urljoin, urlparse

base_url = 'https://ruco-supply-mto9bx5ic-rucosupply.vercel.app'
root = os.getcwd()

html = requests.get(base_url, timeout=45).text
with open(os.path.join(root, 'index.html'), 'w', encoding='utf-8') as f:
    f.write(html)

asset_re = re.compile(r'(?:href|src)=["\']([^"\']+)["\']')
seen = set()
for match in asset_re.finditer(html):
    raw = match.group(1)
    if raw.startswith('#'):
        continue
    if raw.startswith(('http://', 'https://')):
        url = raw
    else:
        url = urljoin(base_url + '/', raw)
    if not url.startswith(base_url):
        continue
    if url in seen:
        continue
    seen.add(url)

    path = urlparse(url).path.lstrip('/')
    if not path:
        continue

    if not (path.startswith('_next/') or path.endswith(('.js', '.css', '.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.json', '.txt'))):
        continue

    local_path = os.path.join(root, path)
    os.makedirs(os.path.dirname(local_path), exist_ok=True)
    try:
        resp = requests.get(url, timeout=45)
        if resp.status_code == 200:
            with open(local_path, 'wb') as f:
                f.write(resp.content)
            print('saved', path)
        else:
            print('status', resp.status_code, url)
    except Exception as exc:
        print('skip', url, exc)

print('restore complete')
