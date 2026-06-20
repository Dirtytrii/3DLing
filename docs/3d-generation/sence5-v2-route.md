# sence5 V2 Model Route

## Current Decision

`public/models/sence5.glb` is a technical prototype only. It proves the frontend path, GLB validation, and loading contract, but it is not display-approved.

Do not overwrite it. Any next model should use:

```text
public/models/sence5-v2.glb
```

Local GPU observed on 2026-06-17:

```text
NVIDIA GeForce RTX 5060 Laptop GPU, 8151 MiB VRAM
```

## V1 Failure Judgment

The failure is mainly asset-generation quality, not frontend placement.

Likely causes:

- Single-image reconstruction from one stylized front/three-quarter render creates a shallow relief rather than a fully designed toy.
- The v1 input image bakes hair, lace socks, belt discs, bag straps, sunglasses, face sparkles, and black outfit details into pixels; TripoSR cannot recover all those as stable geometry from one image.
- The handbag and pose hide parts of the body; single-image methods guess the missing back/side.
- The low CPU prototype used `mc-resolution 96`, which is good for a fast path but too coarse for final character details.
- The output uses vertex-color style appearance, not a PBR/material workflow, so it reads dark and flat under the gift-page lighting.

## Recommended V2 Routes

### 1. API / Online Multi-Image Route

Best balance of speed and quality.

Use a service that supports multi-image or image-to-model with higher-quality textured output:

- Tripo API or Tripo Studio: supports image-to-model and multi-image-to-3D workflows.
- Hyper3D Rodin: supports image-to-3D; Rodin3D skill/API can be used if the user provides API access.

Recommended input package:

- `assets/toy-concepts/sence5-concept-v3.png` as style/face target.
- `assets/toy-concepts/sence5-toy-isolated-neutral-v1.png` as clean full-body subject input.
- Optional generated turntable/model sheet: front, 3/4 side, side, back views on a neutral background.

Privacy impact:

- Uploads the generated toy concept image. It does not need to upload the original private photos if the v3 concept is accepted as the reference.
- If a service requires original references for identity/outfit preservation, stop and ask user approval first.

User needs to provide:

- Tripo developer account/API key, or Rodin account with the required API subscription/API key, or permission to use the web UI manually.
- Whether uploading the generated toy concept image is allowed.

Current output status:

- `assets/toy-concepts/sence5-turntable-v2.png`: not generated yet.
- `public/models/sence5-v2.glb`: not generated yet.

### 2. Local Hunyuan3D 2.1

Better open-source quality potential, but risky on this machine.

Official Hunyuan3D 2.1 notes indicate roughly:

- shape generation: about 10GB VRAM;
- texture generation: about 21GB VRAM;
- full shape + texture pipeline: about 29GB VRAM.

This machine has about 8GB VRAM, so a full local Hunyuan3D 2.1 textured run is not a safe default. It may require CPU/offload/community low-memory wrappers and a longer troubleshooting pass.

Official Hunyuan3D-2 also lists lighter 2.1-series mini models with lower requirements, but those still imply a new CUDA/PyTorch environment, multi-GB weights, and likely texture-generation compromises on an 8GB laptop GPU.

Use only after explicit approval for large model downloads and environment work.

### 3. Local TRELLIS / TRELLIS.2

High-quality image-to-3D direction, but also large and setup-heavy.

TRELLIS.2 is a 4B-parameter high-fidelity image-to-3D model. It is promising for final asset quality, but not a low-risk next step on an 8GB Windows laptop unless the user accepts large downloads, CUDA/PyTorch environment work, and long iteration time.

### 4. TripoSR V1.5 Local Improvement

Lowest effort but least likely to solve final quality.

Possible improvements:

- generate a real front/side/back turntable image sheet;
- rerun TripoSR at `mc-resolution 192` or `256`;
- try `--bake-texture`;
- simplify the toy pose: arms away from torso, no handbag, no lace details.

Risk:

- Still single-image reconstruction, so it may remain relief-like. This is useful only as an interim experiment, not the recommended final route.

## Low-Risk Next Step

Before any external service or large local model:

1. Generate a clean turntable/model-sheet image for the accepted toy design:
   - front view;
   - 3/4 front;
   - side view;
   - back view;
   - neutral background;
   - no stage props.
2. Save it as `assets/toy-concepts/sence5-turntable-v2.png`.
3. Use that image with a multi-image-capable API/service, or manually as a guide for a better generator.

Do not mark `public/models/sence5-v2.glb` complete until it passes:

- file exists and starts with `glTF`;
- Three.js `GLTFLoader` parses it;
- visual screenshot confirms it reads as a full cute collectible toy rather than a flat standee.

## Frontend Guidance

- Keep `/models/sence5.glb` out of normal display by default.
- Keep it only as a technical-prototype/debug toggle if useful.
- Continue showing the placeholder toy or concept-stage visual until `public/models/sence5-v2.glb` is display-approved.

## Official Sources Checked

- Tripo API documentation: `https://platform.tripo3d.ai/`
- Tripo multi-image capability page: `https://www.tripo3d.ai/api`
- Hyper3D Rodin Gen-2 generation docs: `https://developer.hyper3d.ai/api-specification/rodin-generation-gen2_reset_v`
- Hunyuan3D 2.1 official GitHub: `https://github.com/Tencent-Hunyuan/Hunyuan3D-2.1`
- Hunyuan3D-2 official GitHub, including 2.1-series mini notes: `https://github.com/Tencent-Hunyuan/Hunyuan3D-2`
- TRELLIS official GitHub: `https://github.com/microsoft/TRELLIS`
- TRELLIS.2 project page: `https://microsoft.github.io/TRELLIS.2/`
