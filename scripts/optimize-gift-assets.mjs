import sharp from "sharp";
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

// Originals are immutable. Only runtime derivatives and their manifest change.
const root = process.cwd();
const output = path.join(root, "public/optimized");
await mkdir(output, { recursive: true });
const plates = (await readdir("public/gift")).filter((name) => name.endsWith(".png")).map((name) => `/gift/${name}`);
const toys = Array.from({ length: 6 }, (_, index) => `/toys/sence${index + 1}-toy-2d${index === 4 ? "" : "-v2"}.png`);
const manifest = {};
let before = 0, after = 0;
for (const src of [...plates, ...toys]) {
  const original = await readFile(path.join(root, "public", src));
  const lossless = src.startsWith("/toys/");
  const data = await sharp(original).webp(lossless ? { lossless: true, effort: 6 } : { quality: 90, effort: 6 }).toBuffer();
  const digest = createHash("sha256").update(data).digest("hex").slice(0, 10);
  const name = `${path.basename(src, ".png")}.${digest}.webp`;
  await writeFile(path.join(output, name), data);
  manifest[src] = `/optimized/${name}`;
  before += original.length; after += data.length;
  console.log(`${src}: ${(original.length / 1024).toFixed(0)} → ${(data.length / 1024).toFixed(0)} KB${lossless ? " (lossless alpha)" : ""}`);
}
await writeFile("src/data/optimizedAssets.json", `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Generated ${Object.keys(manifest).length} assets: ${(before / 1048576).toFixed(2)} → ${(after / 1048576).toFixed(2)} MB`);
