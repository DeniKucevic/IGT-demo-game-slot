import { Container, Graphics, Sprite, Ticker, Texture } from 'pixi.js';

import { COLORS } from '@shared';
import { ALL_IN_ASSET } from '@shared/config';

// Design tokens
export const ALLIN_SIZE = 130;
const GLOW_PAD = 12;

export type AllInButton = {
  root: Container;
  setActive: (active: boolean) => void;
  setEnabled: (enabled: boolean) => void;
};

export const createAllInButton = (): AllInButton => {
  const root = new Container();
  root.eventMode = 'static';
  root.cursor = 'pointer';

  let active = false;
  let enabled = true;
  let tickerFn: ((t: Ticker) => void) | null = null;
  let glowElapsed = 0;

  const glow = new Graphics();
  glow.visible = false;
  root.addChild(glow);

  const bg = new Graphics();
  root.addChild(bg);

  const sprite = new Sprite(Texture.from(ALL_IN_ASSET));
  const scale = Math.min(
    (ALLIN_SIZE * 1.6) / sprite.texture.width,
    (ALLIN_SIZE * 1.6) / sprite.texture.height,
  );
  sprite.scale.set(scale);
  sprite.anchor.set(0.5);
  sprite.x = ALLIN_SIZE / 2;
  sprite.y = ALLIN_SIZE / 2;
  sprite.blendMode = 'multiply';
  sprite.eventMode = 'none';
  root.addChild(sprite);

  const drawBg = (hover = false): void => {
    bg.clear();
    if (active) {
      bg.roundRect(0, 0, ALLIN_SIZE, ALLIN_SIZE, 10);
      bg.fill({ color: COLORS.cream });
      bg.stroke({ color: COLORS.gold, width: 3 });
    } else if (hover) {
      bg.roundRect(0, 0, ALLIN_SIZE, ALLIN_SIZE, 10);
      bg.fill({ color: COLORS.cream, alpha: 0.5 });
      bg.stroke({ color: COLORS.hint, width: 1.5, alpha: 0.5 });
    } else {
      bg.roundRect(0, 0, ALLIN_SIZE, ALLIN_SIZE, 10);
      bg.fill({ color: 0, alpha: 0 });
      bg.stroke({ color: COLORS.hint, width: 1.5, alpha: 0.25 });
    }
  };

  const startGlow = (): void => {
    if (tickerFn) return;
    glow.visible = true;
    glowElapsed = 0;
    tickerFn = (t: Ticker) => {
      glowElapsed += t.deltaMS;
      const pulse = (Math.sin(glowElapsed / 400) + 1) / 2;
      glow.clear();
      glow.roundRect(
        -GLOW_PAD,
        -GLOW_PAD,
        ALLIN_SIZE + GLOW_PAD * 2,
        ALLIN_SIZE + GLOW_PAD * 2,
        18,
      );
      glow.fill({ color: COLORS.gold, alpha: 0.15 + pulse * 0.35 });
    };
    Ticker.shared.add(tickerFn);
  };

  const stopGlow = (): void => {
    if (tickerFn) {
      Ticker.shared.remove(tickerFn);
      tickerFn = null;
    }
    glow.clear();
    glow.visible = false;
  };

  drawBg();

  root.on('pointerover', () => {
    if (enabled && !active) drawBg(true);
  });
  root.on('pointerout', () => {
    if (!active) drawBg(false);
  });

  const setActive = (val: boolean): void => {
    if (active === val) return;
    active = val;
    drawBg();
    if (val) startGlow();
    else stopGlow();
  };

  const setEnabled = (val: boolean): void => {
    enabled = val;
    root.eventMode = val ? 'static' : 'none';
    root.cursor = val ? 'pointer' : 'default';
    root.alpha = val ? 1 : 0.45;
    if (!val) stopGlow();
  };

  return { root, setActive, setEnabled };
};
