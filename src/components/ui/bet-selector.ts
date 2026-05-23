import { Container, Graphics, Sprite, Text, Texture } from 'pixi.js';

import { COLORS, STRINGS, STYLES } from '../../shared';
import { BET_VALUES, CUP_ASSET } from '../../shared/config';

type Option = { name: string; bet: number };
const OPTIONS: Option[] = [
  { name: STRINGS.betSelector.names[0], bet: BET_VALUES[0] },
  { name: STRINGS.betSelector.names[1], bet: BET_VALUES[1] },
  { name: STRINGS.betSelector.names[2], bet: BET_VALUES[2] },
  { name: STRINGS.betSelector.names[3], bet: BET_VALUES[3] },
];

const CARD_W = 64;
const CARD_H = 90;
const CARD_GAP = 10;
const NAME_STRIP_W = 18;
const CUP_CENTER_X = NAME_STRIP_W + (CARD_W - NAME_STRIP_W) / 2;
const CUP_BOTTOM_Y = 70;
const CUP_HEIGHTS = [40, 43, 47, 51];

export const BET_SELECTOR_WIDTH = OPTIONS.length * CARD_W + (OPTIONS.length - 1) * CARD_GAP;

export type BetSelector = {
  root: Container;
  getBet: () => number;
  setEnabled: (enabled: boolean) => void;
  setAllIn: (active: boolean) => void;
  width: number;
  height: number;
};

export const createBetSelector = (onSelect: () => void): BetSelector => {
  const root = new Container();
  let selectedIndex = 1;
  let enabled = true;
  let allInActive = false;

  const cards: Container[] = [];
  const bgs: Graphics[] = [];

  const drawBg = (i: number): void => {
    const bg = bgs[i];
    bg.clear();
    bg.rect(0, 0, CARD_W, CARD_H).fill({ color: 0, alpha: 0 });
    if (i === selectedIndex && !allInActive) {
      bg.roundRect(0, 0, CARD_W, CARD_H, 6);
      bg.fill({ color: COLORS.cream });
      bg.stroke({ color: COLORS.gold, width: 2 });
    }
  };

  const updateCards = (): void => {
    bgs.forEach((_, i) => drawBg(i));
    cards.forEach((c, i) => {
      c.alpha = !allInActive && i === selectedIndex ? 1 : 0.28;
    });
  };

  OPTIONS.forEach(({ name, bet }, i) => {
    const card = new Container();
    card.x = i * (CARD_W + CARD_GAP);
    card.eventMode = 'static';
    card.cursor = 'pointer';
    root.addChild(card);
    cards.push(card);

    const bg = new Graphics();
    card.addChild(bg);
    bgs.push(bg);

    const nameText = new Text({ text: name, style: STYLES.cardName });
    nameText.anchor.set(0, 0.5);
    nameText.rotation = Math.PI / 2;
    nameText.x = NAME_STRIP_W / 2;
    nameText.y = 8;
    nameText.eventMode = 'none';
    card.addChild(nameText);

    const sprite = new Sprite(Texture.from(CUP_ASSET));
    sprite.scale.set(CUP_HEIGHTS[i] / sprite.texture.height);
    sprite.anchor.set(0.5, 1);
    sprite.x = CUP_CENTER_X;
    sprite.y = CUP_BOTTOM_Y;
    sprite.blendMode = 'multiply';
    sprite.eventMode = 'none';
    card.addChild(sprite);

    const valueText = new Text({ text: String(bet), style: STYLES.cardValue });
    valueText.anchor.set(0.5, 0);
    valueText.x = CUP_CENTER_X;
    valueText.y = CUP_BOTTOM_Y + 4;
    valueText.eventMode = 'none';
    card.addChild(valueText);

    card.on('pointerover', () => {
      if (enabled && i !== selectedIndex) card.alpha = 0.55;
    });
    card.on('pointerout', () => {
      card.alpha = i === selectedIndex ? 1 : 0.28;
    });
    card.on('pointertap', () => {
      if (!enabled) return;
      allInActive = false;
      selectedIndex = i;
      updateCards();
      onSelect();
    });
  });

  updateCards();

  const setEnabled = (isEnabled: boolean): void => {
    enabled = isEnabled;
    cards.forEach((c) => {
      c.eventMode = isEnabled ? 'static' : 'none';
      c.cursor = isEnabled ? 'pointer' : 'default';
    });
    root.alpha = isEnabled ? 1 : 0.45;
  };

  const setAllIn = (active: boolean): void => {
    allInActive = active;
    updateCards();
  };

  return {
    root,
    getBet: () => OPTIONS[selectedIndex].bet,
    setEnabled,
    setAllIn,
    width: BET_SELECTOR_WIDTH,
    height: CARD_H,
  };
};
