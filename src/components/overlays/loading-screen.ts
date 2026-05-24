import { Container, Graphics, Text } from 'pixi.js';

import { COLORS, STRINGS, STYLES } from '@shared';

export type LoadingScreen = {
  root: Container;
  resize: (w: number, h: number) => void;
};

export const createLoadingScreen = (w: number, h: number): LoadingScreen => {
  const root = new Container();

  const bg = new Graphics();
  root.addChild(bg);

  const title = new Text({ text: STRINGS.header.title, style: STYLES.headerTitle });
  title.anchor.set(0.5);
  root.addChild(title);

  const label = new Text({ text: 'LOADING...', style: STYLES.statLabel });
  label.anchor.set(0.5);
  root.addChild(label);

  const layout = (sw: number, sh: number): void => {
    bg.clear();
    bg.rect(0, 0, sw, sh).fill({ color: COLORS.background });
    title.position.set(Math.round(sw / 2), Math.round(sh / 2) - 18);
    label.position.set(Math.round(sw / 2), Math.round(sh / 2) + 16);
  };

  layout(w, h);

  return { root, resize: layout };
};
