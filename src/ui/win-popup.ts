import { Container, Graphics, Text, TextStyle, Ticker } from "pixi.js";
import { COLORS } from "../shared/colors";
import type { WinLine, WinTier } from "../shared/types";
import { TIER_LABEL, TIER_PRIZE_MULT } from "../shared/types";

const POPUP_W = 380;
const HEADER_H = 58; // cup icon + divider
const LINE_H = 30; // height per win-line row
const FOOTER_H = 56; // total divider + total row + padding

// Tier accent colors
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

const TIER_ORDER: WinTier[] = ["small", "win", "bigwin", "jackpot"];

const getTopTier = (lines: WinLine[]): WinTier =>
  lines.reduce<WinTier>(
    (best, l) =>
      TIER_ORDER.indexOf(l.tier) > TIER_ORDER.indexOf(best) ? l.tier : best,
    lines[0].tier,
  );

type PopupPhase = "in" | "hold" | "out" | "idle";

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
};

export const createWinPopup = (screenW: number, screenH: number): WinPopup => {
  const root = new Container();
  root.visible = false;

  const overlay = new Graphics();
  overlay.rect(0, 0, screenW, screenH);
  overlay.fill({ color: "#000000", alpha: 0.5 });
  overlay.eventMode = "static";
  overlay.cursor = "pointer";
  root.addChild(overlay);

  const panel = new Container();
  panel.x = Math.round(screenW / 2);
  panel.y = Math.round(screenH / 2);
  root.addChild(panel);

  const bg = new Graphics();
  panel.addChild(bg);

  // Holds dynamic text nodes
  let dynamicNodes: Text[] = [];

  let phase: PopupPhase = "idle";
  let elapsed = 0;
  let onDoneCallback: (() => void) | null = null;
  let tickerFn: ((t: Ticker) => void) | null = null;

  const skip = (): void => {
    if (phase === "hold") {
      phase = "out";
      elapsed = 0;
    }
  };

  const onKeyDown = (e: KeyboardEvent): void => {
    if (e.code === "Space") skip();
  };

  overlay.on("pointertap", skip);

  const show = (
    winLines: WinLine[],
    prize: number,
    onDone: () => void,
  ): void => {
    if (tickerFn) {
      Ticker.shared.remove(tickerFn);
      tickerFn = null;
    }

    // Tear down previous content
    dynamicNodes.forEach((n) => {
      panel.removeChild(n);
      n.destroy();
    });
    dynamicNodes = [];

    const topTier = getTopTier(winLines);
    const accent = TIER_ACCENT[topTier];
    const popupH = HEADER_H + winLines.length * LINE_H + FOOTER_H;
    const halfH = popupH / 2;

    // Background
    bg.clear();
    bg.roundRect(-POPUP_W / 2, -halfH, POPUP_W, popupH, 4);
    bg.fill({ color: COLORS.white });
    bg.stroke({ color: COLORS.black, width: TIER_BORDER_W[topTier] });

    // Header divider
    bg.moveTo(-POPUP_W / 2 + 28, -halfH + HEADER_H);
    bg.lineTo(POPUP_W / 2 - 28, -halfH + HEADER_H);
    bg.stroke({ color: COLORS.black, alpha: 0.12, width: 1 });

    // Footer divider
    bg.moveTo(-POPUP_W / 2 + 28, halfH - FOOTER_H);
    bg.lineTo(POPUP_W / 2 - 28, halfH - FOOTER_H);
    bg.stroke({ color: COLORS.black, alpha: 0.12, width: 1 });

    // Cup icon
    const add = (
      t: Text,
      x: number,
      y: number,
      anchorX: number,
      anchorY = 0.5,
    ): Text => {
      t.position.set(x, y);
      t.anchor.set(anchorX, anchorY);
      panel.addChild(t);
      dynamicNodes.push(t);
      return t;
    };

    add(
      new Text({
        text: "☕",
        style: new TextStyle({ fontSize: 22, fontFamily: "monospace" }),
      }),
      0,
      -halfH + 28,
      0.5,
    );

    // Win lines
    const lineStartY = -halfH + HEADER_H + LINE_H / 2 + 2;

    winLines.forEach((line, i) => {
      const y = lineStartY + i * LINE_H;

      add(
        new Text({
          text: `ROW ${line.row + 1}`,
          style: new TextStyle({
            fontSize: 13,
            fontFamily: "monospace",
            fill: COLORS.hint,
          }),
        }),
        -POPUP_W / 2 + 28,
        y,
        0,
      );

      add(
        new Text({
          text: TIER_LABEL[line.tier],
          style: new TextStyle({
            fontSize: 13,
            fontWeight: "bold",
            fontFamily: "monospace",
            fill: TIER_ACCENT[line.tier],
            letterSpacing: 2,
          }),
        }),
        0,
        y,
        0.5,
      );

      add(
        new Text({
          text: `+${TIER_PRIZE_MULT[line.tier]}×`,
          style: new TextStyle({
            fontSize: 13,
            fontFamily: "monospace",
            fill: COLORS.black,
          }),
        }),
        POPUP_W / 2 - 28,
        y,
        1,
      );
    });

    // Total
    const totalY = halfH - FOOTER_H / 2;

    add(
      new Text({
        text: "TOTAL",
        style: new TextStyle({
          fontSize: 13,
          fontFamily: "monospace",
          fill: COLORS.hint,
        }),
      }),
      -POPUP_W / 2 + 28,
      totalY,
      0,
    );

    add(
      new Text({
        text: `+${prize}×`,
        style: new TextStyle({
          fontSize: 20,
          fontWeight: "bold",
          fontFamily: "monospace",
          fill: accent,
          letterSpacing: 2,
        }),
      }),
      POPUP_W / 2 - 28,
      totalY,
      1,
    );

    // Animate in
    onDoneCallback = onDone;
    panel.scale.set(0);
    panel.alpha = 1;
    root.visible = true;
    phase = "in";
    elapsed = 0;
    window.addEventListener("keydown", onKeyDown);

    tickerFn = (t: Ticker) => {
      elapsed += t.deltaMS;

      if (phase === "in") {
        const p = Math.min(elapsed / IN_DURATION, 1);
        panel.scale.set(easeOutBounce(p));
        if (p >= 1) {
          panel.scale.set(1);
          phase = "hold";
          elapsed = 0;
        }
      } else if (phase === "hold") {
        if (elapsed >= HOLD_DURATION) {
          phase = "out";
          elapsed = 0;
        }
      } else if (phase === "out") {
        const p = Math.min(elapsed / OUT_DURATION, 1);
        panel.scale.set(1 - p * 0.15);
        panel.alpha = 1 - p;
        if (p >= 1) {
          root.visible = false;
          panel.alpha = 1;
          panel.scale.set(1);
          phase = "idle";
          window.removeEventListener("keydown", onKeyDown);
          Ticker.shared.remove(tickerFn!);
          tickerFn = null;
          onDoneCallback?.();
        }
      }
    };

    Ticker.shared.add(tickerFn);
  };

  return { root, show };
};
