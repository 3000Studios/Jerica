# jerica.pro — Jerica's Corner

Jerica's own corner of the internet: a sticker-notebook, alternative/skater personal site with four built-in games and three maker tools. Built for Jerica (~11, 5th grade) — Nirvana, Green Day and Metallica on repeat, skating-rink life, Roblox and Toca Boca favorites, and a feature block for the family game, Thunderdome.

## Pages

- `/` — Home: hero, "On Repeat" bands, Rink Life, Favorites Shelf, and the Thunderdome feature block (links to https://thunderdome.store, the game's site).
- `/games.html` — The Arcade: **Skate Dash** (endless rink dodger), **Beat Tap** (rhythm tap on a live-generated beat), **Memory Match** (8-pair card game), **Note Highway** (falling-notes shred game). All music is original WebAudio synthesis — no band audio, ever.
- `/studio.html` — Maker Studio: **Avatar Maker**, **Band Poster Maker**, **Skateboard Deck Designer**. All canvas-based; creations download to the device as PNGs.
- `/friends.html` — Friends Zone: pass-and-play house rules and crew challenges ("make it, download it, show it").

## Safety design (this is a child's site — non-negotiable)

- **Zero personal-information collection.** No forms that submit, no accounts, no sign-ups, no comments, no chat, no uploads to any server. Everything runs client-side; high scores live in the visitor's own `localStorage`.
- **Ads (2026 Site Standard):** AdSense is loaded in **child-directed / non-personalized mode only** (`data-tag-for-child-directed-treatment`, `requestNonPersonalizedAds=1`); `public/ads.txt` carries the house publisher line. No analytics, no affiliate links, no third-party embeds beyond the AdSense loader and Google Fonts. The CSP in `public/_headers` allows only those.
- Music content is fan enthusiasm in original words only — no copyrighted lyrics, album art, logos, or band audio. The songs that play on the site are 3000 Studios' own "Entertain Us" and "Motel Television" (self-hosted in `public/audio/`).

## Tech

Static HTML/CSS/vanilla JS in `public/` — no build step, no framework, no dependencies at runtime. Local check: `python3 -m http.server` inside `public/`.

## Production

- Domain: `jerica.pro` · Hosting: Cloudflare Workers Static Assets (`wrangler.jsonc`, Worker `jerica-pro`)
- **Deploy path (current): direct `npx wrangler deploy` from the repo root** with the fleet Cloudflare token — used for the 2026-10-19 Site Standard rebuild (Version ID `023a9843-6f16-4422-8b02-88e496e85d24`). The `.github/workflows/deploy.yml` (push-to-`main`) exists but GitHub Actions is **off-limits** under the Boss's standing law (owed balance) — do not rely on it.
- Pages: `/` Home · `/study.html` Study Hive · `/music.html` Music · `/videos.html` Videos · `/about.html` About · plus the Arcade (`/games.html`), Maker Studio (`/studio.html`) and Friends Zone (`/friends.html`).
- The music player (injected by `app.js` on every page) starts the playlist **muted** on load — browsers block autoplay-with-sound; the first tap anywhere turns sound on. Never "fix" this by faking autoplay sound.
