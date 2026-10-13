# Deploy note — jerica.pro rebuild (2026-10-13)

**DO NOT DEPLOY until Paige confirms the deploy path with the recon worker.** This branch (`jerica-rebuild-2026-10-13`) is built and verified locally only.

## What changed
- Full rebuild of `public/`: new home, games page (4 client-side games), Maker Studio (3 canvas makers), Friends Zone.
- Replaced: `index.html`, `styles.css`, `app.js` (rewritten), `favicon.svg`, `manifest.webmanifest`, `sitemap.xml`, `_headers`.
- Added: `games.html`, `studio.html`, `friends.html`, `games.js`, `makers.js`, `og.png` (self-hosted OG art).
- Removed: `sw.js` (old Study Hive service worker — deleted so stale caches can't serve the old site), old Study Hive content, and the `public/assets/maybe-ill-try-it.mp3` expectation (no audio files ship; all game music is generated live with WebAudio).

## Safety posture (child's site — keep it this way)
- Zero personal-info collection: no forms that submit, no accounts, no comments, no chat, no uploads. Makers render on canvas and download to the device only. High scores use `localStorage` on the visitor's own device.
- No ads, no affiliate links, no analytics, no third-party embeds or requests. The ONLY outbound link is `https://thunderdome.store` (plain anchor, labeled as the game's site) plus self-references to `jerica.pro`.
- `_headers` now ships a CSP: `default-src 'self'` (+ `form-action 'none'`, `object-src 'none'`).
- Music content is fan text only — no lyrics, no album art, no band audio. Roblox/Toca Boca are text mentions only.

## Deploy path (expected — confirm before use)
- Existing setup per `wrangler.jsonc`: Cloudflare Workers Static Assets, Worker name `jerica-pro`, assets dir `./public`, custom domains `jerica.pro` + `www.jerica.pro`.
- Existing CI: `.github/workflows/deploy.yml` deploys on push to `main` (needs `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` secrets).
- Live site currently returns 404 — recon worker is confirming why (Worker not deployed vs. route/domain state) and which path is live.
- Suggested: merge this branch to `main` (or `npx wrangler deploy` from repo root) once recon confirms, then verify: home 200, all 4 pages, CSP header present, og.png resolves.
