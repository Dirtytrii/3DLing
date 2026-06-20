# Frontend Manifest

The gift page is driven by `src/data/scenes.ts`.

Each scene keeps the photo display, toy generation references, stage style, props, and model path together:

```ts
{
  id: "sence5",
  mainPhoto: "/photos/sence5/3.jpg",
  modelPath: "/models/sence5.glb",
  modelReady: false,
  modelTransform: {
    scale: 0.9,
    position: [-0.08, 0.48, 0],
    rotation: [0, 0.08, 1.5708]
  },
  toyDisplay: {
    type: "sprite",
    imagePath: "/toys/sence5-toy-2d.png",
    height: 2.04,
    position: [-0.05, 1.12, 0.08],
    mobilePosition: [-0.16, 0.32, 0.08],
    responsivePositions: [
      { aspect: 1.42, position: [-0.05, 1.12, 0.08] },
      { aspect: 1.6, position: [-0.05, 1.12, 0.08] },
      { aspect: 1.78, position: [-0.33, 1.12, 0.08] },
      { aspect: 1.84, position: [-0.46, 1.12, 0.08] },
      { aspect: 2.0, position: [-0.52, 1.12, 0.08] }
    ],
    rotation: [0, -0.04, 0],
    glowColor: "#ff5a42"
  },
  backgroundAsset: {
    type: "image",
    imagePath: "/backgrounds/sence5-red-wheat-concert.png",
    position: "center center",
    mobilePosition: "58% center",
    opacity: 0.96
  },
  photoLayout: {
    width: "clamp(300px, 22vw, 430px)",
    marginLeft: "0px",
    desktopX: "-14.5vw",
    maxHeight: "min(58svh, 620px)"
  },
  copyMask: {
    desktopStart: 0.68,
    desktopMid: 0.38,
    desktopEnd: 0.08
  },
  stage: {
    profile: "red-wheat-concert",
    accent: "#f0443e",
    secondary: "#f2b45f",
    floor: "#120708"
  },
  toyReferences: {
    face: ["/photos/sence5/1.jpg"],
    outfit: ["/photos/sence5/2.jpg", "/photos/sence5/3.jpg"],
    mood: ["red wheat-field concert stage", "Haikou beach", "sunset sea"]
  }
}
```

To add a later scene:

1. Add a new folder under `public/photos/<scene-id>/`.
2. Add the generated model as `public/models/<scene-id>.glb`.
3. Add a new entry in `src/data/scenes.ts`.
4. Add a wall-photo entry if the scene should appear in the final photo wall.

When a real GLB is ready, set `modelReady: true` for that scene. While it is `false`, the app does not request the missing GLB. If `toyDisplay.type === "sprite"` is present, the stage shows that transparent PNG as a 2.5D toy; otherwise it shows the Three.js placeholder toy. Use `modelTransform` only for GLB visual tuning after checking the rendered desktop and mobile stage; `scale` is a multiplier applied after bounding-box normalization.

`public/models/sence5.glb` is retained as a technical prototype only. It passed the frontend loading path, but it is a low-fidelity relief/standee and is not display-approved for the normal gift page. Keep `sence5.modelReady` as `false` until a visually approved `public/models/sence5-v2.glb` is available, then update `modelPath`, set `modelReady: true`, and tune `modelTransform` from fresh desktop and mobile screenshots.

For the current `sence5` display, `assets/toy-concepts/sence5-toy-isolated-alpha-v2.png` is copied to `public/toys/sence5-toy-2d.png` and rendered as a transparent sprite inside the shared Three.js stage. If replacing the sprite later, keep the source PNG transparent and update only `toyDisplay.imagePath` plus `height`/`position` after visual QA. Use `toyDisplay.mobilePosition` only when the mobile crop needs a different landing point from desktop. When a sprite must stay aligned to a generated full-screen background that uses CSS `cover`, use `toyDisplay.responsivePositions` to define viewport aspect-ratio stops; `StageCanvas` interpolates between them and reapplies the placement on resize so the toy can track the visible light/platform anchor across desktop widths even though the canvas itself is narrower than the full background layer.

The sprite key-light overlay is intentionally opt-in. `sence5` keeps `toyDisplay.keyLight: true` because the accepted red wheat concert composition needs a head/face spotlight layer. Other generated sprite scenes should leave it unset so the full-plane glow does not read as a colored rectangle behind the toy. If a future scene needs similar lighting, first verify the overlay against that scene's background and then enable it explicitly.

`npm run validate:toys` checks more than file presence: rejected v1 assets must stay out of `public/toys`, v2 PNGs must be high-resolution vertical sprites, corners must be transparent, the center must contain a subject, and the script now rejects excessive low/mid alpha outside the opaque subject bounding box. This catches the "transparent corners but broad semi-transparent background plate" failure mode before a scene is promoted.

`backgroundAsset` drives the reusable full-screen scene background layer. `SceneBackground` preloads declared images, keeps the previous and current layers mounted during transition, and crossfades them for 900ms so `sence1 -> sence5 -> sence6` does not flash or hard-cut. Scenes without a `backgroundAsset` still use the same layer with the ambient stage gradient, so later scene images can be added by filling this field instead of changing CSS. The current `sence5` image was generated from a prompt for an abstract red wheat-field concert background with no people, no performer, no celebrity, no text, no logos, and no recognizable IP.

`backgroundAsset.mask` controls the reusable full-screen background's horizontal dark mask. Use it when a generated plate has good left-third scenic detail that should remain visible behind the copy/photo area. Keep the values as subtle opacity numbers and preserve `sence5` as the locked visual baseline.

`photoLayout` and `copyMask` drive the story foreground composition. `photoLayout.desktopX`, `width`, `maxHeight`, and optional shadow offsets replace the old `#sence5`-only CSS branch so non-`sence5` scenes can use the same left-weighted, layered photo-stack language without scattering per-scene selectors through CSS. `copyMask` controls the section-level text readability veil separately from the background mask. For the 2026-06-20 polish pass, `sence1/2/3/4/6` moved from the screen-middle photo position toward the `sence5` family while keeping title text readable.

The non-`sence5` background PNGs started as `npm run generate:backgrounds` outputs, which render photo-based full-screen stage composites into `public/backgrounds`. They have now been replaced with higher-detail generated full-screen backgrounds while keeping the same `backgroundAsset.imagePath` filenames: `sence1` uses a Dali Bai traditional courtyard, `sence2` uses a Halloween campus night stage, `sence3` uses a graduation campus lawn stage, `sence4` uses a Kunming film-night street stage, and `sence6` uses a Tibet plateau stage. If later replacing any background again, keep the same filename or update `backgroundAsset.imagePath`, then rerun the direct-hash, mobile crop, and crossfade checks.

For scenes whose final sprite file has been planned but not generated yet, keep the future path in `toyDisplay.imagePath` and set `toyDisplay.assetReady: false`. `StageCanvas` treats that as an explicit asset gate and falls back to the Three.js placeholder without requesting a missing PNG. Only switch `assetReady` to `true` after the referenced PNG exists, has transparent corners, has complete feet, and passes visual QA against the `sence5` completion bar. Rejected SVG, HTML/CSS, or dress-up composite outputs must not be promoted by toggling this flag. As of 2026-06-19, `sence1/2/3/4/6` have real v2 toy PNGs and `assetReady: true`. The retained v2 flow is `npm run generate:toys:v2` after `OPENAI_API_KEY` is set, then `npm run promote:toys:v2`; promotion runs `validate:toys`, updates `assetReady`, runs `validate:asset-gate`, and builds. After promotion, run `npm run qa:scenes` to verify direct hash loading, navigation, active rail state, model state, sprite asset load state, background state, single-canvas behavior, horizontal overflow, and missing/rejected asset requests across desktop and mobile viewports.

`sence5` also has scene-specific visual tuning. CSS keeps the main photo anchored left on desktop and uses the existing `.photo-shadow` layers as two muted, offset album cards behind the clear main photo. `StageCanvas` reads `stage.profile: "red-wheat-concert"` to add the red wheat-field concert preset: stadium haze, layered red smoke, a textured platform, a static front stage arc, foreground lamp bulbs with reflections, denser red wheat veil layers, a soft top spotlight, a sprite key-light overlay that follows the toy head/face/shoulders, and a small abstract LED screen. Keep future concert-stage changes behind this preset or a similarly named `stage.profile`; use `#sence5` only for layout tweaks that are truly unique to this scene. The sprite should not use duplicated image glow/rim layers or floating bob animation when the approved direction is a clean toy standing on the stage.

Scene sprite changes now use a small transition layer inside `StageCanvas`: the outgoing sprite remains mounted briefly while fading out, and the incoming sprite fades/scales in before the host reports `data-sprite-loaded="true"` and `data-sprite-transition="settled"`. This keeps scene switches from reading as a hard toy replacement while still cleaning up the outgoing group at rest so only one toy remains visible.

`StageCanvas` keeps the shared toy/stage vertical anchor in `STAGE_ANCHORS`. Adjust the desktop and narrow-screen anchor values there first when placeholder toys or sprite toys feel too low, too large, or clipped by the rail. Use per-scene `toyDisplay.position` or `modelTransform.position` only after the shared anchor has been checked and the scene genuinely needs an individual pose correction. When a sprite texture has actually loaded, the canvas host exposes `data-sprite-loaded="true"` and `data-sprite-asset="<imagePath>"`; QA uses these attributes so screenshots are not taken while a placeholder is still visible.

Navigation active state observes the six story sections plus `#letter` and `#wall`. The Three.js stage only switches for real story scene ids; `#letter` and `#wall` keep the last story scene on stage while their rail dots become active.

The original `photos/` directory is not modified by the app. `public/photos/sence1-6` is a web-served copy for Vite.
