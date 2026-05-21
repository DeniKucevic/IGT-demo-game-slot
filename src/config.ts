export type GameConfig = {
  reelCount: number;
  rowCount: number;
};

export const MIN_REELS = 3;
export const MAX_REELS = 5;
export const MIN_ROWS = 2;
export const MAX_ROWS = 4;

export const SYMBOLS = [
  "espresso",
  "latte",
  "cappuccino",
  "mocha",
  "nespresso",
  "java", // I mean come on :D
  "americano",
  "turkish",
];

export const DEFAULT_CONFIG: GameConfig = {
  reelCount: 5,
  rowCount: 3,
};

export const BET_VALUES = [1, 5, 10, 25, 50, 100];

// Gap between reels and between symbol rows
// Symbol size scales with the window; gaps don't.
export const REEL_GAP = 8;
export const ROW_GAP = 8;
