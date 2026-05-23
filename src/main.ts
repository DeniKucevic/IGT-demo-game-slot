import { Application, Assets, Graphics } from "pixi.js";
import "./style.css";
import {
  DEFAULT_CONFIG,
  REEL_GAP,
  ROW_GAP,
  SYMBOLS,
  type GameConfig,
} from "./shared/config";
import { COLORS } from "./shared/colors";
import { createReelGroup } from "./game/reels";
import { getResponseData } from "./server/api";
import { createSpinButton } from "./ui/spin-button";
import { createWinPopup } from "./ui/win-popup";

const HEADER_H = 48;
const FOOTER_H = 108;
const H_PAD = 32;
const V_PAD = 20;

const computeLayout = (
  config: GameConfig,
  screenW: number,
  screenH: number,
) => {
  const availW = screenW - H_PAD * 2;
  const availH = screenH - HEADER_H - FOOTER_H - V_PAD * 2;
  const symFromW = Math.floor(
    (availW - (config.reelCount - 1) * REEL_GAP) / config.reelCount,
  );
  const symFromH = Math.floor(
    (availH - (config.rowCount - 1) * ROW_GAP) / config.rowCount,
  );
  const symbolSize = Math.max(40, Math.min(symFromW, symFromH));
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

// ── App ──
const app = new Application();
await app.init({
  resizeTo: window,
  backgroundColor: COLORS.background,
  antialias: true,
  autoDensity: true,
  resolution: window.devicePixelRatio || 1,
});
document.getElementById("app")!.appendChild(app.canvas);
await Assets.load(SYMBOLS.map((s) => ({ alias: s, src: `/symbols/${s}.png` })));

// ── Layout ──
const { symbolSize, reelW, reelH, reelsX, reelsY, controlsY } = computeLayout(
  DEFAULT_CONFIG,
  app.screen.width,
  app.screen.height,
);

//  Debug overlay (TODO: remove)
// const debug = new Graphics();
// debug.rect(reelsX, reelsY, reelW, reelH);
// debug.stroke({ color: COLORS.debugRed, width: 2 });
// debug.rect(0, 0, app.screen.width, HEADER_H);
// debug.stroke({ color: COLORS.debugBlue, width: 2 });
// debug.rect(0, app.screen.height - FOOTER_H, app.screen.width, FOOTER_H);
// debug.stroke({ color: COLORS.debugGreen, width: 2 });
// debug.circle(app.screen.width / 2, controlsY, 6);
// debug.stroke({ color: COLORS.debugYellow, width: 2 });
// app.stage.addChild(debug);

// ── Reels ──
const reelGroup = createReelGroup(DEFAULT_CONFIG, symbolSize);
reelGroup.root.x = reelsX;
reelGroup.root.y = reelsY;
app.stage.addChild(reelGroup.root);

// ── Spin button ──
const spinButton = createSpinButton();
spinButton.root.x = reelsX + reelW / 2 - spinButton.width / 2;
spinButton.root.y = controlsY;
app.stage.addChild(spinButton.root);

// ── Win popup ──
const winPopup = createWinPopup(app.screen.width, app.screen.height);
app.stage.addChild(winPopup.root);

// ── Game loop ──
let spinning = false;

const runSpin = (): void => {
  if (spinning) return;
  spinning = true;
  spinButton.setEnabled(false);
  reelGroup.clearHighlights();
  reelGroup.spin();
  const result = getResponseData(DEFAULT_CONFIG);
  reelGroup.land(result.reelPositions, () => {
    if (result.winningLines.length > 0) {
      reelGroup.highlightWins(result.winningLines);
      winPopup.show(result.winningLines, result.prize, () => {
        reelGroup.clearHighlights();
        spinning = false;
        spinButton.setEnabled(true);
      });
    } else {
      spinning = false;
      spinButton.setEnabled(true);
    }
  });
};

spinButton.root.on("pointertap", runSpin);
window.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    runSpin();
  }
});
