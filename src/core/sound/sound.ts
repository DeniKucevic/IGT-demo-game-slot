import { sound } from '@pixi/sound';

import type { WinTier } from '@shared/types';

const SOUND_PATH = `${import.meta.env.BASE_URL}assets/sounds`;
const MUTED_KEY = 'slot-muted';
const LOBBY_VOL_FULL = 0.35;
const LOBBY_VOL_GAME = 0.05;

let soundsLoaded = false;
let muted = false;
let tabVisible = true;
let lobbyMusicActive = false;
let lobbyVol = LOBBY_VOL_FULL;
let spinSoundActive = false;

export const getSavedMuted = (): boolean => localStorage.getItem(MUTED_KEY) === 'true';

export const setMuted = (m: boolean): void => {
  muted = m;
  localStorage.setItem(MUTED_KEY, String(m));
  if (!soundsLoaded) return;
  if (m) sound.muteAll();
  else sound.unmuteAll();
};

const play = (alias: string, options?: { loop?: boolean; volume?: number }): void => {
  if (!soundsLoaded || !tabVisible) return;
  try {
    const result = sound.play(alias, options as Parameters<typeof sound.play>[1]);
    if (result instanceof Promise)
      result.catch((e) => console.warn(`[sound] "${alias}" failed:`, e));
  } catch (e) {
    console.warn(`[sound] "${alias}" failed:`, e);
  }
};

export const playClick = (): void => {
  if (!muted) play('click');
};

export const playSpin = (): void => {
  spinSoundActive = true;
  if (!muted) play('spin', { loop: true, volume: 0.6 });
};

export const stopSpin = (): void => {
  spinSoundActive = false;
  Promise.resolve().then(() => {
    try {
      sound.stop('spin');
    } catch {
      /* ignore */
    }
  });
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

export const playGameOver = (): void => {
  if (!muted) play('game-over');
};

export const playLobbyMusic = (): void => {
  if (muted) return;
  lobbyMusicActive = true;
  if (!soundsLoaded) return;
  if (sound.find('lobby')?.isPlaying) return;
  play('lobby', { loop: true, volume: lobbyVol });
};

export const stopLobbyMusic = (): void => {
  lobbyMusicActive = false;
  try {
    sound.stop('lobby');
  } catch {
    /* ignore */
  }
};

export const setLobbyVolume = (vol: number): void => {
  lobbyVol = vol;
  try {
    const s = sound.find('lobby');
    if (s) s.volume = vol;
  } catch {
    /* ignore */
  }
};

export const duckLobbyMusic = (): void => setLobbyVolume(LOBBY_VOL_GAME);
export const unduckLobbyMusic = (): void => setLobbyVolume(LOBBY_VOL_FULL);

export const loadSounds = (): void => {
  // iOS Safari requires AudioContext.resume() to be called synchronously inside a
  // gesture handler. A dynamic import delays past the gesture window and silences
  // all audio on iPhone. Resuming here (static import) fixes that.
  try {
    (sound.context as unknown as { audioContext?: AudioContext }).audioContext?.resume();
  } catch {
    /* ignore */
  }

  soundsLoaded = true;
  sound.disableAutoPause = true;
  if (muted) sound.muteAll();

  sound.add('lobby', `${SOUND_PATH}/lobby.wav`);
  sound.add('click', `${SOUND_PATH}/click.mp3`);
  sound.add('spin', `${SOUND_PATH}/spin.wav`);
  sound.add('no-win', `${SOUND_PATH}/no-win.wav`);
  sound.add('win', `${SOUND_PATH}/win.wav`);
  sound.add('big-win', `${SOUND_PATH}/big-win.wav`);
  sound.add('jackpot', `${SOUND_PATH}/jackpot.wav`);
  sound.add('game-over', `${SOUND_PATH}/game-over.wav`);

  if (lobbyMusicActive && !muted) {
    play('lobby', { loop: true, volume: lobbyVol });
  }

  // Pre-warm sounds that won't play on this gesture so their first play is instant.
  // lobby and click are excluded - they may play on this same gesture.
  // Sound.load() exists at runtime but is absent from the v6 type definitions.
  ['spin', 'no-win', 'win', 'big-win', 'jackpot', 'game-over'].forEach((alias) => {
    try {
      (sound.find(alias) as unknown as { load?: () => void } | undefined)?.load?.();
    } catch {
      /* ignore */
    }
  });
};

// When the tab hides, AudioContext suspends and rAF pauses (Ticker freezes).
// Stop all looping sounds now so they don't ghost-play on return, and gate
// one-shot plays via tabVisible so queued events don't fire on resume.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    tabVisible = false;
    try {
      sound.stop('spin');
    } catch {
      /* ignore */
    }
    try {
      sound.stop('lobby');
    } catch {
      /* ignore */
    }
    return;
  }

  // Tab visible again - re-enable plays, then restart continuous sounds
  tabVisible = true;
  if (spinSoundActive && !muted) play('spin', { loop: true, volume: 0.6 });
  if (lobbyMusicActive && !muted) play('lobby', { loop: true, volume: lobbyVol });
});
