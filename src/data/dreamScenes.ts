import { scenes as originals, type StoryScene } from "./scenes";
import { assetURL } from "../lib/assets";

export interface DreamArt {
  src: string;
  /** Native art aspect ratio, and normalized contact point on its platform. */
  aspect: number;
  foot: [number, number];
  /** Visible toy height relative to the uncropped art height. */
  toyHeight: number;
}

export type DreamScene = StoryScene & { art: DreamArt };

const art: Record<string, DreamArt> = {
  sence1: { src: "/gift/sence1-dream.png", aspect: 1586 / 992, foot: [0.72, 0.77], toyHeight: 0.44 },
  sence2: { src: "/gift/sence2-dream.png", aspect: 1586 / 992, foot: [0.72, 0.77], toyHeight: 0.55 },
  sence3: { src: "/gift/sence3-dream.png", aspect: 1585 / 992, foot: [0.72, 0.77], toyHeight: 0.55 },
  sence4: { src: "/gift/sence4-dream.png", aspect: 1586 / 992, foot: [0.72, 0.77], toyHeight: 0.55 },
  sence5: { src: "/gift/sence5-dream.png", aspect: 1586 / 992, foot: [0.705, 0.79], toyHeight: 0.61 },
  sence6: { src: "/gift/sence6-dream.png", aspect: 1585 / 992, foot: [0.72, 0.75], toyHeight: 0.55 }
};

export const scenes: DreamScene[] = originals.map((scene) => ({
  ...scene,
  art: { ...art[scene.id], src: assetURL(art[scene.id].src) },
  toyDisplay: scene.toyDisplay ? { ...scene.toyDisplay, imagePath: assetURL(scene.toyDisplay.imagePath) } : undefined,
  backgroundAsset: {
    ...scene.backgroundAsset!,
    imagePath: assetURL(art[scene.id].src),
    position: "center center",
    opacity: 1,
    mask: { left: 0, mid: 0, right: 0 }
  }
}));

export const sections = [
  { id: "intro", title: "生日礼物", label: "序章" },
  ...scenes.map((scene) => ({ id: scene.id, title: scene.title, label: String(scene.order).padStart(2, "0") })),
  { id: "birthday", title: "许个愿吧", label: "生日" },
  { id: "letter", title: "给你的一封信", label: "来信" },
  { id: "wall", title: "照片墙", label: "回看" }
];
