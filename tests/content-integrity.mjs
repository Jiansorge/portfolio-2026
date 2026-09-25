// content-integrity.mjs — guards against mojibake/stray-byte regressions.
// Run: node tests/content-integrity.mjs   (also wired to `npm test` + pre-commit)
// Fails non-zero with a report on ANY violation. ASCII-only source by design:
// every non-ASCII char under test is referenced by \u escape, never literally.
import fs from 'fs';
import path from 'path';
import vm from 'vm';
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

// 11. favicon.ico must exist with a valid ICO header (browsers request it by convention)
{
  const p = path.join(root, 'favicon.ico');
  const ok = fs.existsSync(p) && fs.readFileSync(p).slice(0, 4).equals(Buffer.from([0, 0, 1, 0]));
  check('favicon-ico', ok, 'missing or bad ICO header');
}

// 12. every local asset referenced from index.html must exist on disk
{
  const refs = new Set();
  const attrRe = /\b(?:src|href|poster|content|srcset|imagesrcset)\s*=\s*"([^"]*)"/gi;
  let m;
  while ((m = attrRe.exec(text))) {
    const isSet = /srcset/i.test(m[0].split('=')[0]);
    const parts = isSet ? m[1].split(',') : [m[1]];
    for (let part of parts) {
      const u = part.trim().split(/\s+/)[0].split('#')[0].split('?')[0];
      if (!u || !u.includes('/')) continue;
      if (u.startsWith('http') || u.startsWith('data:') || u.includes('://')) continue;
      refs.add(u.replace(/^\.\//, ''));
    }
  }
  const virtual = new Set(['/trap']);
  const missing = [...refs].filter((u) => !virtual.has(u) && !fs.existsSync(path.join(root, u)));
  check('asset-refs-exist', missing.length === 0, 'missing: ' + missing.slice(0, 6).join(','));
}

// 13. obfuscated contact links must decode to valid https URLs
{
  const encs = [...text.matchAll(/data-enc="([^"]+)"/g)].map((x) => x[1]);
  const bad = encs.filter((e) => {
    try { return !Buffer.from(e, 'base64').toString('latin1').startsWith('https://'); }
    catch { return true; }
  });
  check('data-enc-valid', encs.length > 0 && bad.length === 0,
    encs.length === 0 ? 'no data-enc links found' : 'bad payloads: ' + bad.length);
}

// 14. inline scripts must parse (catches truncation corruption in code)
{
  const tags = [...text.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)];
  const codes = tags.filter((x) => !/\bsrc=/.test(x[1]) && !/ld\+json/.test(x[1])).map((x) => x[2]);
  const jsonlds = tags.filter((x) => /ld\+json/.test(x[1])).map((x) => x[2]);
  let bad = -1;
  codes.forEach((code, i) => { try { new vm.Script(code); } catch { bad = i; } });
  let badJson = -1;
  jsonlds.forEach((code, i) => { try { JSON.parse(code); } catch { badJson = i; } });
  check('inline-js-parses', codes.length > 0 && bad < 0,
    codes.length === 0 ? 'no inline scripts found' : 'script block #' + bad + ' has syntax error');
  check('jsonld-parses', jsonlds.length > 0 && badJson < 0,
    jsonlds.length === 0 ? 'no JSON-LD found' : 'JSON-LD block #' + badJson + ' invalid');
}

// 15. <style> braces must balance (catches truncated CSS)
{
  const css = [...text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((x) => x[1]).join('\n');
  const open = (css.match(/{/g) || []).length;
  const close = (css.match(/}/g) || []).length;
  check('css-braces', open > 0 && open === close, 'braces ' + open + '/' + close);
}

// 16. referenced binary assets must have valid magic bytes (catches corrupt images/video)
{
  const found = new Set([...text.matchAll(/assets\/[A-Za-z0-9_.\-]+/g)].map((x) => x[0]));
  found.add('favicon.ico');
  const bad = [];
  for (const u of found) {
    const p = path.join(root, u);
    if (!fs.existsSync(p)) { bad.push(u + '(missing)'); continue; }
    const b = fs.readFileSync(p);
    const head = b.slice(0, 12).toString('hex');
    let ok = false;
    if (u.endsWith('.jpg') || u.endsWith('.jpeg')) ok = head.startsWith('ffd8ff');
    else if (u.endsWith('.png')) ok = head.startsWith('89504e47');
    else if (u.endsWith('.webp')) ok = head.startsWith('52494646') && b.slice(8, 12).toString() === 'WEBP';
    else if (u.endsWith('.avif') || u.endsWith('.mp4')) ok = b.slice(4, 8).toString() === 'ftyp';
    else if (u.endsWith('.webm')) ok = head.startsWith('1a45dfa3');
    else if (u.endsWith('.svg')) ok = b.toString('latin1').includes('<svg');
    else if (u.endsWith('.ico')) ok = head.startsWith('00000100');
    else ok = b.length > 0;
    if (!ok) bad.push(u);
  }
  check('asset-magic', bad.length === 0, 'bad: ' + bad.slice(0, 6).join(','));
}

// 17. images must carry an alt attribute (empty ok only for decorative)
{
  const imgs = [...text.matchAll(/<img\b[^>]*>/gi)].map((x) => x[0]);
  const bad = imgs.filter((t) => !/\balt\s*=\s*"[^"]*"/.test(t));
  check('img-alt', imgs.length > 0 && bad.length === 0,
    imgs.length === 0 ? 'no imgs found' : 'missing alt: ' + bad.length);
}

// 18. links must have discernible text or an aria-label
{
  const bad = [...text.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)]
    .filter((x) => x[2].replace(/<[^>]*>/g, '').trim() === '' && !/\baria-label\s*=\s*"[^"]+"/.test(x[1]));
  check('link-text', bad.length === 0, 'bad links: ' + bad.length);
}

// 19. heading order: exactly one h1 first, never skip a level going down
{
  const hs = [...text.matchAll(/<(h[1-6])\b[^>]*>/gi)].map((x) => parseInt(x[1][1], 10));
  let ok = hs.length > 0 && hs[0] === 1 && hs.filter((h) => h === 1).length === 1;
  for (let i = 1; ok && i < hs.length; i++) if (hs[i] - hs[i - 1] > 1) ok = false;
  check('heading-order', ok, 'seq: ' + hs.join(','));
}

// 20. html lang present
check('html-lang', /<html\b[^>]*\blang\s*=\s*"[a-z]{2}(-[A-Z]{2})?"/.test(text), 'missing lang');

// 21. meta description present with real content
{
  const tag = text.match(/<meta\b[^>]*\bname\s*=\s*"description"[^>]*>/i);
  const content = tag && (tag[0].match(/\bcontent\s*=\s*"([^"]*)"/i) || [])[1];
  check('meta-description', !!content && content.length >= 50, 'len=' + (content || '').length);
}

// 22. canonical and og:url agree
{
  const canonTag = text.match(/<link\b[^>]*\brel\s*=\s*"canonical"[^>]*>/i);
  const ogTag = text.match(/<meta\b[^>]*\bproperty\s*=\s*"og:url"[^>]*>/i);
  const hrefOf = (m) => m && ((m[0].match(/\b(?:href|content)\s*=\s*"([^"]*)"/i) || [])[1] || '');
  const norm = (u) => u.replace(/\/$/, '');
  check('canonical-og-match', !!canonTag && !!ogTag && norm(hrefOf(canonTag)) === norm(hrefOf(ogTag)),
    'canonical=' + hrefOf(canonTag) + ' og:url=' + hrefOf(ogTag));
}

// 23. internal #anchors resolve to element ids
{
  const hrefs = new Set([...text.matchAll(/\bhref\s*=\s*"#([A-Za-z][\w-]*)"/g)].map((x) => x[1]));
  const ids = new Set([...text.matchAll(/\bid\s*=\s*"([A-Za-z][\w-]*)"/g)].map((x) => x[1]));
  const missing = [...hrefs].filter((h) => !ids.has(h));
  check('anchors-resolve', missing.length === 0, 'dangling: ' + missing.join(','));
}

// 24. external target=_blank links carry rel=noopener
{
  const bad = [...text.matchAll(/<a\b([^>]*)>/gi)].map((x) => x[1]).filter((a) => {
    const href = (a.match(/\bhref\s*=\s*"([^"]*)"/i) || [])[1] || '';
    if (!/^https?:\/\//.test(href)) return false;
    if (!/\btarget\s*=\s*"[^"]*_blank[^"]*"/i.test(a)) return false;
    return !/\brel\s*=\s*"[^"]*noopener[^"]*"/i.test(a);
  });
  check('blank-noopener', bad.length === 0, 'bad: ' + bad.length);
}

// 25. imgs carry width+height (CLS guard)
{
  const bad = [...text.matchAll(/<img\b[^>]*>/gi)].map((x) => x[0])
    .filter((t) => !(/\bwidth\s*=\s*"\d+"/.test(t) && /\bheight\s*=\s*"\d+"/.test(t)));
  check('img-dimensions', bad.length === 0, 'missing dims: ' + bad.length);
}

// 26. HTML size budget (bloat guard)
check('html-size-budget', buf.length <= 65536, 'bytes=' + buf.length);

// 27. robots.txt uses only known directives; Sitemap absolute https on this domain
{
  const t = fs.readFileSync(path.join(root, 'robots.txt'), 'utf8');
  const known = ['user-agent', 'allow', 'disallow', 'sitemap', 'crawl-delay'];
  const bad = t.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
    .filter((l) => !known.includes(l.split(':')[0].trim().toLowerCase()));
  const sm = (t.match(/^\s*Sitemap:\s*(\S+)/im) || [])[1] || '';
  check('robots-directives', bad.length === 0, 'unknown: ' + bad.join(','));
  check('robots-sitemap-https', sm.startsWith('https://jiansorge.com/'), 'sitemap=' + sm);
}

// 28. sitemap locs share the canonical domain; lastmod values are valid ISO dates
{
  const t = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
  const locs = [...t.matchAll(/<loc>([^<]*)<\/loc>/g)].map((x) => x[1].trim());
  const mods = [...t.matchAll(/<lastmod>([^<]*)<\/lastmod>/g)].map((x) => x[1].trim());
  check('sitemap-locs', locs.length > 0 && locs.every((u) => u.startsWith('https://jiansorge.com/')),
    'locs=' + locs.join(','));
  check('sitemap-lastmod', mods.length === locs.length && mods.every((d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(Date.parse(d))),
    'lastmod=' + mods.join(','));
}

// 29. CSP meta present with default-src 'self'
{
  const tag = text.match(/<meta\b[^>]*\bhttp-equiv\s*=\s*"Content-Security-Policy"[^>]*>/i);
  const content = tag && ((tag[0].match(/\bcontent\s*=\s*"([^"]*)"/i) || [])[1] || '');
  check('csp-self', !!content && content.includes("default-src 'self'"), 'csp missing/weak');
}

if (fails.length) {
  console.log('\n' + fails.length + ' CHECK(S) FAILED: ' + fails.join(', '));
  process.exit(1);
}
console.log('\nall content-integrity checks passed');
