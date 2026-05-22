import { SYMBOLS, type GameConfig } from "../config";
import type { ServerResponse, WinLine } from "../types";
import { getWinTier, TIER_PRIZE_MULT } from "../types";

// ── Helpers ──
const shuffleForReel = (symbols: number[], reelIndex: number): number[] => {
  const shuffled = [...symbols];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = (i * 7 + reelIndex * 13) % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// ── Win evaluation ──
const evaluateLines = (
  grid: number[][], // grid[reelIndex][rowIndex] = symbolIndex
  rowCount: number,
  reelCount: number,
): { winningLines: WinLine[]; prize: number } => {
  const winningLines: WinLine[] = [];
  let prize = 0;

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    const firstSymbol = grid[0][rowIndex];
    let matchCount = 1;

    for (let reelIndex = 1; reelIndex < reelCount; reelIndex++) {
      if (grid[reelIndex][rowIndex] === firstSymbol) {
        matchCount++;
      } else break;
    }

    if (matchCount >= 2) {
      const tier = getWinTier(matchCount, reelCount);
      winningLines.push({ row: rowIndex, matchCount, tier });
      prize += TIER_PRIZE_MULT[tier];
    }
  }

  return { winningLines, prize };
};

// ── Public API ──
export const getResponseData = (config: GameConfig): ServerResponse => {
  const { reelCount, rowCount } = config;

  // Each reel gets its own symbol order so rows are independent
  const reelOrders = Array.from({ length: reelCount }, (_, reelIndex) =>
    shuffleForReel(
      SYMBOLS.map((_, i) => i),
      reelIndex,
    ),
  );

  const reelPositions = Array.from({ length: reelCount }, () =>
    Math.floor(Math.random() * SYMBOLS.length),
  );

  const grid = reelOrders.map((order, reelIndex) =>
    Array.from(
      { length: rowCount },
      (_, rowOffset) =>
        order[(reelPositions[reelIndex] + rowOffset) % order.length],
    ),
  );

  const { winningLines, prize } = evaluateLines(grid, rowCount, reelCount);

  return { reelPositions, grid, winningLines, prize };
};
