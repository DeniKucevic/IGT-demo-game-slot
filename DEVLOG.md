# Dev Log - IGT Slot Demo 🎰

_CODENAME: SSGD (Simple Slot Game Demo)_

> Keywords: solid performance, code organization and structure, organize and develop

---

## CORE FEATURES

- [x] **Bet selector** - combo box (be creative, fit the game, show dev skills)
- [x] **Reels component (5x3 - or configurable)**
  - [x] Start spinning, spinning, stop spinning
  - [x] Speed up, slow down, bounce (free look and feel)
- [x] **Win display** - animated/highlighted win symbols, win value shown (free look and feel)
- [x] **Mocked server** - separate class/module, returns JSON with stop positions, winning lines, prize info
  ```js
  mockedServer.getResponseData(); // returns result as JSON
  ```

---

## Day 1 - 2026-05-19 | Setup & Research

## TASKS FOR TODAY

- [x] **RESEARCH** - How do slot machines work in depth
- [x] **SETUP**
  - [x] Repo, structure, documents, requrements
  - [x] "Server" and front-end

### What I did

- Read and analyzed the test brief thoroughly
- Researched PixiJS basics (Application, Sprite, Container, Ticker)
- Planned project architecture and module structure

### Decisions & reasoning

- **Both reelCount and rowCount are configurable** - the brief says "5x3 or configurable" but doesn't specify which dimension. Making both configurable shows better architecture and is more aligned with how real slot games work. Default remains 5x3.
- **Winning lines are dynamically generated based on grid size** - instead of hardcoding 3 horizontal lines, winning lines are calculated from the current rowCount. A 5x4 grid automatically gets 4 horizontal lines. Diagonals are a bonus.
- **Functional modules over classes** - exported functions only, no classes. Cleaner, more modern TypeScript.
- **Vite + TypeScript + PixiJS v7** - Vite for fast dev server, PixiJS v7 for stable Canvas/WebGL rendering, TypeScript for type safety.
- **MockedServer is completely isolated** - accepts GameConfig, randomly generates reel positions, calculates wins internally, returns typed JSON. No win logic leaks into game code.

### Problems & solutions

- N/A - research day
- _No hard coded data_ - I do not want hard coded string, the game should be data driven. I think I will create a landing page before the game starts where we can configure the game parameters (reels, symbols, etc....)
- _Everything is set up from the game_ - There should be no changes made "trough code" and all should be configurable during "run-time"

### Next up

- Make a simple game with just basics and nothing more

---

## Day 2 - 2026-05-20 | Simple game & gameplay

## TASKS FOR TODAY

- [ ] **Basic game** - As simple as possible - Could not finish today
- [x] **GAMEPLAY**
  - [x] See what other games have that makes them popular
  - [x] Check what is the most successfull IGT slot game

### What I did

- Started work on the actual animations
- Made decision to skip threejs and focus on basics
- Explored designs (I think I have settled on the design from kafeterija coffee shop..... they have app and I like the simplicity :) )
- Scaffolding a project

### Decisions & reasoning

- **Scaffolding** - initiated the project, created basic folder structure
- **Core features and design** - I dropped a 3d animations with threejs so I have less overhead to fight. I want to do designs that are similar to the Kafeterija app and I want coffee to be used for sprites

### Problems & solutions

- N/A - research day

### Next up

- Do a server and start from there, then start work on UI

---

## Day 3 - 2026-05-21 | Basic game

## TASKS FOR TODAY

- [x] **Basic game** - continue work
- [x] **GAMEPLAY**
  - [x] The reels should spin and stop based on "server response"
  - [x] Spins should have requirements (Speed up, slow down, bounce)

### What I did

- Finished the spinings and animations (hopefully :D)
- Generated coffee theme images with AI and adapted them for use as sprites (8 for now)
- Verify the game works and landing is correct
- Centralized color palete

### Decisions & reasoning

- **Pre-built strip over texture swapping** - the official PixiJS slot example swaps textures on a short looping strip. Since the spec requires server predetermined stop positions a pre-built long strip (80 symbols, 10 repetitions) allows calculating an exact landing coordinate before animation starts. Landing is mathematically guaranteed regardless of frame rate.

- **Easings functions** - https://easings.net/# was a great resource for the spin requirements (speed up, slow down and bounce).

- **Central color palette** - all colors defined in colors.ts with semantic names. No hex values scattered through component files.

### Problems & solutions

- Images loading with wrong paths - assets were in public/ root but code used /symbols/ prefix. Fixed paths in Assets.load.

- Symbol name mismatch - SYMBOLS array had 'java' but image file was beans.png. Renamed to match.

- Text rendering over sprites - old emoji Text label was left in symbols.ts alongside new Sprite. Removed the text entirely.

- Mask fill color confusion - PixiJS mask uses shape only, fill color is irrelevant and never rendered. Removed maskFill from colors, hardcoded white directly.

### Next up

- Mocked server with win evaluation
- Spin button and bet selector
- Wire full game loop (spin → result → win display)

---

## Day 4 - 2026-05-22 | Server, game loop & controls

## TASKS FOR TODAY

- [x] **Mocked server** - getResponseData() returns stop positions, winning lines, prize as JSON
- [x] **Win evaluation** - evaluateLines(), left-to-right consecutive match?, ratio-based tier?
- [x] **Spin button** - triggers spin, disabled during animation
- [ ] **Bet selector** - dropdown?
- [x] **Game loop** - balance, spin count, state machine (idle → spinning → idle)
- [x] **Wire it all together** - server result drives reel stop positions, prize shown after stop

### What I did

- Rebuilt the reel strip from 80 pre-built sprites to a virtual scroll
- Added win overlay, spin button and gold frame on wins
- Organize files better, broke up some components
- Fixed initial render

### Decisions & reasoning

- **Virtual scroll over long strip** - If I kept the original idea there was a problem that if this was in prodaction and server halted the response we could run out of strip and UI would break, if this was waiting for a response from server. If we do it like pixi.js example we can keep the spin phase as long as we want. I mean not a final solution but still better then broken UI.

- **REEL_STRIPS in config.ts** - hard coded the reels, might come back and update later so it is generated by "server" and passed to FE so that they are in sync. Let's focus on what is required first.

### Problems & solutions

- Reels couldn't spin indefinitely - long strip has a fixed end. Virtual scroll has no end; position grows unbounded and modulo handles wrapping.

- Server and client strip out of sync - shuffleForReel was duplicated. Removed both copies, replaced with REEL_STRIPS imported from config in both modules.

- All slots rendering at y=0 on load - Moved definition before the loop.

### Next up

- Bet selector (dropdown/combo box)
- Balance display and spin counter in header
- Config screen (reel/row count stepper)

---

Day 5 - 2026-05-23 | Bet selector & other UI elements

## TASKS FOR TODAY

- [x] **Bet selector** - getResponseData() returns stop positions, winning lines, prize as JSON
- [x] **Number of spins** - evaluateLines(), left-to-right consecutive match?, ratio-based tier?
- [x] **Balance?** - triggers spin, disabled during animation
- [x] **Project structure** - review the current structure
- [] **Testing**

### What I did

- There was a bug where the position number could grow out of hand during a very long gameplay, we reset the position to the actual position of the reel so the number is allways small
- Since we are mocking the server we should also think about issues that come with it, for example we need a response from server to know the status of the win or not, in case that response does not come we need a solution so a random no-win position makes sense to me. This is enough for demo even tho in production this would need more cases and probably some failsafe so the players (I am already adapting to lingo and saying players instead of useds :D) are not stuck forever in that loop. Maybe like if we get no response in 4 spins we show some error screen?
- Implemented a lobby screen, before the game start player can see settings
- Added eslint and prettier formatter
- Lot of refactoring, we grew quite a lot of code

### Decisions & reasoning

- **Lobby screen** - We need a place for a configurations (credit, reels/rows) and a game did not feel finished without a lobby screen.
- **Jackpot java** - The game deserver a proper name now that we have actual game running
- **Chips** - We used coffee cups as chip component for bet selecting so on config screen we are doing the same only for credit we are doing input screen, it feels proper to input a number of credit over selecting a predefined amounts. Also easier for me to test with random numbers
- **All in button** - I wanted to test running out of credits and spending more then limits fast and easy and then decided to keep the button because it turned out to be way more fun then expected.

### Problems & solutions

- Negative balance bug - player could bet 100 credits with only 50 in balance. Fixed on two fronts: `setMaxBet` on bet selector auto-downgrades the selected option and greys out unaffordable ones

- All-in visual flash - pressing Spin while in all-in mode caused the gold border to briefly flicker back to the last selected cup.

- Game-over "Play Again" stayed in game - clicking Play Again was calling `resetGame()` which re-initialised the game with the same config instead of returning to the lobby.

- HTML credit input positioning - needed to overlay a native `<input>` on top of the PixiJS canvas. Since the canvas fills the full viewport, `position: fixed` with coordinates derived from the panel's computed Pixi position worked correctly across zoom levels.

### Next up

- Refactor `main.ts` (session logic into own module)
- Responsive design with `@pixi/layout`
- Tests
- Sound
- Polish

---

## Day 6 - 2026-05-24 | Refactor & Responsiveness

## TASKS FOR TODAY

- [x] **Refactor `main.ts`** - extract session logic into `createGameSession()`
- [x] **Responsiveness** - `@pixi/layout` for scene structure, resize handler

### What I did

- Extracted everything inside `runGame()` after lobby resolution into `src/core/session/game-session.ts` as a `createGameSession(config, state, app, onExit)` factory. `main.ts` is now ~40 lines of pure orchestration.
- Installed `@pixi/layout` (Yoga-powered CSS flexbox for PixiJS). Scene is now a `flexDirection: column` layout container: header strip (fixed 48 px), reels area (`flexGrow: 1`, `justifyContent/alignItems: center`), controls strip (fixed 128 px).
- On `app.renderer` resize: scene dimensions update, reel group is scaled by `newSymbolSize / baseSymbolSize`, reel holder Yoga bounding box is updated so centering stays correct, header items and controls repositioned.
- Fixed silent crash risk: if `getResponseData` threw, the game froze in spinning state with controls permanently disabled. Added `endRound()` to the catch block.

### Decisions & reasoning

- **Scale approach for reel resize, not recreation** - recreating the reel group on every resize would reset animation state and be jarring. Scaling the container is visually cleaner.
- **`reelHolder` wrapper instead of layout on `reelGroup.root`** - giving `@pixi/layout` a separate holder container tells Yoga the bounding box for centering without the layout system interfering with the reel group's internal pixel coordinates or mask.

### Problems & solutions

- **`@pixi/layout` scale conflict concern** - if `.layout` is set directly on `reelGroup.root`, the layout system might apply its own scale and conflict with manual scaling. Resolved by wrapping in a `reelHolder` container: Yoga manages the holder's position/size, `reelGroup.root` inside has no layout and is scaled freely.

- **Import ordering + Prettier formatting** - ESLint reported `@shared` sub-path imports must follow `@shared` barrel imports, and two `computeLayout` destructuring calls needed line-wrapping per printWidth 100. Fixed both.

### Next up

- Tests
- Sound
- Polish (lobby resize, overlay resize on window change)

---

## Day 7 - 2026-05-25 | Final touches & finishing documentation

## TASKS FOR TODAY

- [x] **Test** - Add tests
- [x] **Sound** - Finish wiring up sounds for the game
- [x] **Refactor lobby screen** - Break into components and move to where they belong
- [x] **Go over logs and documentation** - Make sure documentation is updated

### What I did

- Added unit tests across 3 files: `layout.test.ts`, `win-math.test.ts`, `mocked-server.test.ts`
- Fixed iOS Safari audio: switched from dynamic import to static import and call `audioContext.resume()` synchronously within the user gesture handler
- Wire up sounds for the game and find sound assets
- Refactored lobby into managable chunks so that lobby only does orchestration
- Updated & went over documentation and dev log
- Fixed `vite.config.ts` base URL: dev server now runs at `/`, production build uses `/igt-slot-game/` subpath for Vercel
- Hosting

### Decisions & reasoning

- **`win-math.ts` split from `types.ts`** — runtime logic with testable conditions does not belong in a types file.
- **Header extracted to its own component** — the back button and layout strip was inside a session orchestrator. `createGameHeader(onBack)` makes the dependency explicit and keeps `game-session.ts` focused on game flow, not UI construction.
- **`common/` only gets truly shared primitives** — `createButton` is in `common/` because it is used by `ui/`, `overlays/game-over`, and `overlays/lobby-screen`. Chips and sound toggle are lobby-only so they stay in `overlays/`.

### Problems & solutions

- **`vite.config.ts` `base` applied to dev server** — setting `base: '/igt-slot-game/'` for Vercel also moved the dev server off root, which was inconvenient. Fixed with `({ command }) => ({ base: command === 'build' ? '/igt-slot-game/' : '/' })`.


### Next up

- n/a
