export type WinTier = 'small' | 'win' | 'bigwin' | 'jackpot';

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

export type GameState = 'idle' | 'spinning' | 'showing-win';

export type LobbySettings = {
  reelCount: number;
  rowCount: number;
  startingBalance: number;
  muted: boolean;
};
