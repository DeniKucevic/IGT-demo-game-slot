export type WinTier = "small" | "win" | "bigwin" | "jackpot";

// Tier is relative to reelCount so it wrks for any configured reel count
// 3 reels: 2=win 3=jackpot | 5 reels: 2=small 3=win 4=bigwin 5=jackpot
export const getWinTier = (matchCount: number, reelCount: number): WinTier => {
  // All matched = jackpot
  if (matchCount >= reelCount) return "jackpot";
  const ratio = matchCount / reelCount;
  //TODO: do come back and adjust rations of wins
  if (ratio >= 0.75) return "bigwin";
  if (ratio >= 0.5) return "win";
  return "small";
};

// Win multiplier
// TODO: play with numbers after testing the gameplay
export const TIER_PRIZE_MULT: Record<WinTier, number> = {
  small: 1,
  win: 5,
  bigwin: 10,
  jackpot: 40,
};

// I think I want to stick with coffee theme so I guess starbucks sizes?
export const TIER_LABEL: Record<WinTier, string> = {
  small: "TALL",
  win: "GRANDE",
  bigwin: "VENTI!",
  jackpot: "☕ TRENTA!!!! ☕",
};

export type WinLine = {
  row: number;
  matchCount: number;
  tier: WinTier;
};

export type ServerResponse = {
  reelPositions: number[];
  winningLines: WinLine[];
  prize: number;
};

export type SpinResult = {
  response: ServerResponse;
  betMultiplier: number;
  totalPrize: number;
};

export type GameState = "idle" | "spinning" | "showing-win";
