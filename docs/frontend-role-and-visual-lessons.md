# 3Dling Frontend Role And Visual Lessons

Updated: 2026-06-20

This project is a pure frontend gift page. The main risk is not backend correctness, but visual fidelity, asset composition, responsive placement, and scene-to-scene experience. Future work should route through `架构 -> UI/Frontend -> 开发 -> QA/架构验收` unless the task is a narrow code-only fix.

## Role Routing Lessons

- Do not use `开发` as the default owner just because the project is code. For 3Dling, many issues were visual: whether the toy looked like it stood on the stage, whether the light column aligned with the head, whether the background matched the preview, and whether the photo stack felt right. These should be owned first by `UI/Frontend`.
- `架构` should first clarify the requirement and produce a technical options brief for complex new work. The brief should include multiple credible routes, their tradeoffs, dependencies, validation plan, and a recommendation. Only after a route is accepted should it dispatch implementation.
- `UI/Frontend` owns visual direction, target composition, reference matching, responsive acceptance, and screenshot/crop criteria.
- `开发` owns implementation after the visual route is accepted: data fields, React/Three.js components, asset gates, build scripts, and browser bug fixes.
- `QA` or `架构` owns acceptance. It should compare against the accepted visual target and preserve locked constraints instead of opening a broad redesign.

## Required Architecture Plan For New Complex Frontend Work

For a new complex requirement, the architecture output should include:

```text
【技术方案】
- 方案 A：路线、适用点、成本、质量上限、风险、验证方式
- 方案 B：路线、适用点、成本、质量上限、风险、验证方式
- 方案 C：路线、适用点、成本、质量上限、风险、验证方式
- 可选方案 D/E：如果确实存在
- 推荐方案：
- 需要用户/架构确认：
```

For visual frontend work, options should cover at least:

- background/scene asset route;
- toy/model asset route;
- frontend implementation route;
- transition and interaction route;
- QA screenshot matrix and acceptance crops.

Do not dispatch `开发` until the selected route is clear.

## Visual Implementation Lessons From Sence5

- Generated full-screen background plates are better than low-poly Three.js geometry when the target is photo-grade wheat, haze, stage lights, stadium depth, or realistic atmosphere.
- Three.js should focus on compositing and subtle dynamic accents when a static art plate can carry the scene. Do not force every visual layer into geometry.
- Keep one reusable full-screen background layer with preload and crossfade. Scene switches should not hard-cut or flash.
- 2.5D transparent toy sprites are acceptable for the first display release when GLB quality is lower than the visual target. Do not promote GLB just because it technically loads.
- Accepted constraints must be locked before later polish. For sence5, the locked constraints became: generated full-screen red wheat background, photo stack, toy on circular platform, light column aligned with toy, responsive anchor behavior, direct hash support, and single canvas.
- Sprite key-light overlays should be opt-in. A light plane that helps sence5 can read as a colored rectangle in other scenes.
- If a background uses CSS `cover`, toy placement must be viewport-aware, not just canvas-coordinate-aware. Use aspect-ratio stops such as `toyDisplay.responsivePositions` when the visible background landmark moves across viewport widths.
- Grounding should be judged with crops, not only full screenshots. Keep feet/platform crops and head/light crops for scenes that depend on stage contact or spotlight alignment.
- Asset QA must check alpha beyond transparent corners. A PNG can have transparent corners but still contain a broad semi-transparent plate around the toy.
- Browser tooling on Windows can be unstable for local navigation or screenshots. Record the Browser failure, then use Playwright plus local Chrome as the fallback evidence path.

## Reusable QA Matrix

For a scene-level visual change, verify:

- direct hash load for the target scene;
- click navigation into and out of the scene;
- desktop viewports at 1398x986, 1440x900, 1920x1080, and any user-reported wide viewport;
- mobile viewport at 390x844;
- one active toy/model only;
- one canvas only;
- no horizontal overflow;
- no console/page/request errors;
- background crossfade has previous and active layers during transition;
- scene-specific crops when needed: full scene, feet/platform, head/light, photo/title overlap.

## Future Scene Expansion Rule

For future scenes, the preferred route is:

1. `架构` writes a multi-option technical plan and confirms route.
2. `UI/Frontend` defines visual direction, composition, background/toy acceptance target, and screenshot matrix.
3. Asset generation produces background and transparent toy sprites, then validates alpha and visual completeness.
4. `开发` implements only the accepted data/component changes.
5. `QA` or `架构` verifies with screenshots, crops, runtime assertions, and locked-baseline checks.

This keeps frontend polish from becoming a loop of random code nudges.
