import { Graphics, Text, TextStyle, Container } from "pixi.js";
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

export function createSymbolSprite(
  symbolIndex: number,
  symbol: string,
  symbolSize: number,
): Container {
  const container = new Container();

  const bg = new Graphics();
  // Safety not to pass undefined
  // ( 9 % 8 ) = 1
  const color = SYMBOL_COLORS[symbolIndex % SYMBOL_COLORS.length];

  bg.roundRect(2, 2, symbolSize - 4, symbolSize - 4, 12);
  bg.fill({ color, alpha: 0.85 });
  bg.stroke({ color: COLORS.white, alpha: 0.3, width: 2 });

  const label = new Text({
    text: symbol,
    style: new TextStyle({
      fontSize: Math.round(symbolSize * 0.5),
      align: "center",
    }),
  });
  label.anchor.set(0.5);
  label.x = symbolSize / 2;
  label.y = symbolSize / 2;

  container.addChild(bg);
  container.addChild(label);

  container.label = `symbol-${symbolIndex}`;

  return container;
}
