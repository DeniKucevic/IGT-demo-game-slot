import './style.css';
import { initDevtools } from '@pixi/devtools';
import { Application, Container, Graphics, Text, TextStyle, Ticker } from 'pixi.js';

import { COLORS, computeLayout, STRINGS } from '@shared';
import type { GameConfig } from '@shared/config';

import { loadAssets } from '@core/assets';
import { createGameState } from '@core/state';
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
  createLobbyScreen,
  type LobbySettings,
  ALLIN_SIZE,
  BUTTON_HEIGHT,
} from '@components';

const HEADER_MID_Y = 24;
const HEADER_H = 48;
const TITLE_ANIM_INTERVAL = 1500;
const BACK_BTN_W = 52;
const BACK_BTN_H = 30;
const BALANCE_X = BACK_BTN_W + 16;

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

const runGame = async (): Promise<void> => {
  // ── Lobby + asset load in parallel; loadAssets is idempotent on repeat calls ──
  const settingsPromise = new Promise<LobbySettings>((resolve) => {
    const lobby = createLobbyScreen(app.screen.width, app.screen.height, (s) => {
      lobby.destroy();
      app.stage.removeChild(lobby.root);
      resolve(s);
    });
    app.stage.addChild(lobby.root);
  });

  const [lobbySettings] = await Promise.all([settingsPromise, loadAssets()]);

  // ── Config & state ──
  const config: GameConfig = {
    reelCount: lobbySettings.reelCount,
    rowCount: lobbySettings.rowCount,
  };
  const state = createGameState(lobbySettings.startingBalance, lobbySettings.muted);

  // ── Scene (single container — destroyed wholesale on back-to-lobby) ──
  const scene = new Container();
  app.stage.addChild(scene);

  // ── Layout ──
  const { symbolSize, reelW, reelsX, reelsY, controlsY } = computeLayout(
    config,
    app.screen.width,
    app.screen.height,
  );

  // ── UI components ──
  const reelGroup = createReelGroup(config, symbolSize);
  const spinButton = createSpinButton();
  const allInButton = createAllInButton();
  const betSelector = createBetSelector(() => deactivateAllIn());
  const winPopup = createWinPopup(app.screen.width, app.screen.height);
  const gameOverScreen = createGameOverScreen(app.screen.width, app.screen.height);
  const balanceDisplay = createStatDisplay(STRINGS.header.balance, 'left');
  const gameTitle = createTitleDisplay(STRINGS.header.title);
  const spinsDisplay = createStatDisplay(STRINGS.header.spins, 'right');

  // ── Balance helper: syncs state, display, and bet selector affordability ──
  const updateBalance = (newBalance: number): void => {
    state.balance = newBalance;
    balanceDisplay.setValue(newBalance);
    betSelector.setMaxBet(newBalance);
  };

  // ── Back button ──
  const backBtn = new Container();
  backBtn.eventMode = 'static';
  backBtn.cursor = 'pointer';

  const backBg = new Graphics();
  const backTxt = new Text({
    text: '< MENU',
    style: new TextStyle({ fontSize: 11, fontFamily: 'monospace', fill: COLORS.white }),
  });
  backTxt.anchor.set(0.5);
  backTxt.x = BACK_BTN_W / 2;
  backTxt.y = BACK_BTN_H / 2;
  backTxt.eventMode = 'none';

  const drawBackBtn = (hover: boolean): void => {
    backBg.clear();
    backBg.roundRect(0, 0, BACK_BTN_W, BACK_BTN_H, 4);
    backBg.fill({ color: hover ? COLORS.btnFillHover : COLORS.btnFill });
  };

  drawBackBtn(false);
  backBtn.addChild(backBg, backTxt);
  backBtn.position.set(8, Math.round((HEADER_H - BACK_BTN_H) / 2));

  backBtn.on('pointerover', () => drawBackBtn(true));
  backBtn.on('pointerout', () => drawBackBtn(false));

  // ── Scene layout ──
  const setupLayout = (): void => {
    reelGroup.root.position.set(reelsX, reelsY);
    scene.addChild(reelGroup.root);

    const spinOffsetY = Math.round((betSelector.height - BUTTON_HEIGHT) / 2);
    betSelector.root.position.set(reelsX, controlsY);
    allInButton.root.position.set(
      reelsX + Math.round((reelW - ALLIN_SIZE) / 2),
      controlsY + Math.round((betSelector.height - ALLIN_SIZE) / 2),
    );
    spinButton.root.position.set(reelsX + reelW - spinButton.width, controlsY + spinOffsetY);
    scene.addChild(betSelector.root, allInButton.root, spinButton.root);

    balanceDisplay.root.position.set(BALANCE_X, HEADER_MID_Y);
    updateBalance(state.balance);
    gameTitle.root.position.set(app.screen.width / 2, HEADER_MID_Y);
    spinsDisplay.root.position.set(app.screen.width - 24, HEADER_MID_Y);
    spinsDisplay.setValue(state.spinCount);

    scene.addChild(balanceDisplay.root, gameTitle.root, spinsDisplay.root);
    scene.addChild(backBtn);
    scene.addChild(winPopup.root, gameOverScreen.root);
  };

  setupLayout();

  // ── Title animation ──
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
    updateBalance(state.startingBalance);
    state.spinCount = 0;
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

    const bet = state.isAllIn ? state.balance : betSelector.getBet();
    if (bet <= 0 || bet > state.balance) return;

    state.gameState = 'spinning';
    updateBalance(state.balance - bet);
    state.spinCount++;

    spinsDisplay.setValue(state.spinCount);
    setControlsEnabled(false);
    deactivateAllIn();

    reelGroup.clearHighlights();
    reelGroup.spin();

    try {
      const result = await getResponseData(config);

      reelGroup.land(result.reelPositions, () => {
        if (result.winningLines.length > 0) {
          state.gameState = 'showing-win';
          updateBalance(state.balance + result.prize * bet);
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

  // onKeyDown is defined before backBtn handler so both can reference it safely
  const onKeyDown = (e: KeyboardEvent): void => {
    if (e.code === 'Space') {
      e.preventDefault();
      runSpin();
    }
    if (e.code === 'Escape' && state.gameState === 'idle') {
      window.removeEventListener('keydown', onKeyDown);
      Ticker.shared.remove(updateTitleAnimation);
      scene.destroy({ children: true });
      runGame();
    }
  };
  window.addEventListener('keydown', onKeyDown);

  backBtn.on('pointertap', () => {
    if (state.gameState !== 'idle') return;
    window.removeEventListener('keydown', onKeyDown);
    Ticker.shared.remove(updateTitleAnimation);
    scene.destroy({ children: true });
    runGame();
  });
};

runGame();
