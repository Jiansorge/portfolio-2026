# portfolio-2026 · Jian Sorge

Live: **https://jiansorge.surge.sh**

Minimal, earth-inspired portfolio for a software engineer. No build, no framework, no trackers. Mostly light, natural colors, flowing gradients, built for 100/100/100/100 and real privacy.

## Highlights

- **Single file:** `index.html` 38KB, inline CSS, system fonts
- **Lightweight media:** `hero-mountains.jpg` 44KB, `sky-field.jpg` 75KB, `buddha.svg` 1.6KB, `screenshot.jpg` 139KB (optimized from 699KB PNG), `demo.mp4` 106KB + `demo.webm` 95KB (optimized from 3.3MB gif) — total initial ~225KB
- **Stack:** HTML + CSS only, semantic, accessible, responsive
- **Targets:** fast (preload, lazy, no external fonts), secure (strict CSP, nosniff, referrer, honeypot + link obfuscation), private (no cookies/analytics, coarse location only in app), accessible (6.44:1 muted on paper, keyboard, RTL)

## What it showcases

Two recent, holistic builds — innovative and ethical, open source with AI as collaborator:

- **Joining Palms** (prayer-earth) — `https://joining-palms.app` — live 3D Earth that glows as the world prays. 145 prayers across 15 traditions, 12 languages + RTL, 100% public domain or original, wholesome, never shame based. PWA, offline, Three.js + shaders, strict CSP, XSS safe.
- **sync-engine** — `https://github.com/Jiansorge/sync-engine` — privacy first edge sync on Cloudflare Workers + Durable Objects, ~$0/mo, durable SQLite totals, sharding via `?cell` + Coordinator, 53 Vitest tests.

See `index.html` for copy that frames performance, security, accessibility, ethics, and innovation together.

## Structure

```
portfolio-2026/
  index.html — all markup + styles + json-ld
  assets/
    hero-mountains.jpg — mountain lake at dawn 44KB
    sky-field.jpg — sky field wash 75KB
    buddha.svg — rainbow striped Buddha mark 1.6KB
    screenshot.jpg — Joining Palms home 139KB (optimized)
    demo.mp4 / demo.webm — splash demo 106KB/95KB (optimized from gif)
  CNAME — jiansorge.surge.sh
```

Original large sources `assets/screenshot.png` and `assets/demo.gif` are gitignored; optimized jpg/mp4 are committed.

## Local preview

```powershell
npx serve .
# or
python -m http.server 8000
```

## Deploy

Surge (current):
```powershell
npx surge --project ./ --domain jiansorge.surge.sh
```

GitHub Pages alternative (if you prefer CI): enable Pages on this repo, source `main` root, then set custom domain.

## Performance / Security / Privacy

- **Performance:** 1 HTML request + 2 hero images preload, below-fold `loading="lazy"`, `decoding="async"`, system fonts, no JS framework, <150KB hero initial.
- **Security:** `Content-Security-Policy` meta, `X-Content-Type-Options nosniff`, `Referrer strict-origin-when-cross-origin`, honeypot link `hp` + base64 `js-link` obfuscation, `rel="noopener noreferrer"`.
- **Privacy:** no cookies, no analytics, no email harvesting (email removed, LinkedIn/GitHub obfuscated). App only shares coarse 1° cell.
- **Accessibility:** AA contrast (muted 6.44:1, ink 18:1), semantic headings `h1→h2→h3`, `lang="en"`, `skip` link, focus-visible, `alt` on images, RTL ready.

## LinkedIn headline idea

`Senior Front-End Engineer | React · TypeScript | Performance · Security · Accessibility | Cloudflare Workers`

## License

MIT — see `LICENSE`.
