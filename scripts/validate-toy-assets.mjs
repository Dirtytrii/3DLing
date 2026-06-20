import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const root = process.cwd();
const chromePath = "C:/Program Files/Google/Chrome/Application/chrome.exe";

const assetByScene = new Map([
  ["sence1", "public/toys/sence1-toy-2d-v2.png"],
  ["sence2", "public/toys/sence2-toy-2d-v2.png"],
  ["sence3", "public/toys/sence3-toy-2d-v2.png"],
  ["sence4", "public/toys/sence4-toy-2d-v2.png"],
  ["sence6", "public/toys/sence6-toy-2d-v2.png"]
]);

const requestedScenes = new Set();
for (let index = 2; index < process.argv.length; index += 1) {
  const arg = process.argv[index];
  if (arg === "--scene") {
    const scene = process.argv[index + 1];
    if (!scene) {
      console.error("Missing value after --scene");
      process.exit(1);
    }
    requestedScenes.add(scene);
    index += 1;
    continue;
  }

  if (arg.startsWith("--scene=")) {
    requestedScenes.add(arg.slice("--scene=".length));
    continue;
  }

  console.error(`Unknown argument: ${arg}`);
  process.exit(1);
}

for (const scene of requestedScenes) {
  if (!assetByScene.has(scene)) {
    console.error(`Unknown scene for toy validation: ${scene}`);
    process.exit(1);
  }
}

const assets = [...(requestedScenes.size ? requestedScenes : assetByScene.keys())].map((scene) => assetByScene.get(scene));

const failures = [];
const rejectedPublicAssets = [
  "public/toys/sence1-toy-2d.png",
  "public/toys/sence1-toy-2d.svg",
  "public/toys/sence2-toy-2d.png",
  "public/toys/sence2-toy-2d.svg",
  "public/toys/sence3-toy-2d.png",
  "public/toys/sence3-toy-2d.svg",
  "public/toys/sence4-toy-2d.png",
  "public/toys/sence4-toy-2d.svg",
  "public/toys/sence6-toy-2d.png",
  "public/toys/sence6-toy-2d.svg"
];

for (const asset of rejectedPublicAssets) {
  if (existsSync(path.join(root, asset))) {
    failures.push(`${asset}: rejected v1 toy asset must not be web-served from public/toys`);
  }
}

const missing = assets.filter((asset) => !existsSync(path.join(root, asset)));

if (missing.length) {
  for (const asset of missing) {
    failures.push(`${asset}: missing`);
  }
} else {
  const browser = await chromium.launch({ executablePath: chromePath, headless: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });

  for (const asset of assets) {
    const filePath = path.join(root, asset);
    const dataUrl = `data:image/png;base64,${readFileSync(filePath).toString("base64")}`;
    const result = await page.evaluate(async (src) => {
      const image = new Image();
      image.decoding = "async";
      image.src = src;
      await image.decode();

      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("cannot create canvas context");
      ctx.drawImage(image, 0, 0);

      const sample = (x, y) => ctx.getImageData(x, y, 1, 1).data[3];
      const corners = [
        sample(0, 0),
        sample(canvas.width - 1, 0),
        sample(0, canvas.height - 1),
        sample(canvas.width - 1, canvas.height - 1)
      ];

      const center = ctx.getImageData(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1).data[3];
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let minX = canvas.width;
      let minY = canvas.height;
      let maxX = -1;
      let maxY = -1;

      for (let y = 0; y < canvas.height; y += 1) {
        for (let x = 0; x < canvas.width; x += 1) {
          const alpha = data[(y * canvas.width + x) * 4 + 3];
          if (alpha > 96) {
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          }
        }
      }

      const hasSubjectBox = maxX >= minX && maxY >= minY;
      const padX = Math.floor(canvas.width * 0.045);
      const padY = Math.floor(canvas.height * 0.045);
      const paddedBox = {
        minX: Math.max(0, minX - padX),
        minY: Math.max(0, minY - padY),
        maxX: Math.min(canvas.width - 1, maxX + padX),
        maxY: Math.min(canvas.height - 1, maxY + padY)
      };
      let outsideAlphaPixels = 0;
      let outsideMidAlphaPixels = 0;
      let totalAlphaPixels = 0;

      if (hasSubjectBox) {
        for (let y = 0; y < canvas.height; y += 1) {
          for (let x = 0; x < canvas.width; x += 1) {
            const alpha = data[(y * canvas.width + x) * 4 + 3];
            if (alpha <= 8) continue;
            totalAlphaPixels += 1;
            const outside =
              x < paddedBox.minX ||
              x > paddedBox.maxX ||
              y < paddedBox.minY ||
              y > paddedBox.maxY;
            if (outside) {
              outsideAlphaPixels += 1;
              if (alpha <= 180) outsideMidAlphaPixels += 1;
            }
          }
        }
      }

      return {
        width: image.naturalWidth,
        height: image.naturalHeight,
        corners,
        center,
        subjectBox: hasSubjectBox ? { minX, minY, maxX, maxY } : null,
        outsideAlphaRatio: totalAlphaPixels ? outsideAlphaPixels / totalAlphaPixels : 0,
        outsideMidAlphaRatio: totalAlphaPixels ? outsideMidAlphaPixels / totalAlphaPixels : 0
      };
    }, dataUrl).catch((error) => {
      failures.push(`${asset}: browser cannot decode image (${error.message})`);
      return null;
    });

    if (!result) continue;

    if (result.width < 768 || result.height < 1024) {
      failures.push(`${asset}: expected a high-resolution vertical sprite, got ${result.width}x${result.height}`);
    }

    if (result.corners.some((alpha) => alpha > 4)) {
      failures.push(`${asset}: corners are not transparent enough (${result.corners.join(", ")})`);
    }

    if (result.center < 80) {
      failures.push(`${asset}: center alpha is too low; subject may be missing (${result.center})`);
    }

    if (!result.subjectBox) {
      failures.push(`${asset}: cannot find an opaque subject bounding box`);
    } else if (result.outsideAlphaRatio > 0.08 || result.outsideMidAlphaRatio > 0.055) {
      failures.push(
        `${asset}: too much semi-transparent alpha outside subject bbox (` +
          `outside=${result.outsideAlphaRatio.toFixed(3)}, mid=${result.outsideMidAlphaRatio.toFixed(3)})`
      );
    }
  }

  await browser.close();
}

if (failures.length) {
  console.error(["Toy asset validation failed:", ...failures.map((failure) => `- ${failure}`)].join("\n"));
  process.exit(1);
}

console.log("Toy asset validation passed.");
