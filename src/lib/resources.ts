import { scenes } from "../data/dreamScenes";
import { gift } from "../data/gift";
import { wallPhotos } from "../data/scenes";
import fonts from "../data/fonts.json";

// Keep the decoded images alive for the whole gift, including every gallery photo.
const images = new Map<string, Promise<HTMLImageElement>>();
const loadedFonts = new Map<string, Promise<void>>();
const completed = new Set<string>();
const TIMEOUT = 45000;

export function loadImage(src: string): Promise<HTMLImageElement> {
  const existing = images.get(src);
  if (existing) return existing;
  const pending = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    let finished = false;
    const finish = (error?: unknown) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer); image.onload = null; image.onerror = null;
      if (error) { images.delete(src); reject(error); }
      else resolve(image);
    };
    const timer = window.setTimeout(() => finish(new Error(`Image timed out: ${src}`)), TIMEOUT);
    image.decoding = "async";
    image.onload = () => { void image.decode().then(() => finish(), finish); };
    image.onerror = () => finish(new Error(`Image failed: ${src}`));
    image.src = src;
  });
  images.set(src, pending);
  return pending;
}

function loadFont(family: string, src: string): Promise<void> {
  if (!loadedFonts.has(src)) {
    const pending = (async () => {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), TIMEOUT);
      try {
        const response = await fetch(src, { signal: controller.signal });
        if (!response.ok) throw new Error(`Font failed: ${src}`);
        const face = new FontFace(family, await response.arrayBuffer(), { weight: "400 600", style: "normal", display: "swap" });
        await face.load();
        document.fonts.add(face);
      } finally { window.clearTimeout(timeout); }
    })().catch((error) => { loadedFonts.delete(src); throw error; });
    loadedFonts.set(src, pending);
  }
  return loadedFonts.get(src)!;
}

export const giftImageSources = [...new Set([
  gift.art.loading, gift.art.intro, gift.art.birthday, gift.art.quiet, gift.art.paper, gift.art.envelope,
  gift.art.stationery, gift.art.seal, gift.art.paperEdge, gift.art.letterPaper,
  ...scenes.flatMap((scene) => [scene.art.src, scene.toyDisplay!.imagePath, scene.mainPhoto, ...(scene.photoStack ?? [])]),
  ...wallPhotos.map((photo) => photo.src)
])];

const tasks = [
  { id: fonts.serif, label: "标题字体", run: () => loadFont("Ling Serif", fonts.serif) },
  { id: fonts.sans, label: "正文字体", run: () => loadFont("Ling Sans", fonts.sans) },
  ...giftImageSources.map((src) => ({ id: src, label: "回忆画面", run: () => loadImage(src) }))
];
export const resourceCount = tasks.length;
export interface ResourceProgress { completed: number; failed: string[]; done: boolean }

/** Bounded loading, genuine decode completion, and retryable failures. */
export async function prepareGiftResources(report: (progress: ResourceProgress) => void) {
  const failed: string[] = [];
  const pending = tasks.filter((task) => !completed.has(task.id));
  const update = (done = false) => report({ completed: completed.size, failed: [...failed], done });
  update();
  let cursor = 0;
  const worker = async () => {
    while (cursor < pending.length) {
      const task = pending[cursor++];
      try { await task.run(); completed.add(task.id); }
      catch { failed.push(task.label); }
      update();
    }
  };
  await Promise.all(Array.from({ length: Math.min(6, pending.length) }, worker));
  update(failed.length === 0);
}
