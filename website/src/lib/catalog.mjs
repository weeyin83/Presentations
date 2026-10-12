import fs from 'node:fs';
import path from 'node:path';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';
import { decodeHTML } from 'entities';

export const WEBSITE_ROOT = path.resolve(process.cwd());
export const ROOT = path.resolve(WEBSITE_ROOT, '..');
export const REPOSITORY = 'https://github.com/weeyin83/Presentations';
export const slugify = (text) => text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const encodePath = (value) => value.split('/').map(encodeURIComponent).join('/');
export const sourceUrl = (value) => `${REPOSITORY}/blob/main/${encodePath(value)}`;
export const downloadUrl = (value) => `https://raw.githubusercontent.com/weeyin83/Presentations/main/${encodePath(value)}`;
const plain = (text) => decodeHTML(sanitizeHtml(text, { allowedTags: [], allowedAttributes: {} })).replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*_`]/g, '').trim();
const generic = /^(learn it all\b|resources(?: and links)?$|references$|welcome$|presentations?$)/i;
const slidePattern = /\.(pptx?|pdf)$/i;
const topicPatterns = [
  ['Azure Arc', /azure\s*arc|sqlazurearc/i],
  ['Azure Quotas', /azure quota/i],
  ['Azure Migrate', /azure\s*migrate/i],
  ['Migration', /migrat(?:e|ion|ing)/i],
  ['Hybrid Cloud', /hybrid|azure\s*stack|hci/i],
  ['Infrastructure as Code', /infrastructure as code|\biac\b|bicep|terraform|cloudformation/i],
  ['Azure Bicep', /bicep/i],
  ['Terraform', /terraform/i],
  ['Octopus Deploy', /octopus|octopetshop/i],
  ['DevOps', /devops|github actions|pipeline/i],
  ['AWS', /\baws\b|cloudformation/i],
  ['Cost Management', /cost|finops|cloudyn|saving/i],
  ['Kusto Query Language', /kusto|\bkql\b/i],
  ['AI', /\bai\b|artificial intelligence/i],
  ['GitHub Copilot', /github copilot/i],
  ['SQL Server', /sql server/i],
  ['Sustainability', /sustainab|carbon/i],
  ['Git', /\bgit\b|learngit/i],
  ['Package Management', /package manager|chocolatey|winget/i],
  ['Azure', /azure/i],
];

function filesIn(root, folder) {
  return fs.readdirSync(path.join(root, folder), { withFileTypes: true }).flatMap((entry) => {
    const relative = `${folder}/${entry.name}`;
    return entry.isDirectory() ? filesIn(root, relative) : [relative];
  }).sort();
}

function ensureLocal(root, relative, origin) {
  const absolute = path.resolve(root, relative);
  if (!absolute.startsWith(`${path.resolve(root)}${path.sep}`) || !fs.existsSync(absolute)) {
    throw new Error(`${origin}: missing or out-of-repository local reference "${relative}"`);
  }
  return relative;
}

export function resolveResource(href, source, root = ROOT) {
  if (!href || href.startsWith('#')) return null;
  if (/^[\[(]https?:\/\//i.test(href)) return null;
  let pathname;
  let fragment = '';
  if (/^https?:\/\//i.test(href)) {
    const url = new URL(href);
    if (url.hostname.toLowerCase() === 'github.com' && /^\/weeyin83\/presentations\/(blob|tree)\/(main|master)\//i.test(url.pathname)) {
      pathname = decodeURIComponent(url.pathname.replace(/^\/weeyin83\/presentations\/(blob|tree)\/(main|master)\//i, ''));
      fragment = url.hash;
    } else {
      return href;
    }
  } else if (/^[a-z][a-z0-9+.-]*:/i.test(href)) {
    return href.startsWith('mailto:') ? href : null;
  } else {
    const url = new URL(href, 'https://local.invalid/');
    pathname = href.startsWith('/') ? decodeURIComponent(url.pathname.slice(1)) : path.posix.normalize(path.posix.join(path.posix.dirname(source), decodeURIComponent(href.split(/[?#]/)[0])));
    fragment = url.hash;
  }
  ensureLocal(root, pathname, source);
  if (slidePattern.test(pathname)) return `${downloadUrl(pathname)}${fragment}`;
  return fs.statSync(path.join(root, pathname)).isDirectory() ? `${REPOSITORY}/tree/main/${encodePath(pathname)}${fragment}` : `${sourceUrl(pathname)}${fragment}`;
}

function readDocument(root, source, warnings) {
  const markdown = fs.readFileSync(path.join(root, source), 'utf8');
  const tokens = marked.lexer(markdown);
  const headings = tokens.filter((token) => token.type === 'heading');
  const titleMarker = tokens.findIndex((token) => token.type === 'heading' && /^talk title$/i.test(plain(token.text)));
  const followingTitle = titleMarker >= 0 ? tokens.slice(titleMarker + 1).find((token) => token.type === 'heading') : null;
  const firstHeading = headings.find((token) => token.depth === 1 && !generic.test(plain(token.text)));
  const title = plain(followingTitle?.text || firstHeading?.text || '');
  const abstractIndex = tokens.findIndex((token) => token.type === 'heading' && /^(abstract|description|overview)$/i.test(plain(token.text)));
  const abstractTokens = [];
  if (abstractIndex >= 0) {
    for (const token of tokens.slice(abstractIndex + 1)) {
      if (token.type === 'heading') break;
      if (token.type === 'paragraph') abstractTokens.push(plain(token.text));
    }
  }
  const fallback = tokens.find((token) => token.type === 'paragraph' && !/^(this is a talk|if you|thank|thanks|let's stay|you can sign|connect|written by|these are (the )?links|below (are|is)|during my session)/i.test(plain(token.text)) && !token.text.includes('!['));
  const description = abstractTokens.join('\n\n') || (fallback ? plain(fallback.text) : '');
  const links = [];
  const linkedSlides = [];
  marked.walkTokens(tokens, (token) => {
    if (token.type !== 'link' && token.type !== 'image') return;
    if (!token.href) {
      warnings.push(`${source}: empty ${token.type} omitted`);
      return;
    }
    const url = resolveResource(token.href, source, root);
    if (!url && !token.href.startsWith('#')) warnings.push(`${source}: unsupported or malformed link omitted: ${token.href}`);
    if (url?.startsWith('https://raw.githubusercontent.com/weeyin83/Presentations/main/')) linkedSlides.push(decodeURIComponent(url.split('#')[0].split('/main/')[1]));
    if (token.type === 'link' && url && !links.some((link) => link.url === url)) {
      const label = plain(token.text);
      const parsed = new URL(url, 'https://local.invalid');
      const descriptiveLabel = [parsed.hostname.replace('www.', ''), ...decodeURIComponent(parsed.pathname).split('/').filter(Boolean).slice(-2)].join(' / ');
      links.push({ label: /^(here|link|click here)$/i.test(label) ? descriptiveLabel : label || 'Resource', url });
    }
  });
  const referenceMarker = tokens.findIndex((token) => token.type === 'heading' && /^(resources(?: and links)?|references)$/i.test(plain(token.text)));
  let referenceTokens = referenceMarker >= 0 ? tokens.slice(referenceMarker + 1) : tokens.filter((token) => !(token.type === 'heading' && token.depth === 1));
  const contactIndex = referenceTokens.findIndex((token) => token.type === 'heading' && /^(contact|connect with|stay in touch)/i.test(plain(token.text)));
  if (contactIndex >= 0) referenceTokens = referenceTokens.slice(0, contactIndex);
  const html = sanitizeHtml(marked.parser(referenceTokens), {
    allowedTags: ['h2', 'h3', 'h4', 'h5', 'p', 'a', 'ul', 'ol', 'li', 'strong', 'em', 'code', 'pre', 'blockquote', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'br'],
    allowedAttributes: { a: ['href'], code: ['class'], pre: ['tabindex', 'role', 'aria-label'] },
    transformTags: {
      a: (tagName, attributes) => ({ tagName, attribs: { href: resolveResource(attributes.href, source, root) || undefined } }),
      h1: 'h2',
      pre: (tagName) => ({ tagName, attribs: { tabindex: '0', role: 'region', 'aria-label': 'Code example' } }),
    },
  });
  const eventMatch = markdown.match(/This is a talk I gave at(?: the)? \[([^\]]+)\]/i);
  const event = eventMatch ? eventMatch[1].replace(/ in [^,]+,.*$|,.*$/, '').replace(/ in (?:July|September|May) \d{4}$/, '') : null;
  return { source, title, description, links, linkedSlides, html, event, text: plain(markdown), headings: headings.map((token) => plain(token.text)) };
}

function validateOverride(metadata, origin, root) {
  const allowed = new Set(['id', 'title', 'description', 'event', 'date', 'topics', 'files', 'documents']);
  for (const key of Object.keys(metadata)) if (!allowed.has(key)) throw new Error(`${origin}: unknown metadata field "${key}"`);
  for (const key of ['id', 'title', 'description', 'event', 'date']) {
    if (metadata[key] !== undefined && (typeof metadata[key] !== 'string' || !metadata[key].trim())) throw new Error(`${origin}: ${key} must be a non-empty string`);
  }
  if (metadata.id && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(metadata.id)) throw new Error(`${origin}: id must be a lowercase URL slug`);
  if (metadata.date) {
    const date = new Date(`${metadata.date}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(metadata.date) || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== metadata.date) throw new Error(`${origin}: date must be a valid YYYY-MM-DD`);
  }
  for (const key of ['topics', 'files', 'documents']) {
    if (metadata[key] !== undefined && (!Array.isArray(metadata[key]) || metadata[key].some((value) => typeof value !== 'string' || !value.trim()))) throw new Error(`${origin}: ${key} must be an array of non-empty strings`);
  }
  for (const file of [...(metadata.files || []), ...(metadata.documents || [])]) {
    ensureLocal(root, file, origin);
    if (!fs.statSync(path.join(root, file)).isFile()) throw new Error(`${origin}: ${file} must be a file`);
  }
  for (const file of metadata.files || []) if (!slidePattern.test(file)) throw new Error(`${origin}: files must be PowerPoint or PDF files`);
  for (const file of metadata.documents || []) if (!/\.md$/i.test(file)) throw new Error(`${origin}: documents must be Markdown files`);
}

export function loadCatalog(root = ROOT) {
  const warnings = [];
  const presentations = [];
  const years = fs.readdirSync(root, { withFileTypes: true }).filter((entry) => entry.isDirectory() && /^\d{4}$/.test(entry.name)).map((entry) => entry.name).sort();
  for (const year of years) {
    const folders = fs.readdirSync(path.join(root, year), { withFileTypes: true }).filter((entry) => entry.isDirectory()).sort((first, second) => first.name.localeCompare(second.name));
    for (const directory of folders) {
      const folder = `${year}/${directory.name}`;
      const files = filesIn(root, folder);
      const slides = files.filter((file) => slidePattern.test(file));
      const documents = files.filter((file) => /\.md$/i.test(file)).map((file) => readDocument(root, file, warnings));
      if (!slides.length && !documents.some((document) => document.text)) {
        warnings.push(`${folder}: no slides or non-empty resource documents; omitted from the library`);
        continue;
      }
      const mainDocuments = documents.filter((document) => document.title || /\/(readme|resources)\.md$/i.test(document.source));
      const metadataFile = `${folder}/presentation.json`;
      let entries;
      if (files.includes(metadataFile)) {
        const metadata = JSON.parse(fs.readFileSync(path.join(root, metadataFile), 'utf8'));
        entries = Array.isArray(metadata) ? metadata : [metadata];
        if (!entries.length || entries.some((entry) => !entry || typeof entry !== 'object' || Array.isArray(entry))) throw new Error(`${metadataFile}: expected an object or a non-empty array of objects`);
        entries.forEach((entry) => validateOverride(entry, metadataFile, root));
        if (entries.length > 1 && entries.some((entry) => !entry.id && !entry.documents?.length && !entry.files?.length)) throw new Error(`${metadataFile}: each multi-talk entry requires an id or an explicit document/deck association`);
      } else if (mainDocuments.length > 1) {
        entries = mainDocuments.map((document) => ({ documents: [document.source], files: document.linkedSlides }));
      } else if (slides.length > 1) {
        entries = slides.map((file) => ({ files: [file], documents: mainDocuments.filter((document) => document.linkedSlides.includes(file)).map((document) => document.source) }));
        if (mainDocuments.some((document) => !document.linkedSlides.length)) warnings.push(`${folder}: multiple decks; unassociated Markdown is available only in the source folder`);
      } else {
        entries = [{ files: slides, documents: documents.map((document) => document.source) }];
      }
      const usedSlides = new Set();
      for (const entry of entries) {
        const entrySlides = entry.files ?? (entries.length === 1 ? slides : []);
        const entryDocuments = entry.documents ?? (entries.length === 1 ? documents.map((document) => document.source) : []);
        const selected = entryDocuments.map((source) => documents.find((document) => document.source === source) || readDocument(root, source, warnings));
        const primary = selected.find((document) => document.title) || selected[0];
        const title = entry.title || primary?.title || (entrySlides[0] ? path.posix.basename(entrySlides[0]).replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ') : directory.name.replace(/[_-]+/g, ' '));
        const id = entry.id || slugify(`${folder}${entries.length > 1 ? `-${primary?.source ? path.posix.basename(primary.source, '.md') : path.posix.basename(entrySlides[0], path.posix.extname(entrySlides[0]))}` : ''}`);
        const description = entry.description ?? primary?.description ?? '';
        const searchText = selected.flatMap((document) => [...document.headings, ...document.links.map((link) => link.label)]).join(' ');
        const topicText = [title, folder, description, searchText].join(' ');
        const topics = entry.topics || topicPatterns.filter(([, pattern]) => pattern.test(topicText)).map(([topic]) => topic);
        const resources = selected.flatMap((document) => document.links).filter((resource, index, all) => !entrySlides.some((file) => resource.url === downloadUrl(file)) && all.findIndex((other) => other.url === resource.url) === index);
        entrySlides.forEach((file) => usedSlides.add(file));
        if (!entry.title && !primary?.title) warnings.push(`${folder}: title falls back to ${entrySlides.length ? 'deck filename' : 'folder name'}; add presentation.json to confirm it`);
        presentations.push({ id, title, description, searchText, year: Number(year), event: entry.event || primary?.event || null, date: entry.date || null, topics, folder, source: `${REPOSITORY}/tree/main/${encodePath(folder)}`, downloads: entrySlides.map((file) => ({ file, url: downloadUrl(file), type: /\.pdf$/i.test(file) ? 'PDF' : 'PowerPoint', size: fs.statSync(path.join(root, file)).size })), documents: selected.map(({ source, html }) => ({ source, html })), resources });
      }
      for (const file of slides) if (!usedSlides.has(file)) warnings.push(`${file}: not associated with a presentation; assign it explicitly in presentation.json`);
    }
  }
  const ids = new Set();
  for (const presentation of presentations) {
    if (!presentation.id || ids.has(presentation.id)) throw new Error(`Duplicate or empty presentation id: ${presentation.id}`);
    ids.add(presentation.id);
  }
  presentations.sort((first, second) => second.year - first.year || (second.date || '').localeCompare(first.date || '') || first.title.localeCompare(second.title));
  return { presentations, warnings: [...new Set(warnings)] };
}

export { matchesPresentation } from './search.mjs';