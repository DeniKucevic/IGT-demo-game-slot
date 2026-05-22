# Dev Log — IGT Slot Demo 🎰

_CODENAME: SSGD (Simple Slot Game Demo)_

> Keywords: solid performance, code organization and structure, organize and develop

---

## CORE FEATURES

- [ ] **Bet selector** — combo box (be creative, fit the game, show dev skills)
- [ ] **Reels component (5x3 — or configurable)**
  - [ ] Start spinning, spinning, stop spinning
  - [ ] Speed up, slow down, bounce (free look and feel)
- [ ] **Win display** — animated/highlighted win symbols, win value shown (free look and feel)
- [ ] **Mocked server** — separate class/module, returns JSON with stop positions, winning lines, prize info
  ```js
  mockedServer.getResponseData(); // returns result as JSON
  ```

---

## Day 1 — 2026-05-19 | Setup & Research

## TASKS FOR TODAY

- [x] **RESEARCH** — How do slot machines work in depth
- [x] **SETUP**
  - [x] Repo, structure, documents, requrements
  - [x] "Server" and front-end

### What I did

- Read and analyzed the test brief thoroughly
- Researched PixiJS basics (Application, Sprite, Container, Ticker)
- Planned project architecture and module structure

### Decisions & reasoning

- **Both reelCount and rowCount are configurable** — the brief says "5x3 or configurable" but doesn't specify which dimension. Making both configurable shows better architecture and is more aligned with how real slot games work. Default remains 5x3.
- **Winning lines are dynamically generated based on grid size** — instead of hardcoding 3 horizontal lines, winning lines are calculated from the current rowCount. A 5x4 grid automatically gets 4 horizontal lines. Diagonals are a bonus.
- **Functional modules over classes** — exported functions only, no classes. Cleaner, more modern TypeScript.
- **Vite + TypeScript + PixiJS v7** — Vite for fast dev server, PixiJS v7 for stable Canvas/WebGL rendering, TypeScript for type safety.
- **MockedServer is completely isolated** — accepts GameConfig, randomly generates reel positions, calculates wins internally, returns typed JSON. No win logic leaks into game code.

### Problems & solutions

- N/A — research day
- _No hard coded data_ - I do not want hard coded string, the game should be data driven. I think I will create a landing page before the game starts where we can configure the game parameters (reels, symbols, etc....)
- _Everything is set up from the game_ - There should be no changes made "trough code" and all should be configurable during "run-time"

### Next up

- Make a simple game with just basics and nothing more

---

## Day 2 — 2026-05-20 | Simple game & gameplay

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

- **Scaffolding** — initiated the project, created basic folder structure
- **Core features and design** — I dropped a 3d animations with threejs so I have less overhead to fight. I want to do designs that are similar to the Kafeterija app and I want coffee to be used for sprites

### Problems & solutions

- N/A — research day

### Next up

- Do a server and start from there, then start work on UI

---

## Day 3 — 2026-05-21 | Basic game

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

- **Easings functions** — https://easings.net/# was a great resource for the spin requirements (speed up, slow down and bounce).

- **Central color palette** — all colors defined in colors.ts with semantic names. No hex values scattered through component files.

### Problems & solutions

- Images loading with wrong paths — assets were in public/ root but code used /symbols/ prefix. Fixed paths in Assets.load.

- Symbol name mismatch — SYMBOLS array had 'java' but image file was beans.png. Renamed to match.

- Text rendering over sprites — old emoji Text label was left in symbols.ts alongside new Sprite. Removed the text entirely.

-Mask fill color confusion — PixiJS mask uses shape only, fill color is irrelevant and never rendered. Removed maskFill from colors, hardcoded white directly.

### Next up

- Mocked server with win evaluation
- Spin button and bet selector
- Wire full game loop (spin → result → win display)

---

## Day 4 — 2026-05-22 | Server, game loop & controls

## TASKS FOR TODAY

- [ ] **Mocked server** - getResponseData() returns stop positions, winning lines, prize as JSON
- [ ] **Win evaluation** — evaluateLines(), left-to-right consecutive match?, ratio-based tier?
- [ ] **Spin button** — triggers spin, disabled during animation
- [ ] **Bet selector** — dropdown?
- [ ] **Game loop** — balance, spin count, state machine (idle → spinning → idle)
- [ ] **Wire it all together** — server result drives reel stop positions, prize shown after stop

### What I did

- Finished the spinings and animations (hopefully :D)
- Generated coffee theme images with AI and adapted them for use as sprites (8 for now)
- Verify the game works and landing is correct
- Centralized color palete

### Decisions & reasoning

- **Pre-built strip over texture swapping** - the official PixiJS slot example swaps textures on a short looping strip. Since the spec requires server predetermined stop positions a pre-built long strip (80 symbols, 10 repetitions) allows calculating an exact landing coordinate before animation starts. Landing is mathematically guaranteed regardless of frame rate.

- **Easings functions** — https://easings.net/# was a great resource for the spin requirements (speed up, slow down and bounce).

- **Central color palette** — all colors defined in colors.ts with semantic names. No hex values scattered through component files.

### Problems & solutions

- Images loading with wrong paths — assets were in public/ root but code used /symbols/ prefix. Fixed paths in Assets.load.

- Symbol name mismatch — SYMBOLS array had 'java' but image file was beans.png. Renamed to match.

- Text rendering over sprites — old emoji Text label was left in symbols.ts alongside new Sprite. Removed the text entirely.

-Mask fill color confusion — PixiJS mask uses shape only, fill color is irrelevant and never rendered. Removed maskFill from colors, hardcoded white directly.

### Next up

- Mocked server with win evaluation
- Spin button and bet selector
- Wire full game loop (spin → result → win display)

---
