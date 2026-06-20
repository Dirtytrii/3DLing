import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import net from "node:net";
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const root = process.cwd();
const chromePath = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const viteCliPath = path.join(root, "node_modules", "vite", "bin", "vite.js");
const storySceneIds = ["sence1", "sence2", "sence3", "sence4", "sence5", "sence6"];
const navigationIds = [...storySceneIds, "letter", "wall"];
const rejectedToyPattern = /\/toys\/sence[12346]-toy-2d\.(png|svg)$/;
const v2ToyPattern = /\/toys\/sence[12346]-toy-2d-v2\.png$/;

const defaultViewports = [
  { label: "desktop-1398x986", width: 1398, height: 986 },
  { label: "desktop-1440x900", width: 1440, height: 900 },
  { label: "desktop-1920x1080", width: 1920, height: 1080 },
  { label: "mobile-390x844", width: 390, height: 844, isMobile: true }
];
const sceneSettleTimeoutMs = 20000;

function fail(message) {
  console.error(`Scene QA failed: ${message}`);
  process.exit(1);
}

function printHelp() {
  console.log(`Run the 3Dling scene QA matrix.

Usage:
  npm run qa:scenes
  npm run qa:scenes -- --url http://127.0.0.1:5173
  npm run qa:scenes -- --screenshots
  npm run qa:scenes -- --scene sence5 --viewport 2048x1117

Options:
  --url <url>          Reuse an existing dev server instead of starting Vite.
  --scene <id>         Limit direct-hash checks to a scene. Can be repeated.
  --viewport <WxH>     Limit/add viewport. Can be repeated.
  --screenshots        Capture one screenshot for each direct-hash check.
  --out-dir <path>     Screenshot output directory. Defaults to OS temp.
  --no-nav             Skip the rail navigation chain.
  --keep-server        Leave the spawned Vite server running.
`);
}

function parseArgs(argv) {
  const options = {
    url: null,
    scenes: [],
    viewports: [],
    screenshots: false,
    outDir: path.join(tmpdir(), `3dling-scene-qa-${Date.now()}`),
    nav: true,
    keepServer: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }

    if (arg === "--url") {
      const value = argv[index + 1];
      if (!value) fail("--url requires a URL");
      options.url = value.replace(/\/$/, "");
      index += 1;
      continue;
    }

    if (arg === "--scene") {
      const value = argv[index + 1];
      if (!value) fail("--scene requires a scene id");
      if (!storySceneIds.includes(value)) fail(`Unsupported scene "${value}"`);
      options.scenes.push(value);
      index += 1;
      continue;
    }

    if (arg === "--viewport") {
      const value = argv[index + 1];
      if (!value) fail("--viewport requires a WxH value");
      options.viewports.push(parseViewport(value));
      index += 1;
      continue;
    }

    if (arg === "--screenshots") {
      options.screenshots = true;
      continue;
    }

    if (arg === "--out-dir") {
      const value = argv[index + 1];
      if (!value) fail("--out-dir requires a path");
      options.outDir = path.resolve(root, value);
      index += 1;
      continue;
    }

    if (arg === "--no-nav") {
      options.nav = false;
      continue;
    }

    if (arg === "--keep-server") {
      options.keepServer = true;
      continue;
    }

    fail(`Unknown argument: ${arg}`);
  }

  options.scenes = options.scenes.length ? options.scenes : storySceneIds;
  options.viewports = options.viewports.length ? options.viewports : defaultViewports;
  return options;
}

function parseViewport(value) {
  const match = value.match(/^(\d+)x(\d+)$/);
  if (!match) fail(`Invalid viewport "${value}". Expected WxH, for example 1398x986.`);
  const width = Number(match[1]);
  const height = Number(match[2]);
  return {
    label: `${width}x${height}`,
    width,
    height,
    isMobile: width < 600
  };
}

function readSceneExpectations() {
  const scenesSource = readFileSync(path.join(root, "src", "data", "scenes.ts"), "utf8");
  const expectations = new Map();

  for (const sceneId of storySceneIds) {
    const start = scenesSource.indexOf(`id: "${sceneId}"`);
    if (start === -1) fail(`${sceneId}: missing scene data`);
    const currentNumber = Number(sceneId.replace("sence", ""));
    let end = scenesSource.indexOf(`id: "sence${currentNumber + 1}"`, start + 1);
    if (end === -1) end = scenesSource.indexOf("\n];", start);
    if (end === -1) fail(`${sceneId}: cannot locate scene block end`);

    const block = scenesSource.slice(start, end);
    const modelReady = /modelReady:\s*true/.test(block);
    const hasToyDisplay = /toyDisplay:\s*{/.test(block);
    const assetReadyFalse = /assetReady:\s*false/.test(block);
    const imagePathMatch = block.match(/imagePath:\s*"([^"]+)"/);
    const imagePath = imagePathMatch?.[1] ?? "";
    const absoluteToyPath = imagePath.startsWith("/toys/")
      ? path.join(root, "public", imagePath.slice(1))
      : null;
    const toyFileExists = absoluteToyPath ? existsSync(absoluteToyPath) : false;
    const stageProfile = /profile:\s*"red-wheat-concert"/.test(block) ? "red-wheat-concert" : "default";
    const expectedModelState = modelReady ? "glb" : hasToyDisplay && !assetReadyFalse && toyFileExists ? "sprite" : "placeholder";

    expectations.set(sceneId, {
      expectedModelState,
      stageProfile,
      imagePath,
      assetReadyFalse,
      toyFileExists
    });
  }

  return expectations;
}

async function getFreePort() {
  const server = net.createServer();
  return await new Promise((resolve, reject) => {
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      server.close(() => resolve(port));
    });
  });
}

async function waitForServer(url, processRef) {
  const started = Date.now();
  let lastError = "";

  while (Date.now() - started < 30000) {
    if (processRef?.exitCode !== null) {
      fail(`Vite server exited early with code ${processRef.exitCode}`);
    }

    try {
      const response = await fetch(url);
      if (response.ok) return;
      lastError = `${response.status} ${response.statusText}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }

    await new Promise((resolve) => setTimeout(resolve, 350));
  }

  fail(`Timed out waiting for ${url}: ${lastError}`);
}

async function startServer(options) {
  if (options.url) return { url: options.url, process: null };

  const port = await getFreePort();
  if (!existsSync(viteCliPath)) {
    fail(`Vite CLI is missing: ${viteCliPath}. Run npm install first.`);
  }

  const serverProcess = spawn(process.execPath, [viteCliPath, "--host", "127.0.0.1", "--port", String(port), "--strictPort"], {
    cwd: root,
    env: { ...process.env, BROWSER: "none" },
    stdio: ["ignore", "pipe", "pipe"]
  });

  serverProcess.stdout.on("data", (chunk) => process.stdout.write(`[vite] ${chunk}`));
  serverProcess.stderr.on("data", (chunk) => process.stderr.write(`[vite] ${chunk}`));

  const url = `http://127.0.0.1:${port}`;
  await waitForServer(url, serverProcess);
  return { url, process: serverProcess };
}

async function collectState(page, sceneId) {
  return await page.evaluate((id) => {
    const activeRail = document.querySelector(".scene-rail a.active");
    const appShell = document.querySelector(".app-shell");
    const target = document.getElementById(id);
    const stage = document.querySelector(".stage-canvas");
    const activeBackground = document.querySelector(".scene-background-layer.is-active");
    const body = document.body;
    const doc = document.documentElement;
    const targetRect = target?.getBoundingClientRect();

    return {
      title: document.title,
      url: window.location.href,
      appReady: appShell?.getAttribute("data-app-ready") ?? "",
      activeHref: activeRail?.getAttribute("href") ?? "",
      targetTop: targetRect?.top ?? null,
      modelState: stage?.getAttribute("data-model-state") ?? "",
      stageProfile: stage?.getAttribute("data-stage-profile") ?? "",
      spriteLoaded: stage?.getAttribute("data-sprite-loaded") ?? "",
      spriteTransition: stage?.getAttribute("data-sprite-transition") ?? "",
      spriteAsset: stage?.getAttribute("data-sprite-asset") ?? "",
      activeBackgroundScene: activeBackground?.getAttribute("data-background-scene") ?? "",
      backgroundLayerCount: document.querySelectorAll(".scene-background-layer").length,
      canvasCount: document.querySelectorAll("canvas").length,
      overflowX: Math.max(body.scrollWidth, doc.scrollWidth) - window.innerWidth,
      hasFrameworkOverlay:
        !!document.querySelector("[data-nextjs-dialog-overlay], vite-error-overlay") ||
        document.body.innerText.includes("Failed to compile") ||
        document.body.innerText.includes("Internal server error")
    };
  }, sceneId);
}

async function waitForScene(page, sceneId, expectation) {
  const started = Date.now();
  let lastState = null;
  let nudgedScroll = false;

  while (Date.now() - started < sceneSettleTimeoutMs) {
    lastState = await collectState(page, sceneId);
    const isReady =
      lastState.activeHref === `#${sceneId}` &&
      lastState.appReady === "true" &&
      lastState.targetTop !== null &&
      Math.abs(lastState.targetTop) < 8 &&
      lastState.modelState === expectation.expectedModelState &&
      lastState.stageProfile === expectation.stageProfile &&
      (expectation.expectedModelState !== "sprite" ||
        (lastState.spriteLoaded === "true" &&
          lastState.spriteTransition === "settled" &&
          lastState.spriteAsset === expectation.imagePath));

    if (isReady) return;

    if (
      !nudgedScroll &&
      Date.now() - started > 2500 &&
      page.url().includes(`#${sceneId}`) &&
      lastState.activeHref === `#${sceneId}` &&
      lastState.targetTop !== null &&
      Math.abs(lastState.targetTop) >= 8
    ) {
      await page.evaluate((id) => {
        document.getElementById(id)?.scrollIntoView({ block: "start", inline: "nearest", behavior: "auto" });
      }, sceneId);
      nudgedScroll = true;
    }

    await page.waitForTimeout(250);
  }

  fail(`${sceneId}: timed out waiting for stable scene state. Last state: ${JSON.stringify(lastState)}`);
}

function assertState(state, sceneId, expectation) {
  const failures = [];
  if (!state.title) failures.push("document title is empty");
  if (state.appReady !== "true") failures.push(`app ready ${state.appReady}, expected true`);
  if (state.activeHref !== `#${sceneId}`) failures.push(`active rail ${state.activeHref}, expected #${sceneId}`);
  if (state.targetTop === null || Math.abs(state.targetTop) > 8) failures.push(`target top ${state.targetTop}, expected near 0`);
  if (state.modelState !== expectation.expectedModelState) {
    failures.push(`model state ${state.modelState}, expected ${expectation.expectedModelState}`);
  }
  if (state.stageProfile !== expectation.stageProfile) {
    failures.push(`stage profile ${state.stageProfile}, expected ${expectation.stageProfile}`);
  }
  if (expectation.expectedModelState === "sprite") {
    if (state.spriteLoaded !== "true") {
      failures.push(`sprite loaded ${state.spriteLoaded}, expected true`);
    }
    if (state.spriteTransition !== "settled") {
      failures.push(`sprite transition ${state.spriteTransition}, expected settled`);
    }
    if (state.spriteAsset !== expectation.imagePath) {
      failures.push(`sprite asset ${state.spriteAsset}, expected ${expectation.imagePath}`);
    }
  }
  if (state.activeBackgroundScene !== sceneId) {
    failures.push(`active background ${state.activeBackgroundScene}, expected ${sceneId}`);
  }
  if (state.canvasCount !== 1) failures.push(`canvas count ${state.canvasCount}, expected 1`);
  if (state.overflowX > 1) failures.push(`horizontal overflow ${state.overflowX}px`);
  if (state.hasFrameworkOverlay) failures.push("framework error overlay detected");

  if (failures.length) {
    fail(`${sceneId}: ${failures.join("; ")}`);
  }
}

function recordRequestIssues(requestIssues, request, response = null) {
  const url = request.url();
  if (rejectedToyPattern.test(new URL(url).pathname)) {
    requestIssues.push(`rejected toy asset requested: ${url}`);
  }
  if (response && response.status() >= 400) {
    requestIssues.push(`${response.status()} ${url}`);
  }
}

async function runDirectMatrix(browser, baseUrl, options, expectations) {
  const screenshotPaths = [];

  for (const viewport of options.viewports) {
    for (const sceneId of options.scenes) {
      const expectation = expectations.get(sceneId);
      const requestIssues = [];
      const consoleIssues = [];
      const page = await browser.newPage({
        viewport: { width: viewport.width, height: viewport.height },
        isMobile: viewport.isMobile
      });

      page.on("console", (message) => {
        if (["error", "warning"].includes(message.type())) {
          consoleIssues.push(`${message.type()}: ${message.text()}`);
        }
      });
      page.on("pageerror", (error) => consoleIssues.push(`pageerror: ${error.message}`));
      page.on("requestfailed", (request) => requestIssues.push(`request failed: ${request.url()} ${request.failure()?.errorText ?? ""}`));
      page.on("response", (response) => recordRequestIssues(requestIssues, response.request(), response));

      await page.goto(`${baseUrl}/#${sceneId}`, { waitUntil: "load" });
      await waitForScene(page, sceneId, expectation);
      const state = await collectState(page, sceneId);
      assertState(state, sceneId, expectation);

      if (expectation.assetReadyFalse && requestIssues.some((issue) => v2ToyPattern.test(issue))) {
        fail(`${sceneId}: gated v2 toy was requested even though assetReady is false`);
      }

      if (requestIssues.length) fail(`${sceneId}: request issues: ${requestIssues.join("; ")}`);
      if (consoleIssues.length) fail(`${sceneId}: console/page issues: ${consoleIssues.join("; ")}`);

      if (options.screenshots) {
        mkdirSync(options.outDir, { recursive: true });
        const screenshotPath = path.join(options.outDir, `${viewport.label}-${sceneId}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: false });
        screenshotPaths.push(screenshotPath);
      }

      console.log(
        `PASS direct ${viewport.label} #${sceneId}: model=${state.modelState}, stage=${state.stageProfile}, bg=${state.activeBackgroundScene}`
      );
      await page.close();
    }
  }

  return screenshotPaths;
}

async function runNavigationCheck(browser, baseUrl, expectations) {
  const viewport = { width: 1398, height: 986 };
  const page = await browser.newPage({ viewport });
  const requestIssues = [];
  const consoleIssues = [];

  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) {
      consoleIssues.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => consoleIssues.push(`pageerror: ${error.message}`));
  page.on("requestfailed", (request) => requestIssues.push(`request failed: ${request.url()} ${request.failure()?.errorText ?? ""}`));
  page.on("response", (response) => recordRequestIssues(requestIssues, response.request(), response));

  await page.goto(`${baseUrl}/#sence1`, { waitUntil: "load" });
  await page.waitForFunction(
    () => document.querySelector(".app-shell")?.getAttribute("data-app-ready") === "true",
    { timeout: sceneSettleTimeoutMs }
  );

  for (const id of navigationIds) {
    await page.locator(`.scene-rail a[href="#${id}"]`).click();

    if (storySceneIds.includes(id)) {
      await waitForScene(page, id, expectations.get(id));
      const state = await collectState(page, id);
      assertState(state, id, expectations.get(id));
      console.log(`PASS nav #${id}: model=${state.modelState}, stage=${state.stageProfile}`);
    } else {
      await page.waitForFunction(
        (targetId) => {
          const activeRail = document.querySelector(".scene-rail a.active");
          const target = document.getElementById(targetId);
          const targetRect = target?.getBoundingClientRect();
          return activeRail?.getAttribute("href") === `#${targetId}` && !!targetRect && Math.abs(targetRect.top) < 8;
        },
        id,
        { timeout: sceneSettleTimeoutMs }
      );
      const state = await collectState(page, id);
      if (state.canvasCount !== 1) fail(`${id}: canvas count ${state.canvasCount}, expected 1`);
      if (state.overflowX > 1) fail(`${id}: horizontal overflow ${state.overflowX}px`);
      if (state.hasFrameworkOverlay) fail(`${id}: framework error overlay detected`);
      console.log(`PASS nav #${id}: active=${state.activeHref}, canvas=${state.canvasCount}`);
    }
  }

  if (requestIssues.length) fail(`navigation request issues: ${requestIssues.join("; ")}`);
  if (consoleIssues.length) fail(`navigation console/page issues: ${consoleIssues.join("; ")}`);
  await page.close();
}

const options = parseArgs(process.argv.slice(2));
const expectations = readSceneExpectations();
const server = await startServer(options);
let browser;

try {
  browser = await chromium.launch({
    executablePath: existsSync(chromePath) ? chromePath : undefined,
    headless: true
  });

  console.log(`Scene QA URL: ${server.url}`);
  const screenshotPaths = await runDirectMatrix(browser, server.url, options, expectations);

  if (options.nav) {
    await runNavigationCheck(browser, server.url, expectations);
  }

  if (screenshotPaths.length) {
    console.log("Screenshots:");
    screenshotPaths.forEach((screenshotPath) => console.log(`- ${screenshotPath}`));
  }

  console.log("Scene QA passed.");
} finally {
  if (browser) await browser.close();
  if (server.process && !options.keepServer) {
    server.process.kill();
  }
}
