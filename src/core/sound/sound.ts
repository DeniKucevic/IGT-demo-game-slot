import type { SoundLibrary } from '@pixi/sound';

import type { WinTier } from '@shared/types';

const SOUND_PATH = '/assets/sounds';
const MUTED_KEY = 'slot-muted';
const LOBBY_VOL_FULL = 0.35;
const LOBBY_VOL_GAME = 0.05;

// Populated on first user gesture via loadSounds() — dynamic import prevents
// @pixi/sound from creating an AudioContext before a gesture occurs.
let $sound: SoundLibrary | null = null;

let muted = false;
let tabVisible = true;
let lobbyMusicActive = false;
let lobbyVol = LOBBY_VOL_FULL;
let spinSoundActive = false;

export const getSavedMuted = (): boolean => localStorage.getItem(MUTED_KEY) === 'true';

export const setMuted = (m: boolean): void => {
  muted = m;
  localStorage.setItem(MUTED_KEY, String(m));
  if (!$sound) return;
  if (m) $sound.muteAll();
  else $sound.unmuteAll();
};

const play = (alias: string, options?: { loop?: boolean; volume?: number }): void => {
  if (!tabVisible || !$sound) return;
  try {
    $sound.play(alias, options as Parameters<typeof $sound.play>[1]);
  } catch {
    // File missing or wrong format — fail silently
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
  // Defer the stop so any internal @pixi/sound error cannot block the
  // playStop() call that immediately follows at the call site
  Promise.resolve().then(() => {
    try { $sound?.stop('spin'); } catch { /* ignore */ }
  });
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

export const playGameOver = (): void => {
  if (!muted) play('game-over');
};

export const playLobbyMusic = (): void => {
  if (muted) return;
  lobbyMusicActive = true;
  if (!$sound) return; // loadSounds will start music once the import resolves
  if ($sound.find('lobby')?.isPlaying) return;
  play('lobby', { loop: true, volume: lobbyVol });
};

export const stopLobbyMusic = (): void => {
  lobbyMusicActive = false;
  try {
    $sound?.stop('lobby');
  } catch {
    /* ignore */
  }
};

export const setLobbyVolume = (vol: number): void => {
  lobbyVol = vol;
  try {
    const s = $sound?.find('lobby');
    if (s) s.volume = vol;
  } catch {
    /* ignore */
  }
};

export const duckLobbyMusic = (): void => setLobbyVolume(LOBBY_VOL_GAME);
export const unduckLobbyMusic = (): void => setLobbyVolume(LOBBY_VOL_FULL);

export const loadSounds = (): void => {
  import('@pixi/sound').then(({ sound }) => {
    $sound = sound;
    // Disable the built-in auto-pause so our visibilitychange handler has full
    // control — otherwise @pixi/sound resumes stopped sounds on window refocus
    // https://github.com/pixijs/sound/issues/258
    $sound.disableAutoPause = true;
    if (muted) $sound.muteAll();

    $sound.add('lobby', `${SOUND_PATH}/lobby.wav`);
    $sound.add('click', `${SOUND_PATH}/click.mp3`);
    $sound.add('spin', `${SOUND_PATH}/spin.wav`);
    $sound.add('stop', `${SOUND_PATH}/stop.wav`);
    $sound.add('no-win', `${SOUND_PATH}/no-win.wav`);
    $sound.add('win', `${SOUND_PATH}/win.wav`);
    $sound.add('big-win', `${SOUND_PATH}/big-win.wav`);
    $sound.add('jackpot', `${SOUND_PATH}/jackpot.wav`);
    $sound.add('game-over', `${SOUND_PATH}/game-over.wav`);

    // playLobbyMusic may have been called on the same gesture before the import
    // resolved — if so, start the music now that $sound is ready
    if (lobbyMusicActive && !muted) {
      play('lobby', { loop: true, volume: lobbyVol });
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
      $sound?.stop('spin');
    } catch {
      /* ignore */
    }
    try {
      $sound?.stop('lobby');
    } catch {
      /* ignore */
    }
    return;
  }

  // Tab visible again — re-enable plays, then restart continuous sounds
  tabVisible = true;
  if (spinSoundActive && !muted) play('spin', { loop: true, volume: 0.6 });
  if (lobbyMusicActive && !muted) play('lobby', { loop: true, volume: lobbyVol });
});
