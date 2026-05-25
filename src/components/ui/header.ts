import '@pixi/layout';
import { Container, Graphics, Text } from 'pixi.js';

import { COLORS, STRINGS, STYLES } from '@shared';
import { HEADER_H } from '@shared/layout';
import { createStatDisplay, type StatDisplay } from './stat-display';
import { createTitleDisplay, type TitleDisplay } from './title-display';

// Design tokens
export const TITLE_MIN_W = 560;

const HEADER_MID_Y = HEADER_H / 2;
const BACK_BTN_W = 52;
const BACK_BTN_H = 30;
const BALANCE_X = BACK_BTN_W + 16;

export type GameHeader = {
  root: Container;
  balanceDisplay: StatDisplay;
  gameTitle: TitleDisplay;
  spinsDisplay: StatDisplay;
  setBackBtnDisabled: (disabled: boolean) => void;
  setTitleVisible: (visible: boolean) => void;
};

export const createGameHeader = (onBack: () => void): GameHeader => {
  const backBtn = new Container();
  backBtn.eventMode = 'static';
  backBtn.cursor = 'pointer';

  const backBg = new Graphics();
  const backTxt = new Text({ text: STRINGS.header.back, style: STYLES.backBtn });
  backTxt.anchor.set(0.5);
  backTxt.x = BACK_BTN_W / 2;
  backTxt.y = BACK_BTN_H / 2;
  backTxt.eventMode = 'none';

  let backBtnDisabled = false;

  const drawBackBtn = (hover: boolean): void => {
    backBg.clear();
    backBg.roundRect(0, 0, BACK_BTN_W, BACK_BTN_H, 4);
    backBg.fill({
      color: backBtnDisabled
        ? COLORS.btnFillDisabled
        : hover
          ? COLORS.btnFillHover
          : COLORS.btnFill,
    });
    backTxt.style.fill = backBtnDisabled ? COLORS.hint : COLORS.white;
  };

  const setBackBtnDisabled = (disabled: boolean): void => {
    backBtnDisabled = disabled;
    backBtn.cursor = disabled ? 'default' : 'pointer';
    drawBackBtn(false);
  };

  drawBackBtn(false);
  backBtn.addChild(backBg, backTxt);
  backBtn.on('pointerover', () => {
    if (!backBtnDisabled) drawBackBtn(true);
  });
  backBtn.on('pointerout', () => drawBackBtn(false));
  backBtn.on('pointertap', onBack);

  const balanceDisplay = createStatDisplay(STRINGS.header.balance, 'left');
  const gameTitle = createTitleDisplay(STRINGS.header.title);
  const spinsDisplay = createStatDisplay(STRINGS.header.spins, 'right');

  const headerStrip = new Container();
  headerStrip.layout = { width: '100%', height: HEADER_H };

  backBtn.layout = { position: 'absolute', left: 8, top: Math.round((HEADER_H - BACK_BTN_H) / 2) };
  balanceDisplay.root.layout = { position: 'absolute', left: BALANCE_X, top: 0 };
  balanceDisplay.root.y = HEADER_MID_Y;

  const gameTitleWrapper = new Container();
  gameTitleWrapper.layout = { position: 'absolute', left: '50%', top: 0 };
  gameTitle.root.position.set(0, HEADER_MID_Y);
  gameTitleWrapper.addChild(gameTitle.root);

  const spinsWrapper = new Container();
  spinsWrapper.layout = { position: 'absolute', right: 24, top: 0 };
  spinsDisplay.root.position.set(0, HEADER_MID_Y);
  spinsWrapper.addChild(spinsDisplay.root);

  headerStrip.addChild(backBtn, balanceDisplay.root, gameTitleWrapper, spinsWrapper);

  return {
    root: headerStrip,
    balanceDisplay,
    gameTitle,
    spinsDisplay,
    setBackBtnDisabled,
    setTitleVisible: (visible) => {
      gameTitleWrapper.visible = visible;
    },
  };
};
