import { Graphics, Text, Ticker } from 'pixi.js';

import { BUTTON_HEIGHT, COLORS, STRINGS, STYLES } from '@shared';
import { createButton } from '../common/button';

export type SpinButton = {
  root: ReturnType<typeof createButton>['root'];
  setEnabled: (enabled: boolean) => void;
  setAllIn: (active: boolean) => void;
  width: number;
};

export const createSpinButton = (): SpinButton => {
  const btn = createButton(STRINGS.spinButton.label, 140);

  const hint = new Text({ text: STRINGS.spinButton.hint, style: STYLES.hint });
  hint.anchor.set(0.5, 0);
  hint.x = btn.width / 2;
  hint.y = BUTTON_HEIGHT + 4;
  btn.root.addChild(hint);

  const glow = new Graphics();
  glow.visible = false;
  btn.root.addChildAt(glow, 0);

  let tickerFn: ((t: Ticker) => void) | null = null;
  let glowElapsed = 0;
  const GLOW_PAD = 8;

  const setAllIn = (active: boolean): void => {
    if (active) {
      glow.visible = true;
      glowElapsed = 0;
      if (tickerFn) Ticker.shared.remove(tickerFn);
      tickerFn = (t: Ticker) => {
        glowElapsed += t.deltaMS;
        const pulse = (Math.sin(glowElapsed / 350) + 1) / 2;
        glow.clear();
        glow.roundRect(
          -GLOW_PAD,
          -GLOW_PAD,
          btn.width + GLOW_PAD * 2,
          BUTTON_HEIGHT + GLOW_PAD * 2,
          10,
        );
        glow.fill({ color: COLORS.gold, alpha: 0.3 + pulse * 0.4 });
      };
      Ticker.shared.add(tickerFn);
    } else {
      if (tickerFn) {
        Ticker.shared.remove(tickerFn);
        tickerFn = null;
      }
      glow.clear();
      glow.visible = false;
    }
  };

  return {
    root: btn.root,
    setEnabled: btn.setEnabled,
    setAllIn,
    width: btn.width,
  };
};
