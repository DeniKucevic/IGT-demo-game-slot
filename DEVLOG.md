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

- [ ] **RESEARCH** — How do slot machines work in depth
- [ ] **SETUP**
  - [ ] Repo, structure, documents, requrements
  - [ ] "Server" and front-end

### What I did

- Read and analyzed the test brief thoroughly
- Researched PixiJS v7 basics (Application, Sprite, Container, Ticker)
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

- [ ] **Basic game** — As simple as possible
- [ ] **GAMEPLAY**
  - [ ] See what other games have that makes them popular
  - [ ] Check what is the most successfull IGT slot game

### What I did

- Created a simple game
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
