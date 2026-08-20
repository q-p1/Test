import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const dist = new URL('../dist/', import.meta.url);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === 'sw.js' || entry.name.endsWith('.map')) continue;
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(fullPath));
    else files.push(fullPath);
  }
  return files;
}

const distPath = dist.pathname;
const files = await walk(distPath);
const shellFiles = files
  .map((file) => `./${relative(distPath, file).split(sep).join('/')}`)
  .sort();
const shellHash = createHash('sha256');
for (const file of files.sort()) {
  shellHash.update(relative(distPath, file));
  shellHash.update(await readFile(file));
}
const version = shellHash.digest('hex').slice(0, 18);

const source = `const CACHE_PREFIX = 'routine-shell-';
const CACHE_NAME = CACHE_PREFIX + '${version}';
const APP_SHELL = ${JSON.stringify(shellFiles)};
const SCOPE_URL = self.registration.scope;
const SCOPE_PATH = new URL(SCOPE_URL).pathname;
const SHELL_URL = new URL('index.html', SCOPE_URL).href;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL.map((path) => new URL(path, SCOPE_URL).href)))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match(SHELL_URL).then((cached) => cached || fetch(request))
    );
    return;
  }

  const scopedPath = url.pathname.startsWith(SCOPE_PATH) ? url.pathname.slice(SCOPE_PATH.length) : '';
  if (scopedPath.startsWith('assets/') || scopedPath.startsWith('icons/') || scopedPath.startsWith('exercises/') || scopedPath === 'manifest.webmanifest') {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
  }
});
`;

await writeFile(new URL('../dist/sw.js', import.meta.url), source);
console.log(`Generated service worker routine-shell-${version}`);
