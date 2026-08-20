import { access, readFile, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(root, 'dist');
const html = await readFile(join(dist, 'index.html'), 'utf8');
const manifest = JSON.parse(await readFile(join(dist, 'manifest.webmanifest'), 'utf8'));
const worker = await readFile(join(dist, 'sw.js'), 'utf8');
const registrationSource = await readFile(join(root, 'src/lib/registerServiceWorker.ts'), 'utf8');
const errors = [];

if (!html.includes('dir="rtl"') || !html.includes('lang="ar"')) errors.push('index.html must be Arabic RTL');
if (!html.includes('name="theme-color"')) errors.push('theme-color is missing');
if (/https?:\/\//.test(html)) errors.push('production HTML has an external runtime dependency');

const references = [...html.matchAll(/(?:src|href)="((?:\/|\.\/)[^"?#]+)[^\"]*"/g)].map((match) => match[1]);
for (const reference of references) {
  if (!reference || reference === '/') continue;
  const normalized = reference.replace(/^\.\//, '').replace(/^\//, '');
  try { await access(join(dist, normalized)); } catch { errors.push(`missing referenced asset: ${reference}`); }
}

for (const icon of manifest.icons ?? []) {
  try {
    const iconStat = await stat(join(dist, icon.src.replace(/^\.\//, '').replace(/^\//, '')));
    if (iconStat.size < 500) errors.push(`icon is unexpectedly small: ${icon.src}`);
  } catch {
    errors.push(`missing manifest icon: ${icon.src}`);
  }
}
if (manifest.id !== './' || manifest.start_url !== './?source=pwa' || manifest.scope !== './') errors.push('manifest navigation URLs must remain subpath-safe');
if (registrationSource.includes("register('/sw.js'")) errors.push('service-worker registration must not assume a domain-root deployment');

const cssAssets = references.filter((reference) => reference.endsWith('.css')).map((reference) => `/${reference.replace(/^\.\//, '').replace(/^\//, '')}`);
const jsAssets = references.filter((reference) => reference.endsWith('.js')).map((reference) => `/${reference.replace(/^\.\//, '').replace(/^\//, '')}`);
if (cssAssets.length !== 1 || jsAssets.length !== 1) errors.push('expected one hashed CSS and one hashed JS entry');
for (const asset of [...cssAssets, ...jsAssets, '/index.html']) {
  const scopedAsset = `.${asset}`;
  if (!worker.includes(scopedAsset)) errors.push(`service worker does not precache ${scopedAsset}`);
}
for (const asset of [...cssAssets, ...jsAssets]) {
  const assetStat = await stat(join(dist, asset.slice(1)));
  if (assetStat.size < (asset.endsWith('.css') ? 5_000 : 20_000)) errors.push(`compiled asset is unexpectedly small: ${asset}`);
}
if (!worker.includes("CACHE_PREFIX = 'routine-shell-'")) errors.push('versioned cache prefix missing');
if (!worker.includes("key !== CACHE_NAME")) errors.push('old cache cleanup missing');
if (!worker.includes("request.mode === 'navigate'")) errors.push('navigation fallback missing');
if (!worker.includes("SHELL_URL = new URL('index.html', SCOPE_URL).href")) errors.push('scope-relative shell URL missing');
if (!worker.includes("caches.match(SHELL_URL).then((cached) => cached || fetch(request))")) errors.push('navigation shell must stay version-consistent');

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Verified ${references.length} HTML assets, ${manifest.icons.length} icons, and versioned PWA cache behavior.`);
}
