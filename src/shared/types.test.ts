import { describe, it, expect } from 'vitest';

import { getWinTier, TIER_PRIZE_MULT } from './types';

describe('getWinTier', () => {
  describe('5 reels', () => {
    it('2/5 → small (ratio 0.4)', () => expect(getWinTier(2, 5)).toBe('small'));
    it('3/5 → win (ratio 0.6)', () => expect(getWinTier(3, 5)).toBe('win'));
    it('4/5 → bigwin (ratio 0.8)', () => expect(getWinTier(4, 5)).toBe('bigwin'));
    it('5/5 → jackpot', () => expect(getWinTier(5, 5)).toBe('jackpot'));
  });

  describe('3 reels', () => {
    it('2/3 → win (ratio ~0.67)', () => expect(getWinTier(2, 3)).toBe('win'));
    it('3/3 → jackpot', () => expect(getWinTier(3, 3)).toBe('jackpot'));
  });

  describe('4 reels', () => {
    it('2/4 → win (ratio 0.5, boundary)', () => expect(getWinTier(2, 4)).toBe('win'));
    it('3/4 → bigwin (ratio 0.75, boundary)', () => expect(getWinTier(3, 4)).toBe('bigwin'));
    it('4/4 → jackpot', () => expect(getWinTier(4, 4)).toBe('jackpot'));
  });

  it('matchCount > reelCount → jackpot', () => expect(getWinTier(6, 5)).toBe('jackpot'));
});

describe('TIER_PRIZE_MULT', () => {
  it('multipliers are ordered small < win < bigwin < jackpot', () => {
    expect(TIER_PRIZE_MULT.small).toBeLessThan(TIER_PRIZE_MULT.win);
    expect(TIER_PRIZE_MULT.win).toBeLessThan(TIER_PRIZE_MULT.bigwin);
    expect(TIER_PRIZE_MULT.bigwin).toBeLessThan(TIER_PRIZE_MULT.jackpot);
  });

  it('all multipliers are positive integers', () => {
    for (const mult of Object.values(TIER_PRIZE_MULT)) {
      expect(mult).toBeGreaterThan(0);
      expect(Number.isInteger(mult)).toBe(true);
    }
  });
});
