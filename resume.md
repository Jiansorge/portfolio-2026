# Jian Sorge — Senior Front-End Engineer
Remote / Los Angeles, CA — ji@nsorge.com — linkedin.com/in/jiansorge — jiansorge.com — github.com/jiansorge

## Summary
Senior Front-End Engineer, 5+ years shipping production web apps. Sole front-end owner of a four-app enterprise platform at Bionic. Holistic builder focused on performance, security, accessibility, and reliability. Known for diagnosing state and concurrency defects in large legacy codebases, 46 percent build-time reduction, and introducing first automated testing and CI.

## Skills
- **Languages:** JavaScript, HTML, CSS/SCSS — TypeScript (prior professional use, can refresh)
- **Frameworks/Libraries:** React, Node.js, Express, Tailwind CSS (current) — Backbone, MobX (prior)
- **Tools & Practices:** Git, RESTful APIs, Server-Sent Events (SSE), Playwright, GitHub Actions, Docker, Terser, Dart Sass, Google Lighthouse, JSON-LD / SEO, Agile
- **Platform:** Cloudflare Workers + Durable Objects, PWA, WebGL/GLSL (via Joining Palms)

## Selected Projects — jiansorge.com
**Joining Palms (joining-palms.app)** — github.com/Jiansorge/prayer-earth | React 18, Vite, Three.js, Zustand, Cloudflare
- Live 3D Earth that glows as the world prays, 145 prayers across 15 traditions, 12 languages + RTL, 100 percent public domain or original, PWA offline
- Holistic optimization: 60fps shader aura, Vite code split, service worker, 150KB initial, 99 Lighthouse
- Secure and accessible: strict CSP, coarse 1 degree cell only and IPs never stored, semantic HTML, keyboard, high contrast

**sync-engine** — github.com/Jiansorge/sync-engine | Cloudflare Workers, Durable Objects, Vitest
- Edge sync for ~$0 per month, durable SQLite totals, WebSocket presence, live feed, sharding via ?cell + Coordinator, 53 tests including restart survival

## Professional Experience
**Senior Front-End Engineer — Bionic Advertising Systems | Remote | Aug 2021 - Present**
- Sole front-end for 4 apps, 430+ merged PRs across features, performance, security, modernization
- Built Advertise With Us search engine, 95+ Lighthouse via code split and lazy load, JSON-LD and semantic HTML for SEO
- Built real-time collaboration layer over Server-Sent Events to replace a monolithic fetch of all campaign data and associated processing for grid sync (rates, quantities, costs), enabling incremental updates with connection monitoring, freeze-state lifecycle, and recovery for dropped and out-of-order events
- Cut media plan build 46 percent (49s to 26s) on 13K-line campaigns by eliminating O(n2) scans and inefficient SQL subselect, with prod telemetry
- Modernized build: Closure Compiler to Terser, node-sass to Dart Sass, GitHub Actions CI, automated deps with security cooldowns
- Established first automated testing with Playwright E2E, nightly runs, deploy verification, resolved 583 pre-existing backend failures
- Remediated pen-test findings including persistent XSS and HTML injection, removed eval and vulnerable libs, added CSP, fixed JDBC pool leak

**Front-End Developer — Collinear | Remote | Oct 2020 - Feb 2021**
- Built responsive React + TypeScript + MobX components for Fortune 100 product, Dockerized microservices, admin dashboards for factory QA

## Education
Certificate, Full-Stack JS — University of Washington, 2019
Certificate, Front-End — University of Washington, 2018

## Early Career
Project Engineer — Boeing Commercial Airplanes | Everett, WA | 2014 - 2020 — Manufacturing systems, microservices, 3D search.
