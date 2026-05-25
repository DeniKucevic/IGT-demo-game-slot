import type { WinTier } from './types';

export type { WinTier };

// Tier is relative to reelCount so it works for any configured reel count
// 3 reels: 2=win 3=jackpot | 5 reels: 2=small 3=win 4=bigwin 5=jackpot
export const getWinTier = (matchCount: number, reelCount: number): WinTier => {
  if (matchCount >= reelCount) return 'jackpot';
  const ratio = matchCount / reelCount;
  if (ratio >= 0.75) return 'bigwin';
  if (ratio >= 0.5) return 'win';
  return 'small';
};

export const TIER_PRIZE_MULT: Record<WinTier, number> = {
  small: 1,
  win: 5,
  bigwin: 10,
  jackpot: 40,
};
