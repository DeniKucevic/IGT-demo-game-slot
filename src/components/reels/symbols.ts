import { Container, Graphics, Sprite, Texture, Ticker } from 'pixi.js';

import { COLORS } from '../../shared';
import { SYMBOLS } from '../../shared/config';

const SYMBOL_COLORS = [
  COLORS.espresso,
  COLORS.latte,
  COLORS.cappuccino,
  COLORS.mocha,
  COLORS.nespresso,
  COLORS.java,
  COLORS.americano,
  COLORS.turkish,
];

export type SymbolSlot = {
  container: Container;
  setSymbol: (symbolIndex: number) => void;
  highlight: (on: boolean) => void;
};

export const createSymbolSlot = (symbolSize: number): SymbolSlot => {
  const container = new Container();

  const background = new Graphics();
  container.addChild(background);

  const sprite = new Sprite();
  sprite.width = symbolSize - 8;
  sprite.height = symbolSize - 8;
  sprite.x = 4;
  sprite.y = 4;
  container.addChild(sprite);

  const glowOverlay = new Graphics();
  container.addChild(glowOverlay);

  const setSymbol = (symbolIndex: number): void => {
    background.clear();
    background.roundRect(2, 2, symbolSize - 4, symbolSize - 4, 4);
    background.fill({
      color: SYMBOL_COLORS[symbolIndex % SYMBOL_COLORS.length],
    });
    background.stroke({ color: COLORS.black, width: 2 });
    sprite.texture = Texture.from(SYMBOLS[symbolIndex]);
  };

  let highlightTicker: ((t: Ticker) => void) | null = null;
  let highlightTime = 0;

  const highlight = (on: boolean): void => {
    if (highlightTicker) {
      Ticker.shared.remove(highlightTicker);
      highlightTicker = null;
    }
    glowOverlay.clear();

    if (on) {
      highlightTime = 0;
      highlightTicker = (t: Ticker) => {
        highlightTime += t.deltaMS;
        const alpha = 0.6 + 0.4 * Math.sin(highlightTime / 280);
        glowOverlay.clear();
        glowOverlay.roundRect(1, 1, symbolSize - 2, symbolSize - 2, 5);
        glowOverlay.stroke({ color: COLORS.gold, alpha, width: 6 });
      };
      Ticker.shared.add(highlightTicker);
    }
  };

  return { container, setSymbol, highlight };
};
