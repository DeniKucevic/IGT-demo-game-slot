import { Container, Graphics, Text } from 'pixi.js';

import { COLORS, FONTS, STRINGS, STYLES } from '../../shared';
import { BUTTON_HEIGHT, createButton } from '../common/button';

const PANEL_W = 480;
const CHIP_H = 40;
const CHIP_GAP = 8;
const SECTION_GAP = 24;
const LABEL_H = 16;
const LABEL_CHIP_GAP = 10;
const PAD = 24;
const INNER_W = PANEL_W - PAD * 2;

export type LobbySettings = {
  reelCount: number;
  rowCount: number;
  startingBalance: number;
  muted: boolean;
};

export type LobbyScreen = {
  root: Container;
  destroy: () => void;
  resize: (w: number, h: number) => void;
};

type Chip = { root: Container; setActive: (a: boolean) => void };

const createChip = (label: string, w: number): Chip => {
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

type ChipRow = { root: Container; getValue: () => number; height: number };

const createChipRow = (
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

type SoundToggle = { root: Container; getMuted: () => boolean };

const createSoundToggle = (w: number, initialMuted = false): SoundToggle => {
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

export const createLobbyScreen = (
  screenW: number,
  screenH: number,
  onPlay: (settings: LobbySettings) => void,
  onMuteToggle?: (muted: boolean) => void,
  initialMuted = false,
  onInteract?: () => void,
): LobbyScreen => {
  const root = new Container();

  const screenBg = new Graphics();
  screenBg.eventMode = 'static';
  root.addChild(screenBg);

  const panel = new Container();
  root.addChild(panel);

  const panelBg = new Graphics();
  panel.addChild(panelBg);

  let curY = PAD;

  // Title
  const titleTxt = new Text({ text: STRINGS.header.title, style: STYLES.headerTitle });
  titleTxt.anchor.set(0.5, 0);
  titleTxt.x = PANEL_W / 2;
  titleTxt.y = curY;
  panel.addChild(titleTxt);
  curY += Math.round(titleTxt.height) + 12;

  // Divider
  panel.addChild(new Graphics().rect(PAD, curY, INNER_W, 1).fill({ color: COLORS.hint }));
  curY += 1 + 20;

  // Credit label (HTML input will be positioned here)
  const creditLabelTxt = new Text({ text: STRINGS.lobby.credit, style: STYLES.statLabel });
  creditLabelTxt.position.set(PAD, curY);
  panel.addChild(creditLabelTxt);
  const creditInputOffsetY = curY + LABEL_H + LABEL_CHIP_GAP;
  curY += LABEL_H + LABEL_CHIP_GAP + CHIP_H + SECTION_GAP;

  // Reels row
  const reelsRow = createChipRow(STRINGS.lobby.reels, [3, 4, 5], 2, INNER_W, onInteract);
  reelsRow.root.position.set(PAD, curY);
  panel.addChild(reelsRow.root);
  curY += reelsRow.height + SECTION_GAP;

  // Rows row
  const rowsRow = createChipRow(STRINGS.lobby.rows, [2, 3, 4], 1, INNER_W, onInteract);
  rowsRow.root.position.set(PAD, curY);
  panel.addChild(rowsRow.root);
  curY += rowsRow.height + SECTION_GAP;

  // Bottom: sound toggle + play button
  const soundBtnW = Math.round(INNER_W * 0.38);
  const playBtnW = INNER_W - soundBtnW - CHIP_GAP;

  const soundToggle = createSoundToggle(soundBtnW, initialMuted);
  soundToggle.root.on('pointertap', () => onMuteToggle?.(soundToggle.getMuted()));
  soundToggle.root.position.set(PAD, curY);
  panel.addChild(soundToggle.root);

  const playBtn = createButton(STRINGS.lobby.play, playBtnW);
  playBtn.root.position.set(PAD + soundBtnW + CHIP_GAP, curY);
  panel.addChild(playBtn.root);
  curY += BUTTON_HEIGHT + 16;

  panel.addChild(new Graphics().rect(PAD, curY, INNER_W, 1).fill({ color: COLORS.hint }));
  curY += 1 + 8;

  const creditsOffsetY = curY;
  curY += 14 + 12;

  const panelH = curY;

  panelBg.roundRect(0, 0, PANEL_W, panelH, 8);
  panelBg.fill({ color: COLORS.white });
  panelBg.stroke({ color: COLORS.black, width: 3 });

  // HTML credits overlay
  const makeLink = (text: string, href: string): HTMLAnchorElement => {
    const a = document.createElement('a');
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = text;
    Object.assign(a.style, { color: COLORS.hint, textDecoration: 'none' });
    a.addEventListener('mouseenter', () => {
      a.style.color = COLORS.black;
      a.style.textDecoration = 'underline';
    });
    a.addEventListener('mouseleave', () => {
      a.style.color = COLORS.hint;
      a.style.textDecoration = 'none';
    });
    return a;
  };

  const creditsEl = document.createElement('div');
  Object.assign(creditsEl.style, {
    position: 'fixed',
    fontFamily: FONTS.mono,
    color: COLORS.hint,
    textAlign: 'center',
    zIndex: '10',
    pointerEvents: 'auto',
    lineHeight: '1',
  });
  creditsEl.appendChild(makeLink('Denis Kucevic', 'https://deniskucevic.com'));
  creditsEl.appendChild(document.createTextNode(' · '));
  creditsEl.appendChild(makeLink('LinkedIn', 'https://www.linkedin.com/in/denis-kucevic'));
  document.body.appendChild(creditsEl);

  // HTML input for credit (positioned over the canvas)
  const creditInput = document.createElement('input');
  creditInput.type = 'text';
  creditInput.inputMode = 'numeric';
  creditInput.pattern = '[0-9]*';
  creditInput.maxLength = 6;
  creditInput.value = '1000';
  creditInput.placeholder = '100 – 999999';
  Object.assign(creditInput.style, {
    position: 'fixed',
    fontFamily: FONTS.mono,
    fontWeight: 'bold',
    color: COLORS.black,
    background: COLORS.white,
    border: `1.5px solid ${COLORS.hint}`,
    borderRadius: '4px',
    padding: '0 12px',
    boxSizing: 'border-box',
    outline: 'none',
    zIndex: '10',
  });

  const positionPanel = (w: number, h: number): void => {
    screenBg.clear();
    screenBg.rect(0, 0, w, h).fill({ color: COLORS.background });
    const panelScale = Math.min(1, (w - 32) / PANEL_W);
    panel.scale.set(panelScale);
    const scaledW = PANEL_W * panelScale;
    const scaledH = panelH * panelScale;
    const px = Math.round(w / 2 - scaledW / 2);
    const py = Math.max(8, Math.round(h / 2 - scaledH / 2));
    panel.position.set(px, py);
    creditInput.style.left = `${px + PAD * panelScale}px`;
    creditInput.style.top = `${py + creditInputOffsetY * panelScale}px`;
    creditInput.style.width = `${INNER_W * panelScale}px`;
    creditInput.style.height = `${CHIP_H * panelScale}px`;
    creditInput.style.fontSize = `${Math.round(15 * panelScale)}px`;
    creditsEl.style.left = `${px}px`;
    creditsEl.style.top = `${py + creditsOffsetY * panelScale}px`;
    creditsEl.style.width = `${PANEL_W * panelScale}px`;
    creditsEl.style.fontSize = `${Math.round(11 * panelScale)}px`;
  };

  positionPanel(screenW, screenH);
  // Block non-digit keystrokes
  creditInput.addEventListener('keydown', (e) => {
    const nav = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (nav.includes(e.key) || e.ctrlKey || e.metaKey) return;
    if (!/^\d$/.test(e.key)) e.preventDefault();
  });
  // Strip any non-digits that slip through (e.g. paste)
  creditInput.addEventListener('input', () => {
    creditInput.value = creditInput.value.replace(/\D/g, '');
  });
  creditInput.addEventListener('focus', () => {
    creditInput.style.borderColor = COLORS.black;
  });
  creditInput.addEventListener('blur', () => {
    creditInput.style.borderColor = COLORS.hint;
    const v = parseInt(creditInput.value, 10);
    if (isNaN(v) || v < 1) creditInput.value = '100';
    else if (v > 999_999) creditInput.value = '999999';
  });
  document.body.appendChild(creditInput);

  const getCreditValue = (): number => {
    const v = parseInt(creditInput.value, 10);
    if (isNaN(v) || v < 1) return 100;
    return Math.min(v, 999_999);
  };

  playBtn.root.on('pointertap', () => {
    onPlay({
      reelCount: reelsRow.getValue(),
      rowCount: rowsRow.getValue(),
      startingBalance: getCreditValue(),
      muted: soundToggle.getMuted(),
    });
  });

  const destroy = (): void => {
    creditInput.remove();
    creditsEl.remove();
  };

  const resize = (w: number, h: number): void => positionPanel(w, h);

  return { root, destroy, resize };
};
