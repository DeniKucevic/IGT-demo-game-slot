# IGT Demo Slot Game

A configurable slot machine demo built with PixiJS 8, TypeScript, and Vite.

## Stack

- **PixiJS 8** — WebGL/Canvas rendering
- **@pixi/sound** — Web Audio with autoplay-policy compliance
- **@pixi/layout** — Yoga-based flexbox layout
- **Vite** + **TypeScript**

## Features

- Configurable reel and row count (3–5 reels, 2–4 rows)
- Animated reel spin with per-reel stop bounce
- Win detection with line highlights and tiered win popup (small / win / big win / jackpot)
- Bet selector with all-in mode
- Lobby music with ducking during gameplay
- Per-reel click sounds, win/no-win sounds, game-over sound
- Mute toggle persisted in `localStorage`
- Responsive layout — scales to any screen size
- Mocked server separated from game logic (`src/server/`)

## Getting Started

```bash
npm install
npm run dev
```

Other scripts:

```bash
npm run build     # production build → dist/
npm run preview   # preview the production build locally
npm run lint      # ESLint
npm run format    # Prettier
```

## Project Structure

```
src/
  components/       # PixiJS UI components (reels, overlays, controls)
  core/
    session/        # Game loop and round logic
    sound/          # Sound manager (Web Audio, mute, ducking)
    state/          # App state
  server/           # Mocked server + API layer
  shared/           # Config, types, layout constants, styles
```

## Deployment

The Vite base is set to `/igt-slot-game/` — build output is ready to serve from that subpath.

```bash
npm run build
```

To host on an existing Vercel site, add a rewrite in `vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/igt-slot-game/:path*",
      "destination": "https://<this-project>.vercel.app/:path*"
    }
  ]
}
```
