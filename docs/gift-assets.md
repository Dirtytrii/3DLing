# 生日主题生产素材

2026-10-15。背景仅承载布景，标题、按钮、原始照片、玩偶、烛火和纸张动画均独立实现。原 `public/backgrounds`、`public/photos`、`public/toys` 保留原样。

生成源位于本次会话 `C:\Users\12156\.codex\generated_images\01a13ea0-9428-7412-b642-d0003c6d9129`，以下文件名省略 `.png`。项目保存的是独立生产图，不是包含 UI 的概念截图。

| 项目路径 | 尺寸 | 生成源 | 生产要求摘要 |
| --- | --- | --- | --- |
| `public/gift/intro-dream.png` | 1586×992 | `exec-c4251a8a-b00b-429c-8b89-e79b79eda784` | 梦幻云朵礼盒，移除网页文字和控件，保留右侧礼物及左侧留白 |
| `public/gift/birthday-dream.png` | 1586×992 | `exec-f1cc5b7e-1da8-450f-bd23-40ae23233217` | 微缩蛋糕，保留无火焰的蜡烛和灯芯，火焰由 SVG 叠加 |
| `public/gift/quiet-dream.png` | 1586×992 | `exec-3f1c8af6-fcb0-45a9-a6d3-f1064e1a7be9` | 暮色天空、云朵和丝带，移除信封、信纸、文字和照片 |
| `public/gift/paper-texture.png` | 1536×1024 | `exec-087fc9f8-b181-4937-9d27-089999a3fca8` | 细腻暖米色纸纤维，无字、无边缘、无折叠和外部物件 |
| `public/gift/envelope-front.png` | 1606×979 | `exec-4d1351fa-ed31-44cc-a7da-0fb35fc52161` | 完整纸面折痕、厚度与暖光，用于信封正面，开口由独立剪裁实现 |
| `public/gift/loading-dream.png` | 1586×992 | `exec-91488421-8bf0-441d-8a50-08c5761032f2` | 2026-10-16 新增加载布景：居中礼物、金色细星轨、下缘暖粉云；全部文字和进度为原生 UI |
| `public/gift/sence1-dream.png` | 1586×992 | `exec-815979d7-5ef2-4600-84c1-a40af6d3fe1e` | 大理白族院落、白墙青瓦、木雕窗、玉兰 |
| `public/gift/sence2-dream.png` | 1586×992 | `exec-15f7fa16-273d-4eb7-a0ca-9a9ccc92bb05` | 万圣节校园、南瓜灯、秋叶，温暖无恐怖元素 |
| `public/gift/sence3-dream.png` | 1585×992 | `exec-27d8bdf4-5714-47f7-b57d-b78916c0a099` | 毕业草坪、花朵、校园和毕业拱门 |
| `public/gift/sence4-dream.png` | 1586×992 | `exec-5c28f1a2-c436-4e81-8e01-d6c65790c398` | 昆明胶片街、复古影院、摄影机与暖灯 |
| `public/gift/sence5-dream.png` | 1586×992 | `exec-4b949333-c5cb-4ca8-b00d-f0225ca54819` | 红麦田音乐现场，从已确认海口设计独立提取，移除玩偶、照片和 UI |
| `public/gift/sence6-dream.png` | 1585×992 | `exec-86b899af-491f-45c8-915d-6f4f253e92d3` | 香格里拉雪山、藏式建筑、经幡和高原花朵 |

另外五幕的完整生成提示词和参考图路径保存在 `docs/gift-scene-prompts.json`。前五张先行生产图的要求为上表摘要，完整原始调用保留在会话记录中。

构图规则：左侧文字/照片独立留白，右侧空平台供原玩偶合成；背景无人物、无照片、无界面。渲染使用原图实际宽高比进行中心 cover 对齐，场景接触点由 `src/data/dreamScenes.ts` 管理，玩偶透明边界由 `DreamStageCanvas` 实际扫描。

2026-10-16 增加 `public/optimized` 网页衍生图，映射见 `src/data/optimizedAssets.json`。12 张布景/纸面及 6 张玩偶从 29.84 MiB 降为 5.81 MiB，原文件完整保留；玩偶逐像素校验 alpha 与所有可见 RGB 值均一致。新加载布景约 81 KiB。字体授权与裁剪来源见 `public/fonts` 及 `docs/loading-and-motion-polish.md`。
