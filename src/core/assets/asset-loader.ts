import { Assets } from 'pixi.js';

import { SYMBOLS, SYMBOLS_PATH, CUP_ASSET, ALL_IN_ASSET } from '@shared';

export const loadAssets = (): Promise<void> =>
  Assets.load([
    ...SYMBOLS.map((s) => ({ alias: s, src: `${SYMBOLS_PATH}/${s}.png` })),
    { alias: CUP_ASSET, src: CUP_ASSET },
    { alias: ALL_IN_ASSET, src: ALL_IN_ASSET },
  ]);
