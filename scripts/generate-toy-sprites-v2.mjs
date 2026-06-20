import { existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const pendingScenes = ["sence1", "sence2", "sence3", "sence4", "sence6"];

const codexHome = process.env.CODEX_HOME || path.join(homedir(), ".codex");
const pythonPath =
  process.env.CODEX_IMAGEGEN_PYTHON ||
  path.join(homedir(), ".cache", "codex-runtimes", "codex-primary-runtime", "dependencies", "python", "python.exe");
const imageGenScript = path.join(codexHome, "skills", ".system", "imagegen", "scripts", "image_gen.py");
const chromaScript = path.join(codexHome, "skills", ".system", "imagegen", "scripts", "remove_chroma_key.py");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

function printHelp() {
  console.log(`Generate true v2 toy sprite PNGs for sence1/2/3/4/6.

Usage:
  npm run generate:toys:v2
  npm run generate:toys:v2 -- --scene sence1 --force
  npm run generate:toys:v2 -- --dry-run

Options:
  --scene <id>       Generate one scene. Can be repeated.
  --force            Regenerate source and final PNG even if files exist.
  --dry-run          Print the planned commands without requiring OPENAI_API_KEY.
  --size <WxH>       GPT image size. Default: 1024x1536.
  --quality <value>  GPT image quality. Default: high.
  --no-validate      Skip npm run validate:toys after live generation.
`);
}

function parseArgs(argv) {
  const options = {
    scenes: [],
    force: false,
    dryRun: false,
    validate: true,
    size: "1024x1536",
    quality: "high"
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }

    if (arg === "--force") {
      options.force = true;
      continue;
    }

    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg === "--no-validate") {
      options.validate = false;
      continue;
    }

    if (arg === "--scene") {
      const value = argv[index + 1];
      if (!value) fail("--scene requires a scene id");
      options.scenes.push(value);
      index += 1;
      continue;
    }

    if (arg === "--size") {
      const value = argv[index + 1];
      if (!value) fail("--size requires a value");
      options.size = value;
      index += 1;
      continue;
    }

    if (arg === "--quality") {
      const value = argv[index + 1];
      if (!value) fail("--quality requires a value");
      options.quality = value;
      index += 1;
      continue;
    }

    fail(`Unknown argument: ${arg}`);
  }

  options.scenes = options.scenes.length ? options.scenes : pendingScenes;

  for (const sceneId of options.scenes) {
    if (!pendingScenes.includes(sceneId)) {
      fail(`Unsupported scene "${sceneId}". Expected one of: ${pendingScenes.join(", ")}`);
    }
  }

  return options;
}

function fail(message) {
  console.error(`Toy sprite generation failed: ${message}`);
  process.exit(1);
}

function quote(value) {
  return `"${value}"`;
}

function commandPreview(command, args) {
  return [quote(command), ...args.map((arg) => (arg.includes(" ") ? quote(arg) : arg))].join(" ");
}

function assertFile(filePath, label) {
  if (!existsSync(filePath)) {
    fail(`${label} is missing: ${filePath}`);
  }
}

function run(command, args, label) {
  console.log(`\n[${label}]`);
  console.log(commandPreview(command, args));
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

function checkPythonDependency(moduleName, installName = moduleName) {
  const result = spawnSync(pythonPath, ["-c", `import ${moduleName}`], {
    cwd: root,
    env: process.env,
    stdio: "pipe",
    encoding: "utf8"
  });

  if (result.status !== 0) {
    fail(
      `Python dependency "${moduleName}" is missing. Install it with:\n` +
        `  & ${quote(pythonPath)} -m pip install ${installName}`
    );
  }
}

function scenePaths(sceneId) {
  return {
    reference: path.join(root, "tmp", "toy-sprite-refs-v2", `${sceneId}-reference-clean.jpg`),
    prompt: path.join(root, "docs", "3d-generation", "toy-sprites-v2", `${sceneId}.prompt.txt`),
    sourceGreen: path.join(root, "tmp", "toy-sprite-refs-v2", `${sceneId}-source-green.png`),
    finalPng: path.join(root, "public", "toys", `${sceneId}-toy-2d-v2.png`)
  };
}

function buildImageGenArgs(paths, options) {
  const args = [
    imageGenScript,
    "edit",
    "--model",
    "gpt-image-2",
    "--image",
    paths.reference,
    "--prompt-file",
    paths.prompt,
    "--size",
    options.size,
    "--quality",
    options.quality,
    "--out",
    paths.sourceGreen
  ];

  if (options.force) args.push("--force");
  return args;
}

function buildChromaArgs(paths, options) {
  const args = [
    chromaScript,
    "--input",
    paths.sourceGreen,
    "--out",
    paths.finalPng,
    "--auto-key",
    "border",
    "--soft-matte",
    "--transparent-threshold",
    "12",
    "--opaque-threshold",
    "220",
    "--despill"
  ];

  if (options.force) args.push("--force");
  return args;
}

const options = parseArgs(process.argv.slice(2));

for (const sceneId of options.scenes) {
  const paths = scenePaths(sceneId);
  assertFile(paths.reference, `${sceneId} reference board`);
  assertFile(paths.prompt, `${sceneId} prompt`);
}

assertFile(pythonPath, "bundled Python runtime");
assertFile(imageGenScript, "image generation CLI");
assertFile(chromaScript, "chroma-key removal helper");

if (!options.dryRun) {
  if (!process.env.OPENAI_API_KEY) {
    fail(
      "OPENAI_API_KEY is not set. Set it locally and rerun this command. " +
        "Do not paste the key into chat."
    );
  }

  checkPythonDependency("openai");
  checkPythonDependency("PIL", "pillow");
  mkdirSync(path.join(root, "public", "toys"), { recursive: true });
}

for (const sceneId of options.scenes) {
  const paths = scenePaths(sceneId);
  const finalExists = existsSync(paths.finalPng);
  const sourceExists = existsSync(paths.sourceGreen);

  console.log(`\n=== ${sceneId} ===`);

  if (finalExists && !options.force) {
    console.log(`Skip ${sceneId}: final PNG already exists. Use --force to regenerate.`);
    continue;
  }

  const imageGenArgs = buildImageGenArgs(paths, options);
  const chromaArgs = buildChromaArgs(paths, options);

  if (options.dryRun) {
    console.log(commandPreview(pythonPath, imageGenArgs));
    console.log(commandPreview(pythonPath, chromaArgs));
    continue;
  }

  if (sourceExists && !options.force) {
    console.log(`Reuse existing chroma-key source: ${paths.sourceGreen}`);
  } else {
    run(pythonPath, imageGenArgs, `${sceneId} gpt-image-2 edit`);
  }

  assertFile(paths.sourceGreen, `${sceneId} chroma-key source`);
  run(pythonPath, chromaArgs, `${sceneId} remove chroma key`);
}

if (options.dryRun) {
  console.log("\nDry run complete. No files were generated.");
  process.exit(0);
}

if (options.validate) {
  run(npmCommand, ["run", "validate:toys"], "validate generated toy sprites");
}

console.log("\nToy sprite generation finished.");
