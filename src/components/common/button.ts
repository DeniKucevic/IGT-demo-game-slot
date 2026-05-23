import { Container, Graphics, Text } from 'pixi.js';

import { COLORS, STYLES } from '../../shared';

export const BUTTON_HEIGHT = 52;

export type Button = {
  root: Container;
  setEnabled: (enabled: boolean) => void;
  width: number;
  height: number;
};

export const createButton = (label: string, width = 140): Button => {
  const root = new Container();
  root.eventMode = 'static';
  root.cursor = 'pointer';

  const bg = new Graphics();

  const text = new Text({ text: label, style: STYLES.btnLabel });
  text.anchor.set(0.5);
  text.x = width / 2;
  text.y = BUTTON_HEIGHT / 2;
  text.eventMode = 'none';

  let enabled = true;

  const draw = (hover: boolean): void => {
    bg.clear();
    bg.roundRect(0, 0, width, BUTTON_HEIGHT, 4);
    if (!enabled) {
      bg.fill({ color: COLORS.btnFillDisabled });
      bg.stroke({ color: COLORS.btnStrokeDisabled, width: 2 });
    } else {
      bg.fill({ color: hover ? COLORS.btnFillHover : COLORS.btnFill });
      bg.stroke({
        color: hover ? COLORS.btnStrokeHover : COLORS.btnStroke,
        width: 2,
      });
    }
  };

  draw(false);
  root.addChild(bg);
  root.addChild(text);

  root.on('pointerover', () => {
    if (enabled) draw(true);
  });
  root.on('pointerout', () => draw(false));

  const setEnabled = (isEnabled: boolean): void => {
    enabled = isEnabled;
    root.eventMode = isEnabled ? 'static' : 'none';
    root.cursor = isEnabled ? 'pointer' : 'default';
    draw(false);
  };

  return { root, setEnabled, width, height: BUTTON_HEIGHT };
};
