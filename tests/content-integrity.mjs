// content-integrity.mjs — guards against mojibake/stray-byte regressions.
// Run: node tests/content-integrity.mjs   (also wired to `npm test` + pre-commit)
// Fails non-zero with a report on ANY violation. ASCII-only source by design:
// every non-ASCII char under test is referenced by \u escape, never literally.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const fails = [];
function check(name, ok, detail) {
  console.log((ok ? 'PASS' : 'FAIL') + ' ' + name + (ok ? '' : ' :: ' + detail));
  if (!ok) fails.push(name);
}

const htmlPath = path.join(root, 'index.html');
const buf = fs.readFileSync(htmlPath);
const latin = buf.toString('latin1');

// 1. doctype must be byte zero (a stray lead byte forces quirks mode)
check('doctype-first-byte', latin.startsWith('<!doctype html>'),
  'first bytes: ' + buf.slice(0, 6).toString('hex'));

// 2. strict UTF-8 decode must not throw (fatal) and must contain no U+FFFD
let text = '';
try {
  text = new TextDecoder('utf-8', { fatal: true }).decode(buf);
  check('valid-utf8', true);
} catch (e) {
  check('valid-utf8', false, String(e).slice(0, 160));
}
check('no-replacement-char', !text.includes('�'), 'U+FFFD present');

// 3. banned codepoints for this English-only site (mojibake signatures)
const banned = ['�', '—', '–', '―', 'Â', '“', '”', '‘', '’', '→', '✓'];
for (const ch of banned) {
  const cp = ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0');
  check('banned-U+' + cp, !text.includes(ch), 'found in index.html');
}

// 4. allowed non-ASCII allowlist must be the ONLY high chars present
const allowed = new Set([0x00a9, 0x00b0, 0x00b7]);
const seen = new Set();
for (const ch of text) {
  const cp = ch.codePointAt(0);
  if (cp > 127 && cp !== 0xfffd) seen.add(cp);
}
const unexpected = [...seen].filter((c) => !allowed.has(c));
check('allowlist-only', unexpected.length === 0,
  'unexpected: ' + unexpected.map((c) => 'U+' + c.toString(16).toUpperCase()).join(','));

// 5. no stray text nodes inside <head> (they render as page-top garbage)
const head = (text.match(/<head[^>]*>([\s\S]*?)<\/head>/i) || [])[1] || '';
const stripped = head
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/<(script|style|title)[\s\S]*?<\/\1>/gi, '')
  .replace(/<[^>]+>/g, '');
check('head-no-stray-text', stripped.trim() === '',
  'stray head text: ' + JSON.stringify(stripped.trim().slice(0, 80)));

// 6. tag balance for paired elements
const paired = ['div', 'span', 'a', 'p', 'li', 'ul', 'h1', 'h2', 'h3',
  'section', 'article', 'picture', 'style', 'script', 'head', 'body',
  'html', 'em', 'strong', 'code', 'i', 'dl', 'dt', 'dd', 'video', 'footer', 'main', 'nav', 'header'];
let balanced = true, badTag = '';
for (const t of paired) {
  const open = (text.match(new RegExp('<' + t + '(\\s|>)', 'g')) || []).length;
  const close = (text.match(new RegExp('</' + t + '>', 'g')) || []).length;
  if (open !== close) { balanced = false; badTag = t + '(' + open + '/' + close + ')'; break; }
}
check('tags-balanced', balanced, badTag);

// 7. title exact
const m = text.match(/<title>([\s\S]*?)<\/title>/i);
check('title-exact', !!m && m[1] === 'Jian Sorge · Software Engineer',
  'title was: ' + JSON.stringify(m && m[1]));

// 8. no bare & in text content (must be &amp; / entity)
const noTags = text.replace(/<[^>]*>/g, ' ').replace(/&(amp|lt|gt|quot|#\d+);/g, ' ');
check('no-bare-amp', !/[&]/.test(noTags), 'bare & in text');

// 9. file must end with </html> (no trailing junk bytes)
check('ends-clean', /<\/html>\s*$/.test(text), 'tail: ' + JSON.stringify(text.slice(-16)));

// 10. sibling static files exist and are pure ASCII (no hidden mojibake)
for (const f of ['robots.txt', 'sitemap.xml', '_headers', '.well-known/security.txt']) {
  const p = path.join(root, f);
  if (!fs.existsSync(p)) { check('file-' + f, false, 'missing'); continue; }
  const b = fs.readFileSync(p);
  check('file-' + f, ![...b].some((x) => x >= 128), 'has high bytes');
}

if (fails.length) {
  console.log('\n' + fails.length + ' CHECK(S) FAILED: ' + fails.join(', '));
  process.exit(1);
}
console.log('\nall content-integrity checks passed');
