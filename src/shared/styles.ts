import { TextStyle } from 'pixi.js';

import { COLORS } from './colors';

// Design tokens
export const BUTTON_HEIGHT = 52;

// Fonts
export const FONTS = {
  mono: 'monospace',
  title: 'Tahoma',
} as const;

export const STYLES = {
  // Button
  btnLabel: new TextStyle({
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: FONTS.mono,
    fill: COLORS.white,
  }),

  // Stat header
  statLabel: new TextStyle({
    fontSize: 10,
    fontFamily: FONTS.mono,
    fill: COLORS.hint,
    letterSpacing: 1,
  }),
  statValue: new TextStyle({
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: FONTS.mono,
    fill: COLORS.black,
  }),
  headerTitle: new TextStyle({
    fill: COLORS.gold,
    fontFamily: FONTS.title,
    fontSize: 30,
    fontStyle: 'italic',
    fontWeight: 'bold',
    letterSpacing: 8,
    stroke: {
      color: COLORS.black,
      width: 3,
    },
  }),

  backBtn: new TextStyle({
    fontSize: 11,
    fontFamily: FONTS.mono,
    fill: COLORS.white,
  }),

  // Lobby chip selector
  chipLabel: new TextStyle({
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: FONTS.mono,
    fill: COLORS.black,
  }),
  chipActive: new TextStyle({
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: FONTS.mono,
    fill: COLORS.white,
  }),

  // Bet selector cards
  cardName: new TextStyle({
    fontSize: 11,
    fontFamily: FONTS.mono,
    fill: COLORS.black,
    letterSpacing: 0.5,
  }),
  cardValue: new TextStyle({
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: FONTS.mono,
    fill: COLORS.black,
  }),

  // Small hint (spin button)
  hint: new TextStyle({
    fontSize: 11,
    fontFamily: FONTS.mono,
    fill: COLORS.hint,
  }),

  // Game over overlay
  overlayEmoji: new TextStyle({ fontSize: 36, fontFamily: 'monospace' }),
  overlayHeadline: new TextStyle({
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: FONTS.mono,
    fill: COLORS.black,
    letterSpacing: 2,
  }),
  overlaySub: new TextStyle({
    fontSize: 12,
    fontFamily: FONTS.mono,
    fill: COLORS.hint,
  }),

  // Win popup - static
  popupEmoji: new TextStyle({ fontSize: 22, fontFamily: 'monospace' }),
  popupRow: new TextStyle({
    fontSize: 13,
    fontFamily: FONTS.mono,
    fill: COLORS.hint,
  }),
  popupMult: new TextStyle({
    fontSize: 13,
    fontFamily: FONTS.mono,
    fill: COLORS.black,
  }),

  // Win popup - dynamic fill (tier color varies per call)
  popupTier: (fill: string): TextStyle =>
    new TextStyle({
      fontSize: 13,
      fontWeight: 'bold',
      fontFamily: FONTS.mono,
      fill,
      letterSpacing: 2,
    }),
  popupTotal: (fill: string): TextStyle =>
    new TextStyle({
      fontSize: 20,
      fontWeight: 'bold',
      fontFamily: FONTS.mono,
      fill,
      letterSpacing: 2,
    }),
};
