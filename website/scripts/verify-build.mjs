import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { WEBSITE_ROOT, loadCatalog } from '../src/lib/catalog.mjs';

const { presentations } = loadCatalog();
const output = path.join(WEBSITE_ROOT, 'dist');
assert.ok(presentations.length, 'No presentations discovered in the repository archive.');
for (const talk of presentations) {
  const filename = path.join(output, 'presentations', talk.id, 'index.html');
  assert.ok(fs.existsSync(filename), `Missing generated detail page: ${talk.id}`);
  const html = fs.readFileSync(filename, 'utf8');
  for (const download of talk.downloads) assert.ok(html.includes(download.url), `Missing download on ${talk.id}: ${download.file}`);
}
for (const filename of ['index.html', 'events/index.html', 'archive/index.html', '404.html', 'robots.txt', 'sitemap.xml', 'staticwebapp.config.json', 'archive/images/arc.png']) {
  assert.ok(fs.existsSync(path.join(output, filename)), `Missing build output: ${filename}`);
}
if (process.env.SITE_URL) {
  const sitemap = fs.readFileSync(path.join(output, 'sitemap.xml'), 'utf8');
  assert.equal((sitemap.match(/<loc>/g) || []).length, presentations.length + 3, 'Incomplete sitemap');
  assert.ok(sitemap.includes(new URL('/', process.env.SITE_URL).href), 'Wrong sitemap origin');
  const homepage = fs.readFileSync(path.join(output, 'index.html'), 'utf8');
  assert.ok(homepage.includes('rel="canonical"'), 'Canonical URL missing');
}
console.log(`Verified ${presentations.length} static detail pages, downloads, public assets and hosting configuration.`);