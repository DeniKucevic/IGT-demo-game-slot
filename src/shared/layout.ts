import { REEL_GAP, ROW_GAP, type GameConfig } from "./config";

const HEADER_H = 48;
const FOOTER_H = 108;
const H_PAD = 32;
const V_PAD = 20;

export type Layout = {
  symbolSize: number;
  reelW: number;
  reelH: number;
  reelsX: number;
  reelsY: number;
  controlsY: number;
};

export const computeLayout = (
  config: GameConfig,
  screenW: number,
  screenH: number,
): Layout => {
  const availW = screenW - H_PAD * 2;
  const availH = screenH - HEADER_H - FOOTER_H - V_PAD * 2;
  const symFromW = Math.floor(
    (availW - (config.reelCount - 1) * REEL_GAP) / config.reelCount,
  );
  const symFromH = Math.floor(
    (availH - (config.rowCount - 1) * ROW_GAP) / config.rowCount,
  );
  const symbolSize = Math.max(40, Math.min(symFromW, symFromH));
  const reelW = config.reelCount * symbolSize + (config.reelCount - 1) * REEL_GAP;
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
