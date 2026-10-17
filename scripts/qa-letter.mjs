import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import net from "node:net";
import path from "node:path";
import assert from "node:assert/strict";

// Prefer the native browser for interaction. When unavailable or its frame lags
// the DOM, use this fresh Chrome lane with temporary plaintext-letter fixtures.
const outDir = path.join(tmpdir(), `3dling-letter-qa-${Date.now()}`);
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
const viewportOnly = process.argv.find((argument) => argument.startsWith("--viewport="))?.slice(11);
const sizes = [{ width: 1440, height: 900 }, { width: 1440, height: 800 }, { width: 1280, height: 720 }].filter((size) => !viewportOnly || `${size.width}x${size.height}` === viewportOnly);
const sample = "这是一段用于测试阅读焦点的排版文字。正式信件将保留原有段落与换行。";
const letter = Array.from({ length: 24 }, (_, index) => `${String(index + 1).padStart(2, "0")} · ${sample}\n${sample}${index === 23 ? "<script>window.unwanted = true</script>" : ""}`).join("\n\n");
const errors = [], results = [];
const ready = async (page) => {
  await page.locator('[data-app-ready="true"]').waitFor({ timeout: 60000 });
  await page.waitForFunction(() => document.querySelector(".app-shell").dataset.activeSection === "letter" && Math.abs(document.getElementById("letter").getBoundingClientRect().top) < 2);
  await page.waitForTimeout(250);
};
const reading = async (page) => {
  await page.locator('#letter[data-letter-state="reading"]').waitFor();
  await page.waitForTimeout(400);
};
async function fixture(page, body) {
  await page.route("**/src/data/gift.ts*", async (route) => {
    const response = await route.fetch();
    const source = await response.text();
    const bodyField = /body:\s*"(?:\\.|[^"\\])*"/;
    assert.match(source, bodyField);
    await route.fulfill({ response, body: source.replace(bodyField, () => `body: ${JSON.stringify(body)}`) });
  });
}
function watch(page) {
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("response", (response) => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
}
const focus = (page) => page.locator(".letter-body").getAttribute("data-focused-paragraph");
const lineFocus = (page) => page.locator(".letter-body").getAttribute("data-focused-line");

try {
  for (const viewport of sizes) {
    const context = await browser.newContext({ viewport });
    await context.addInitScript(() => {
      window.rafCalls = 0;
      const original = requestAnimationFrame.bind(window);
      window.requestAnimationFrame = (callback) => original((time) => { window.rafCalls++; callback(time); });
    });
    const page = await context.newPage(); watch(page);
    await fixture(page, "");
    await page.goto(`${url}/#letter`); await ready(page);
    const envelope = await page.locator(".envelope-rig").boundingBox();
    const button = await page.locator("#letter .letter-invitation button").boundingBox();
    const footer = await page.locator(".letter-pager").boundingBox();
    console.log(JSON.stringify({ viewport, envelope, button, footer }));
    await page.screenshot({ path: path.join(outDir, `${viewport.width}x${viewport.height}-sealed.png`) });
    assert.ok(envelope.width >= 590 && envelope.y > 150);
    assert.ok(button.y > envelope.y + envelope.height + 20, "Opening CTA clears the envelope");
    assert.ok(footer.y > button.y + button.height, "Footer clears the CTA");
    assert.ok(footer.y + footer.height <= viewport.height + 2, "Sealed letter fits desktop height");
    assert.equal(await page.locator(".wax-seal").evaluate((image) => image.complete && image.naturalWidth > 0), true);
    await page.screenshot({ path: path.join(outDir, `${viewport.width}x${viewport.height}-sealed.png`) });
    await page.locator("#letter .letter-invitation button").click();
    await page.waitForTimeout(520);
    assert.equal(await page.locator("#letter").getAttribute("data-letter-state"), "opening");
    assert.ok(Number(await page.locator(".wax-seal").evaluate((node) => getComputedStyle(node).opacity)) < .05, "Wax releases before unfolding");
    await page.screenshot({ path: path.join(outDir, `${viewport.width}x${viewport.height}-flap-opening.png`) });
    await reading(page);
    assert.equal(await page.locator(".letter-placeholder").textContent(), "信件原文待放入");
    assert.equal(await page.getByRole("button", { name: "聚焦阅读" }).count(), 0, "Empty letter has no irrelevant reading control");
    assert.equal(await page.evaluate(() => document.activeElement.id), "letter-title");
    await page.screenshot({ path: path.join(outDir, `${viewport.width}x${viewport.height}-paper-empty.png`) });
    await page.close();

    const long = await context.newPage(); watch(long);
    await fixture(long, letter);
    await long.goto(`${url}/#letter`); await ready(long);
    await long.locator("#letter .letter-invitation button").click(); await reading(long);
    await long.locator(".letter-body.has-reading-focus").waitFor();
    assert.equal(await long.getByRole("button", { name: "聚焦阅读" }).count(), 0, "Reading focus is on by default without a paper control");
    assert.equal(await long.locator(".reading-lamp").count(), 0, "No floating paragraph glow");
    assert.equal(await long.locator(".reading-guide").count(), 1, "A single decorative star follows the reading line");
    assert.equal(await long.locator("[data-letter-paragraph]").count(), 24);
    assert.equal(await long.evaluate(() => window.unwanted), undefined);
    const paper = await long.locator(".letter-paper").boundingBox();
    assert.ok(paper.height > viewport.height * 4, "Long letter naturally extends the page");
    assert.equal(await long.locator(".letter-body").evaluate((node) => getComputedStyle(node).overflowY), "visible");
    await long.locator('[data-letter-paragraph="1"]').hover(); await long.waitForTimeout(650);
    await long.screenshot({ path: path.join(outDir, `${viewport.width}x${viewport.height}-long-start.png`) });
    await long.mouse.move(50, 100);
    await long.waitForTimeout(100);
    const initial = await focus(long);
    await long.mouse.wheel(0, 420); await long.waitForTimeout(450);
    assert.notEqual(await focus(long), initial, "Manual scroll moves paragraph focus");
    const beforeHover = await long.evaluate(() => scrollY);
    const visible = await long.locator("[data-letter-paragraph]").evaluateAll((nodes) => nodes.filter((node) => {
      const rect = node.getBoundingClientRect(); return rect.top > 130 && rect.bottom < innerHeight - 30;
    }).map((node) => Number(node.dataset.letterParagraph)));
    assert.ok(visible.length >= 2);
    const currentFocus = await focus(long);
    const target = visible.find((index) => String(index) !== currentFocus) ?? visible[0];
    await long.locator(`[data-letter-paragraph="${target}"]`).hover();
    await long.waitForFunction((index) => document.querySelector(".letter-body").dataset.focusedParagraph === String(index) && document.querySelector(".letter-body").dataset.focusSource === "pointer", target);
    await long.waitForTimeout(650);
    assert.equal(await long.evaluate(() => scrollY), beforeHover, "Pointer focus never auto-scrolls");
    assert.equal(await long.locator("[data-reading-current]").count(), 1);
    // A line inside one paragraph is the interaction unit, not its whole box.
    const linePoints = await long.locator(`[data-letter-paragraph="${target}"]`).evaluate((node) => {
      const range = document.createRange(); range.selectNodeContents(node);
      const points = [];
      for (const rect of range.getClientRects()) {
        if (rect.width < 1 || rect.height < 1 || points.some((point) => Math.abs(point.y - (rect.top + rect.height / 2)) < 1)) continue;
        points.push({ x: rect.left + Math.min(20, rect.width / 2), y: rect.top + rect.height / 2 });
      }
      return points;
    });
    assert.ok(linePoints.length >= 2);
    await long.mouse.move(linePoints[0].x, linePoints[0].y);
    await long.waitForTimeout(220);
    const firstLine = await lineFocus(long);
    await long.mouse.move(linePoints[1].x, linePoints[1].y);
    await long.waitForTimeout(60);
    assert.equal(await lineFocus(long), firstLine, "Pointer needs a brief deliberate dwell");
    await long.waitForFunction((line) => document.querySelector(".letter-body").dataset.focusedLine !== line, firstLine);
    assert.equal(await focus(long), String(target), "Line focus can change without changing paragraphs");
    await long.waitForTimeout(650);
    const guide = await long.locator(".reading-guide").boundingBox();
    assert.ok(Math.abs(guide.y + guide.height / 2 - linePoints[1].y) < 2, "Star aligns with the actual text line");
    const settledLine = await lineFocus(long);
    await long.mouse.move(linePoints[0].x, linePoints[0].y);
    await long.waitForTimeout(45);
    await long.mouse.move(linePoints[1].x, linePoints[1].y);
    await long.waitForTimeout(220);
    assert.equal(await lineFocus(long), settledLine, "Returning to the current line cancels a pending hover");
    await long.mouse.move(linePoints[0].x, linePoints[0].y);
    await long.waitForTimeout(45);
    const bodyBounds = await long.locator(".letter-body").boundingBox();
    await long.mouse.move(bodyBounds.x - 20, linePoints[0].y);
    await long.waitForTimeout(220);
    assert.equal(await long.locator(".letter-body").getAttribute("data-focus-source"), "scroll", "Leaving text cancels a pending hover");
    await long.mouse.move(linePoints[1].x, linePoints[1].y);
    await long.waitForTimeout(220);
    assert.match(await long.locator(`[data-letter-paragraph="${target}"]`).evaluate((node) => getComputedStyle(node).backgroundImage), /linear-gradient/, "Ink treatment is clipped inside native text");
    await long.screenshot({ path: path.join(outDir, `${viewport.width}x${viewport.height}-long-focus.png`) });
    const idleFrames = await long.evaluate(() => window.rafCalls);
    await long.waitForTimeout(400);
    assert.equal(await long.evaluate(() => window.rafCalls), idleFrames, "Paragraph focus has no idle RAF loop");
    await long.mouse.wheel(0, 300); await long.waitForTimeout(350);
    assert.equal(await long.locator(".letter-body").getAttribute("data-focus-source"), "scroll", "Manual scrolling takes priority over a resting pointer");
    const beforeJitter = await lineFocus(long);
    const jitter = await long.locator(".letter-body").evaluate((node) => {
      const top = parseFloat(node.style.getPropertyValue("--reading-line-top"));
      const height = parseFloat(node.style.getPropertyValue("--reading-line-height"));
      return { y: scrollY + node.getBoundingClientRect().top + top + height * 1.08 - innerHeight * .48, height };
    });
    await long.evaluate((y) => scrollTo({ top: y, behavior: "instant" }), jitter.y);
    await long.waitForTimeout(120);
    assert.equal(await lineFocus(long), beforeJitter, "Small motion across a line boundary stays within its hysteresis");
    await long.evaluate((y) => scrollTo({ top: y, behavior: "instant" }), jitter.y - jitter.height * .16);
    await long.waitForTimeout(120);
    assert.equal(await lineFocus(long), beforeJitter, "Small reverse motion does not flicker between lines");
    // A native selection must remain readable and suppress the decorative guide.
    await long.locator("[data-reading-current]").evaluate((node) => {
      const range = document.createRange(); range.selectNodeContents(node);
      getSelection().removeAllRanges(); getSelection().addRange(range);
    });
    await long.locator(".letter-body.has-selection").waitFor();
    assert.equal(await long.evaluate(() => getSelection().toString()), await long.locator("[data-reading-current]").textContent(), "Selection preserves a single native copy of the text");
    await long.waitForFunction(() => getComputedStyle(document.querySelector(".reading-guide")).opacity === "0");
    assert.equal(await long.locator(".reading-guide").evaluate((node) => getComputedStyle(node).opacity), "0");
    assert.equal(await long.locator("[data-reading-current]").evaluate((node) => getComputedStyle(node).webkitTextFillColor), "rgb(67, 45, 73)", "Selected text restores solid ink");
    await long.evaluate(() => getSelection().removeAllRanges());
    await long.locator(".letter-body.has-selection").waitFor({ state: "hidden" });
    const textStyles = await long.locator("[data-letter-paragraph]").evaluateAll((nodes) => nodes.map((node) => {
      const style = getComputedStyle(node); return { opacity: style.opacity, filter: style.filter, weight: style.fontWeight };
    }));
    assert.ok(textStyles.every((style) => style.opacity === "1" && style.filter === "none"), "Every paragraph remains fully opaque and sharp");
    assert.equal(new Set(textStyles.map((style) => style.weight)).size, 1, "Focus never shifts layout through font weight");
    await long.emulateMedia({ reducedMotion: "reduce" });
    assert.ok(parseFloat(await long.locator(".reading-guide").evaluate((node) => getComputedStyle(node).transitionDuration)) <= .001);
    await long.locator(".letter-pager").scrollIntoViewIfNeeded();
    await long.waitForFunction(() => {
      const bounds = document.querySelector(".letter-pager").getBoundingClientRect();
      return bounds.top >= 0 && bounds.bottom <= innerHeight && document.querySelector(".app-shell").dataset.activeSection === "letter";
    }, null, { timeout: 5000 }).catch(async (error) => {
      console.error("Footer state", await long.evaluate(() => ({ active: document.querySelector(".app-shell").dataset.activeSection, y: scrollY, height: innerHeight, pager: document.querySelector(".letter-pager").getBoundingClientRect().toJSON(), letter: document.getElementById("letter").getBoundingClientRect().toJSON(), paper: document.querySelector(".letter-paper").getBoundingClientRect().toJSON() })));
      await long.screenshot({ path: path.join(outDir, "footer-failure.png") });
      throw error;
    });
    assert.equal(await long.locator(".app-shell").getAttribute("data-active-section"), "letter");
    await long.screenshot({ path: path.join(outDir, `${viewport.width}x${viewport.height}-long-end.png`) });
    await long.locator('#letter a[href="#wall"]').click();
    await long.waitForFunction(() => document.querySelector(".app-shell").dataset.activeSection === "wall");
    assert.equal(await long.locator("[data-reading-current]").count(), 0, "Leaving the letter cleans focus state");
    assert.equal(await long.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    results.push({ viewport, envelope, button, footer, longHeight: paper.height });
    console.log(`PASS ${viewport.width}x${viewport.height}: stationery, long letter, real line focus, pointer dwell, aligned star, clear native text, selection, reduced motion and leaving`);
    await context.close();
  }

  const edge = await browser.newContext({ viewport: sizes[2] });
  await edge.addInitScript(() => {
    window.rafCalls = 0;
    const original = requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (callback) => original((time) => { window.rafCalls++; callback(time); });
  });
  const page = await edge.newPage(); watch(page);
  await fixture(page, `${sample.repeat(90)}\n${sample}`);
  await page.goto(`${url}/#letter`); await ready(page);
  await page.locator("#letter .letter-invitation button").click();
  await page.emulateMedia({ reducedMotion: "reduce" }); await reading(page);
  assert.equal(await page.locator("[data-letter-paragraph]").count(), 1, "A long single paragraph is not artificially paginated");
  assert.equal(await page.getByRole("button", { name: "聚焦阅读" }).count(), 0);
  assert.ok((await page.locator(".letter-paper").boundingBox()).height > 1000);
  await page.locator(".letter-body.has-reading-focus").waitFor();
  assert.ok(Number(await lineFocus(page)) >= 0, "One long paragraph also gets native line focus");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForFunction(() => {
    const body = document.querySelector(".letter-body");
    return parseFloat(body.style.getPropertyValue("--reading-line-height")) === parseFloat(getComputedStyle(body.querySelector("p")).lineHeight);
  });
  await page.waitForTimeout(400);
  const frames = await page.evaluate(() => window.rafCalls);
  await page.waitForTimeout(500);
  assert.equal(await page.evaluate(() => window.rafCalls), frames, "No perpetual JS animation while reading");
  await edge.close();
  assert.deepEqual(errors, []);
  writeFileSync(path.join(outDir, "results.json"), JSON.stringify({ results, errors }, null, 2));
  console.log("PASS single long paragraph, live reduced-motion opening and idle RAF");
  console.log("Letter stationery and reading-focus QA passed.");
} finally { await browser.close(); server.kill(); }
