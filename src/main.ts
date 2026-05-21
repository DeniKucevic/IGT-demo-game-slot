import { Application, Graphics } from "pixi.js";

import "./style.css";
import {
  DEFAULT_CONFIG,
  REEL_GAP,
  ROW_GAP,
  SYMBOLS,
  type GameConfig,
} from "./config";
import { createSymbolSprite } from "./game/symbols";
import { COLORS } from "./colors";

const HEADER_H = 48;
const FOOTER_H = 108;
const H_PAD = 32;
const V_PAD = 20;

// Makes you appreciate the layout engine....
const computeLayout = (
  config: GameConfig,
  screenW: number,
  screenH: number,
) => {
  // Total available
  const availW = screenW - H_PAD * 2;
  const availH = screenH - HEADER_H - FOOTER_H - V_PAD * 2;

  const symFromW = Math.floor(
    // available - total gaps / total
    (availW - (config.reelCount - 1) * REEL_GAP) / config.reelCount,
  );
  const symFromH = Math.floor(
    (availH - (config.rowCount - 1) * ROW_GAP) / config.rowCount,
  );
  const symbolSize = Math.max(40, Math.min(symFromW, symFromH));

  // Total sizes combined
  const reelW =
    config.reelCount * symbolSize + (config.reelCount - 1) * REEL_GAP;
  const reelH = config.rowCount * symbolSize + (config.rowCount - 1) * ROW_GAP;

  return {
    symbolSize,
    reelW,
    reelH,
    reelsX: Math.round((screenW - reelW) / 2),
    reelsY: Math.round(HEADER_H + V_PAD + (availH - reelH) / 2),
    controlsY: Math.round(screenH - FOOTER_H + 10),
  };
};

const app = new Application();
await app.init({
  resizeTo: window,
  backgroundColor: COLORS.background,
  antialias: true,
  autoDensity: true,
  resolution: window.devicePixelRatio || 1,
});
document.getElementById("app")!.appendChild(app.canvas);

// TODO: remove when done
const { reelW, reelH, reelsX, reelsY, controlsY } = computeLayout(
  DEFAULT_CONFIG,
  app.screen.width,
  app.screen.height,
);

const g = new Graphics();

// reels
g.rect(reelsX, reelsY, reelW, reelH);
g.stroke({ color: COLORS.debugRed, width: 2 });

// header
g.rect(0, 0, app.screen.width, HEADER_H);
g.stroke({ color: COLORS.debugBlue, width: 2 });

// footer
g.rect(0, app.screen.height - FOOTER_H, app.screen.width, FOOTER_H);
g.stroke({ color: COLORS.debugGreen, width: 2 });

// controls
g.circle(app.screen.width / 2, controlsY, 6);
g.stroke({ color: COLORS.debugYellow, width: 2 });

app.stage.addChild(g);

SYMBOLS.forEach((symbol, i) => {
  const sprite = createSymbolSprite(i, symbol, 50);
  sprite.x = 20 + i * 110;
  sprite.y = 200;
  app.stage.addChild(sprite);
});
