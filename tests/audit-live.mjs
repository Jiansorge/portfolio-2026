// audit-live.mjs — live-vs-repo drift check (needs network; run on demand, NOT in pre-commit).
// Run: node tests/audit-live.mjs
// Fails non-zero when the deployed site drifts from this repo.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://jiansorge.com';
const fails = [];
function check(name, ok, detail) {
  console.log((ok ? 'PASS' : 'FAIL') + ' ' + name + (ok ? '' : ' :: ' + detail));
  if (!ok) fails.push(name);
}
function get(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? import('https') : import('http');
    lib.then((m) => m.default.get(url, (r) => {
      const c = [];
      r.on('data', (d) => c.push(d));
      r.on('end', () => resolve({ status: r.statusCode, body: Buffer.concat(c) }));
    }).on('error', reject)).catch(reject);
  });
}

const home = await get(SITE + '/?drift=' + Date.now());
const live = home.body.toString('latin1');
check('live-200', home.status === 200, 'status ' + home.status);
check('live-doctype-first', live.startsWith('<!doctype html>'), 'byte0 off');
const FFFD_BYTES = String.fromCharCode(0xef, 0xbf, 0xbd);
check('live-no-fffd', live.indexOf(FFFD_BYTES) < 0, 'replacement bytes live');
check('live-has-fixes', live.indexOf("I'm <strong>Jian") >= 0 && live.indexOf('View work</a>') >= 0,
  'committed fixes not deployed yet?');

const repoRobots = fs.readFileSync(path.join(root, 'robots.txt'), 'utf8').trim();
const liveRobots = (await get(SITE + '/robots.txt?drift=' + Date.now())).body.toString('utf8').trim();
check('live-robots-match', liveRobots === repoRobots,
  'live robots.txt differs from repo (stale edge cache or override?)');

const fav = await get(SITE + '/favicon.ico?drift=' + Date.now());
check('live-favicon-200', fav.status === 200 && fav.body.length > 100,
  'status ' + fav.status);

if (fails.length) {
  console.log('\n' + fails.length + ' LIVE CHECK(S) FAILED: ' + fails.join(', '));
  process.exit(1);
}
console.log('\nlive matches repo');
