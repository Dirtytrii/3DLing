import { assetURL } from "../lib/assets";

/** Personal letter: paste the original here, preserving its paragraphs. */
export const gift = {
  title: "给你的生日礼物",
  wish: "愿新的一岁，喜欢的事都能慢慢发生。",
  letter: { title: "给你的一封信", body: "" },
  art: {
    intro: assetURL("/gift/intro-dream.png"),
    birthday: assetURL("/gift/birthday-dream.png"),
    quiet: assetURL("/gift/quiet-dream.png"),
    loading: assetURL("/gift/loading-dream.png"),
    paper: assetURL("/gift/paper-texture.png"),
    envelope: assetURL("/gift/envelope-front.png"),
    // Normalized wick location in the production plate; flame is independent.
    candle: { x: 0.676, y: 0.27 }
  }
} as const;
