# jerica.pro — Jerica's Corner

Jerica's own corner of the internet: a sticker-notebook, alternative/skater personal site with four built-in games and three maker tools. Built for Jerica (~11, 5th grade) — Nirvana, Green Day and Metallica on repeat, skating-rink life, Roblox and Toca Boca favorites, and a feature block for the family game, Thunderdome.

## Pages

- `/` — Home: hero, "On Repeat" bands, Rink Life, Favorites Shelf, and the Thunderdome feature block (links to https://thunderdome.store, the game's site).
- `/games.html` — The Arcade: **Skate Dash** (endless rink dodger), **Beat Tap** (rhythm tap on a live-generated beat), **Memory Match** (8-pair card game), **Note Highway** (falling-notes shred game). All music is original WebAudio synthesis — no band audio, ever.
- `/studio.html` — Maker Studio: **Avatar Maker**, **Band Poster Maker**, **Skateboard Deck Designer**. All canvas-based; creations download to the device as PNGs.
- `/friends.html` — Friends Zone: pass-and-play house rules and crew challenges ("make it, download it, show it").

## Safety design (this is a child's site — non-negotiable)

- **Zero personal-information collection.** No forms that submit, no accounts, no sign-ups, no comments, no chat, no uploads to any server. Everything runs client-side; high scores live in the visitor's own `localStorage`.
- **No ads, no affiliate links, no analytics, no third-party embeds or requests.** All assets are self-hosted. The only outbound link is the Thunderdome anchor. A CSP in `public/_headers` enforces `default-src 'self'`.
- Music content is fan enthusiasm in original words only — no copyrighted lyrics, album art, logos, or audio.

## Tech

Static HTML/CSS/vanilla JS in `public/` — no build step, no framework, no dependencies at runtime. Local check: `python3 -m http.server` inside `public/`.

## Production

- Domain: `jerica.pro` · Hosting: Cloudflare Workers Static Assets (`wrangler.jsonc`, Worker `jerica-pro`)
- CI/CD: push to `main` runs `.github/workflows/deploy.yml` (secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`)
- **Rebuild of 2026-10-13 lives on branch `jerica-rebuild-2026-10-13` — see `DEPLOY-NOTE-2026-10-13.md` before deploying.**
