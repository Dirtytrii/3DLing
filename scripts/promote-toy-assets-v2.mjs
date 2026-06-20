import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const pendingScenes = ["sence1", "sence2", "sence3", "sence4", "sence6"];

function fail(message) {
  console.error(`Toy asset promotion failed: ${message}`);
  process.exit(1);
}

function printHelp() {
  console.log(`Promote generated v2 toy sprites into the frontend scene data.

Usage:
  npm run promote:toys:v2

Options:
  --no-build    Skip npm run build after promotion.

The script first requires npm run validate:toys to pass. It will not open
toyDisplay.assetReady while the five true v2 PNGs are missing or invalid.
`);
}

function parseArgs(argv) {
  const options = { build: true };

  for (const arg of argv) {
    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }

    if (arg === "--no-build") {
      options.build = false;
      continue;
    }

    fail(`Unknown argument: ${arg}`);
  }

  return options;
}

function run(command, args, label) {
  console.log(`\n[${label}]`);
  const result = spawnSync(command, args, {
    cwd: root,
    env: process.env,
    stdio: "inherit"
  });

  if (result.error) {
    fail(`${label} could not start: ${result.error.message}`);
  }

  if (result.status !== 0) {
    fail(`${label} exited with status ${result.status}`);
  }
}

function runNodeScript(relativeScriptPath, args, label) {
  run(process.execPath, [path.join(root, relativeScriptPath), ...args], label);
}

function runBuild() {
  runNodeScript("node_modules/typescript/bin/tsc", [], "typecheck after toy promotion");
  runNodeScript("node_modules/vite/bin/vite.js", ["build"], "vite build after toy promotion");
}

function sceneBounds(source, sceneId) {
  const start = source.indexOf(`id: "${sceneId}"`);
  if (start === -1) fail(`${sceneId}: missing scene entry`);

  const currentIndex = Number(sceneId.replace("sence", ""));
  let end = -1;

  for (let nextIndex = currentIndex + 1; nextIndex <= 6; nextIndex += 1) {
    end = source.indexOf(`id: "sence${nextIndex}"`, start + 1);
    if (end !== -1) break;
  }

  if (end === -1) {
    end = source.indexOf("\n];", start);
  }

  if (end === -1) fail(`${sceneId}: cannot locate scene block end`);

  return { start, end };
}

function promoteSceneBlock(block, sceneId) {
  const expectedPath = `/toys/${sceneId}-toy-2d-v2.png`;

  if (!block.includes(`imagePath: "${expectedPath}"`)) {
    fail(`${sceneId}: toyDisplay.imagePath must point at ${expectedPath}`);
  }

  if (block.includes("assetReady: true")) {
    return { block, changed: false };
  }

  if (block.includes("assetReady: false")) {
    return {
      block: block.replace("assetReady: false", "assetReady: true"),
      changed: true
    };
  }

  const imageLine = `imagePath: "${expectedPath}",`;
  const nextBlock = block.replace(imageLine, `${imageLine}\n      assetReady: true,`);

  if (nextBlock === block) {
    fail(`${sceneId}: cannot insert assetReady`);
  }

  return { block: nextBlock, changed: true };
}

const options = parseArgs(process.argv.slice(2));

for (const sceneId of pendingScenes) {
  const assetPath = path.join(root, "public", "toys", `${sceneId}-toy-2d-v2.png`);
  if (!existsSync(assetPath)) {
    fail(`${sceneId}: missing ${assetPath}`);
  }
}

runNodeScript("scripts/validate-toy-assets.mjs", [], "validate toy sprites before promotion");

const scenesPath = path.join(root, "src", "data", "scenes.ts");
let scenesSource = readFileSync(scenesPath, "utf8");
let changed = false;

for (const sceneId of pendingScenes) {
  const { start, end } = sceneBounds(scenesSource, sceneId);
  const before = scenesSource.slice(0, start);
  const block = scenesSource.slice(start, end);
  const after = scenesSource.slice(end);
  const result = promoteSceneBlock(block, sceneId);

  if (result.changed) {
    changed = true;
    scenesSource = `${before}${result.block}${after}`;
  }
}

if (changed) {
  writeFileSync(scenesPath, scenesSource, "utf8");
  console.log("Updated src/data/scenes.ts: promoted sence1/2/3/4/6 assetReady to true.");
} else {
  console.log("No scene data changes needed: v2 toy sprites are already promoted.");
}

runNodeScript("scripts/validate-asset-gate.mjs", [], "validate asset gate after promotion");

if (options.build) {
  runBuild();
}

console.log("\nToy asset promotion finished.");
