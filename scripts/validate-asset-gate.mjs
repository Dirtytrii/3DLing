import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const scenesSource = readFileSync(path.join(root, "src/data/scenes.ts"), "utf8");
const stageCanvasSource = readFileSync(path.join(root, "src/components/StageCanvas.tsx"), "utf8");

const pendingToyScenes = ["sence1", "sence2", "sence3", "sence4", "sence6"];
const rejectedPublicAssets = pendingToyScenes.flatMap((sceneId) => [
  `public/toys/${sceneId}-toy-2d.png`,
  `public/toys/${sceneId}-toy-2d.svg`
]);

const failures = [];

if (!stageCanvasSource.includes("display.assetReady === false")) {
  failures.push("StageCanvas is missing the assetReady false gate before sprite loading");
}

for (const asset of rejectedPublicAssets) {
  if (existsSync(path.join(root, asset))) {
    failures.push(`${asset}: rejected v1 toy asset must not be web-served`);
  }
}

for (const sceneId of pendingToyScenes) {
  const sceneStart = scenesSource.indexOf(`id: "${sceneId}"`);
  const nextSceneStart = scenesSource.indexOf(`id: "sence${Number(sceneId.replace("sence", "")) + 1}"`, sceneStart + 1);
  const sceneBlock = scenesSource.slice(sceneStart, nextSceneStart === -1 ? undefined : nextSceneStart);
  const expectedPath = `/toys/${sceneId}-toy-2d-v2.png`;
  const absoluteAssetPath = path.join(root, "public", "toys", `${sceneId}-toy-2d-v2.png`);
  const exists = existsSync(absoluteAssetPath);

  if (sceneStart === -1) {
    failures.push(`${sceneId}: missing scene entry`);
    continue;
  }

  if (!sceneBlock.includes(`imagePath: "${expectedPath}"`)) {
    failures.push(`${sceneId}: toyDisplay.imagePath must point at ${expectedPath}`);
  }

  if (exists && sceneBlock.includes("assetReady: false")) {
    failures.push(`${sceneId}: v2 sprite exists but scene is still gated with assetReady: false`);
  }

  if (!exists && !sceneBlock.includes("assetReady: false")) {
    failures.push(`${sceneId}: missing v2 sprite must stay gated with assetReady: false`);
  }
}

if (failures.length) {
  console.error(["Asset gate validation failed:", ...failures.map((failure) => `- ${failure}`)].join("\n"));
  process.exit(1);
}

console.log("Asset gate validation passed.");
