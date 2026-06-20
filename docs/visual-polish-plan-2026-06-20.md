# Visual Polish Plan 2026-06-20

Scope: `sence1/2/3/4/6` visual parity with the accepted `sence5` baseline.

Current user-reported issues:

- Non-`sence5` photo stacks sit too close to the screen center. `sence5` overlaps the title/background more naturally without hurting readability.
- Non-`sence5` left-side background reads too dark or almost black, while `sence5` keeps visible full-screen background detail behind the photo and copy.
- Some generated backgrounds place the stage/platform landmark too high or too central. If the toy is moved to stand on that platform, toy positions drift too much between scenes.
- Scene switching currently feels like a hard cut. `SceneBackground` crossfades the background, but the foreground photo/copy and Three.js toy replacement are not coordinated into a visible scene transition.

## Technical Options

### Option A: CSS/Data Nudge Only

Adjust existing CSS and scene data without regenerating backgrounds.

- Move all non-`sence5` photo stacks left using the same overlap family as `sence5`.
- Lighten the left overlay mask for all generated-background scenes.
- Tune `backgroundAsset.position`, `toyDisplay.position`, and a few `responsivePositions`.
- Add basic CSS transitions to active story sections.

Fit: fastest.

Risk: high chance of chasing per-scene numbers. It does not solve backgrounds whose stage/platform is baked in the wrong place.

Validation: screenshot matrix plus feet/platform crops.

### Option B: Regenerate Misaligned Backgrounds + Data-Driven Layout Pass

Regenerate only the non-`sence5` backgrounds whose stage anchor or left-side detail is wrong, then make photo layout and foreground transitions data-driven.

- New background generation prompt must lock a consistent toy landing anchor: stage/platform center around the right stage area, with enough top/side breathing room.
- New background prompt must require visible detail in the left third, not pure black, while still leaving readable space for text and photo stack.
- Keep toy positions comparatively stable; avoid solving baked-background stage errors by moving toys wildly.
- Generalize the `sence5` photo stack layout into a reusable scene/photo layout, not a `#sence5` one-off.
- Add coordinated foreground transitions for photo/copy/toy while keeping the existing background crossfade.

Fit: best balance for the user's current complaints.

Risk: requires asset regeneration and a visual selection pass.

Validation: compare all six scenes against the `sence5` baseline at 1398x986, 1440x900, 1920x1080, 2048x1117, and 390x844.

### Option C: Full Motion System

Build a richer route-level scene transition system, possibly with GSAP or an internal transition state machine.

- Keep previous and next scene states alive during transition.
- Animate background, photo stack, copy, toy sprite, rail indicator, and stage light accents on one timeline.
- Add scroll/rail transition easing and optional parallax.

Fit: highest motion quality.

Risk: bigger implementation surface. It may distract from the current main issue: background/stage asset alignment.

Validation: full navigation video capture plus screenshot matrix.

### Option D: UI Overlay Compensation

Keep existing backgrounds, but add semi-transparent scenic overlays, light panels, or local platform plates to compensate for dark left areas and misplaced stages.

Fit: avoids regeneration.

Risk: can look patched together and may reintroduce the "colored plate" feeling that was just removed.

Validation: strict visual review against `sence5`; reject if overlays read as UI patches.

## Recommended Route

Use Option B first, with a small piece of Option C for transition polish.

Reason:

- The user correctly identified that some stage/platform anchors are baked into the background. Moving toys to match every broken platform would make toys drift too much between scenes.
- `sence5` worked because the full-screen background, photo stack, toy, platform, and light anchor formed one composition. Other scenes should follow that asset-level composition rule instead of being repaired only with CSS.
- The hard-cut feeling needs more than the existing 900ms background crossfade: toy and foreground layers need their own transition.

## UI/Frontend Work Package

Primary owner: `UI/Frontend`.

Tasks:

1. Audit `sence1/2/3/4/6` against `sence5` at desktop 1398x986 and the user-reported wide viewport.
2. Mark which backgrounds must be regenerated because the platform/toy landing point is not aligned to the shared right-stage anchor.
3. Produce background prompt constraints for each regenerated scene:
   - 16:9 cinematic full-screen background;
   - visible left-third scenic detail, not pure black;
   - readable text/photo area on the left;
   - stage/platform landing point consistently on the right stage area;
   - no people, no text, no logo, no watermark, no celebrity/IP;
   - scene-specific mood preserved.
4. Define reusable desktop photo layout:
   - photo stack sits closer to the viewer/left edge like `sence5`;
   - enough overlap with title/background to feel integrated;
   - no title/photo collision.
5. Define transition target:
   - background crossfade remains;
   - active photo/copy enter with delayed opacity/translate;
   - toy sprite fades/slides/scales instead of instantly replacing;
   - one toy visible at rest, temporary overlap allowed only during transition.

Output:

- list of backgrounds to regenerate;
- prompt pack or generated background assets;
- visual acceptance notes and reference screenshots;
- handoff to `开发` with exact file/data changes.

## Development Work Package

Owner: `开发`, after UI/Frontend route is accepted.

Allowed files:

- `src/data/scenes.ts`
- `src/components/SceneBackground.tsx`
- `src/components/StorySection.tsx`
- `src/components/StageCanvas.tsx`
- `src/styles.css`
- `docs/frontend-manifest.md`
- `public/backgrounds/*` only for approved regenerated backgrounds

Implementation requirements:

1. Add a reusable `photoLayout` or CSS variable route instead of keeping `#sence5` as the only left-overlap layout.
2. Reduce the generic left black mask for generated-background scenes while preserving text readability.
3. Keep `sence5` locked unless regression fixes are required.
4. If new backgrounds are added, prefer replacing the same filenames only after UI approval, or use `*-v2.png` and update `backgroundAsset.imagePath`.
5. Implement toy transition in `StageCanvas`:
   - do not instantly clear the old sprite on scene change;
   - keep outgoing and incoming sprite groups for the transition window;
   - animate material opacity plus a subtle y/scale/rotation entrance;
   - remove outgoing sprite after the transition;
   - expose stable QA attributes so screenshots wait for settled state.
6. Implement foreground transition:
   - copy/photo section active state should have visible staggered enter;
   - avoid long animations that fight scroll snapping;
   - respect `prefers-reduced-motion`.

Validation:

- `npm run validate:toys`
- `npm run validate:asset-gate`
- `npm run build`
- `npm run qa:scenes -- --screenshots`
- visual review of full scene, photo/title overlap, left-background detail, and feet/platform crops.

## Acceptance Criteria

- Non-`sence5` photo stacks are visually closer to `sence5`: left-weighted, layered, integrated with the title/background, but still readable.
- Non-`sence5` left-side backgrounds retain clear scene detail instead of becoming flat black.
- Toy positions across scenes remain reasonably consistent; background stages are regenerated when their baked platform forces excessive toy drift.
- Every toy reads as standing on the intended stage/platform center or natural ground plane.
- Scene switching has a noticeable but soft transition across background, photo/copy, and toy; it no longer feels like a hard cut.
- `sence5` accepted baseline does not regress.

## UI/Frontend Execution Notes

2026-06-20 UI/Frontend pass:

- Visual audit result: `sence1/2/3/4/6` backgrounds did not require replacement. Their generated plates already provide usable right-side platform or ground anchors, and the toy feet read as grounded after the existing sprite placement. The main issues were foreground composition and masking.
- Implemented the layout pass with scene data instead of new selectors: `photoLayout` controls photo width, desktop offset, max height, and shadow spread; `copyMask` controls the story-section readability veil; `backgroundAsset.mask` controls the full-screen background veil.
- Kept `sence5` locked by moving its previous CSS-only photo values into `photoLayout` and leaving its toy `height`, `position`, `mobilePosition`, and `responsivePositions` unchanged.
- Reduced non-`sence5` left-side dark masking so courtyard, campus, street, and Tibet details remain visible behind the copy/photo area.
- Added foreground motion: story copy and photo stack now enter with coordinated opacity/translate easing, and `StageCanvas` keeps an outgoing sprite briefly while the incoming sprite fades/scales in. The stage host reports `data-sprite-transition="settled"` after cleanup.
- No `public/backgrounds/*` files were regenerated or replaced in this pass.
