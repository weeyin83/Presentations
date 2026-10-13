import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { ROOT, WEBSITE_ROOT, loadCatalog, matchesPresentation, resolveResource, slugify } from '../src/lib/catalog.mjs';

test('website commands discover the repository archive in the parent directory', () => {
  assert.equal(path.join(ROOT, 'website'), WEBSITE_ROOT);
  const { presentations } = loadCatalog();
  assert.ok(presentations.length > 0, 'The default catalog must discover the repository archive');
  for (const talk of presentations) {
    assert.ok(fs.existsSync(path.join(ROOT, talk.folder)), `Missing archive folder: ${talk.folder}`);
  }
});

function fixture(context, files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'presentations-'));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const [name, contents] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, name)), { recursive: true });
    fs.writeFileSync(path.join(root, name), contents);
  }
  return root;
}

test('generic README uses actual deck name and relative links are downloadable', (context) => {
  const root = fixture(context, { '2025/Event/readme.md': '# Learn it all\n\n[Slides](Talk.pptx)\n\n## Azure Arc\n[Docs](https://learn.microsoft.com/azure/azure-arc/)\n', '2025/Event/Talk.pptx': 'slides' });
  const { presentations } = loadCatalog(root);
  assert.equal(presentations[0].title, 'Talk');
  assert.equal(presentations[0].downloads[0].url, 'https://raw.githubusercontent.com/weeyin83/Presentations/main/2025/Event/Talk.pptx');
  assert.ok(presentations[0].topics.includes('Azure Arc'));
  assert.equal(presentations[0].event, null);
});

test('multiple decks remain separate and do not inherit unrelated resources', (context) => {
  const root = fixture(context, { '2019/Event/One.pptx': '', '2019/Event/Two.pptx': '', '2019/Event/readme.md': '# Learn it all\n\n[Docs](https://example.com)' });
  const { presentations, warnings } = loadCatalog(root);
  assert.equal(presentations.length, 2);
  assert.equal(presentations[0].documents.length, 0);
  assert.notEqual(presentations[0].id, presentations[1].id);
  assert.ok(warnings.some((warning) => warning.includes('unassociated')));
});

test('missing local links fail with their source file', (context) => {
  const root = fixture(context, { '2025/Event/readme.md': '# Talk\n[Download](missing.pdf)' });
  assert.throws(() => loadCatalog(root), /2025\/Event\/readme.md: missing.*missing.pdf/);
  assert.throws(() => resolveResource('../../../etc/passwd', '2025/Event/readme.md', root), /out-of-repository/);
});

test('metadata separates talks and rejects invalid dates, fields and duplicate URLs', (context) => {
  const metadata = [{ id: 'cost-talk', title: 'Costs', documents: ['2025/Event/costs.md'], event: 'Event', date: '2025-06-12' }, { id: 'ops-talk', documents: ['2025/Event/ops.md'] }];
  const root = fixture(context, { '2025/Event/costs.md': '# Costs', '2025/Event/ops.md': '# Operations', '2025/Event/presentation.json': JSON.stringify(metadata) });
  const result = loadCatalog(root);
  assert.equal(result.presentations.length, 2);
  assert.equal(result.presentations[0].date, '2025-06-12');
  metadata[0].date = '2025-02-30';
  fs.writeFileSync(path.join(root, '2025/Event/presentation.json'), JSON.stringify(metadata));
  assert.throws(() => loadCatalog(root), /valid YYYY-MM-DD/);
  metadata[0].date = '2025-06-12';
  metadata[0].date = '2025-99-01';
  fs.writeFileSync(path.join(root, '2025/Event/presentation.json'), JSON.stringify(metadata));
  assert.throws(() => loadCatalog(root), /valid YYYY-MM-DD/);
  metadata[0].date = '2025-06-12';
  metadata[1].id = 'cost-talk';
  fs.writeFileSync(path.join(root, '2025/Event/presentation.json'), JSON.stringify(metadata));
  assert.throws(() => loadCatalog(root), /Duplicate/);
  metadata[1].id = 'ops-talk';
  metadata[0].unexpected = true;
  fs.writeFileSync(path.join(root, '2025/Event/presentation.json'), JSON.stringify(metadata));
  assert.throws(() => loadCatalog(root), /unknown metadata field/);
});

test('unsafe HTML and empty links are not actionable', (context) => {
  const root = fixture(context, { '2025/Event/readme.md': '# Talk\n\n<script>alert(1)</script>\n\n[Demo]()\n\n[Bad](javascript:alert)\n\n[Docs](https://example.com)' });
  const { presentations, warnings } = loadCatalog(root);
  assert.ok(!presentations[0].documents[0].html.includes('<script>'));
  assert.ok(!presentations[0].documents[0].html.includes('javascript:'));
  assert.equal(presentations[0].resources.length, 1);
  assert.ok(warnings.some((warning) => warning.includes('empty link')));
  assert.equal(resolveResource('[https://old.example](https://example.com)', '2025/Event/readme.md', root), null);
});

test('search matches all words and combines topic, event and year filters', () => {
  const talk = { title: 'Azure Arc', description: 'Manage SQL servers', topics: ['Azure Arc'], event: 'Community', year: 2026, folder: '2026/SQLAzureArc' };
  assert.ok(matchesPresentation(talk, { query: ' sql AZURE ', topic: 'Azure Arc', year: '2026', event: 'Community' }));
  assert.ok(!matchesPresentation(talk, { query: 'azure terraform' }));
  assert.ok(!matchesPresentation(talk, { year: '2025' }));
  assert.ok(!matchesPresentation(talk, { topic: 'AI' }));
  assert.equal(slugify('2026/Azure Quotas'), '2026-azure-quotas');
});

test('empty folders are omitted and HTML entities do not leak into titles', (context) => {
  const root = fixture(context, { '2025/Empty/readme.md': ' ', '2025/Talk/readme.md': '# Sustainability & AI\n\n## References\n[Docs](https://example.com)' });
  const { presentations, warnings } = loadCatalog(root);
  assert.equal(presentations.length, 1);
  assert.equal(presentations[0].title, 'Sustainability & AI');
  assert.ok(warnings.some((warning) => warning.includes('omitted from the library')));
});

test('resource technology labels are searchable and code examples are keyboard accessible', (context) => {
  const root = fixture(context, { '2025/Talk/readme.md': '# Practical AI\n\n[GitHub Copilot](https://github.com/features/copilot)\n\n```bash\nexample\n```\n\nThanks for coming along.' });
  const talk = loadCatalog(root).presentations[0];
  assert.ok(matchesPresentation(talk, { query: 'copilot' }));
  assert.ok(talk.topics.includes('GitHub Copilot'));
  assert.ok(talk.documents[0].html.includes('tabindex="0"'));
  assert.ok(!talk.description.startsWith('Thanks'));
});

test('multiple resource documents do not guess an unlinked slide association', (context) => {
  const root = fixture(context, { '2025/Event/first.md': '# First talk', '2025/Event/second.md': '# Second talk', '2025/Event/deck.pptx': '' });
  const { presentations, warnings } = loadCatalog(root);
  assert.equal(presentations.length, 2);
  assert.ok(presentations.every((talk) => talk.downloads.length === 0));
  assert.ok(warnings.some((warning) => warning.includes('not associated')));
});