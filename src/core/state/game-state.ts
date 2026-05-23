import type { GameState } from '@shared/types';

export const STARTING_BALANCE = 1000;

export type AppState = {
  balance: number;
  spinCount: number;
  isAllIn: boolean;
  gameState: GameState;
  titleAnimationTime: number;
  startingBalance: number;
  muted: boolean;
};

export const createGameState = (startingBalance = STARTING_BALANCE, muted = false): AppState => ({
  balance: startingBalance,
  spinCount: 0,
  isAllIn: false,
  gameState: 'idle',
  titleAnimationTime: 0,
  startingBalance,
  muted,
});
