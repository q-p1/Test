import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import vm from 'node:vm';

const dist = new URL('../dist/', import.meta.url);
const source = await readFile(new URL('sw.js', dist), 'utf8');
const listeners = new Map();
const addedUrls = [];
const deletedCaches = [];
const currentName = source.match(/const CACHE_NAME = CACHE_PREFIX \+ '([^']+)'/)?.[1];
if (!currentName) throw new Error('Unable to read generated cache version');

let skippedWaiting = false;
let claimedClients = false;
let networkFetches = 0;
const shellResponse = { source: 'current-shell' };
const assetResponse = { source: 'current-asset' };

const cacheApi = {
  async open() {
    return { async addAll(urls) { addedUrls.push(...urls); } };
  },
  async keys() {
    return ['unrelated-cache', 'routine-shell-obsolete', `routine-shell-${currentName}`];
  },
  async delete(name) {
    deletedCaches.push(name);
    return true;
  },
  async match(request) {
    const url = typeof request === 'string' ? request : request.url;
    if (url === 'https://example.test/Test/index.html') return shellResponse;
    if (url === 'https://example.test/Test/assets/example.css') return assetResponse;
    return undefined;
  },
};

const worker = {
  registration: { scope: 'https://example.test/Test/' },
  location: { origin: 'https://example.test' },
  clients: { async claim() { claimedClients = true; } },
  skipWaiting() { skippedWaiting = true; },
  addEventListener(type, handler) { listeners.set(type, handler); },
};

vm.runInNewContext(source, {
  self: worker,
  caches: cacheApi,
  URL,
  fetch: async () => { networkFetches += 1; return { source: 'network' }; },
});

await runExtendable(listeners.get('install'));
assert(addedUrls.length > 4, 'install should precache the complete app shell');
assert(addedUrls.every((url) => url.startsWith('https://example.test/Test/')), 'precache URLs must stay inside the service-worker subpath scope');
assert(addedUrls.includes('https://example.test/Test/index.html'), 'index shell is not precached');
assert(addedUrls.some((url) => /\/assets\/index-.+\.css$/.test(url)), 'hashed CSS is not precached');
assert(addedUrls.some((url) => /\/assets\/index-.+\.js$/.test(url)), 'hashed JavaScript is not precached');

await runExtendable(listeners.get('activate'));
assert(deletedCaches.includes('routine-shell-obsolete'), 'activation should remove an obsolete routine cache');
assert(!deletedCaches.includes(`routine-shell-${currentName}`), 'activation must retain the new complete cache');
assert(!deletedCaches.includes('unrelated-cache'), 'activation must not delete other applications caches');
assert(claimedClients, 'activation should claim clients after cache cleanup');

listeners.get('message')?.({ data: { type: 'SKIP_WAITING' } });
assert(skippedWaiting, 'explicit update confirmation should activate the waiting worker');

const navigation = await runFetch(listeners.get('fetch'), {
  method: 'GET',
  mode: 'navigate',
  url: 'https://example.test/Test/today?source=pwa',
});
assert(navigation === shellResponse, 'navigation should receive the matching current cached HTML shell');
assert(networkFetches === 0, 'cached navigation should not mix in a network HTML version');

const asset = await runFetch(listeners.get('fetch'), {
  method: 'GET',
  mode: 'cors',
  url: 'https://example.test/Test/assets/example.css',
});
assert(asset === assetResponse, 'scoped assets should use their matching cached version');

const externalHandled = runFetch(listeners.get('fetch'), {
  method: 'GET',
  mode: 'cors',
  url: 'https://cdn.example/assets/example.css',
});
assert(externalHandled === null, 'the worker must not intercept external origins');

const expectedVersion = await contentVersion(dist);
assert(currentName === expectedVersion, 'cache version must be the current app-shell content hash');

console.log(`Verified service-worker install, subpath scope, atomic navigation, cleanup, and content version ${currentName}.`);

async function runExtendable(handler) {
  if (!handler) throw new Error('Missing service-worker lifecycle listener');
  let pending;
  handler({ waitUntil(promise) { pending = promise; } });
  if (!pending) throw new Error('Lifecycle event did not register waitUntil');
  await pending;
}

function runFetch(handler, request) {
  if (!handler) throw new Error('Missing service-worker fetch listener');
  let response = null;
  handler({ request, respondWith(promise) { response = Promise.resolve(promise); } });
  return response;
}

async function contentVersion(directoryUrl) {
  const directoryPath = directoryUrl.pathname;
  const files = await walk(directoryPath);
  const hash = createHash('sha256');
  for (const file of files.sort()) {
    hash.update(relative(directoryPath, file));
    hash.update(await readFile(file));
  }
  return hash.digest('hex').slice(0, 18);
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === 'sw.js' || entry.name.endsWith('.map')) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else files.push(path);
  }
  return files;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
