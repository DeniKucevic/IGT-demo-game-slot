import { Application, Container, Graphics, Text, TextStyle, Ticker } from 'pixi.js';

import { COLORS, computeLayout, STRINGS } from '@shared';
import type { GameConfig } from '@shared/config';
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

const HEADER_MID_Y = 24;
const HEADER_H = 48;
const TITLE_ANIM_INTERVAL = 1500;
const BACK_BTN_W = 52;
const BACK_BTN_H = 30;
const BALANCE_X = BACK_BTN_W + 16;

export const createGameSession = (
  config: GameConfig,
  state: AppState,
  app: Application,
  onExit: () => void,
): void => {
  const scene = new Container();
  app.stage.addChild(scene);

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
  backBtn.position.set(8, Math.round((HEADER_H - BACK_BTN_H) / 2));

  backBtn.on('pointerover', () => drawBackBtn(true));
  backBtn.on('pointerout', () => drawBackBtn(false));

  // ── Layout ──
  const spinOffsetY = Math.round((betSelector.height - BUTTON_HEIGHT) / 2);
  reelGroup.root.position.set(reelsX, reelsY);
  betSelector.root.position.set(reelsX, controlsY);
  allInButton.root.position.set(
    reelsX + Math.round((reelW - ALLIN_SIZE) / 2),
    controlsY + Math.round((betSelector.height - ALLIN_SIZE) / 2),
  );
  spinButton.root.position.set(reelsX + reelW - spinButton.width, controlsY + spinOffsetY);
  balanceDisplay.root.position.set(BALANCE_X, HEADER_MID_Y);
  gameTitle.root.position.set(app.screen.width / 2, HEADER_MID_Y);
  spinsDisplay.root.position.set(app.screen.width - 24, HEADER_MID_Y);

  scene.addChild(reelGroup.root);
  scene.addChild(betSelector.root, allInButton.root, spinButton.root);
  scene.addChild(balanceDisplay.root, gameTitle.root, spinsDisplay.root);
  scene.addChild(backBtn);
  scene.addChild(winPopup.root, gameOverScreen.root);

  updateBalance(state.balance);
  spinsDisplay.setValue(state.spinCount);

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
    scene.destroy({ children: true });
    onExit();
  };

  window.addEventListener('keydown', onKeyDown);

  backBtn.on('pointertap', () => {
    if (state.gameState !== 'idle') return;
    exitSession();
  });
};
