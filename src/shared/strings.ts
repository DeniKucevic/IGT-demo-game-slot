import type { WinTier } from './types';

export const STRINGS = {
  header: {
    title: 'JACKPOT JAVA',
    balance: 'CREDIT',
    spins: 'SPINS',
  },
  betSelector: {
    names: ['TALL', 'GRANDE', 'VENTI', 'TRENTA'],
  },
  spinButton: {
    label: 'SPIN',
    hint: '[Space]',
  },
  gameOver: {
    emoji: '☕',
    headline: 'YOUR CUP IS EMPTY',
    sub: 'better luck next time',
    playAgain: 'PLAY AGAIN',
  },
  winPopup: {
    emoji: '☕',
    rowLabel: (n: number) => `ROW ${n}`,
    total: 'TOTAL',
  },
  lobby: {
    credit: 'STARTING CREDIT',
    reels: 'REELS',
    rows: 'ROWS',
    play: 'PLAY',
    soundOn: 'SOUND ON',
    soundOff: 'SOUND OFF',
  },
} as const;

export const TIER_LABEL: Record<WinTier, string> = {
  small: 'BUONO',
  win: 'OTTIMO',
  bigwin: 'MAGNIFICO',
  jackpot: 'LEGGENDARIO',
};
