import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import net from "node:net";
import path from "node:path";
import assert from "node:assert/strict";

const prototype = process.argv.includes("--prototype");
const checksOnly = process.argv.includes("--checks-only");
const wishOnly = process.argv.includes("--wish-only");
const surfaceOnly = process.argv.find((arg) => arg.startsWith("--surface="))?.slice(10);
if (surfaceOnly && !["intro", "birthday", "letter", "wall"].includes(surfaceOnly)) throw new Error(`Unknown surface: ${surfaceOnly}`);
const outDir = path.join(tmpdir(), `3dling-gift-${checksOnly ? "checks" : prototype ? "prototype" : "qa"}-${Date.now()}`);
mkdirSync(outDir, { recursive: true });
console.log(`Evidence: ${outDir}`);
const serverSocket = net.createServer();
await new Promise((resolve) => serverSocket.listen(0, "127.0.0.1", resolve));
const port = serverSocket.address().port;
await new Promise((resolve) => serverSocket.close(resolve));
const url = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, [path.resolve("node_modules/vite/bin/vite.js"), "--host", "127.0.0.1", "--port", String(port), "--strictPort"], { stdio: "pipe", windowsHide: true });
let startup = "";
server.stderr.on("data", (chunk) => startup += chunk.toString());
for (let attempt = 0; attempt < 100; attempt++) {
  if (server.exitCode !== null) throw new Error(`Vite failed: ${startup}`);
  try { if ((await fetch(url)).ok) break; } catch {}
  if (attempt === 99) throw new Error(`Vite did not start: ${startup}`);
  await new Promise((resolve) => setTimeout(resolve, 100));
}
const chrome = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const browser = await chromium.launch({ executablePath: existsSync(chrome) ? chrome : undefined, headless: true });
const errors = [];
const optimized = JSON.parse(readFileSync("src/data/optimizedAssets.json", "utf8"));
const measurements = [];
const sizes = [{ width: 1440, height: 900 }, { width: 1440, height: 800 }, { width: 1280, height: 720 }];
const sceneIds = prototype ? ["sence5"] : ["sence1", "sence2", "sence3", "sence4", "sence5", "sence6"];
const sections = surfaceOnly ? [surfaceOnly] : checksOnly || wishOnly ? [] : ["intro", ...sceneIds, "birthday", "letter", "wall"];

async function settle(page, id) {
  await page.waitForFunction((expected) => {
    const app = document.querySelector(".app-shell");
    const target = document.getElementById(expected);
    const background = document.querySelector(".scene-background-layer.is-active");
    return app?.dataset.appReady === "true" && app.dataset.activeSection === expected && Math.abs(target.getBoundingClientRect().top) < 2 && (!expected.startsWith("sence") || background?.dataset.backgroundScene === expected);
  }, id, { timeout: 60000 }).catch(async (error) => {
    console.error("Unsettled page", await page.evaluate((expected) => ({
      url: location.href,
      ready: document.querySelector(".app-shell")?.dataset.appReady,
      active: document.querySelector(".app-shell")?.dataset.activeSection,
      targetTop: document.getElementById(expected)?.getBoundingClientRect().top
    }), id));
    throw error;
  });
  await page.waitForFunction(() => [...document.querySelectorAll("img")].filter((image) => {
    const rect = image.getBoundingClientRect(); return rect.top < innerHeight && rect.bottom > 0;
  }).every((image) => image.complete && image.naturalWidth > 0), null, { timeout: 20000 });
  if (id.startsWith("sence")) await page.waitForFunction(() => {
    const stage = document.querySelector(".stage-canvas");
    return stage.dataset.modelState === "sprite" && stage.dataset.spriteTransition === "settled" && stage.dataset.spriteLoaded === "true" && stage.dataset.spriteScene === document.querySelector(".app-shell").dataset.activeSection;
  }, null, { timeout: 20000 });
  // Include the end of the background transition, rather than a loading frame.
  await page.waitForTimeout(1000);
}

try {
  for (const size of checksOnly ? [sizes[0]] : sizes) {
    const context = await browser.newContext({ viewport: size, deviceScaleFactor: size.width === 1440 && size.height === 900 ? 2 : 1 });
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    page.on("response", (response) => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    for (const id of sections) {
      await page.goto(`${url}/#${id}`, { waitUntil: "load" });
      await settle(page, id);
      const state = await page.evaluate((targetId) => {
        const target = document.getElementById(targetId);
        const heading = target.querySelector("h1,h2");
        const photo = target.querySelector(".photo-main-image");
        const copy = target.querySelector(".story-copy");
        const p = photo?.getBoundingClientRect(), c = copy?.getBoundingClientRect();
        const h = heading.getBoundingClientRect();
        const stage = document.querySelector(".stage-canvas");
        return {
          canvas: document.querySelectorAll("canvas").length,
          overflow: document.documentElement.scrollWidth - innerWidth,
          headingVisible: h.top >= 60 && h.bottom <= innerHeight,
          overlap: p && c ? Math.max(0, c.bottom - p.top) : 0,
          stageActive: stage.dataset.stageActive,
          sprite: stage.dataset.spriteAsset,
          foot: [Number(stage.dataset.toyFootX), Number(stage.dataset.toyFootY)]
        };
      }, id);
      assert.equal(state.canvas, 1, `${id}: exactly one WebGL canvas`);
      assert.ok(state.overflow <= 1, `${id}: horizontal overflow ${state.overflow}`);
      if (id !== "letter") assert.ok(state.headingVisible, `${id}: heading clipped`);
      assert.ok(state.overlap <= 0, `${id}: copy/photo overlap`);
      assert.equal(state.stageActive, String(id.startsWith("sence")), `${id}: stage visibility`);
      measurements.push({ viewport: size, section: id, ...state });
      if (id.startsWith("sence")) {
        assert.ok(state.foot[0] > size.width * .5 && state.foot[1] < size.height - 70, `${id}: toy outside art stage region`);
        const source = await page.locator(`#${id} [data-photo-main]`).getAttribute("src");
        const swap = page.getByRole("button", { name: `查看${await page.locator(`#${id} h2`).textContent()}下一张照片` });
        if (await swap.count()) {
          await swap.click();
          assert.notEqual(await page.locator(`#${id} [data-photo-main]`).getAttribute("src"), source);
          await page.locator(`#${id}`).getByRole("button", { name: /上一张照片/ }).click();
          await settle(page, id);
          assert.equal(await page.locator(`#${id} [data-photo-main]`).getAttribute("src"), source);
        }
      }
      if (id === "letter") {
        await page.locator("#letter .letter-invitation button").click();
        await page.waitForFunction(() => document.querySelector("#letter").dataset.letterState === "reading");
        assert.equal(await page.locator(".letter-placeholder").textContent(), "信件原文待放入");
        await page.waitForTimeout(500);
      }
      await page.screenshot({ path: path.join(outDir, `${size.width}x${size.height}-${id}.png`) });
      console.log(`PASS ${size.width}x${size.height} #${id}`);
    }

    if (surfaceOnly) { await context.close(); continue; }
    await page.goto(`${url}/#birthday`); await settle(page, "birthday");
    await page.getByRole("button", { name: "吹灭蜡烛", exact: true }).click();
    await page.waitForFunction(() => document.querySelector("#birthday").dataset.birthdayState === "celebrating");
    assert.equal(await page.locator(".candle-flame").count(), 0);
    assert.equal(await page.locator(".wish-particle").count(), 64);
    assert.equal(await page.locator(".candle-smoke").count(), 1);
    await page.waitForTimeout(700);
    const celebration = await page.locator(".wish-effects").evaluate((node) => {
      const bounds = node.getBoundingClientRect();
      const stars = [...node.querySelectorAll(".is-star")].filter((star) => {
        const rect = star.getBoundingClientRect();
        return Number(getComputedStyle(star).opacity) > .5 && rect.right > 0 && rect.left < innerWidth && rect.bottom > 0 && rect.top < innerHeight;
      });
      return { x: bounds.x, y: bounds.y, stars: stars.length };
    });
    assert.ok(celebration.x > size.width * .6 && celebration.y < size.height * .35, "Celebration tracks the candle anchor");
    assert.ok(celebration.stars >= 20, "Visible star burst around cake");
    await page.screenshot({ path: path.join(outDir, `${size.width}x${size.height}-wish-celebration.png`) });
    await page.waitForFunction(() => document.querySelector("#birthday").dataset.birthdayState === "revealed");
    assert.equal(await page.locator(".candle-flame").count(), 0);
    assert.equal(await page.locator(".wish-effects").count(), 0, "One-shot effects clean up after celebration");
    assert.ok(page.url().endsWith("#birthday"), "Greeting waits for the reader to choose open letter");
    await page.screenshot({ path: path.join(outDir, `${size.width}x${size.height}-wish-revealed.png`) });
    if (wishOnly && size.height === 900) {
      await page.getByRole("button", { name: "再许个愿", exact: true }).click();
      assert.equal(await page.locator(".candle-flame").count(), 1);
      await page.getByRole("button", { name: "吹灭蜡烛", exact: true }).click();
      await page.waitForFunction(() => document.querySelector("#birthday").dataset.birthdayState === "celebrating");
      await page.getByRole("button", { name: "再许个愿", exact: true }).click();
      assert.equal(await page.locator(".wish-effects").count(), 0, "Replay cancels the previous burst");
      assert.equal(await page.locator(".candle-flame").count(), 1);
      await page.getByRole("button", { name: "吹灭蜡烛", exact: true }).click();
      await page.waitForFunction(() => document.querySelector("#birthday").dataset.birthdayState === "celebrating");
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.waitForFunction(() => document.querySelector("#birthday").dataset.birthdayState === "revealed");
      assert.equal(await page.locator(".wish-effects").count(), 0, "Changing reduced motion stops the celebration immediately");
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await page.getByRole("button", { name: "再许个愿", exact: true }).click();
      await page.getByRole("button", { name: "吹灭蜡烛", exact: true }).click();
      await page.waitForFunction(() => document.querySelector("#birthday").dataset.birthdayState === "celebrating");
      console.log("PASS replay during celebration and live reduced-motion change");
    }
    await page.locator("#birthday").getByRole("button", { name: /打开信/ }).click();
    await page.waitForFunction(() => document.querySelector("#letter").dataset.letterState === "opening");
    assert.equal(await page.locator(".wish-effects").count(), 0, "Leaving for the letter clears particles");
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, `${size.width}x${size.height}-letter-opening.png`) });
    await page.waitForFunction(() => document.querySelector("#letter").dataset.letterState === "reading");
    await page.getByRole("button", { name: "回忆目录", exact: true }).click();
    assert.ok(await page.getByRole("dialog").isVisible());
    await page.keyboard.press("Escape"); assert.equal(await page.getByRole("dialog").isVisible(), false);
    await page.getByRole("button", { name: "回忆目录", exact: true }).click();
    await page.locator('.directory a[href="#sence5"]').click(); await settle(page, "sence5");
    if (size.height === 900 && !wishOnly) {
      // Interrupt transitions repeatedly; the final selection must win.
      for (const id of ["sence2", "sence6", "sence1", "sence5"]) {
        await page.evaluate((next) => { location.hash = next; }, id);
        await page.waitForTimeout(120);
      }
      await settle(page, "sence5");
      await page.evaluate(() => { location.hash = "birthday"; }); await settle(page, "birthday");
      await page.getByRole("button", { name: /再许个愿/ }).click();
      assert.equal(await page.locator(".candle-flame").count(), 1);
      await page.getByRole("button", { name: "吹灭蜡烛", exact: true }).click();
      await page.evaluate(() => { location.hash = "intro"; }); await settle(page, "intro");
      assert.equal(await page.locator("#birthday").getAttribute("data-birthday-state"), "revealed");
      await page.evaluate(() => { location.hash = "birthday"; }); await settle(page, "birthday");
      await page.locator("#birthday").getByRole("button", { name: /打开信/ }).click();
      await page.waitForFunction(() => document.querySelector("#letter").dataset.letterState === "opening");
      await page.evaluate(() => { location.hash = "intro"; }); await settle(page, "intro");
      assert.equal(await page.locator("#letter").getAttribute("data-letter-state"), "sealed");
      await page.evaluate(() => { location.hash = "letter"; }); await settle(page, "letter");
      await page.locator("#letter .letter-invitation button").click();
      await page.getByRole("button", { name: "直接读信", exact: true }).click();
      assert.equal(await page.locator("#letter").getAttribute("data-letter-state"), "reading");
      await page.evaluate(() => { location.hash = "wall"; }); await settle(page, "wall");
      assert.equal(await page.locator(".photo-wall figure").count(), 6);
      await page.locator('.photo-wall a[href="#sence3"]').click(); await settle(page, "sence3");
      await page.goBack(); await settle(page, "wall");
      console.log("PASS rapid scene switching, replay, interrupted wish/envelope, skip, photo wall and browser back");
    }
    console.log(`PASS ${size.width}x${size.height} candle → envelope → paper → directory`);
    await context.close();
  }
  if (!surfaceOnly) {
  const reduced = await browser.newContext({ viewport: sizes[0], reducedMotion: "reduce" });
  const page = await reduced.newPage();
  await page.goto(`${url}/#birthday`); await settle(page, "birthday");
  assert.equal(await page.locator(".candle-flame svg").evaluate((node) => getComputedStyle(node).animationIterationCount), "1", "Reduced motion removes continuous flickering");
  await page.getByRole("button", { name: "吹灭蜡烛", exact: true }).focus();
  await page.keyboard.press("Enter");
  assert.equal(await page.locator("#birthday").getAttribute("data-birthday-state"), "revealed");
  await page.locator("#birthday").getByRole("button", { name: /打开信/ }).click();
  await page.waitForFunction(() => document.querySelector("#letter").dataset.letterState === "reading");
  await page.evaluate(() => document.getElementById("birthday").scrollIntoView({ behavior: "instant" }));
  await settle(page, "birthday");
  assert.ok(page.url().endsWith("#letter"), "Wheel/scroll navigation leaves the old hash");
  await page.locator("#birthday").getByRole("button", { name: /打开信/ }).click();
  await settle(page, "letter");
  console.log("PASS reduced motion, keyboard activation and reopening letter with unchanged hash");
  await reduced.close();

  if (!wishOnly) {
  // Exercise a real long plaintext letter without changing the user's empty slot.
  const longContext = await browser.newContext({ viewport: sizes[2], reducedMotion: "reduce" });
  const longPage = await longContext.newPage();
  const letter = Array.from({ length: 24 }, (_, i) => `验收样文第${i + 1}段。这是检查长信排版的测试文字，正式信件仍等待用户提供。\n保留手写信原有的换行。${i === 23 ? "<script>window.unwanted = true</script>" : ""}`).join("\n\n");
  await longPage.route("**/src/data/gift.ts*", async (route) => {
    const response = await route.fetch();
    const source = await response.text();
    assert.match(source, /body:\s*""/, "Empty letter fixture slot");
    await route.fulfill({ response, body: source.replace(/body:\s*""/, () => `body: ${JSON.stringify(letter)}`) });
  });
  await longPage.goto(`${url}/#letter`); await settle(longPage, "letter");
  await longPage.locator("#letter .letter-invitation button").click();
  await longPage.waitForFunction(() => document.querySelector("#letter").dataset.letterState === "reading");
  assert.equal(await longPage.locator(".letter-body p").count(), 24);
  assert.equal(await longPage.evaluate(() => window.unwanted), undefined);
  assert.ok((await longPage.locator(".letter-paper").boundingBox()).height > sizes[2].height * 3);
  assert.equal(await longPage.locator(".letter-body").evaluate((node) => getComputedStyle(node).overflowY), "visible");
  await longPage.locator("#letter .letter-pager").scrollIntoViewIfNeeded();
  await longPage.waitForFunction(() => {
    const bounds = document.querySelector("#letter .letter-pager").getBoundingClientRect();
    return bounds.top >= 0 && bounds.bottom <= innerHeight && document.querySelector(".app-shell").dataset.activeSection === "letter";
  });
  assert.equal(await longPage.locator(".app-shell").getAttribute("data-active-section"), "letter");
  assert.ok(await longPage.locator("#letter a[href='#wall']").isVisible());
  await longPage.screenshot({ path: path.join(outDir, "1280x720-letter-long-fixture.png") });
  await longContext.close();
  console.log("PASS long plaintext letter, preserved newlines, natural page scroll and literal HTML");

  const resilience = await browser.newContext({ viewport: sizes[0], reducedMotion: "reduce" });
  await resilience.addInitScript(() => {
    window.rafCalls = 0;
    const original = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (callback) => original((time) => { window.rafCalls++; callback(time); });
  });
  const recoveryPage = await resilience.newPage();
  const failedToy = `**${optimized["/toys/sence2-toy-2d-v2.png"]}`;
  await recoveryPage.route(failedToy, (route) => route.abort());
  await recoveryPage.goto(`${url}/#sence2`);
  await recoveryPage.locator('[data-loading-state="error"]').waitFor();
  assert.equal(await recoveryPage.locator(".app-shell").getAttribute("data-app-ready"), "false", "Missing toy cannot pass the complete-resource gate");
  await recoveryPage.unroute(failedToy);
  await recoveryPage.getByRole("button", { name: /重新准备/ }).click();
  await settle(recoveryPage, "sence2");
  await recoveryPage.evaluate(() => { location.hash = "sence1"; }); await settle(recoveryPage, "sence1");
  await recoveryPage.evaluate(() => { location.hash = "sence2"; }); await settle(recoveryPage, "sence2");
  const frames = await recoveryPage.evaluate(() => window.rafCalls);
  await recoveryPage.waitForTimeout(500);
  assert.equal(await recoveryPage.evaluate(() => window.rafCalls), frames, "Settled toy stops requesting animation frames");
  await recoveryPage.setViewportSize(sizes[2]); await settle(recoveryPage, "sence2");
  await recoveryPage.screenshot({ path: path.join(outDir, "1280x720-sence2-resize.png") });
  console.log("PASS missing toy recovery, stopped idle RAF and same-page resize");
  await resilience.close();
  }
  }
  assert.deepEqual(errors, [], `Browser errors: ${errors.join("; ")}`);
  writeFileSync(path.join(outDir, "measurements.json"), JSON.stringify({ measurements, errors }, null, 2));
  console.log(`Evidence: ${outDir}`);
} finally { await browser.close(); server.kill(); }
