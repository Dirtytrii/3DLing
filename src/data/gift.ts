import { assetURL } from "../lib/assets";

/** Personal letter: replace the preview body with the original when ready. */
export const gift = {
  title: "给你的生日礼物",
  wish: "愿新的一岁，喜欢的事都能慢慢发生。",
  letter: {
    title: "给铃宝",
    // Temporary layout preview; no generated personal letter.
    body: "亲爱的宝贝：\n  见字如面。\nxxx\n\nxxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx\n\nxxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx\n\nxxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx\n\nxxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx\n\nxxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx\n\nxxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx\n\nxxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx\n\nxxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx"
  },
  art: {
    intro: assetURL("/gift/intro-dream.png"),
    birthday: assetURL("/gift/birthday-dream.png"),
    quiet: assetURL("/gift/quiet-dream.png"),
    loading: assetURL("/gift/loading-dream.png"),
    paper: assetURL("/gift/paper-texture.png"),
    envelope: assetURL("/gift/envelope-front.png"),
    stationery: assetURL("/gift/envelope-stationery.png"),
    seal: assetURL("/gift/star-wax-seal.png"),
    paperEdge: assetURL("/gift/letter-stationery.png"),
    letterPaper: assetURL("/gift/letter-cotton-texture.png"),
    // Normalized wick location in the production plate; flame is independent.
    candle: { x: 0.676, y: 0.27 }
  }
} as const;
