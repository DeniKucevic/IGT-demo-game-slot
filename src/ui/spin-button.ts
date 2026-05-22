import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { COLORS } from "../shared/colors";

const BTN_WIDTH = 140;
const BTN_HEIGHT = 52;

export type SpinButton = {
  root: Container;
  setEnabled: (enabled: boolean) => void;
  width: number;
};

export const createSpinButton = (): SpinButton => {
  const root = new Container();
  root.eventMode = "static";
  root.cursor = "pointer";

  const bg = new Graphics();

  const label = new Text({
    text: "SPIN",
    style: new TextStyle({
      fontSize: 22,
      fill: COLORS.white,
      fontWeight: "bold",
      fontFamily: "monospace",
    }),
  });
  label.anchor.set(0.5);
  label.x = BTN_WIDTH / 2;
  label.y = BTN_HEIGHT / 2;
  label.eventMode = "none";

  const hint = new Text({
    text: "[Space]",
    style: new TextStyle({
      fontSize: 11,
      fill: COLORS.hint,
      fontFamily: "monospace",
    }),
  });
  hint.anchor.set(0.5, 0);
  hint.x = BTN_WIDTH / 2;
  hint.y = BTN_HEIGHT + 4;

  let enabled = true;

  const draw = (hover: boolean): void => {
    bg.clear();
    bg.roundRect(0, 0, BTN_WIDTH, BTN_HEIGHT, 12);
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
  root.addChild(label);
  root.addChild(hint);

  root.on("pointerover", () => {
    if (enabled) draw(true);
  });
  root.on("pointerout", () => draw(false));

  const setEnabled = (isEnabled: boolean): void => {
    enabled = isEnabled;
    root.eventMode = isEnabled ? "static" : "none";
    root.cursor = isEnabled ? "pointer" : "default";
    draw(false);
  };

  return { root, setEnabled, width: BTN_WIDTH };
};
