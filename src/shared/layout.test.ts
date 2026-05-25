import { describe, it, expect } from 'vitest';

import { REEL_GAP, ROW_GAP } from './layout';
import { computeLayout, HEADER_H, FOOTER_H } from './layout';

const cfg5x3 = { reelCount: 5, rowCount: 3 };
const cfg3x2 = { reelCount: 3, rowCount: 2 };

describe('computeLayout', () => {
  it('symbolSize is the min of width-constrained and height-constrained fits', () => {
    // availW=1216, symFromW=floor((1216-32)/5)=236
    // availH=504,  symFromH=floor((504-16)/3)=162
    // symbolSize = min(236,162) = 162
    const { symbolSize } = computeLayout(cfg5x3, 1280, 720);
    expect(symbolSize).toBe(162);
  });

  it('clamps symbolSize to minimum 40 on tiny screens', () => {
    const { symbolSize } = computeLayout(cfg5x3, 100, 100);
    expect(symbolSize).toBe(40);
  });

  it('reelW accounts for reel gaps', () => {
    const { symbolSize, reelW } = computeLayout(cfg5x3, 1280, 720);
    expect(reelW).toBe(symbolSize * 5 + (5 - 1) * REEL_GAP);
  });

  it('reelH accounts for row gaps', () => {
    const { symbolSize, reelH } = computeLayout(cfg5x3, 1280, 720);
    expect(reelH).toBe(symbolSize * 3 + (3 - 1) * ROW_GAP);
  });

  it('reelsX centers the reel group horizontally', () => {
    const { reelW, reelsX } = computeLayout(cfg5x3, 1280, 720);
    expect(reelsX).toBe(Math.round((1280 - reelW) / 2));
  });

  it('reelsY sits below the header with vertical padding', () => {
    const { reelsY } = computeLayout(cfg5x3, 1280, 720);
    expect(reelsY).toBeGreaterThan(HEADER_H);
  });

  it('controlsY sits inside the footer area', () => {
    const { controlsY } = computeLayout(cfg5x3, 1280, 720);
    expect(controlsY).toBeGreaterThanOrEqual(720 - FOOTER_H);
  });

  it('works correctly for 3x2 config', () => {
    const { symbolSize, reelW, reelH } = computeLayout(cfg3x2, 800, 600);
    expect(symbolSize).toBeGreaterThanOrEqual(40);
    expect(reelW).toBe(symbolSize * 3 + 2 * REEL_GAP);
    expect(reelH).toBe(symbolSize * 2 + 1 * ROW_GAP);
  });

  it('larger screen produces larger symbols than smaller screen', () => {
    const small = computeLayout(cfg5x3, 800, 600);
    const large = computeLayout(cfg5x3, 1920, 1080);
    expect(large.symbolSize).toBeGreaterThan(small.symbolSize);
  });
});
