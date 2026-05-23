import { Container, Text, Ticker, Graphics, BlurFilter } from 'pixi.js';

import { STYLES } from '../../shared';

// 1. Definišemo jasan i strogo tipiziran interfejs za podatke o animaciji slova
interface LetterAnimationState {
  container: Container;
  textNode: Text;
  blurFilter: BlurFilter;
  isSpinning: boolean;
  spinProgress: number;
  startY: number;
}

export type TitleDisplay = {
  root: Container;
  triggerRandomSpin: () => void;
};

export const createTitleDisplay = (label: string): TitleDisplay => {
  const root = new Container();

  // Strogo tipiziran niz koji drži stanja za svako slovo
  const letters: LetterAnimationState[] = [];

  let currentX = 0;
  const spacing = STYLES.headerTitle.letterSpacing || 0;

  // Konstantne vrednosti za finu kalibraciju spina
  const LETTER_HEIGHT = STYLES.headerTitle.fontSize
    ? Number(STYLES.headerTitle.fontSize) * 1.5
    : 50;
  const SPIN_DURATION = 40; // Koliko frejmova traje spin

  for (let i = 0; i < label.length; i++) {
    const char = label[i];

    // Kreiramo bazični kontejner koji služi kao "prozor" za jedno slovo
    const letterWindow = new Container();

    const letterText = new Text({ text: char, style: STYLES.headerTitle });
    letterText.anchor.set(0.5);

    // Pozicioniramo slovo u centar njegovog prozora
    letterText.x = letterText.width / 2;
    letterText.y = LETTER_HEIGHT / 2;

    // Kreiramo filter za zamućenje tokom spina (daje taj brzi casino osećaj)
    const blurFilter = new BlurFilter();
    blurFilter.blurX = 0;
    blurFilter.blurY = 0;
    letterText.filters = [blurFilter];

    // Maskiramo prozor da se slovo ne vidi kada izleti van granica (odozgo/odozdo)
    const mask = new Graphics()
      .rect(0, 0, letterText.width, LETTER_HEIGHT)
      .fill({ color: 0xffffff });

    letterWindow.addChild(mask);
    letterWindow.mask = mask;
    letterWindow.addChild(letterText);

    // Pozicioniramo ceo prozor na ekranu
    letterWindow.x = currentX;
    currentX += letterText.width + spacing;

    root.addChild(letterWindow);

    // Smeštamo sve podatke u tipiziran objekat
    letters.push({
      container: letterWindow,
      textNode: letterText,
      blurFilter: blurFilter,
      isSpinning: false,
      spinProgress: 0,
      startY: LETTER_HEIGHT / 2,
    });
  }

  root.pivot.x = currentX / 2;
  root.pivot.y = LETTER_HEIGHT / 2;

  // --- SLOT SPIN LOGIKA ---
  const slotSpinUpdate = (ticker: Ticker) => {
    letters.forEach((letter) => {
      if (!letter.isSpinning) return;

      letter.spinProgress += 1 * ticker.deltaTime;

      // Simulacija prolaska kroz bubanj pomoću trigonometrije i pomeranja po Y osi
      const angle = (letter.spinProgress / SPIN_DURATION) * Math.PI * 4; // 2 puna kruga

      // Pomeramo Y poziciju slova naglo nadole i vraćamo je odozgo
      const offset = Math.sin(angle) * (LETTER_HEIGHT * 0.8);
      letter.textNode.y = letter.startY + offset;

      // Dodajemo vertikalni Motion Blur na osnovu brzine kretanja
      const speedFactor = Math.abs(Math.cos(angle));
      letter.blurFilter.blurY = speedFactor * 6;

      // Kraj animacije
      if (letter.spinProgress >= SPIN_DURATION) {
        letter.isSpinning = false;
        letter.spinProgress = 0;
        letter.textNode.y = letter.startY; // Vraćamo tačno u centar
        letter.blurFilter.blurY = 0; // Gasimo blur
      }
    });
  };

  Ticker.shared.add(slotSpinUpdate);

  // --- SPOLJNA FUNKCIJA ---
  const triggerRandomSpin = (): void => {
    const available = letters.filter((l) => !l.isSpinning);
    if (available.length === 0) return;

    const randomIndex = Math.floor(Math.random() * available.length);
    const target = available[randomIndex];

    target.isSpinning = true;
    target.spinProgress = 0;
  };

  root.on('destroyed', () => {
    Ticker.shared.remove(slotSpinUpdate);
    // Čistimo filtere iz memorije
    letters.forEach((l) => l.blurFilter.destroy());
  });

  return { root, triggerRandomSpin };
};
