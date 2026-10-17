# Frontend Manifest

## 2026-10-15 当前生日主题入口

当前页面由 `App.tsx` 组合礼物封面、六幕回忆、生日许愿、开信和照片墙。`src/data/scenes.ts` 继续保存原照片/玩偶/回忆文案；`src/data/dreamScenes.ts` 派生新布景和平台接触点；`src/data/gift.ts` 保存生日配置与待填写信件。

实际舞台入口是 `DreamStageCanvas.tsx`：一个正交 Three.js 画布，以原图 cover 比例和 PNG 透明边界定位玩偶，静止/隐藏时停止绘制。旧 `StageCanvas.tsx` 与下文的世界坐标、移动端数据保留为历史实现，当前页面不再读取其位置配置。本轮只支持电脑端。

设计、素材和本轮验收见 `docs/birthday-redesign.md`、`docs/gift-assets.md`。下文是之前版本的数据字段说明，不作为新生日主题构图基线。

## 2026-10-16 当前加载与字体机制

用户要求完整准备后再进入，覆盖下文历史的“只等待首屏”策略。当前 `src/lib/resources.ts` 收集整段体验的 40 张图片（含全部相册照片及新增四张信件素材）与 2 个本地字体，六路并发、去重加载，图片等待 `decode()`；随后 `DreamStageCanvas` 上传六幕纹理并预编译共用材质。全部成功后加载页淡出、解除滚动和交互锁；失败停留并重试，超时不会被当作完成。

生产路径通过 `src/data/optimizedAssets.json` 指向内容哈希 WebP：布景质量 90、玩偶无损，照片保留原 JPG。纸张/信封/安静背景使用与预载清单相同的 CSS 变量路径。本地 Noto Serif SC / Sans SC 字体在闸门内加载，裁剪与授权见 `docs/loading-and-motion-polish.md`。原 `scenes.ts` 和原 PNG 不变。

背景和玩偶过渡统一为 800ms；背景保留不透明旧层，逐层叠入新图，快速返回仍保留底层；静止后清理。文字按标题、次标题、正文、照片顺序错峰进入，系统减少动态效果时立即收尾并停止持续动画。

新增验收：`npm run qa:resources` 覆盖最后一张图库图片、字体阻塞、失败重试、真实锁屏、全图库缓存、快速滚动和中断切幕；原 `qa:gift` / `qa:scenes` 继续覆盖桌面交互与落点。

## 2026-10-16 信件细化与聚焦阅读

`LetterSection.tsx` 使用独立棉纸信封、星形封蜡、九宫格信纸边缘和匹配的纸纤维素材，开信约 2100ms，可跳过。正文按空行分段，单个换行保留，长信随页面自然伸展；没有自动滚动和内部滚动容器。

`useReadingFocus.ts` 按实际可见纸面启停，2026-10-17 重做为逐行阅读：缓存原生 Range 行矩形，滚动按视口 48% 阅读线选择真实文字行，边界设置约 0.16 行高滞回；鼠标同一行停留 160ms 后才接管，手动滚动立即取消待切换任务并恢复位置聚焦。默认开启，无纸面开关。当前行的字形内墨色渐深，左侧内页边 18px 星芒跟随，约 540ms 过渡；此前椭圆纸面柔光已移除。正文只渲染一份原生文字，全文不模糊、不改字号/字重/透明度；选字时隐藏星芒并恢复统一墨色，减少动态效果时立即切换。单个超长段落也逐行处理；几何仅随排版变化重测，监听按需合并到单次 rAF，离开/隐藏清理，空闲没有循环。当前为用户提供开头加 xxx 占位，正式原文待提供。设计、素材和 `qa:letter` 验收见 `docs/letter-stationery-and-focus.md`。

## 2026-10-17 悬挂软纸微风

展开后的 `LetterSection` 将稳定的原生文字与 `PaperBreeze.tsx` 装饰纸面分层。纸面复用原九宫格纸边和棉纸纹理，通过原生 SVG 连续形变，上缘约 96px 权重接近零、向下渐强，长信不会扩大固定区域；18 秒缓动叠加轻微姿态、斜向明暗与悬空阴影，反光限制在纸面内部。形变不施加到标题、段落或阅读星芒，不新增外部图片请求、依赖、Canvas 或 JavaScript 动画循环。纸张长度或窗口变化时更新悬点权重区域，长信继续自然滚动。

仅实际可见且已展开时运行；选字、页面隐藏或离开纸面暂停 SVG 与 CSS 动画。减少动态效果时关闭纸面形变并恢复静态表面。原生选择复制、逐行聚焦和无开关约束不变，具体设计与三尺寸动态证据见 `docs/letter-stationery-and-focus.md`。

## 2026-10-16 许愿前的自然滚动边界

新会话从 intro、回忆或 birthday 进入时，`App` 将信件与照片墙包在 `hidden` 容器中，页面可滚动高度止于蛋糕页。滚轮、触控板、键盘和拖动滚动条都使用浏览器原生边界，仍可向上回看。650ms 吹灭结束进入 celebrating 后展开后续内容，不自动移动页面；减少动态效果时立即完成。点击“再许个愿”会重新收起后续内容，已读信件组件状态保留。

既有“跳过，读信”、目录与直接信件/照片墙锚点仍可明确进入后续内容；目录点击也处理当前 hash 未变化的情况。展开隐藏目标后在布局阶段对齐，当前幕随真实视口更新，避免平滑滚动途中提前触发并中断开信动画。完整资源预载仍覆盖全部图片、字体和六幕纹理，不以隐藏代替加载。

## 历史场景数据字段（以下加载策略已被上文替代）

The gift page is driven by `src/data/scenes.ts`.

Each scene keeps the photo display, toy generation references, stage style, props, and model path together:

```ts
{
  id: "sence5",
  mainPhoto: "/photos/sence5/3.jpg",
  photoStack: ["/photos/sence5/3.jpg", "/photos/sence5/1.jpg", "/photos/sence5/2.jpg"],
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

`toyDisplay.fillLight` is the safer per-scene sprite brightening path for non-concert scenes. It duplicates the same transparent toy PNG as a low-opacity additive layer, so the lift is clipped to the sprite alpha instead of drawing a rectangular light card behind the toy. Tune `color`, `opacity`, and optional `scale` per scene. Use `toyDisplay.bodyLift` for a very light normal-blended duplicate when black clothing, shoes, or hair need more readable detail than additive highlights can provide. Both fields must stay subtle and alpha-clipped; if a scene starts showing white edges, halos, or a cutout-card look, reduce `bodyLift.opacity` first. `sence5` still keeps its dedicated `keyLight` for the accepted concert spotlight, with only small alpha-clipped sprite lift allowed when the toy itself needs more legibility.

`toyDisplay.contactShadow` is an optional per-sprite calibration for the dark contact ellipse under a 2.5D toy. Use `yOffset`, `xOffset`, `zOffset`, `scale`, and `opacity` only when the PNG's transparent padding makes the default shadow detach from the visible feet or slide onto the platform edge. Keep foot/platform placement in `height`, `position`, `mobilePosition`, and `responsivePositions`; use `contactShadow` to make the grounding shadow meet the already-approved foot landing point.

`npm run validate:toys` checks more than file presence: rejected v1 assets must stay out of `public/toys`, v2 PNGs must be high-resolution vertical sprites, corners must be transparent, the center must contain a subject, and the script now rejects excessive low/mid alpha outside the opaque subject bounding box. This catches the "transparent corners but broad semi-transparent background plate" failure mode before a scene is promoted.

`backgroundAsset` drives the reusable full-screen scene background layer. `SceneBackground` preloads declared images, keeps the previous and current layers mounted during transition, and crossfades them for 900ms so `sence1 -> sence5 -> sence6` does not flash or hard-cut. Scenes without a `backgroundAsset` still use the same layer with the ambient stage gradient, so later scene images can be added by filling this field instead of changing CSS. The current `sence5` image was generated from a prompt for an abstract red wheat-field concert background with no people, no performer, no celebrity, no text, no logos, and no recognizable IP.

`LoadingScreen` is the first-load cover for slow static hosting/CDN starts. `App` keeps the real scene tree mounted but visually hidden until the initial story scene's background image, main photo, ready sprite PNG, and stage/background DOM state are ready, with a short minimum display time to avoid a flash. The shell exposes `data-app-ready="true"` only after this boot gate, and `qa:scenes` waits for that attribute before taking screenshots or clicking navigation. Keep the loading template CSS-only so it does not add more first-load image requests.

Only the active scene's visual assets should compete for first paint. Other generated scene backgrounds are preloaded after `data-app-ready="true"` during an idle callback or a delayed timer fallback. Do not move all-scene background preloading back into initial mount; it makes Cloudflare cold starts compete with six large background images and can keep the loading screen up longer than the visible scene needs.

`backgroundAsset.mask` controls the reusable full-screen background's horizontal dark mask. Use it when a generated plate has good left-third scenic detail that should remain visible behind the copy/photo area. Keep the values as subtle opacity numbers and preserve `sence5` as the locked visual baseline.

`photoStack` is an optional ordered gallery for the story photo stack. `mainPhoto` remains the default story image and the photo-wall fallback, while `StorySection` can promote any `photoStack` image to the visible main photo when a real back card is clicked. Keep the first entry aligned with `mainPhoto` for predictable reset behavior when revisiting a scene; back cards are rendered as accessible image buttons and should use real photos from `public/photos/<scene-id>/`, not decorative placeholders.

`photoLayout` and `copyMask` drive the story foreground composition. `photoLayout.desktopX`, `width`, `maxHeight`, and optional shadow offsets replace the old `#sence5`-only CSS branch so non-`sence5` scenes can use the same left-weighted, layered photo-stack language without scattering per-scene selectors through CSS. `copyMask` controls the section-level text readability veil separately from the background mask. For the 2026-06-20 polish pass, `sence1/2/3/4/6` moved from the screen-middle photo position toward the `sence5` family while keeping title text readable.

The non-`sence5` background PNGs started as `npm run generate:backgrounds` outputs, which render photo-based full-screen stage composites into `public/backgrounds`. They have now been replaced with higher-detail generated full-screen backgrounds while keeping the same `backgroundAsset.imagePath` filenames: `sence1` uses a Dali Bai traditional courtyard, `sence2` uses a Halloween campus night stage, `sence3` uses a graduation campus lawn stage, `sence4` uses a Kunming film-night street stage, and `sence6` uses a Shangri-La highland travel stage while retaining the existing background filename. If later replacing any background again, keep the same filename or update `backgroundAsset.imagePath`, then rerun the direct-hash, mobile crop, and crossfade checks.

For scenes whose final sprite file has been planned but not generated yet, keep the future path in `toyDisplay.imagePath` and set `toyDisplay.assetReady: false`. `StageCanvas` treats that as an explicit asset gate and falls back to the Three.js placeholder without requesting a missing PNG. Only switch `assetReady` to `true` after the referenced PNG exists, has transparent corners, has complete feet, and passes visual QA against the `sence5` completion bar. Rejected SVG, HTML/CSS, or dress-up composite outputs must not be promoted by toggling this flag. As of 2026-06-19, `sence1/2/3/4/6` have real v2 toy PNGs and `assetReady: true`. The retained v2 flow is `npm run generate:toys:v2` after `OPENAI_API_KEY` is set, then `npm run promote:toys:v2`; promotion runs `validate:toys`, updates `assetReady`, runs `validate:asset-gate`, and builds. After promotion, run `npm run qa:scenes` to verify direct hash loading, navigation, active rail state, model state, sprite asset load state, background state, single-canvas behavior, horizontal overflow, and missing/rejected asset requests across desktop and mobile viewports.

`sence5` also has scene-specific visual tuning. CSS keeps the main photo anchored left on desktop and uses the existing `.photo-shadow` layers as two muted, offset album cards behind the clear main photo. `StageCanvas` reads `stage.profile: "red-wheat-concert"` to add the red wheat-field concert preset: stadium haze, layered red smoke, a textured platform, a static front stage arc, foreground lamp bulbs with reflections, denser red wheat veil layers, a soft top spotlight, a sprite key-light overlay that follows the toy head/face/shoulders, and a small abstract LED screen. Keep future concert-stage changes behind this preset or a similarly named `stage.profile`; use `#sence5` only for layout tweaks that are truly unique to this scene. The sprite should not use duplicated image glow/rim layers or floating bob animation when the approved direction is a clean toy standing on the stage.

Scene sprite changes now use a small transition layer inside `StageCanvas`: the outgoing sprite remains mounted briefly while fading out, and the incoming sprite fades/scales in before the host reports `data-sprite-transition="settled"`. `data-sprite-loaded="true"` means the sprite texture has been loaded and mounted; QA requires both `data-sprite-loaded="true"` and `data-sprite-transition="settled"` before taking scene screenshots. This keeps scene switches from reading as a hard toy replacement while still cleaning up the outgoing group at rest so only one toy remains visible.

`StageCanvas` keeps the shared toy/stage vertical anchor in `STAGE_ANCHORS`. Adjust the desktop and narrow-screen anchor values there first when placeholder toys or sprite toys feel too low, too large, or clipped by the rail. Use per-scene `toyDisplay.position` or `modelTransform.position` only after the shared anchor has been checked and the scene genuinely needs an individual pose correction. When a sprite texture has actually loaded, the canvas host exposes `data-sprite-loaded="true"` and `data-sprite-asset="<imagePath>"`; QA uses these attributes so screenshots are not taken while a placeholder is still visible.

Navigation active state observes the six story sections plus `#letter` and `#wall`. The Three.js stage only switches for real story scene ids; `#letter` and `#wall` keep the last story scene on stage while their rail dots become active.

The original `photos/` directory is not modified by the app. `public/photos/sence1-6` is a web-served copy for Vite.
