# 3D Asset Handoff

## Current Contract

- Concept image path: `assets/toy-concepts/sence5-concept-v3.png`
- Clean 3D input image: `assets/toy-concepts/sence5-toy-triposr-input-v1.png`
- Prompt pack path: `docs/3d-generation/sence5-prompt-pack.md`
- Model path expected by frontend: `public/models/sence5.glb`
- Frontend URL path after model exists: `/models/sence5.glb`

## Current Status

- `sence5` manifest, prompt pack, and v3 concept image are ready.
- 2D concept images v1/v2 are retained as earlier drafts; v3 is the recommended input for 3D conversion.
- v3 correction: preserves black sunglasses resting on top of the head and a narrower, calmer face direction closer to the approved preview.
- `public/models/sence5.glb` has been generated from the clean isolated toy image.
- The first GLB is a lightweight local prototype from TripoSR. Treat it as `technical prototype / not display-approved`.
- Architecture review result: v1 looks like a low-fidelity photo relief/standee. It is technically loadable, but it is not suitable as the final gift-page character model.

## Route Used

- Tool: official TripoSR code from `tools/TripoSR`.
- Model weights: `stabilityai/TripoSR`, downloaded to `tools/models/TripoSR`.
- Runtime: project-local venv at `tools/triposr-venv`.
- Device: CPU.
- Command style: `run.py <input> --device cpu --no-remove-bg --model-save-format glb --mc-resolution 96`.
- External upload: none. The clean concept image and private photos were not uploaded to a 3D API.
- Local adjustment: `tools/TripoSR/torchmcubes.py` provides a scikit-image fallback for marching cubes because native `torchmcubes` compilation is not available on this Windows/Python 3.12 environment.

## Validation

- File exists: `public/models/sence5.glb`
- File size: 280,032 bytes
- GLB magic: `glTF`
- Trimesh load: passed
- Geometry count: 1
- Vertices: 6,961
- Faces: 13,970
- Three.js `GLTFLoader.parse`: passed, `meshes=1`
- Three.js bounding box size: `[0.9301, 0.9042, 0.3265]`
- Three.js bounding box center: `[-0.0053, 0.0028, 0.0993]`
- Technical validation: passed.
- Display approval: failed. Do not present this as the intended final toy quality.
- Mobile size: lightweight. Draco/Meshopt compression is not needed for this 280KB technical prototype.

## Why V1 Failed Visually

- TripoSR is a single-image reconstruction baseline. It infers hidden back/side geometry from one front-ish illustration, so stylized character details collapse into shallow relief.
- The input concept is a polished 2D render, not a real multi-view model sheet. Hair volume, head-top sunglasses, lace socks, belt discs, bag straps, and face details are visually painted rather than geometrically defined.
- The three-quarter pose and handbag introduce occlusion. Single-image reconstruction cannot reliably separate arm, bag, skirt, hair, and torso volume.
- V1 used low `mc-resolution 96` on CPU for a fast technical pass. This kept the file small but reduced silhouette and accessory fidelity.
- The GLB uses vertex colors, not a high-quality PBR texture workflow. The result is loadable but lacks the cute collectible-toy material quality.
- The local scikit-image marching-cubes fallback is acceptable for proving the path, but it does not solve the core reconstruction-quality problem.

## V2 Recommendation

See `docs/3d-generation/sence5-v2-route.md`.

## Frontend Integration

- Use `modelPath: "/models/sence5.glb"`.
- Current recommendation: keep v1 hidden by default or expose it only behind a `technicalPrototype`/debug toggle.
- Suggested starting transform:
  - `scale`: `2.1` to `2.4`
  - `position`: `[0, -0.1, 0]` then tune visually inside the red wheat-field stage
  - `rotation`: start at `[0, 0, 0]`; use a slow idle Y rotation only if the outfit remains readable
- Keep the existing scene placeholder as fallback if model loading fails.
- The frontend stage should still provide red haze, wheat lights, seaside/venue atmosphere, suitcase, and ticket props. The GLB is toy-only.
