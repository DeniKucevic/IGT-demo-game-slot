import '@pixi/layout';
import { Application, Container, Ticker } from 'pixi.js';

import { computeLayout } from '@shared';
import type { GameConfig } from '@shared/config';
import { FOOTER_H } from '@shared/layout';
import type { WinTier } from '@shared/types';

import {
  playClick,
  playSpin,
  stopSpin,
  playResult,
  playGameOver,
  setMuted,
  unduckLobbyMusic,
} from '@core/sound';
import type { AppState } from '@core/state';
import { getResponseData } from '@server/api';

import {
  createReelGroup,
  createSpinButton,
  createWinPopup,
  createBetSelector,
  createGameOverScreen,
  createAllInButton,
  createGameHeader,
  TITLE_MIN_W,
  ALLIN_SIZE,
  BET_SELECTOR_WIDTH,
  BUTTON_HEIGHT,
} from '@components';

const TIER_ORDER: WinTier[] = ['small', 'win', 'bigwin', 'jackpot'];
const topWinTier = (tiers: WinTier[]): WinTier =>
  tiers.reduce((best, t) => (TIER_ORDER.indexOf(t) > TIER_ORDER.indexOf(best) ? t : best));

const TITLE_ANIM_INTERVAL = 1500;
const CTRL_GAP = 16;

export const createGameSession = (
  config: GameConfig,
  state: AppState,
  app: Application,
  onExit: () => void,
): void => {
  const scene = new Container();
  app.stage.addChild(scene);
  scene.layout = { flexDirection: 'column', width: app.screen.width, height: app.screen.height };

  const {
    symbolSize: baseSymbolSize,
    reelW,
    reelH,
    reelsX,
  } = computeLayout(config, app.screen.width, app.screen.height);

  // ── UI components ──
  const reelGroup = createReelGroup(config, baseSymbolSize);
  const spinButton = createSpinButton();
  const allInButton = createAllInButton();
  const betSelector = createBetSelector(() => {
    playClick();
    deactivateAllIn();
  });
  const winPopup = createWinPopup(app.screen.width, app.screen.height);
  const gameOverScreen = createGameOverScreen(app.screen.width, app.screen.height);
  // ── Header ──
  const header = createGameHeader(() => {
    if (state.gameState !== 'idle') return;
    playClick();
    exitSession();
  });
  header.setTitleVisible(app.screen.width >= TITLE_MIN_W);
  scene.addChild(header.root);

  // ── Balance helper ──
  const updateBalance = (newBalance: number): void => {
    state.balance = newBalance;
    header.balanceDisplay.setValue(newBalance);
    betSelector.setMaxBet(newBalance);
  };

  // ── Reels area ──
  const reelsArea = new Container();
  reelsArea.layout = { flexGrow: 1, width: '100%', justifyContent: 'center', alignItems: 'center' };

  const reelHolder = new Container();
  reelHolder.layout = { width: reelW, height: reelH };
  reelHolder.addChild(reelGroup.root);
  reelsArea.addChild(reelHolder);
  scene.addChild(reelsArea);

  // ── Controls strip ──
  const ctrlTotalW = BET_SELECTOR_WIDTH + CTRL_GAP + ALLIN_SIZE + CTRL_GAP + spinButton.width;
  const ctrlTotalH = Math.max(betSelector.height, ALLIN_SIZE, BUTTON_HEIGHT);

  betSelector.root.position.set(0, Math.round((ctrlTotalH - betSelector.height) / 2));
  allInButton.root.position.set(
    BET_SELECTOR_WIDTH + CTRL_GAP,
    Math.round((ctrlTotalH - ALLIN_SIZE) / 2),
  );
  spinButton.root.position.set(
    BET_SELECTOR_WIDTH + CTRL_GAP + ALLIN_SIZE + CTRL_GAP,
    Math.round((ctrlTotalH - BUTTON_HEIGHT) / 2),
  );

  const controlsGroup = new Container();
  controlsGroup.addChild(betSelector.root, allInButton.root, spinButton.root);

  const controlsStrip = new Container();
  controlsStrip.layout = { width: '100%', height: FOOTER_H };

  controlsGroup.layout = { position: 'absolute', left: 0, top: 0 };
  controlsStrip.addChild(controlsGroup);
  scene.addChild(controlsStrip);

  const positionControls = (w: number, rx: number): void => {
    const availW = w - rx * 2;
    const itemsW = BET_SELECTOR_WIDTH + ALLIN_SIZE + spinButton.width;
    if (itemsW <= availW) {
      controlsGroup.scale.set(1);
      betSelector.root.x = 0;
      allInButton.root.x = Math.round((availW - ALLIN_SIZE) / 2);
      spinButton.root.x = availW - spinButton.width;
      controlsGroup.layout!.setStyle({ left: rx, top: Math.round((FOOTER_H - ctrlTotalH) / 2) });
    } else {
      const ctrlScale = Math.min(1, w / ctrlTotalW);
      const scaledW = ctrlTotalW * ctrlScale;
      const scaledH = ctrlTotalH * ctrlScale;
      controlsGroup.scale.set(ctrlScale);
      betSelector.root.x = 0;
      allInButton.root.x = BET_SELECTOR_WIDTH + CTRL_GAP;
      spinButton.root.x = BET_SELECTOR_WIDTH + CTRL_GAP + ALLIN_SIZE + CTRL_GAP;
      controlsGroup.layout!.setStyle({
        left: Math.round((w - scaledW) / 2),
        top: Math.round((FOOTER_H - scaledH) / 2),
      });
    }
  };

  positionControls(app.screen.width, reelsX);

  scene.addChild(winPopup.root, gameOverScreen.root);

  updateBalance(state.balance);
  header.spinsDisplay.setValue(state.spinCount);
  setMuted(state.muted);

  // ── Resize handler ──
  const onResize = (w: number, h: number): void => {
    scene.layout!.setStyle({ width: w, height: h });

    const {
      symbolSize,
      reelW: newReelW,
      reelH: newReelH,
      reelsX: newReelsX,
    } = computeLayout(config, w, h);

    const scale = symbolSize / baseSymbolSize;
    reelGroup.root.scale.set(scale);
    reelHolder.layout!.setStyle({ width: newReelW, height: newReelH });

    positionControls(w, newReelsX);
    winPopup.resize(w, h);
    gameOverScreen.resize(w, h);
    header.setTitleVisible(w >= TITLE_MIN_W);
  };

  app.renderer.on('resize', onResize);

  // ── Title animation ──
  const updateTitleAnimation = (ticker: Ticker): void => {
    if (state.gameState !== 'idle' || state.spinCount > 0) {
      Ticker.shared.remove(updateTitleAnimation);
      return;
    }
    state.titleAnimationTime += ticker.deltaMS;
    if (state.titleAnimationTime >= TITLE_ANIM_INTERVAL) {
      header.gameTitle.triggerRandomSpin();
      state.titleAnimationTime = 0;
    }
  };
  Ticker.shared.add(updateTitleAnimation);

  // ── Business logic ──
  const deactivateAllIn = (): void => {
    state.isAllIn = false;
    allInButton.setActive(false);
    spinButton.setAllIn(false);
    betSelector.setAllIn(false);
  };

  const setControlsEnabled = (enabled: boolean): void => {
    spinButton.setEnabled(enabled);
    betSelector.setEnabled(enabled);
    allInButton.setEnabled(enabled);
    header.setBackBtnDisabled(!enabled);
  };

  const endRound = (): void => {
    reelGroup.clearHighlights();
    betSelector.setAllIn(false);
    if (state.balance <= 0) {
      playGameOver();
      gameOverScreen.show(exitSession);
    } else {
      state.gameState = 'idle';
      setControlsEnabled(true);
    }
  };

  const runSpin = async (): Promise<void> => {
    if (state.gameState !== 'idle') return;

    const bet = state.isAllIn ? state.balance : betSelector.getBet();
    if (bet <= 0 || bet > state.balance) return;

    state.gameState = 'spinning';
    updateBalance(state.balance - bet);
    state.spinCount++;

    header.spinsDisplay.setValue(state.spinCount);
    setControlsEnabled(false);
    state.isAllIn = false;
    allInButton.setActive(false);
    spinButton.setAllIn(false);

    reelGroup.clearHighlights();
    reelGroup.spin(playClick);
    playSpin();

    try {
      const result = await getResponseData(config);

      reelGroup.land(result.reelPositions, () => {
        stopSpin();
        if (result.winningLines.length > 0) {
          state.gameState = 'showing-win';
          updateBalance(state.balance + result.prize * bet);
          reelGroup.highlightWins(result.winningLines);
          playResult(topWinTier(result.winningLines.map((l) => l.tier)));
          winPopup.show(result.winningLines, result.prize, endRound);
        } else {
          if (state.balance > 0) playResult(null);
          endRound();
        }
      });
    } catch (error) {
      console.error(error);
      stopSpin();
      endRound();
    }
  };

  // ── Input handlers ──
  allInButton.root.on('pointertap', () => {
    playClick();
    state.isAllIn = !state.isAllIn;
    allInButton.setActive(state.isAllIn);
    spinButton.setAllIn(state.isAllIn);
    betSelector.setAllIn(state.isAllIn);
  });

  spinButton.root.on('pointertap', () => {
    playClick();
    runSpin();
  });

  const onKeyDown = (e: KeyboardEvent): void => {
    if (e.code === 'Space') {
      e.preventDefault();
      runSpin();
    }
    if (e.code === 'Escape' && state.gameState === 'idle') exitSession();
  };

  const exitSession = (): void => {
    window.removeEventListener('keydown', onKeyDown);
    Ticker.shared.remove(updateTitleAnimation);
    app.renderer.off('resize', onResize);
    unduckLobbyMusic();
    scene.destroy({ children: true });
    onExit();
  };

  window.addEventListener('keydown', onKeyDown);
};
