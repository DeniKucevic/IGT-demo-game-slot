import './style.css';
import { initDevtools } from '@pixi/devtools';
import { Application, Ticker } from 'pixi.js';

import { DEFAULT_CONFIG, COLORS, computeLayout, STRINGS } from '@shared';

import { loadAssets } from '@core/assets';
import { createGameState, STARTING_BALANCE } from '@core/state';
import { getResponseData } from '@server/api';

import {
  createReelGroup,
  createSpinButton,
  createWinPopup,
  createStatDisplay,
  createBetSelector,
  createGameOverScreen,
  createAllInButton,
  createTitleDisplay,
  ALLIN_SIZE,
  BUTTON_HEIGHT,
} from '@components';

const HEADER_MID_Y = 24;
const TITLE_ANIM_INTERVAL = 1500;

// ── Game state ──
const state = createGameState();

// ── App ──
const app = new Application();
await app.init({
  resizeTo: window,
  backgroundColor: COLORS.background,
  autoDensity: true,
  resolution: window.devicePixelRatio || 1,
});
initDevtools({ app });
document.getElementById('app')!.appendChild(app.canvas);

await loadAssets();

// ── Layout ──
const { symbolSize, reelW, reelsX, reelsY, controlsY } = computeLayout(
  DEFAULT_CONFIG,
  app.screen.width,
  app.screen.height,
);

// ── UI components ──
const reelGroup = createReelGroup(DEFAULT_CONFIG, symbolSize);
const spinButton = createSpinButton();
const allInButton = createAllInButton();
const betSelector = createBetSelector(() => deactivateAllIn());
const winPopup = createWinPopup(app.screen.width, app.screen.height);
const gameOverScreen = createGameOverScreen(app.screen.width, app.screen.height);
const balanceDisplay = createStatDisplay(STRINGS.header.balance, 'left');
const gameTitle = createTitleDisplay(STRINGS.header.title);
const spinsDisplay = createStatDisplay(STRINGS.header.spins, 'right');

// ── Scene ──
const setupLayout = (): void => {
  reelGroup.root.position.set(reelsX, reelsY);
  app.stage.addChild(reelGroup.root);

  const spinOffsetY = Math.round((betSelector.height - BUTTON_HEIGHT) / 2);
  betSelector.root.position.set(reelsX, controlsY);

  allInButton.root.position.set(
    reelsX + Math.round((reelW - ALLIN_SIZE) / 2),
    controlsY + Math.round((betSelector.height - ALLIN_SIZE) / 2),
  );

  spinButton.root.position.set(reelsX + reelW - spinButton.width, controlsY + spinOffsetY);

  app.stage.addChild(betSelector.root, allInButton.root, spinButton.root);

  balanceDisplay.root.position.set(24, HEADER_MID_Y);
  balanceDisplay.setValue(state.balance);

  gameTitle.root.position.set(app.screen.width / 2, HEADER_MID_Y);

  spinsDisplay.root.position.set(app.screen.width - 24, HEADER_MID_Y);
  spinsDisplay.setValue(state.spinCount);

  app.stage.addChild(balanceDisplay.root, gameTitle.root, spinsDisplay.root);
  app.stage.addChild(winPopup.root, gameOverScreen.root);
};

setupLayout();

const updateTitleAnimation = (ticker: Ticker): void => {
  if (state.gameState !== 'idle' || state.spinCount > 0) {
    Ticker.shared.remove(updateTitleAnimation);
    return;
  }
  state.titleAnimationTime += ticker.deltaMS;
  if (state.titleAnimationTime >= TITLE_ANIM_INTERVAL) {
    gameTitle.triggerRandomSpin();
    state.titleAnimationTime = 0;
  }
};
Ticker.shared.add(updateTitleAnimation);

// ── Business handlers ──
const deactivateAllIn = (): void => {
  state.isAllIn = false;
  allInButton.setActive(false);
  spinButton.setAllIn(false);
  betSelector.setAllIn(false);
};

const resetGame = (): void => {
  state.balance = STARTING_BALANCE;
  state.spinCount = 0;
  balanceDisplay.setValue(state.balance);
  spinsDisplay.setValue(state.spinCount);
  reelGroup.clearHighlights();
  deactivateAllIn();

  state.gameState = 'idle';
  setControlsEnabled(true);

  state.titleAnimationTime = 0;
  Ticker.shared.add(updateTitleAnimation);
};

const endRound = (): void => {
  reelGroup.clearHighlights();
  if (state.balance <= 0) {
    gameOverScreen.show(resetGame);
  } else {
    state.gameState = 'idle';
    setControlsEnabled(true);
  }
};

const setControlsEnabled = (enabled: boolean): void => {
  spinButton.setEnabled(enabled);
  betSelector.setEnabled(enabled);
  allInButton.setEnabled(enabled);
};

const runSpin = async (): Promise<void> => {
  if (state.gameState !== 'idle') return;

  state.gameState = 'spinning';
  const bet = state.isAllIn ? state.balance : betSelector.getBet();
  state.balance -= bet;
  state.spinCount++;

  balanceDisplay.setValue(state.balance);
  spinsDisplay.setValue(state.spinCount);
  setControlsEnabled(false);
  deactivateAllIn();

  reelGroup.clearHighlights();
  reelGroup.spin();

  try {
    const result = await getResponseData(DEFAULT_CONFIG);

    reelGroup.land(result.reelPositions, () => {
      if (result.winningLines.length > 0) {
        state.gameState = 'showing-win';
        state.balance += result.prize * bet;
        balanceDisplay.setValue(state.balance);
        reelGroup.highlightWins(result.winningLines);
        winPopup.show(result.winningLines, result.prize, endRound);
      } else {
        endRound();
      }
    });
  } catch (error) {
    console.error(error);
  }
};

// ── Input handlers ──
allInButton.root.on('pointertap', () => {
  state.isAllIn = !state.isAllIn;
  allInButton.setActive(state.isAllIn);
  spinButton.setAllIn(state.isAllIn);
  betSelector.setAllIn(state.isAllIn);
});

spinButton.root.on('pointertap', runSpin);

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    runSpin();
  }
});
