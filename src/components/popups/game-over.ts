import { Container, Graphics, Text, Ticker } from 'pixi.js';

import { COLORS, STRINGS, STYLES } from '@shared';
import { createButton } from '../common/button';

const PANEL_W = 360;
const PANEL_H = 220;

const easeOutBack = (t: number): number => {
  const c = 1.70158;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
};

export type GameOverScreen = {
  root: Container;
  show: (onPlayAgain: () => void) => void;
  resize: (w: number, h: number) => void;
};

export const createGameOverScreen = (screenW: number, screenH: number): GameOverScreen => {
  const root = new Container();
  root.visible = false;

  const overlay = new Graphics()
    .rect(0, 0, screenW, screenH)
    .fill({ color: COLORS.black, alpha: 0.55 });
  overlay.eventMode = 'static';
  root.addChild(overlay);

  const panel = new Container();
  panel.x = Math.round(screenW / 2);
  panel.y = Math.round(screenH / 2);
  root.addChild(panel);

  const bg = new Graphics();
  bg.roundRect(-PANEL_W / 2, -PANEL_H / 2, PANEL_W, PANEL_H, 4);
  bg.fill({ color: COLORS.white });
  bg.stroke({ color: COLORS.black, width: 3 });
  panel.addChild(bg);

  const emoji = new Text({ text: STRINGS.gameOver.emoji, style: STYLES.overlayEmoji });
  emoji.anchor.set(0.5);
  emoji.x = 0;
  emoji.y = -PANEL_H / 2 + 46;
  panel.addChild(emoji);

  const headline = new Text({ text: STRINGS.gameOver.headline, style: STYLES.overlayHeadline });
  headline.anchor.set(0.5);
  headline.x = 0;
  headline.y = -18;
  panel.addChild(headline);

  const sub = new Text({ text: STRINGS.gameOver.sub, style: STYLES.overlaySub });
  sub.anchor.set(0.5);
  sub.x = 0;
  sub.y = 10;
  panel.addChild(sub);

  const btn = createButton(STRINGS.gameOver.playAgain, 160);
  btn.root.x = -80;
  btn.root.y = PANEL_H / 2 - 68;
  panel.addChild(btn.root);

  let tickerFn: ((t: Ticker) => void) | null = null;

  const show = (onPlayAgain: () => void): void => {
    if (tickerFn) {
      Ticker.shared.remove(tickerFn);
      tickerFn = null;
    }

    panel.scale.set(0);
    root.visible = true;
    let elapsed = 0;
    const DURATION = 380;

    tickerFn = (t: Ticker) => {
      elapsed += t.deltaMS;
      const p = Math.min(elapsed / DURATION, 1);
      panel.scale.set(easeOutBack(p));
      if (p >= 1) {
        panel.scale.set(1);
        Ticker.shared.remove(tickerFn!);
        tickerFn = null;
      }
    };
    Ticker.shared.add(tickerFn);

    btn.root.removeAllListeners();
    btn.root.on('pointertap', () => {
      root.visible = false;
      onPlayAgain();
    });
  };

  const resize = (w: number, h: number): void => {
    overlay.clear();
    overlay.rect(0, 0, w, h).fill({ color: COLORS.black, alpha: 0.55 });
    panel.x = Math.round(w / 2);
    panel.y = Math.round(h / 2);
  };

  return { root, show, resize };
};
