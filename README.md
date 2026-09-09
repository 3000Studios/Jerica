# jerica.pro — Study Hive

A mobile-first study dashboard built for Jerica. The experience begins with a swipeable four-dial honeybee hive lock. Enter `3000` to open the hive and transition into a study dashboard with planning, focus tools, weather, assignments, learning resources, rewards, music, and a one-tap help/share action.

## Production

- Domain: `jerica.pro`
- Hosting: Cloudflare Workers Static Assets
- Production branch: `main`
- CI/CD: every push to `main` runs `.github/workflows/deploy.yml`
- Runtime: static HTML/CSS/JavaScript; no framework runtime required

## Local development

```bash
npm install
npm run dev
```

## User song

The site expects the production music file at:

```text
public/assets/maybe-ill-try-it.mp3
```

On the Windows workstation, run `scripts/sync-local-secrets-and-assets.ps1`. It reads `C:\Users\MrJws\Documents\global.env`, imports/transcodes the local song when available, pushes required Cloudflare credentials into GitHub Actions secrets, and deploys the Worker.

Never commit `global.env`, API tokens, account IDs, or private keys.

## Cloudflare

The Worker configuration is in `wrangler.jsonc`. It serves `./public` as static assets and maps the production Worker to `jerica.pro` and `www.jerica.pro` as Cloudflare Custom Domains.

Required GitHub Actions secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

The checked-in bootstrap script can copy those values from the local global environment file without printing them.

## Design

The visual direction is a honey-gold / charcoal grunge alternative collage with age-appropriate fan-inspired nods to Nirvana, Green Day, Type O Negative, and Roblox. It does not reproduce official album artwork or logos.
