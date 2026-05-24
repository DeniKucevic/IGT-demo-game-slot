import { sound } from '@pixi/sound';

import type { WinTier } from '@shared/types';

const SOUND_PATH = '/assets/sounds';

export const loadSounds = (): void => {
  // No preload — load on first play to avoid decode errors for missing/wrong-format files
  sound.add('click', `${SOUND_PATH}/click.mp3`);
  sound.add('spin', `${SOUND_PATH}/spin.wav`);
  sound.add('stop', `${SOUND_PATH}/stop.wav`);
  sound.add('no-win', `${SOUND_PATH}/no-win.wav`);
  sound.add('win', `${SOUND_PATH}/win.wav`);
  sound.add('big-win', `${SOUND_PATH}/big-win.wav`);
  sound.add('jackpot', `${SOUND_PATH}/jackpot.wav`);
  sound.add('lobby', `${SOUND_PATH}/lobby.wav`);
};

let muted = false;
let lobbyMusicActive = false;

export const setMuted = (m: boolean): void => {
  muted = m;
  if (m) sound.muteAll();
  else sound.unmuteAll();
};

const play = (alias: string, options?: { loop?: boolean; volume?: number }): void => {
  try {
    sound.play(alias, options as Parameters<typeof sound.play>[1]);
  } catch {
    // File missing or wrong format — fail silently
  }
};

export const playClick = (): void => {
  if (!muted) play('click');
};

export const playSpin = (): void => {
  if (!muted) play('spin', { loop: true, volume: 0.6 });
};

export const stopSpin = (): void => {
  try {
    sound.stop('spin');
  } catch { /* ignore */ }
};

export const playStop = (): void => {
  if (!muted) play('stop');
};

const WIN_TIER_SOUND: Record<WinTier, string> = {
  small: 'win',
  win: 'win',
  bigwin: 'big-win',
  jackpot: 'jackpot',
};

export const playResult = (tier: WinTier | null): void => {
  if (!muted) play(tier ? WIN_TIER_SOUND[tier] : 'no-win');
};

export const playLobbyMusic = (): void => {
  if (muted) return;
  lobbyMusicActive = true;
  if (sound.find('lobby')?.isPlaying) return;
  play('lobby', { loop: true, volume: 0.35 });
};

export const stopLobbyMusic = (): void => {
  lobbyMusicActive = false;
  try {
    sound.stop('lobby');
  } catch { /* ignore */ }
};

// AudioContext is suspended when the tab is hidden — restart lobby music on focus return
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && lobbyMusicActive && !muted) {
    try { sound.stop('lobby'); } catch { /* ignore */ }
    play('lobby', { loop: true, volume: 0.35 });
  }
});
