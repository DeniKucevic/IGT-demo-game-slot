import { Application } from "pixi.js";

import "./style.css";

const app = new Application();
await app.init({
  resizeTo: window,
  backgroundColor: 0x090918,
  antialias: true,
  autoDensity: true,
  resolution: window.devicePixelRatio || 1,
});
document.getElementById("app")!.appendChild(app.canvas);
