export type GameConfig = {
  reelCount: number;
  rowCount: number;
};

export const MIN_REELS = 3;
export const MAX_REELS = 5;
export const MIN_ROWS = 2;
export const MAX_ROWS = 4;
export const MIN_MATCH_COUNT = 2;
// Gap between reels and between symbol rows
// Symbol size scales with the window, gaps don't.
export const REEL_GAP = 8;
export const ROW_GAP = 8;

export const SYMBOLS = [
  'espresso',
  'latte',
  'cappuccino',
  'mocha',
  'nespresso',
  'java', // I mean come on :D
  'americano',
  'turkish',
];

export const REEL_STRIPS: number[][] = [
  [0, 5, 3, 7, 1, 4, 6, 2],
  [2, 0, 6, 3, 5, 1, 7, 4],
  [4, 7, 1, 5, 2, 6, 0, 3],
  [6, 3, 5, 0, 7, 2, 4, 1],
  [1, 4, 7, 2, 0, 3, 5, 6],
];

export const DEFAULT_CONFIG: GameConfig = {
  reelCount: 5,
  rowCount: 3,
};

export const BET_VALUES = [1, 5, 25, 100]; // TALL, GRANDE, VENTI, TRENTA

export const SYMBOLS_PATH = `${import.meta.env.BASE_URL}assets/symbols`;
export const CUP_ASSET = `${import.meta.env.BASE_URL}assets/ui/cup.png`;
export const ALL_IN_ASSET = `${import.meta.env.BASE_URL}assets/ui/all-in.png`;
