import { Container, Text, TextStyle } from "pixi.js";
import { COLORS } from "../shared/colors";

export type StatDisplay = {
  root: Container;
  setValue: (value: string | number) => void;
};

export const createStatDisplay = (
  label: string,
  align: "left" | "right" = "left",
): StatDisplay => {
  const root = new Container();
  const ax = align === "right" ? 1 : 0;

  const labelText = new Text({
    text: label,
    style: new TextStyle({
      fontSize: 10,
      fontFamily: "monospace",
      fill: COLORS.hint,
      letterSpacing: 1,
    }),
  });
  labelText.anchor.set(ax, 1);
  labelText.y = -2;

  const valueText = new Text({
    text: "0",
    style: new TextStyle({
      fontSize: 18,
      fontFamily: "monospace",
      fontWeight: "bold",
      fill: COLORS.black,
    }),
  });
  valueText.anchor.set(ax, 0);
  valueText.y = 2;

  root.addChild(labelText);
  root.addChild(valueText);

  const setValue = (value: string | number): void => {
    valueText.text = String(value);
  };

  return { root, setValue };
};
