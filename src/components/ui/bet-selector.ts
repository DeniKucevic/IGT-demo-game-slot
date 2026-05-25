import { Container, Graphics, Sprite, Text, Texture } from 'pixi.js';

import { COLORS, STRINGS, STYLES } from '@shared';
import { BET_VALUES, CUP_ASSET } from '@shared/config';

type Option = { name: string; bet: number };
const OPTIONS: Option[] = [
  { name: STRINGS.betSelector.names[0], bet: BET_VALUES[0] },
  { name: STRINGS.betSelector.names[1], bet: BET_VALUES[1] },
  { name: STRINGS.betSelector.names[2], bet: BET_VALUES[2] },
  { name: STRINGS.betSelector.names[3], bet: BET_VALUES[3] },
];

// Design tokens
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
  /** Toggles the gold all-in border on the currently selected card. */
  setAllIn: (active: boolean) => void;
  /**
   * Caps the selectable options to what the player can afford.
   * Auto-downgrades the active selection if it exceeds `balance`,
   * and visually greys out unaffordable options.
   */
  setMaxBet: (balance: number) => void;
  width: number;
  height: number;
};

export const createBetSelector = (onSelect: () => void): BetSelector => {
  const root = new Container();
  let selectedIndex = 1;
  let enabled = true;
  let allInActive = false;
  let maxBet = Infinity;

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
      const affordable = OPTIONS[i].bet <= maxBet;
      if (!allInActive && i === selectedIndex) {
        c.alpha = 1;
      } else if (!affordable) {
        c.alpha = 0.15;
      } else {
        c.alpha = 0.28;
      }
      c.cursor = !enabled ? 'default' : !affordable ? 'not-allowed' : 'pointer';
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
      if (enabled && i !== selectedIndex && OPTIONS[i].bet <= maxBet) card.alpha = 0.55;
    });
    card.on('pointerout', () => {
      updateCards();
    });
    card.on('pointertap', () => {
      if (!enabled || OPTIONS[i].bet > maxBet) return;
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
    });
    updateCards();
    root.alpha = isEnabled ? 1 : 0.45;
  };

  const setAllIn = (active: boolean): void => {
    allInActive = active;
    updateCards();
  };

  const setMaxBet = (balance: number): void => {
    maxBet = balance;
    // Auto-downgrade selection to the highest affordable bet
    if (!allInActive && OPTIONS[selectedIndex].bet > maxBet) {
      const best = OPTIONS.reduce<number | null>(
        (prev, opt, i) => (opt.bet <= maxBet ? i : prev),
        null,
      );
      if (best !== null) selectedIndex = best;
    }
    updateCards();
  };

  return {
    root,
    getBet: () => OPTIONS[selectedIndex].bet,
    setEnabled,
    setAllIn,
    setMaxBet,
    width: BET_SELECTOR_WIDTH,
    height: CARD_H,
  };
};
