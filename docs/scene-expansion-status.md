# Scene Expansion Status

更新时间：2026-06-19

## 当前结论

`sence1`、`sence2`、`sence3`、`sence4`、`sence6` 已经从占位玩偶切换为重新生成的完整 2.5D sprite 玩偶。

本轮没有恢复被否定的旧 SVG / HTML / CSS / 贴片资产，也没有把 `sence5` 母版换衣服复用到其它场景。五张 v2 玩偶都是真实 PNG 文件，已通过 alpha、尺寸、旧资产闸门校验，并通过 `promote:toys:v2` 打开前端 `assetReady`。

已落盘玩偶资产：

- `public/toys/sence1-toy-2d-v2.png`
- `public/toys/sence2-toy-2d-v2.png`
- `public/toys/sence3-toy-2d-v2.png`
- `public/toys/sence4-toy-2d-v2.png`
- `public/toys/sence6-toy-2d-v2.png`

已升级全屏背景资产：

- `public/backgrounds/sence1-dali-bai-courtyard.png`
- `public/backgrounds/sence2-halloween-campus.png`
- `public/backgrounds/sence3-graduation-lawn.png`
- `public/backgrounds/sence4-kunming-film-street.png`
- `public/backgrounds/sence6-tibet-plateau.png`

## 已完成

- `sence5` 保持已验收路线：全屏生成式红麦田背景 + 2.5D sprite 玩偶。
- `sence1` 背景已替换为大理白族传统民居院落图。
- `sence2/3/4/6` 背景已替换为新一轮高细节生成式全屏背景，继续沿用现有 `backgroundAsset.imagePath` 文件名。
- `sence1/2/3/4/6` 已接入完整重新生成的 2.5D 玩偶 PNG，`toyDisplay.assetReady: true`。
- `StageCanvas` 修复了开发模式下 sprite key 复用导致 `data-model-state=sprite` 但画面仍是 placeholder 的问题。
- `qa:scenes` 已增加真实 sprite 加载断言：`data-sprite-loaded=true` 且 `data-sprite-asset` 等于期望路径后才截图/通过。
- `validate:toys` 已改为 data URL 解码，避免 Chromium 在 `about:blank` 中解码 `file://` PNG 的误报。
- `validate:toys -- --scene <id>` 可做单场景资产验证。
- `promote:toys:v2` 已改为直接调用 Node/Vite/tsc，避开 Windows `spawnSync npm.cmd EINVAL`。

## 当前验证

通过：

```bash
npm run validate:toys
npm run validate:asset-gate
npm run promote:toys:v2
npm run build
npm run qa:scenes -- --screenshots
```

`build` 仅保留既有 Three.js chunk-size warning。

最新全站 QA 截图目录：

```text
C:\Users\12156\AppData\Local\Temp\3dling-scene-qa-1781823549698
```

桌面 contact sheet：

```text
C:\Users\12156\AppData\Local\Temp\3dling-scene-qa-1781823549698\desktop-1398-contact-sheet.jpg
```

移动端 contact sheet：

```text
C:\Users\12156\AppData\Local\Temp\3dling-scene-qa-1781823549698\mobile-390-contact-sheet.jpg
```

## 仍需人工判断

- 桌面端六个场景已经进入同一条产品路线：照片栈 + 生成式全屏背景 + 2.5D 玩偶 + 单 canvas 舞台。
- `sence2/3/4/6` 背景完成度已明显高于旧脚本合成背景，接近 `sence1/sence5` 的生成式路线。
- 移动端目前更偏“照片优先，玩偶作为背景舞台角色”。如果后续希望手机端玩偶也变成主角级存在，需要单独做移动端构图 pass，重新平衡照片、标题、底部 rail 和玩偶尺寸。

## 资产来源说明

五张 v2 玩偶来自内置 imagegen 的会话结果提取，随后用本地 chroma-key 去背脚本转为透明 PNG，并做了轻量边缘 despill：

- 源图：`tmp/imagegen/*-source-green.png`
- 最终图：`public/toys/*-toy-2d-v2.png`

新一轮背景图同样来自内置 imagegen 的会话结果提取，覆盖到现有 `public/backgrounds/*.png` 文件名，旧背景已备份在：

```text
tmp/imagegen/backgrounds-v2
```

这条路线不需要 `OPENAI_API_KEY`。`npm run generate:toys:v2` 仍保留为可复现的 CLI/API 路线；如果未来设置了 key，可以继续用它重新生成或批量替换。
