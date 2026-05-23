import type { GameState } from '@shared/types';

export const STARTING_BALANCE = 1000;

export type AppState = {
  balance: number;
  spinCount: number;
  isAllIn: boolean;
  gameState: GameState;
  titleAnimationTime: number;
};

export const createGameState = (): AppState => ({
  balance: STARTING_BALANCE,
  spinCount: 0,
  isAllIn: false,
  gameState: 'idle',
  titleAnimationTime: 0,
});
