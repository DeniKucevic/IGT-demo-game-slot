import { Container, Graphics, Text, Ticker } from 'pixi.js';

import { COLORS, STRINGS, STYLES, TIER_LABEL, TIER_PRIZE_MULT } from '../../shared';
import type { WinLine, WinTier } from '../../shared/types';

const POPUP_W = 380;
const HEADER_H = 58;
const LINE_H = 30;
const FOOTER_H = 56;

const TIER_ACCENT: Record<WinTier, string> = {
  small: COLORS.kafePink,
  win: COLORS.latte,
  bigwin: COLORS.roast,
  jackpot: COLORS.black,
};

const TIER_BORDER_W: Record<WinTier, number> = {
  small: 2,
  win: 2,
  bigwin: 3,
  jackpot: 4,
};

const TIER_ORDER: WinTier[] = ['small', 'win', 'bigwin', 'jackpot'];

const getTopTier = (lines: WinLine[]): WinTier =>
  lines.reduce<WinTier>(
    (best, l) => (TIER_ORDER.indexOf(l.tier) > TIER_ORDER.indexOf(best) ? l.tier : best),
    lines[0].tier,
  );

type PopupPhase = 'in' | 'hold' | 'out' | 'idle';

const IN_DURATION = 420;
const HOLD_DURATION = 2200;
const OUT_DURATION = 280;

const easeOutBounce = (t: number): number => {
  if (t < 0.75) {
    const s = t / 0.75;
    return 1.04 * (1 - (1 - s) * (1 - s));
  }
  return 1.04 - 0.04 * ((t - 0.75) / 0.25);
};

export type WinPopup = {
  root: Container;
  show: (winLines: WinLine[], prize: number, onDone: () => void) => void;
  resize: (w: number, h: number) => void;
};

export const createWinPopup = (screenW: number, screenH: number): WinPopup => {
  const root = new Container();
  root.visible = false;

  const overlay = new Graphics();
  overlay.rect(0, 0, screenW, screenH);
  overlay.fill({ color: '#000000', alpha: 0.5 });
  overlay.eventMode = 'static';
  overlay.cursor = 'pointer';
  root.addChild(overlay);

  const panel = new Container();
  panel.x = Math.round(screenW / 2);
  panel.y = Math.round(screenH / 2);
  root.addChild(panel);

  const bg = new Graphics();
  panel.addChild(bg);

  let dynamicNodes: Text[] = [];
  let phase: PopupPhase = 'idle';
  let elapsed = 0;
  let onDoneCallback: (() => void) | null = null;
  let tickerFn: ((t: Ticker) => void) | null = null;

  const skip = (): void => {
    if (phase === 'hold') {
      phase = 'out';
      elapsed = 0;
    }
  };

  const onKeyDown = (e: KeyboardEvent): void => {
    if (e.code === 'Space') skip();
  };

  overlay.on('pointertap', skip);

  const show = (winLines: WinLine[], prize: number, onDone: () => void): void => {
    if (tickerFn) {
      Ticker.shared.remove(tickerFn);
      tickerFn = null;
    }

    dynamicNodes.forEach((n) => {
      panel.removeChild(n);
      n.destroy();
    });
    dynamicNodes = [];

    const topTier = getTopTier(winLines);
    const accent = TIER_ACCENT[topTier];
    const popupH = HEADER_H + winLines.length * LINE_H + FOOTER_H;
    const halfH = popupH / 2;

    bg.clear();
    bg.roundRect(-POPUP_W / 2, -halfH, POPUP_W, popupH, 4);
    bg.fill({ color: COLORS.white });
    bg.stroke({ color: COLORS.black, width: TIER_BORDER_W[topTier] });
    bg.moveTo(-POPUP_W / 2 + 28, -halfH + HEADER_H);
    bg.lineTo(POPUP_W / 2 - 28, -halfH + HEADER_H);
    bg.stroke({ color: COLORS.black, alpha: 0.12, width: 1 });
    bg.moveTo(-POPUP_W / 2 + 28, halfH - FOOTER_H);
    bg.lineTo(POPUP_W / 2 - 28, halfH - FOOTER_H);
    bg.stroke({ color: COLORS.black, alpha: 0.12, width: 1 });

    const add = (t: Text, x: number, y: number, anchorX: number, anchorY = 0.5): Text => {
      t.position.set(x, y);
      t.anchor.set(anchorX, anchorY);
      panel.addChild(t);
      dynamicNodes.push(t);
      return t;
    };

    add(new Text({ text: STRINGS.winPopup.emoji, style: STYLES.popupEmoji }), 0, -halfH + 28, 0.5);

    const lineStartY = -halfH + HEADER_H + LINE_H / 2 + 2;
    winLines.forEach((line, i) => {
      const y = lineStartY + i * LINE_H;
      add(
        new Text({
          text: STRINGS.winPopup.rowLabel(line.row + 1),
          style: STYLES.popupRow,
        }),
        -POPUP_W / 2 + 28,
        y,
        0,
      );
      add(
        new Text({
          text: TIER_LABEL[line.tier],
          style: STYLES.popupTier(TIER_ACCENT[line.tier]),
        }),
        0,
        y,
        0.5,
      );
      add(
        new Text({
          text: `+${TIER_PRIZE_MULT[line.tier]}×`,
          style: STYLES.popupMult,
        }),
        POPUP_W / 2 - 28,
        y,
        1,
      );
    });

    const totalY = halfH - FOOTER_H / 2;
    add(
      new Text({ text: STRINGS.winPopup.total, style: STYLES.popupRow }),
      -POPUP_W / 2 + 28,
      totalY,
      0,
    );
    add(
      new Text({ text: `+${prize}×`, style: STYLES.popupTotal(accent) }),
      POPUP_W / 2 - 28,
      totalY,
      1,
    );

    onDoneCallback = onDone;
    panel.scale.set(0);
    panel.alpha = 1;
    root.visible = true;
    phase = 'in';
    elapsed = 0;
    window.addEventListener('keydown', onKeyDown);

    tickerFn = (t: Ticker) => {
      elapsed += t.deltaMS;
      if (phase === 'in') {
        const p = Math.min(elapsed / IN_DURATION, 1);
        panel.scale.set(easeOutBounce(p));
        if (p >= 1) {
          panel.scale.set(1);
          phase = 'hold';
          elapsed = 0;
        }
      } else if (phase === 'hold') {
        if (elapsed >= HOLD_DURATION) {
          phase = 'out';
          elapsed = 0;
        }
      } else if (phase === 'out') {
        const p = Math.min(elapsed / OUT_DURATION, 1);
        panel.scale.set(1 - p * 0.15);
        panel.alpha = 1 - p;
        if (p >= 1) {
          root.visible = false;
          panel.alpha = 1;
          panel.scale.set(1);
          phase = 'idle';
          window.removeEventListener('keydown', onKeyDown);
          Ticker.shared.remove(tickerFn!);
          tickerFn = null;
          onDoneCallback?.();
        }
      }
    };
    Ticker.shared.add(tickerFn);
  };

  const resize = (w: number, h: number): void => {
    overlay.clear();
    overlay.rect(0, 0, w, h).fill({ color: '#000000', alpha: 0.5 });
    panel.x = Math.round(w / 2);
    panel.y = Math.round(h / 2);
  };

  return { root, show, resize };
};
