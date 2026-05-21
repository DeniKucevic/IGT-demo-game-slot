import { Graphics, Text, TextStyle, Container, Sprite } from "pixi.js";
import { COLORS } from "../colors";

const SYMBOL_COLORS = [
  COLORS.espresso,
  COLORS.latte,
  COLORS.cappuccino,
  COLORS.mocha,
  COLORS.nespresso,
  COLORS.java,
  COLORS.americano,
  COLORS.turkish,
];

export const createSymbolSprite = (
  symbolIndex: number,
  symbol: string,
  symbolSize: number,
): Container => {
  const container = new Container();

  const bg = new Graphics();
  // Same symbols same color
  // Safety not to pass undefined ( 9 % 8 ) = 1
  const color = SYMBOL_COLORS[symbolIndex % SYMBOL_COLORS.length];

  bg.roundRect(2, 2, symbolSize - 4, symbolSize - 4, 12);
  bg.fill({ color, alpha: 0.85 });
  bg.stroke({ color: COLORS.white, alpha: 0.3, width: 2 });
  container.addChild(bg);

  const sprite = Sprite.from(symbol);
  sprite.width = symbolSize - 8;
  sprite.height = symbolSize - 8;
  sprite.x = 4;
  sprite.y = 4;
  container.addChild(sprite);

  container.label = `symbol-${symbolIndex}`;
  return container;
};
