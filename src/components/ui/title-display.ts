import { BlurFilter, Container, Graphics, Text, Ticker } from 'pixi.js';

import { STYLES } from '../../shared';

type LetterAnimationState = {
  textNode: Text;
  blurFilter: BlurFilter;
  isSpinning: boolean;
  spinProgress: number;
  startY: number;
};

export type TitleDisplay = {
  root: Container;
  triggerRandomSpin: () => void;
};

const SPIN_DURATION = 667;

export const createTitleDisplay = (label: string): TitleDisplay => {
  const root = new Container();
  const letters: LetterAnimationState[] = [];

  let currentX = 0;
  const spacing = STYLES.headerTitle.letterSpacing || 0;
  const LETTER_HEIGHT = STYLES.headerTitle.fontSize
    ? Number(STYLES.headerTitle.fontSize) * 1.5
    : 50;

  for (let i = 0; i < label.length; i++) {
    const char = label[i];

    const letterWindow = new Container();
    const letterText = new Text({ text: char, style: STYLES.headerTitle });
    letterText.anchor.set(0.5);
    letterText.x = letterText.width / 2;
    letterText.y = LETTER_HEIGHT / 2;

    const blurFilter = new BlurFilter();
    blurFilter.strengthX = 0;
    blurFilter.strengthY = 0;
    letterText.filters = [blurFilter];

    const mask = new Graphics()
      .rect(0, 0, letterText.width, LETTER_HEIGHT)
      .fill({ color: 0xffffff });
    letterWindow.addChild(mask);
    letterWindow.mask = mask;
    letterWindow.addChild(letterText);

    letterWindow.x = currentX;
    currentX += letterText.width + spacing;
    root.addChild(letterWindow);

    letters.push({
      textNode: letterText,
      blurFilter,
      isSpinning: false,
      spinProgress: 0,
      startY: LETTER_HEIGHT / 2,
    });
  }

  root.pivot.x = currentX / 2;
  root.pivot.y = LETTER_HEIGHT / 2;

  const slotSpinUpdate = (ticker: Ticker): void => {
    letters.forEach((letter) => {
      if (!letter.isSpinning) return;

      letter.spinProgress += ticker.deltaMS;
      const angle = (letter.spinProgress / SPIN_DURATION) * Math.PI * 4;
      letter.textNode.y = letter.startY + Math.sin(angle) * (LETTER_HEIGHT * 0.8);
      letter.blurFilter.strengthY = Math.abs(Math.cos(angle)) * 6;

      if (letter.spinProgress >= SPIN_DURATION) {
        letter.isSpinning = false;
        letter.spinProgress = 0;
        letter.textNode.y = letter.startY;
        letter.blurFilter.strengthY = 0;
      }
    });
  };

  Ticker.shared.add(slotSpinUpdate);

  const triggerRandomSpin = (): void => {
    const available = letters.filter((l) => !l.isSpinning);
    if (available.length === 0) return;
    const target = available[Math.floor(Math.random() * available.length)];
    target.isSpinning = true;
    target.spinProgress = 0;
  };

  root.on('destroyed', () => {
    Ticker.shared.remove(slotSpinUpdate);
    letters.forEach((l) => l.blurFilter.destroy());
  });

  return { root, triggerRandomSpin };
};
