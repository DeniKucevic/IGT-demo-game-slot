# IGT ([www.igt.com](http://www.igt.com)) - Demo Game Test

## Overview

As a Game Developer candidate, you need to successfully develop a demo game.

**Test Goal** - By creating a demo game you will show technical knowledge, design, development and problem-solving skills, but also speed, performance, motivation and independence. Apart from showing your skills, you will also get a taste of what kind of games we are creating. You will also get a better understanding of what your job will be and if this position is right for you.

---

## Demo Game Requirements

- Candidate needs to independently develop a simple slot game demo
- Demo Game should be in playable state with solid performance and have the following features:

### ✅ Selecting Bet Value Component

- Choosing Bet from list - combo box _(be creative, anything that you think will fit best for the game and will show your dev skills)_

### ✅ Reels Component (5x3 - or configurable)

- Start spinning, spinning, stop spinning
- Speed up, slow down, bounce _(free look and feel)_

### ✅ Showing Results

- After reels stop on a new reel picture, some win symbols should be animated, highlighted, win value shown _(free look and feel)_

### ✅ Mocked Server

- Result data (stop reel picture positions, winning lines, prize info) ideally come in the form of a JSON, mimicking a response from a server
- Server logic should be **separated** from the game in a separate class/module, fetched by a simple API call:
  ```js
  mockedServer.getResponseData(); // returns result as JSON
  ```

> Test will be considered successful if all ✅ items are done and the game can be played with **no console errors**. Everything additional provides an opportunity to stand out from other candidates.

---

## Important Notes

- **Focus on code organization and structure** rather than visual representation
- **Do not use existing slot templates** found on the Internet - organize and develop the project yourself
- Comment your code
- AI assistance is permitted if used appropriately and does not replace genuine personal effort

---

## Guides & Tips

- **Technology:** JavaScript, TypeScript, Canvas (PixiJS), WebGL
- Any additional JS libraries can be used (Three.js, etc.)
- Developers who pass will be called for an interview where the Test Game will be analyzed and discussed - expect to explain **how** features are implemented and **why**
- You can use any graphics found online with the goal that the demo looks and feels like a slot game - graphics look and feel will **not** be judged/scored
