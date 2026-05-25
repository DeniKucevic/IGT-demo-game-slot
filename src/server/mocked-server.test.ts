import { describe, it, expect } from 'vitest';

import { TIER_PRIZE_MULT } from '../shared/win-math';

import { evaluateLines } from './mocked-server';

// grid[reel][row] - reel-major order matching the server internals

describe('evaluateLines', () => {
  it('no matches → empty result with prize 0', () => {
    const grid = [
      [0, 1, 2], // reel 0
      [1, 2, 0], // reel 1 - row 0 differs from reel 0
      [2, 0, 1], // reel 2
    ];
    const { winningLines, prize } = evaluateLines(grid, 3, 3);
    expect(winningLines).toHaveLength(0);
    expect(prize).toBe(0);
  });

  it('all reels match on one row → jackpot', () => {
    const grid = [
      [5, 1, 2], // reel 0 - row 0 is symbol 5
      [5, 3, 4], // reel 1 - row 0 is symbol 5
      [5, 6, 7], // reel 2 - row 0 is symbol 5
    ];
    const { winningLines, prize } = evaluateLines(grid, 3, 3);
    expect(winningLines).toHaveLength(1);
    expect(winningLines[0]).toEqual({ row: 0, matchCount: 3, tier: 'jackpot' });
    expect(prize).toBe(TIER_PRIZE_MULT.jackpot);
  });

  it('match stops at first mismatch - does not skip gaps', () => {
    // 5 reels, row 0: reels 0-1 match, reel 2 breaks, reels 3-4 also match symbol but ignored
    const grid = [
      [3, 0], // reel 0
      [3, 0], // reel 1
      [9, 0], // reel 2 - mismatch on row 0
      [3, 0], // reel 3
      [3, 0], // reel 4
    ];
    const { winningLines } = evaluateLines(grid, 2, 5);
    const row0 = winningLines.find((l) => l.row === 0);
    expect(row0).toMatchObject({ matchCount: 2 }); // stopped at reel 2
  });

  it('multiple rows win simultaneously - prize is summed', () => {
    const grid = [
      [7, 2], // reel 0
      [7, 2], // reel 1
      [7, 2], // reel 2
    ];
    const { winningLines, prize } = evaluateLines(grid, 2, 3);
    expect(winningLines).toHaveLength(2);
    expect(prize).toBe(TIER_PRIZE_MULT.jackpot * 2);
  });

  it('single match (below MIN_MATCH_COUNT=2) is not counted', () => {
    // row 0: only reel 0 has symbol 5, reels 1-2 differ → matchCount stays at 1
    const grid = [
      [5, 1], // reel 0
      [9, 1], // reel 1
      [8, 1], // reel 2
    ];
    const { winningLines } = evaluateLines(grid, 2, 3);
    expect(winningLines.find((l) => l.row === 0)).toBeUndefined();
    // row 1 all match → 1 win
    expect(winningLines).toHaveLength(1);
  });

  it('partial match on 5-reel config produces correct tier', () => {
    // 5 reels, row 0: 3 match → ratio 3/5 = 0.6 → 'win'
    const grid = [
      [4, 0], // reel 0
      [4, 0], // reel 1
      [4, 0], // reel 2
      [9, 0], // reel 3 - breaks the run
      [4, 0], // reel 4
    ];
    const { winningLines } = evaluateLines(grid, 2, 5);
    expect(winningLines.find((l) => l.row === 0)).toMatchObject({ matchCount: 3, tier: 'win' });
  });
});
