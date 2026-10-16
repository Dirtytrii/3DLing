import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import net from "node:net";
import path from "node:path";
import assert from "node:assert/strict";
import { scenes } from "../src/data/scenes.ts";

// Native IAB smoke check comes first. This suite adds network fault injection,
// repeatable desktop viewports and frame samples unavailable in that smoke check.
const outDir = path.join(tmpdir(), `3dling-loading-qa-${Date.now()}`);
mkdirSync(outDir, { recursive: true });
console.log(`Evidence: ${outDir}`);
const socket = net.createServer();
await new Promise((resolve) => socket.listen(0, "127.0.0.1", resolve));
const port = socket.address().port;
await new Promise((resolve) => socket.close(resolve));
const url = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, [path.resolve("node_modules/vite/bin/vite.js"), "--host", "127.0.0.1", "--port", String(port), "--strictPort"], { stdio: "pipe", windowsHide: true });
let diagnostics = "";
server.stderr.on("data", (chunk) => diagnostics += chunk);
for (let attempt = 0; attempt < 100; attempt++) {
  if (server.exitCode !== null) throw new Error(diagnostics);
  try { if ((await fetch(url)).ok) break; } catch {}
  if (attempt === 99) throw new Error(`Vite did not start: ${diagnostics}`);
  await new Promise((resolve) => setTimeout(resolve, 100));
}
const chrome = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const browser = await chromium.launch({ executablePath: existsSync(chrome) ? chrome : undefined, headless: true });
const sizes = [{ width: 1440, height: 900 }, { width: 1440, height: 800 }, { width: 1280, height: 720 }];
const optimized = JSON.parse(readFileSync("src/data/optimizedAssets.json", "utf8"));
const fonts = JSON.parse(readFileSync("src/data/fonts.json", "utf8"));
const photos = [...new Set(scenes.flatMap((scene) => [scene.mainPhoto, ...(scene.photoStack ?? [])]))];
const expected = [...Object.values(optimized), ...Object.values(fonts), ...photos];
const heldPhoto = scenes[5].photoStack.at(-1);
const records = [];
const errors = [];
const isAsset = (request) => /\/(photos|optimized|fonts)\//.test(new URL(request.url()).pathname);
const ready = (page) => page.locator('[data-app-ready="true"]').waitFor({ timeout: 60000 });
const state = (page) => page.evaluate(() => ({
  ready: document.querySelector(".app-shell").dataset.appReady,
  percent: Number(document.querySelector('[role="progressbar"]')?.getAttribute("aria-valuenow")),
  inert: document.querySelector(".gift-content").inert,
  locked: getComputedStyle(document.documentElement).overflowY === "hidden",
  scroll: scrollY
}));

try {
  for (const viewport of sizes) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    const requests = [];
    page.on("request", (request) => { if (isAsset(request)) requests.push(new URL(request.url()).pathname); });
    let release;
    const barrier = new Promise((resolve) => release = resolve);
    await page.route(`**${heldPhoto}`, async (route) => { await barrier; await route.continue(); });
    await page.goto(`${url}/#intro`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Number(document.querySelector('[role="progressbar"]')?.getAttribute("aria-valuenow")) >= 75, null, { timeout: 60000 }).catch(async (error) => {
      console.error("Loading barrier state", await state(page), requests);
      await page.screenshot({ path: path.join(outDir, "loading-barrier-failure.png") });
      throw error;
    });
    await page.waitForTimeout(600);
    const waiting = await state(page);
    assert.equal(waiting.ready, "false"); assert.equal(waiting.inert, true); assert.equal(waiting.locked, true);
    assert.ok(waiting.percent < 100, "Last offscreen gallery image holds the real gate");
    await page.mouse.wheel(0, 2500); await page.keyboard.press("Space"); await page.waitForTimeout(150);
    assert.equal((await state(page)).scroll, waiting.scroll, "Wheel and keyboard cannot reveal an unready scene");
    await page.screenshot({ path: path.join(outDir, `${viewport.width}x${viewport.height}-loading.png`) });
    release(); await ready(page);
    assert.equal(await page.locator(".loading-screen").count(), 0);
    assert.equal((await state(page)).inert, false);
    assert.equal(await page.locator(".stage-canvas").getAttribute("data-prepared-textures"), "6");
    const fontState = await page.evaluate(() => [...document.fonts].filter((face) => face.family.startsWith("Ling ")).map((face) => ({ family: face.family, state: face.status })));
    assert.equal(fontState.length, 2); assert.ok(fontState.every((face) => face.state === "loaded"));
    for (const asset of expected) assert.ok(requests.includes(asset), `Prepared complete experience asset: ${asset}`);
    const preparedRequests = requests.length;
    // Real rapid wheel navigation, followed by all gallery controls and hash jumps.
    for (let i = 0; i < 7; i++) { await page.mouse.wheel(0, viewport.height); await page.waitForTimeout(80); }
    for (const scene of scenes) {
      await page.evaluate((id) => { location.hash = id; }, scene.id);
      await page.waitForFunction((id) => {
        const stage = document.querySelector(".stage-canvas");
        return document.querySelector(".app-shell").dataset.activeSection === id && stage.dataset.spriteScene === id && stage.dataset.spriteLoaded === "true";
      }, scene.id);
      for (let i = 1; i < new Set([scene.mainPhoto, ...(scene.photoStack ?? [])]).size; i++) {
        await page.locator(`#${scene.id}`).getByRole("button", { name: /下一张照片/ }).click();
        assert.equal(await page.locator(`#${scene.id} [data-photo-main]`).evaluate((image) => image.complete && image.naturalWidth > 0), true);
      }
    }
    await page.evaluate(() => { location.hash = "sence5"; });
    await page.waitForFunction(() => document.querySelector(".stage-canvas").dataset.spriteScene === "sence5" && document.querySelector(".stage-canvas").dataset.spriteTransition === "settled");
    await page.waitForTimeout(900);
    assert.equal(requests.length, preparedRequests, "Fast scroll, every gallery photo and scene need no new resource requests");
    assert.equal(await page.locator("canvas").count(), 1);
    await page.screenshot({ path: path.join(outDir, `${viewport.width}x${viewport.height}-sence5-refined.png`) });
    records.push({ viewport, waiting, assetRequests: preparedRequests, fontState });
    console.log(`PASS ${viewport.width}x${viewport.height}: last gallery image gate, locked scroll, all assets/fonts, six warm textures, fast scroll and all galleries`);
    await context.close();
  }

  const fontContext = await browser.newContext({ viewport: sizes[0] });
  const fontPage = await fontContext.newPage();
  let releaseFont;
  const fontBarrier = new Promise((resolve) => releaseFont = resolve);
  await fontPage.route(`**${fonts.serif}`, async (route) => { await fontBarrier; await route.continue(); });
  await fontPage.goto(`${url}/#sence6`, { waitUntil: "domcontentloaded" });
  await fontPage.waitForFunction(() => Number(document.querySelector('[role="progressbar"]')?.getAttribute("aria-valuenow")) >= 75, null, { timeout: 60000 });
  assert.equal((await state(fontPage)).ready, "false", "Font is part of the gate");
  releaseFont(); await ready(fontPage);
  assert.equal(await fontPage.locator(".app-shell").getAttribute("data-active-section"), "sence6", "Direct hash survives the loading screen");
  assert.ok(Math.abs((await fontPage.locator("#sence6").boundingBox()).y) < 2);
  console.log("PASS held font and direct final-memory hash");
  await fontContext.close();

  for (const failedAsset of [optimized["/toys/sence2-toy-2d-v2.png"], fonts.sans]) {
    const context = await browser.newContext({ viewport: sizes[2], reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.route(`**${failedAsset}`, (route) => route.abort());
    await page.goto(`${url}/#birthday`, { waitUntil: "domcontentloaded" });
    await page.locator('[data-loading-state="error"]').waitFor();
    assert.equal((await state(page)).ready, "false"); assert.equal((await state(page)).inert, true);
    await page.screenshot({ path: path.join(outDir, `1280x720-error-${failedAsset.includes("fonts") ? "font" : "toy"}.png`) });
    await page.unroute(`**${failedAsset}`);
    await page.getByRole("button", { name: /重新准备/ }).click();
    await ready(page);
    assert.equal(await page.locator(".app-shell").getAttribute("data-active-section"), "birthday");
    console.log(`PASS failed ${failedAsset.includes("fonts") ? "font" : "toy"}: no false entry, retry and reduced motion`);
    await context.close();
  }

  // Inspect a real interrupted crossfade: incoming is partial, outgoing stays
  // opaque underneath, and rapid reversals finish on the requested scene.
  const motionContext = await browser.newContext({ viewport: sizes[0] });
  const motion = await motionContext.newPage();
  await motion.goto(`${url}/#sence1`); await ready(motion);
  await motion.evaluate(() => { location.hash = "sence5"; });
  await motion.waitForFunction(() => {
    const incoming = document.querySelector('[data-background-scene="sence5"].is-active');
    return incoming && Number(getComputedStyle(incoming).opacity) > .05 && Number(getComputedStyle(incoming).opacity) < .95;
  });
  const blend = await motion.locator(".scene-background-layer").evaluateAll((layers) => layers.map((layer) => ({ id: layer.dataset.backgroundScene, opacity: Number(getComputedStyle(layer).opacity) })));
  assert.ok(blend.some((layer) => layer.id === "sence1" && layer.opacity === 1), "Outgoing backdrop remains a continuous base");
  await motion.screenshot({ path: path.join(outDir, "1440x900-scene-crossfade.png") });
  for (const id of ["sence2", "sence6", "sence1", "sence5"]) {
    await motion.evaluate((next) => { location.hash = next; }, id); await motion.waitForTimeout(100);
    assert.ok(await motion.locator(".scene-background-layer").evaluateAll((layers) => layers.some((layer) => Number(getComputedStyle(layer).opacity) === 1)), "A fully opaque backing layer survives rapid reversals");
  }
  await motion.waitForFunction(() => document.querySelectorAll(".scene-background-layer").length === 1 && document.querySelector(".scene-background-layer").dataset.backgroundScene === "sence5" && document.querySelector(".stage-canvas").dataset.spriteTransition === "settled");
  records.push({ blend });
  await motion.evaluate(() => { location.hash = "sence2"; });
  await motion.waitForFunction(() => document.querySelector(".stage-canvas").dataset.spriteScene === "sence2" && document.querySelector(".stage-canvas").dataset.spriteTransition === "transitioning");
  await motion.emulateMedia({ reducedMotion: "reduce" });
  await motion.waitForFunction(() => document.querySelector(".stage-canvas").dataset.spriteTransition === "settled", null, { timeout: 400 });
  console.log("PASS visible crossfade, stable outgoing base and interrupted scene reversal");
  await motionContext.close();
  assert.deepEqual(errors, []);
  writeFileSync(path.join(outDir, "results.json"), JSON.stringify({ records, errors }, null, 2));
  console.log("Complete-resource and motion QA passed.");
} finally { await browser.close(); server.kill(); }
