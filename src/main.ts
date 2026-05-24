import './style.css';
import '@pixi/layout';
import { initDevtools } from '@pixi/devtools';
import { Application } from 'pixi.js';

import { COLORS } from '@shared';
import type { GameConfig } from '@shared/config';

import {
  loadAssets,
  createGameState,
  createGameSession,
  loadSounds,
  setMuted,
  getSavedMuted,
  playLobbyMusic,
  stopLobbyMusic,
} from '@core';

import { createLobbyScreen, createLoadingScreen, type LobbySettings } from '@components';

// ── App ──
const app = new Application();
await app.init({
  resizeTo: window,
  backgroundColor: COLORS.background,
  autoDensity: true,
  resolution: window.devicePixelRatio || 1,
});
initDevtools({ app });
document.getElementById('app')!.appendChild(app.canvas);

// Defer sound init to first gesture — avoids the AudioContext autoplay warning
window.addEventListener('pointerdown', loadSounds, { once: true });

// Loading screen while assets fetch
const loading = createLoadingScreen(app.screen.width, app.screen.height);
app.stage.addChild(loading.root);
app.renderer.on('resize', loading.resize);
await loadAssets();
app.renderer.off('resize', loading.resize);
app.stage.removeChild(loading.root);
loading.root.destroy({ children: true });

const runGame = async (): Promise<void> => {
  const savedMuted = getSavedMuted();
  setMuted(savedMuted);

  const lobbySettings = await new Promise<LobbySettings>((resolve) => {
    const lobby = createLobbyScreen(
      app.screen.width,
      app.screen.height,
      (s) => {
        app.renderer.off('resize', lobby.resize);
        stopLobbyMusic();
        lobby.destroy();
        app.stage.removeChild(lobby.root);
        resolve(s);
      },
      (m) => {
        setMuted(m);
        if (m) stopLobbyMusic();
        else playLobbyMusic();
      },
      savedMuted,
    );
    app.stage.addChild(lobby.root);
    app.renderer.on('resize', lobby.resize);
    window.addEventListener('pointerdown', playLobbyMusic, { once: true });
  });

  window.removeEventListener('pointerdown', playLobbyMusic);

  setMuted(lobbySettings.muted);

  const config: GameConfig = {
    reelCount: lobbySettings.reelCount,
    rowCount: lobbySettings.rowCount,
  };
  const state = createGameState(lobbySettings.startingBalance, lobbySettings.muted);

  createGameSession(config, state, app, runGame);
};

runGame();
