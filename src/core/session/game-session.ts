import '@pixi/layout';
import { Application, Container, Graphics, Text, TextStyle, Ticker } from 'pixi.js';

import { COLORS, computeLayout, STRINGS } from '@shared';
import type { GameConfig } from '@shared/config';
import { FOOTER_H, HEADER_H } from '@shared/layout';

import type { AppState } from '@core/state';
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

const HEADER_MID_Y = HEADER_H / 2;
const TITLE_ANIM_INTERVAL = 1500;
const BACK_BTN_W = 52;
const BACK_BTN_H = 30;
const BALANCE_X = BACK_BTN_W + 16;
const CONTROLS_PAD_Y = 10;

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
  const betSelector = createBetSelector(() => deactivateAllIn());
  const winPopup = createWinPopup(app.screen.width, app.screen.height);
  const gameOverScreen = createGameOverScreen(app.screen.width, app.screen.height);
  const balanceDisplay = createStatDisplay(STRINGS.header.balance, 'left');
  const gameTitle = createTitleDisplay(STRINGS.header.title);
  const spinsDisplay = createStatDisplay(STRINGS.header.spins, 'right');

  // ── Balance helper ──
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
  backBtn.on('pointerover', () => drawBackBtn(true));
  backBtn.on('pointerout', () => drawBackBtn(false));

  // ── Header strip ──
  const headerStrip = new Container();
  headerStrip.layout = { width: '100%', height: HEADER_H };

  backBtn.position.set(8, Math.round((HEADER_H - BACK_BTN_H) / 2));
  balanceDisplay.root.position.set(BALANCE_X, HEADER_MID_Y);
  gameTitle.root.position.set(app.screen.width / 2, HEADER_MID_Y);
  spinsDisplay.root.position.set(app.screen.width - 24, HEADER_MID_Y);
  headerStrip.addChild(backBtn, balanceDisplay.root, gameTitle.root, spinsDisplay.root);
  scene.addChild(headerStrip);

  // ── Reels area ──
  const reelsArea = new Container();
  reelsArea.layout = {
    flexGrow: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  };

  const reelHolder = new Container();
  reelHolder.layout = { width: reelW, height: reelH };
  reelHolder.addChild(reelGroup.root);
  reelsArea.addChild(reelHolder);
  scene.addChild(reelsArea);

  // ── Controls strip ──
  const controlsStrip = new Container();
  controlsStrip.layout = { width: '100%', height: FOOTER_H };

  const spinOffsetY = Math.round((betSelector.height - BUTTON_HEIGHT) / 2);

  const positionControls = (rx: number, rw: number): void => {
    betSelector.root.position.set(rx, CONTROLS_PAD_Y);
    allInButton.root.position.set(
      rx + Math.round((rw - ALLIN_SIZE) / 2),
      CONTROLS_PAD_Y + Math.round((betSelector.height - ALLIN_SIZE) / 2),
    );
    spinButton.root.position.set(rx + rw - spinButton.width, CONTROLS_PAD_Y + spinOffsetY);
  };

  positionControls(reelsX, reelW);
  controlsStrip.addChild(betSelector.root, allInButton.root, spinButton.root);
  scene.addChild(controlsStrip);

  scene.addChild(winPopup.root, gameOverScreen.root);

  updateBalance(state.balance);
  spinsDisplay.setValue(state.spinCount);

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

    gameTitle.root.x = w / 2;
    spinsDisplay.root.x = w - 24;

    positionControls(newReelsX, newReelW);
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
      gameTitle.triggerRandomSpin();
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
  };

  const endRound = (): void => {
    reelGroup.clearHighlights();
    betSelector.setAllIn(false);
    if (state.balance <= 0) {
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

    spinsDisplay.setValue(state.spinCount);
    setControlsEnabled(false);
    state.isAllIn = false;
    allInButton.setActive(false);
    spinButton.setAllIn(false);

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
      endRound();
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
    scene.destroy({ children: true });
    onExit();
  };

  window.addEventListener('keydown', onKeyDown);

  backBtn.on('pointertap', () => {
    if (state.gameState !== 'idle') return;
    exitSession();
  });
};
