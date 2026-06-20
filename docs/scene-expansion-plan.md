# 3Dling 其它场景首版落地方案

本文档用于用户检查与今晚 Goal 模式派发。范围只包含 `sence1`、`sence2`、`sence3`、`sence4`、`sence6`；`sence5` 作为已验收基线锁定，`sence7`、`sence8` 本轮不做。

## 总体方向

- 首版继续走 `sence5` 已验证的静态资产路线：生成式全屏背景图 + 2.5D 透明玩偶图 + 照片叠放 + 单 Three.js 舞台层。
- 每个场景只展示一个当前玩偶。多张照片只作为玩偶脸、穿搭、姿态和氛围参考，不在同一屏铺成相册。
- 背景优先做成“舞台 / 微缩场景 / 记忆布景”，不要只是普通风景照。玩偶必须站在可读的地面、圆台、木台、草地台面或石面上。
- 场景切换复用现有 `SceneBackground` 的预加载和 900ms crossfade，避免不同背景之间硬切。
- 背景图不出现文字、Logo、水印、名人、品牌、可识别 IP。玩偶资产不带文字和商标。
- 移动端优先，但桌面也要好看。全屏背景使用 CSS cover 后，玩偶位置必须按视口比例校准，必要时配置 `toyDisplay.responsivePositions`。
- 今晚目标是把五个其它场景做到“可完整浏览 + 视觉方向成立 + 不破坏 sence5”，不要在单个场景上无限细抠。

## 复用资产结构

建议新增背景资产：

- `public/backgrounds/sence1-dali-bai-courtyard.png`
- `public/backgrounds/sence2-halloween-campus.png`
- `public/backgrounds/sence3-graduation-lawn.png`
- `public/backgrounds/sence4-kunming-film-street.png`
- `public/backgrounds/sence6-tibet-plateau.png`

建议新增玩偶资产：

- `public/toys/sence1-toy-2d.png`
- `public/toys/sence2-toy-2d.png`
- `public/toys/sence3-toy-2d.png`
- `public/toys/sence4-toy-2d.png`
- `public/toys/sence6-toy-2d.png`

数据层沿用 `src/data/scenes.ts`：

- 为每个场景补 `backgroundAsset.imagePath`。
- 为每个场景补 `toyDisplay.type = "sprite"`、`toyDisplay.spritePath`、`toyDisplay.height`、`toyDisplay.position`。
- 如宽屏或手机下玩偶相对背景舞台偏移，再补 `toyDisplay.mobilePosition` 或 `toyDisplay.responsivePositions`。
- 保留现有 `stage`、`toyReferences`、`mainPhoto`，不要改动原始照片路径。

## sence1 小时候

现有主题：女朋友小时候，关键词是可爱，那个时候还不认识她。用户已确认：背景需要体现“大理白族的传统民居”，不是普通童年房间。

视觉方向：

- 背景做成大理白族传统民居里的童年记忆小舞台：白墙青瓦、照壁、院落、木雕窗花、门楼、石板地或小庭院。
- 场景核心是“大理白族民居 + 小时候的可爱”，不要退回普通儿童房，也不要只加几个民族纹样当装饰。
- 氛围是“小时候的可爱被放进一座安静明亮的白族院落里”，温暖、干净、有地方记忆。
- 色彩以白墙、青灰瓦、木色、浅蓝天空和少量暖光为主，点缀柔和桃色或童年小物，避免整屏米色或过度复古发黄。
- 地面必须是可站立的石板庭院 / 木台 / 小圆台，让玩偶脚底能自然落在民居院落空间里。

玩偶方向：

- 风格偏 Jellycat / 毛绒质感，比例更幼态，头发和五官柔软。
- 穿搭参考 `photos/sence1` 里的第二张；脸和主形象参考主图。
- 可带小星星、蝴蝶结、小布偶等很轻的童年道具；如果需要地方呼应，可用很克制的蓝白小挂饰，但不要把玩偶做成民族服装 cosplay。

背景生成提示词要点：

- Dali Bai traditional residential courtyard, white walls and grey tiled roofs, decorative screen wall, carved wooden windows, stone courtyard floor, warm childhood memory miniature stage, soft morning light, clean local architecture atmosphere, cute nostalgic mood, visible standing platform, no people, no text, no logo, no watermark

前端动效：

- 背景轻微日光呼吸、少量尘埃粒子或庭院光斑。
- 玩偶不浮动，最多保留很轻的入场淡入和缩放。

## sence2 大学万圣节

现有主题：大学过万圣节，女朋友化了搞怪的妆。

视觉方向：

- 背景做成校园夜色里的万圣节小舞台：紫橙灯光、南瓜灯、纸片小幽灵、校园走廊或派对角落。
- 要调皮、搞怪、明亮，不要恐怖、阴森或血腥。
- 舞台地面可以是深色木地板 / 校园台阶 / 派对地台，必须能让玩偶站稳。

玩偶方向：

- 风格偏 Pop Mart 可爱潮玩，脸上保留搞怪妆感，但表情仍可爱。
- 穿搭参考 `photos/sence2` 的 outfit references。
- 道具可以是小面具、南瓜小包、糖果篮。

背景生成提示词要点：

- playful college Halloween campus stage at night, purple and orange party lights, pumpkins, paper ghosts, campus corridor, cute mischievous mood, visible floor platform, no horror gore, no people, no text, no logo, no watermark

前端动效：

- 紫橙灯光轻闪。
- 少量纸屑或小星点经过即可，不做大面积飞行动效。

## sence3 大学毕业

现有主题：女朋友大学毕业，在拍毕业照。

视觉方向：

- 背景做成毕业草坪 / 校园礼堂前的小舞台：阳光、绿草、白色花、金色高光、远处虚化的校园建筑。
- 画面情绪是“句号也是新的开头”，明亮、干净、纪念感强。
- 不出现具体学校名、校徽、横幅文字。

玩偶方向：

- 风格为干净可爱的毕业纪念玩偶。
- 可穿毕业袍或参考照片里的毕业穿搭，手持毕业证 / 小花束。
- 帽穗、花束、证书是主要道具，数量控制在 1 到 2 个。

背景生成提示词要点：

- sunny graduation lawn miniature stage, campus ceremony atmosphere, soft green grass, warm gold sunlight, white flowers, subtle bokeh, visible standing platform, no school logo, no text, no people, no watermark

前端动效：

- 轻微阳光粒子、慢速飘落花瓣或纸屑。
- 玩偶站位偏舞台中右，避免遮挡左侧照片和标题。

## sence4 昆明胶片跨年

现有主题：毕业后在昆明，第一次用胶片机一起拍照片，跨年前后。用户指定：脸用 `photos/sence4/1.jpg`，主图用 `photos/sence4/2.jpg`。

视觉方向：

- 背景做成昆明蓝调时刻 / 夜晚街角的胶片舞台：暖色店灯、湿润路面反光、远处灯串、很轻的跨年烟花或光点。
- 整体有胶片颗粒、轻微漏光、浪漫但不腻。
- 不要生成可识别商铺名、城市地标文字或街牌文字。

玩偶方向：

- 脸参考 `1.jpg`，穿搭和整体氛围参考 `2.jpg`。
- 道具用小胶片机、相机挂绳、跨年小灯。
- 风格是软萌潮玩 + 胶片质感，不要做成真实人像立牌。

背景生成提示词要点：

- Kunming blue-hour film street corner miniature stage, warm shop window lights, wet pavement reflections, subtle new year light strings, gentle film grain, romantic memory mood, no readable signs, no people, no text, no logo, no watermark

前端动效：

- 胶片颗粒覆盖层、非常轻的漏光扫过。
- 背景 crossfade 到这一屏时可以让暖色光慢慢显出来。

## sence6 西藏

现有主题：女朋友自己去西藏玩，拍了好看的照片。

视觉方向：

- 背景做成高原晴空下的旅行舞台：蓝天、远山、湖面或公路、风中的经幡元素。
- 氛围是自由、开阔、清澈，不要做成厚重宗教符号堆叠。
- 地面可以是石台、木平台或高原草地平台，确保玩偶脚底有明确接触面。

玩偶方向：

- 穿搭参考 `photos/sence6` 的主图和 outfit references。
- 可带小背包、相机、围巾或风带。
- 风格偏旅行纪念玩偶，轻盈、明亮、有风感。

背景生成提示词要点：

- bright Tibet plateau travel stage, clear blue sky, distant mountains, lake or open road, subtle prayer flags in the wind, natural stone or wood platform, airy freedom mood, no people, no text, no logo, no watermark

前端动效：

- 慢速云影或风带摆动。
- 经幡 / 风线只做少量点缀，不压住玩偶。

## 今晚执行顺序

建议按下面顺序推进，减少返工：

1. 先生成五张全屏背景图，全部放入 `public/backgrounds`。优先保证每张背景都有清楚的可站立地面。
2. 再生成五张透明玩偶图，全部放入 `public/toys`。统一正面或略侧身全身比例，底部留少量透明边距，避免脚被裁掉。
3. 开发窗口接入 `backgroundAsset` 和 `toyDisplay`，保留现有照片叠放结构。
4. 对每个场景做第一轮锚点：桌面 1398/1440、宽屏 1920、手机 390。
5. 只对明显跑偏的场景增加 `responsivePositions`，不要默认每个场景都堆一组复杂参数。
6. 最后跑全链路导航：`#sence1 -> #sence2 -> #sence3 -> #sence4 -> #sence5 -> #sence6 -> #letter -> #wall`。

## 验收矩阵

每个新增场景至少检查：

- direct hash：`/#sence1`、`/#sence2`、`/#sence3`、`/#sence4`、`/#sence6` 能直接进入正确屏。
- 视口：`390x844`、`1398x986`、`1440x900`、`1920x1080`。
- 如背景和玩偶在宽屏明显错位，再加 `2048x1117`。
- 页面状态：全站仍只有一个 canvas，active rail 正确，无水平溢出。
- 控制台和网络：无 console error、page error、request failed、4xx/5xx。
- 视觉：照片不压标题，玩偶不浮动，脚底站在对应地面上，背景切换无闪白或硬切。
- 回归：`sence5` 的红麦田背景、照片栈、光柱/玩偶同轴、平台落点不能退化。

## 派发口径

给 3D / 资产窗口：

- 按本文档为 `sence1`、`sence2`、`sence3`、`sence4`、`sence6` 生成背景图和 2.5D 透明玩偶图。
- 背景不要人物、文字、Logo、水印、名人或可识别 IP。
- `sence1` 背景必须明确是“大理白族传统民居 / 白族院落”，核心元素包括白墙青瓦、照壁、木雕窗花、庭院或石板地，不接受普通童年房间替代。
- 玩偶要根据对应照片提取脸和穿搭；`sence4` 必须脸用 `1.jpg`、主图和穿搭氛围用 `2.jpg`。
- 输出完成后主动回调架构窗口，并附资产路径、生成约束和自评。

给开发窗口：

- 等资产到位后，按数据驱动方式接入，不要为每个场景写散落硬编码。
- 保留 `sence5` 已验收状态，不恢复 GLB 默认展示。
- 如果需要响应式修正，优先在 `toyDisplay.responsivePositions` 数据里标定，不把 magic number 写进动画循环。
- 完成后主动回调架构窗口，附构建结果、截图路径、视口矩阵和自评。

给 QA 窗口：

- 开发回调后再做只读验收。
- 重点看新增五个场景是否形成统一礼物页体验，以及 `sence5` 是否没有退化。

## 用户确认状态

- `sence1` 已调整为“大理白族传统民居 / 白族院落里的童年记忆小舞台”，待用户最终检查。
- `sence2` 已接受：“可爱校园万圣节”，不走恐怖风。
- `sence3` 已接受：“明亮毕业草坪 / 仪式感小舞台”方向。
- `sence4` 已接受：“昆明蓝调街角 + 胶片颗粒 + 跨年灯光”方向。
- `sence6` 已接受：“高原晴空 + 旅行石台 / 木台 + 少量经幡风感”方向。
