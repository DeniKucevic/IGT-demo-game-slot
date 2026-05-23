import { Container, Text } from 'pixi.js';

import { STYLES } from '../../shared';

export type StatDisplay = {
  root: Container;
  setValue: (value: string | number) => void;
};

export const createStatDisplay = (label: string, align: 'left' | 'right' = 'left'): StatDisplay => {
  const root = new Container();
  const ax = align === 'right' ? 1 : 0;

  const labelText = new Text({ text: label, style: STYLES.statLabel });
  labelText.anchor.set(ax, 1);
  labelText.y = -2;

  const valueText = new Text({ text: '0', style: STYLES.statValue });
  valueText.anchor.set(ax, 0);
  valueText.y = 2;

  root.addChild(labelText);
  root.addChild(valueText);

  return {
    root,
    setValue: (value) => {
      valueText.text = String(value);
    },
  };
};
