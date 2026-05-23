import { Application, Assets } from "pixi.js";
import "./style.css";
import { DEFAULT_CONFIG, SYMBOLS, COLORS, computeLayout } from "./shared";
import { createReelGroup, createSpinButton, createWinPopup, createStatDisplay } from "./components";
import { getResponseData } from "./server/api";

const HEADER_MID_Y = 24; // vertical center of 48px header
const STARTING_BALANCE = 1000;
const BET = 10;

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
const { symbolSize, reelW, reelsX, reelsY, controlsY } = computeLayout(
  DEFAULT_CONFIG,
  app.screen.width,
  app.screen.height,
);

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

// ── Header stats ──
let balance = STARTING_BALANCE;
let spinCount = 0;

const balanceDisplay = createStatDisplay("BALANCE", "left");
balanceDisplay.root.x = 24;
balanceDisplay.root.y = HEADER_MID_Y;
balanceDisplay.setValue(balance);
app.stage.addChild(balanceDisplay.root);

const spinsDisplay = createStatDisplay("SPINS", "right");
spinsDisplay.root.x = app.screen.width - 24;
spinsDisplay.root.y = HEADER_MID_Y;
spinsDisplay.setValue(spinCount);
app.stage.addChild(spinsDisplay.root);

// ── Game loop ──
let spinning = false;

const runSpin = (): void => {
  if (spinning) return;
  spinning = true;
  balance -= BET;
  spinCount++;
  balanceDisplay.setValue(balance);
  spinsDisplay.setValue(spinCount);
  spinButton.setEnabled(false);
  reelGroup.clearHighlights();
  reelGroup.spin();
  const result = getResponseData(DEFAULT_CONFIG);
  reelGroup.land(result.reelPositions, () => {
    if (result.winningLines.length > 0) {
      balance += result.prize * BET;
      balanceDisplay.setValue(balance);
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
