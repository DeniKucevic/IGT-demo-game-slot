import { Container, Graphics, Text } from 'pixi.js';

import { COLORS, STRINGS, STYLES } from '../../shared';
import { BUTTON_HEIGHT } from '../common/button';

export const CHIP_H = 40;
export const CHIP_GAP = 8;
export const SECTION_GAP = 24;
export const LABEL_H = 16;
export const LABEL_CHIP_GAP = 10;

export type Chip = { root: Container; setActive: (a: boolean) => void };

export const createChip = (label: string, w: number): Chip => {
  const root = new Container();
  root.eventMode = 'static';
  root.cursor = 'pointer';

  const bg = new Graphics();
  root.addChild(bg);

  const txt = new Text({ text: label, style: STYLES.chipLabel });
  txt.anchor.set(0.5);
  txt.x = w / 2;
  txt.y = CHIP_H / 2;
  txt.eventMode = 'none';
  root.addChild(txt);

  let active = false;

  const draw = (hover: boolean): void => {
    bg.clear();
    bg.roundRect(0, 0, w, CHIP_H, 4);
    if (active) {
      bg.fill({ color: COLORS.black });
      bg.stroke({ color: COLORS.black, width: 2 });
      txt.style = STYLES.chipActive;
    } else if (hover) {
      bg.fill({ color: COLORS.chipHover });
      bg.stroke({ color: COLORS.black, width: 1.5 });
      txt.style = STYLES.chipLabel;
    } else {
      bg.fill({ color: COLORS.white });
      bg.stroke({ color: COLORS.hint, width: 1.5 });
      txt.style = STYLES.chipLabel;
    }
  };

  draw(false);
  root.on('pointerover', () => {
    if (!active) draw(true);
  });
  root.on('pointerout', () => {
    if (!active) draw(false);
  });

  const setActive = (a: boolean): void => {
    active = a;
    draw(false);
  };

  return { root, setActive };
};

export type ChipRow = { root: Container; getValue: () => number; height: number };

export const createChipRow = (
  label: string,
  values: number[],
  defaultIndex: number,
  rowW: number,
  onSelect?: () => void,
): ChipRow => {
  const root = new Container();
  let selectedIndex = defaultIndex;

  const labelTxt = new Text({ text: label, style: STYLES.statLabel });
  root.addChild(labelTxt);

  const chipW = Math.floor((rowW - CHIP_GAP * (values.length - 1)) / values.length);
  const chips: Chip[] = [];

  values.forEach((value, i) => {
    const chip = createChip(String(value), chipW);
    chip.root.position.set(i * (chipW + CHIP_GAP), LABEL_H + LABEL_CHIP_GAP);
    chip.setActive(i === defaultIndex);

    chip.root.on('pointertap', () => {
      chips[selectedIndex].setActive(false);
      selectedIndex = i;
      chips[i].setActive(true);
      onSelect?.();
    });

    chips.push(chip);
    root.addChild(chip.root);
  });

  return {
    root,
    getValue: () => values[selectedIndex],
    height: LABEL_H + LABEL_CHIP_GAP + CHIP_H,
  };
};

export type SoundToggle = { root: Container; getMuted: () => boolean };

export const createSoundToggle = (w: number, initialMuted = false): SoundToggle => {
  const root = new Container();
  root.eventMode = 'static';
  root.cursor = 'pointer';

  const bg = new Graphics();
  root.addChild(bg);

  let muted = initialMuted;

  const txt = new Text({
    text: initialMuted ? STRINGS.lobby.soundOff : STRINGS.lobby.soundOn,
    style: STYLES.btnLabel,
  });
  txt.anchor.set(0.5);
  txt.x = w / 2;
  txt.y = BUTTON_HEIGHT / 2;
  txt.eventMode = 'none';
  root.addChild(txt);

  const draw = (hover: boolean): void => {
    bg.clear();
    bg.roundRect(0, 0, w, BUTTON_HEIGHT, 4);
    bg.fill({ color: hover ? COLORS.btnFillHover : COLORS.btnFill });
    bg.stroke({ color: COLORS.btnStroke, width: 2 });
  };

  draw(false);
  root.on('pointerover', () => draw(true));
  root.on('pointerout', () => draw(false));
  root.on('pointertap', () => {
    muted = !muted;
    txt.text = muted ? STRINGS.lobby.soundOff : STRINGS.lobby.soundOn;
    draw(false);
  });

  return { root, getMuted: () => muted };
};
