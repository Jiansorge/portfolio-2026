# portfolio-2026 — Jian Sorge

Live: **https://jiansorge.com** (Cloudflare) · fallback **https://jiansorge.surge.sh** · Repo: this one

Minimal, earth-inspired portfolio for a senior front-end engineer. No build, no framework, no trackers. Mostly light, natural palette with subtle blue/green flowing accents, built for 99/100 Lighthouse and real world hiring impact.

## Highlights

- **Single file:** `index.html` 38KB, inline CSS, system fonts, `content-visibility` for below fold
- **Lightweight media:** `hero-mountains` wildflower meadow 14KB webp (400) / 33KB (800) + `sky-field` 13KB/35KB, `buddha.svg` 1.6KB, `screenshot` 7KB webp 400 / 24KB 800 (from 139KB jpg, 699KB png), `demo` 106KB mp4 / 95KB webm (from 3.3MB gif) — total initial ~140KB on mobile
- **Stack:** HTML + CSS only, semantic, accessible, responsive, `srcset`/`sizes` for DPR, `preload` with `fetchpriority=high` for LCP
- **Targets:** fast (99 performance), secure (strict CSP with hash, honeypot + link obfuscation), private by design, accessible (6.44:1 AA, keyboard, RTL, `track` captions)

## What it showcases

Two recent, holistic builds — innovative, ethical, and shipping. AI accelerated, human curated, business focused on performance, security, reliability, and cost efficiency:

- **Joining Palms** (prayer-earth) — `https://joining-palms.app` — live 3D Earth that glows as the world prays. 145 prayers across 15 traditions, 12 languages + RTL, 100 percent public domain or original, wholesome, never shame based. PWA offline, Three.js shaders, 60fps, strict CSP, XSS safe. Holistic optimization, secure and trustworthy.
- **sync-engine** — `https://github.com/Jiansorge/sync-engine` — edge sync on Cloudflare Workers + Durable Objects, ~$0 per month, durable SQLite totals, sharding via `?cell` + Coordinator, 53 Vitest tests including restart survival. Performant and durable, secure and reliable.

See `index.html` for copy that frames bold, impactful shipping with business impact (46 percent build time reduction, first CI in org, state/concurrency diagnostics).

## Structure

```
portfolio-2026/
  index.html — all markup + styles + json-ld, no em dashes
  assets/
    hero-mountains.jpg — wildflower meadow under blue sky 144KB (fallback), 14KB/33KB webp, 11KB/21KB avif
    sky-field.jpg — sky wash 75KB, 13KB/35KB webp
    buddha.svg — rainbow striped Buddha mark 1.6KB
    screenshot.jpg — Joining Palms home 139KB, 7KB/24KB webp, 6KB/17KB avif responsive
    demo.mp4 / demo.webm — splash demo 106KB/95KB (from 3.3MB gif)
  _headers — Cloudflare Pages headers (HSTS, CSP, Cache-Control)
  robots.txt — Allow: / + Sitemap
  sitemap.xml
  CNAME — jiansorge.com (surge fallback)
```

Original large sources `assets/screenshot.png` and `assets/demo.gif` are gitignored; optimized jpg/webp/avif/mp4 are committed.

## Local preview

```powershell
npx serve .
```

## Deploy

**Cloudflare (current, after domain transfer):**
```powershell
npx wrangler pages deploy . --project-name=portfolio-2026
# or via Cloudflare dashboard: Connect this repo, build command none, output .
```
Headers via `_headers` (HSTS, CSP, Cache-Control for /assets/* immutable). DNS: `jiansorge.com` CNAME to Cloudflare Pages.

**Surge fallback:**
```powershell
npx surge --project ./ --domain jiansorge.surge.sh
npx surge --project ./ --domain jiansorge.com
```

## Performance / Security / Privacy

- **Performance 99:** 1 HTML + 1 preload LCP, `loading="lazy"`, `decoding="async"`, `content-visibility`, system fonts, no JS framework, responsive `srcset`/`sizes` for DPR, `<150KB` hero initial on mobile, `Cache-Control: immutable` for assets.
- **Security:** `Content-Security-Policy` with `sha256-Lw0Ant2AYlaKaNvmXAakN5mgMvmo9BtrcCkbuFUls7Q=` + `https://static.cloudflareinsights.com`, `X-Content-Type-Options nosniff`, `X-Frame-Options DENY`, `COOP same-origin`, `Referrer strict-origin`, honeypot `hp` + base64 `js-link` obfuscation, `rel="noopener noreferrer"`. Note: HSTS/COOP/XFO via `_headers` active on Cloudflare, not on Surge.
- **Privacy:** no cookies, no analytics (Cloudflare beacon allowed via CSP), no email harvesting (email removed, LinkedIn/GitHub obfuscated). App only shares coarse 1 degree cell.
- **Accessibility:** AA contrast (muted 6.44:1, ink 18:1), semantic `h1→h2→h3`, `lang="en"`, `skip` link, focus-visible, `alt` on images, `dl` for facts, `track` captions for video, identical links share `aria-label`.
- **SEO:** `robots.txt` Allow, `sitemap.xml`, `canonical`, `og`, `viewport`, `json-ld`.

## Style note

No em dashes in this repo. Use commas, periods, or "and" instead for consistency and accessibility.

## LinkedIn headline

`Senior Front-End Engineer | React · JavaScript | Performance · Security · Accessibility` — TypeScript and MobX are prior professional experience, can refresh quickly.

## License

MIT — see `LICENSE`.
