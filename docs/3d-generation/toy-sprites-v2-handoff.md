# Toy Sprites V2 Handoff

## Status

The five non-sence5 toy sprites are now generated, cleaned, validated, and promoted into the frontend.

Final files:

- `D:\javaProjects\personal\3Dling\public\toys\sence1-toy-2d-v2.png`
- `D:\javaProjects\personal\3Dling\public\toys\sence2-toy-2d-v2.png`
- `D:\javaProjects\personal\3Dling\public\toys\sence3-toy-2d-v2.png`
- `D:\javaProjects\personal\3Dling\public\toys\sence4-toy-2d-v2.png`
- `D:\javaProjects\personal\3Dling\public\toys\sence6-toy-2d-v2.png`

They were generated as complete 2.5D cute designer toy sprites, not as sence5 dress-up overlays, SVGs, HTML/CSS composites, vector stand-ins, or placeholder screenshots.

## Source And Processing

The accepted route for this batch used the built-in image generation tool, then extracted the generated PNG payloads from the local Codex session record because the default `$CODEX_HOME/generated_images` save path was not updated for these calls.

Chroma-key sources:

- `D:\javaProjects\personal\3Dling\tmp\imagegen\sence1-source-green.png`
- `D:\javaProjects\personal\3Dling\tmp\imagegen\sence2-source-green.png`
- `D:\javaProjects\personal\3Dling\tmp\imagegen\sence3-source-green.png`
- `D:\javaProjects\personal\3Dling\tmp\imagegen\sence4-source-green.png`
- `D:\javaProjects\personal\3Dling\tmp\imagegen\sence6-source-green.png`

Post-processing:

- local chroma-key removal via `C:\Users\12156\.codex\skills\.system\imagegen\scripts\remove_chroma_key.py`;
- edge despill for near-transparent green fringe;
- browser/data-URL alpha validation via `npm run validate:toys`.

## Scene Notes

- `sence1`: toddler childhood version, short dark hair, white/light floral clothes, soft round cheeks.
- `sence2`: university Halloween version, twin ponytails, cute face doodle makeup, black outfit, pumpkin accessory.
- `sence3`: graduation version, black gown, white ceremonial collar, bouquet and diploma.
- `sence4`: Kunming film-camera/new-year version, black puffer jacket, compact film camera accessory.
- `sence6`: Tibet travel version, dark outfit with warm orange/yellow trim, backpack and restrained highland travel accents.

## Frontend Promotion

The assets were promoted with:

```powershell
npm run promote:toys:v2
```

Promotion changed `src/data/scenes.ts` for `sence1/2/3/4/6` from `toyDisplay.assetReady: false` to `toyDisplay.assetReady: true`, then ran:

```powershell
npm run validate:toys
npm run validate:asset-gate
npm run build
```

`build` passes with only the existing Three.js chunk-size warning.

## QA

Full scene QA with screenshots passed:

```powershell
npm run qa:scenes -- --screenshots
```

Latest full-scene screenshot directory after toy promotion and generated background replacement:

```text
C:\Users\12156\AppData\Local\Temp\3dling-scene-qa-1781823549698
```

`qa:scenes` now waits for real sprite load using:

- `data-model-state="sprite"`;
- `data-sprite-loaded="true"`;
- `data-sprite-asset="<expected toy path>"`.

This closes the previous blind spot where a scene could report `sprite` while still visually rendering the placeholder toy.

## Archived Rejected Assets

Rejected older assets remain outside `public/toys`:

```text
D:\javaProjects\personal\3Dling\tmp\rejected-toy-assets-v1
```

Do not move them back into `public/toys`.

## CLI/API Route Kept For Future Regeneration

`OPENAI_API_KEY` is still not set in this environment, so the scripted CLI/API generator remains a future reproducibility route rather than the route used for this completed batch.

Prepared references and prompt files are still useful if the user later wants another pass:

- `D:\javaProjects\personal\3Dling\tmp\toy-sprite-refs-v2\*-reference-clean.jpg`
- `D:\javaProjects\personal\3Dling\docs\3d-generation\toy-sprites-v2\*.prompt.txt`

Commands:

```powershell
npm run generate:toys:v2 -- --dry-run
npm run generate:toys:v2
npm run generate:toys:v2 -- --scene sence1 --force
```

The live `generate:toys:v2` command still requires a local `OPENAI_API_KEY`.
