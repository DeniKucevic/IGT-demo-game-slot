import './style.css';
import '@pixi/layout';
import { initDevtools } from '@pixi/devtools';
import { Application } from 'pixi.js';

import { COLORS } from '@shared';
import type { GameConfig } from '@shared/config';

import { loadAssets, createGameState, createGameSession } from '@core';

import { createLobbyScreen, type LobbySettings } from '@components';

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

const runGame = async (): Promise<void> => {
  const settingsPromise = new Promise<LobbySettings>((resolve) => {
    const lobby = createLobbyScreen(app.screen.width, app.screen.height, (s) => {
      app.renderer.off('resize', lobby.resize);
      lobby.destroy();
      app.stage.removeChild(lobby.root);
      resolve(s);
    });
    app.stage.addChild(lobby.root);
    app.renderer.on('resize', lobby.resize);
  });

  const [lobbySettings] = await Promise.all([settingsPromise, loadAssets()]);

  const config: GameConfig = {
    reelCount: lobbySettings.reelCount,
    rowCount: lobbySettings.rowCount,
  };
  const state = createGameState(lobbySettings.startingBalance, lobbySettings.muted);

  createGameSession(config, state, app, runGame);
};

runGame();
