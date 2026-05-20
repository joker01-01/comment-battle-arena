# Architecture

本文档记录 Comment Battle Arena 的核心系统架构和数据流，面向技术开发者和未来的 AI Agent。

## 项目结构树

```text
CommentBattleArena/
├─ src/
│  ├─ core/
│  │  ├─ BattleEngine.ts      # 游戏主循环、实体管理、胜负判定
│  │  ├─ collision.ts         # 圆形刚体碰撞解析、位置修正、伤害计算
│  │  ├─ constants.ts         # 全局常量 (如 PIXEL_UNIT)
│  │  ├─ random.ts            # 确定性伪随机数生成器
│  │  ├─ types.ts             # 核心接口 (CharacterConfig, PhysicsConfig 等)
│  │  └─ vector.ts            # 2D 向量数学库
│  ├─ data/
│  │  ├─ characters.ts        # 角色配置组装
│  │  ├─ episodes.ts          # 对战剧本定义
│  │  └─ pixelSprites.ts      # 16x16 像素矩阵和调色板数据
│  ├─ entities/
│  │  ├─ Entity.ts            # 所有场上物体的基类
│  │  ├─ CharacterEntity.ts   # 核心战斗角色，包含状态机和速度修正逻辑
│  │  ├─ EffectEntity.ts      # 像素粒子特效
│  │  ├─ ProjectileEntity.ts  # 弹体
│  │  └─ SummonEntity.ts      # 召唤物
│  ├─ rendering/
│  │  ├─ PixelCharacterRenderer.ts # 像素角色渲染、插值、状态机
│  │  └─ pixelAnimations.ts   # 默认的 Transform Keyframes 动画数据
│  ├─ skills/
│  │  ├─ skillRegistry.ts     # 技能注册表
│  │  ├─ skillTypes.ts        # 技能接口定义
│  │  └─ [具体技能实现].ts
│  ├─ app.ts                  # 应用入口、UI 绑定、Debug 面板
│  └─ main.ts                 # 启动文件
├─ tests/                     # 单元测试
├─ docs/                      # 架构文档、ADR 记录
├─ README.md
├─ CONTEXT.md
├─ CHANGELOG.md
└─ package.json
```

## 核心模块职责

1. **BattleEngine**：世界的大脑。维护所有实体列表，驱动 `update` 和 `draw` 循环，处理边界碰撞，判定胜负。
2. **CharacterEntity**：物理与逻辑的结合体。它是一个拥有 `pos`, `velocity`, `radius`, `mass` 的刚体，同时维护着 `hp`, `attackTimer`, `stunTimer` 等战斗状态。
3. **Collision System**：纯粹的物理法则。负责计算两个圆的交叠，应用冲量（Impulse）分离它们，并根据相对速度计算伤害。
4. **Skill System**：解耦的事件响应。AI 决定“何时”触发，Skill 决定“发生什么”。技能可以修改实体状态、生成 Projectile 或 Effect。
5. **PixelCharacterRenderer**：视觉欺骗。它不关心圆有多大，只负责在 `character.pos` 的位置，根据当前状态播放对应的 Transform Keyframes 动画，并严格对齐到逻辑像素网格。
6. **Pixel Sprite Previewer**：开发辅助工具。不参与战斗核心循环，但完全复用 `PixelCharacterRenderer` 的渲染逻辑、`pixelSprites.ts` 的数据和 `defaultAnimations`。用于快速编辑 16x16 矩阵和调色板，并生成可复制的 Sprite Definition 代码。同时内置了 **CharacterConfig Generator** 和 **Episode Generator**，结合 `characterTemplates.ts` 提供战斗风格预设，大幅加速新角色入库流程。
7. **Custom Match Setup**：UI 辅助工具。允许用户在页面上自由选择左右角色和 Seed，在内存中动态生成临时的 `EpisodeConfig` 并传递给 `app.ts` 的 `restart()` 方法，从而绕过固定的 `episodes.ts` 列表启动战斗。它不参与核心物理/碰撞逻辑。

## Fixed Episode vs Custom Match

- **Custom Match Mode**：**当前默认模式与主要入口**。应用启动时会读取 Custom Match Setup UI 的默认值并在内存中动态生成 `EpisodeConfig` 初始化 `BattleEngine`。用于日常测试、角色创作和自由对战。
- **Fixed Episode Mode** (Saved Presets)：归档模式。`app.ts` 根据 `currentEpisodeIndex` 从 `src/data/episodes.ts` 中读取硬编码的剧本。点击 Prev/Next Preset 按钮会进入此模式，用于浏览已发布的正式对战。

## 一帧战斗循环 (Game Loop)

在 `app.ts` 的 `requestAnimationFrame` 驱动下，`BattleEngine.update(dt)` 执行以下流程：

1. **更新 AI**：遍历所有 `CharacterEntity`，执行其 `behaviorType` 对应的 AI 逻辑。AI 仅负责触发技能（调用 `tryAttack` 等），**不直接修改加速度或速度**。
2. **实体 Update**：
   - `CharacterEntity`：应用 `baseSpeed` 速度修正（抵消摩擦力），更新各类 Timer（冷却、眩晕）。
   - `ProjectileEntity` / `EffectEntity`：更新位置、生命周期。
3. **物理迭代 (多次循环以保证稳定性)**：
   - **处理角色碰撞** (`handleCollisions`)：两两检测距离，若重叠则调用 `resolveCircleCollision` 进行位置修正、冲量计算和伤害判定。
   - **处理墙体碰撞** (`constrainToArena`)：检测实体是否超出边界，若超出则反弹并修正位置。
4. **清理死亡实体**：移除 `isDead === true` 的实体。
5. **胜负判定**：检查 Team A 和 Team B 的存活情况，若一方全灭则结束战斗。
6. **渲染场景**：调用 `Renderer.render`，清空画布，依次绘制特效、弹体、角色和 UI（伤害数字、血条）。Canvas 初始化时根据 `window.devicePixelRatio` 缩放 backing store 分辨率，并使用 `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)` 保证逻辑坐标系依然是 CSS 像素，确保物理坐标和 collider 居中对齐。UI 文本统一使用 `src/rendering/textStyles.ts` 中的 Times New Roman 样式。

## 角色渲染流程 (Transform Keyframes)

当 `PixelCharacterRenderer.drawCharacter` 被调用时：

1. **确定状态**：根据角色的物理/战斗状态（如 `isDead`, `stunTimer`, `velocity`），按优先级确定当前的 `PixelAnimationName`。
2. **计算时间**：获取该状态的 `stateEntryTime`，计算已播放时间 `elapsed`。
3. **阶梯化采样**：根据动画的 `fps`，将 `elapsed` 转换为离散的 `steppedElapsed`，实现跳帧效果。
4. **插值计算**：在 `interpolateKeyframes` 中找到前后的关键帧，对偏移、缩放、旋转等数值进行线性插值（Lerp）。
5. **像素对齐**：将插值后的逻辑像素偏移量（如 `offsetX`）通过 `Math.round` 取整，并乘以 `PIXEL_UNIT`。
6. **Canvas 绘制**：应用 `translate`, `scale` (处理 facing), `rotate`，最后遍历 16x16 矩阵，根据 `palette` 填充颜色块。在 High-DPI 下，由于使用了 `ctx.setTransform` 缩放 backing store 分辨率，并且 `imageSmoothingEnabled = false`，像素边缘依然保持锐利。

## 碰撞处理流程

在 `resolveCircleCollision(a, b)` 中：

1. **位置修正 (Positional Correction)**：无论速度如何，只要重叠，就按质量比例将两者推开，防止卡死。
2. **相对速度计算**：计算沿法线方向的相对速度 `velocityAlongNormal`。
3. **冲量计算 (Impulse)**：如果两者正在相向运动（`velocityAlongNormal < 0`），则根据两者的 `restitution` (弹性) 和 `mass` (质量) 计算冲量标量，并分别应用到两者的 `velocity` 上。
4. **伤害判定**：如果相对速度的绝对值大于 `IMPACT_THRESHOLD`，且不在 pair-based cooldown 期间，则计算碰撞伤害，并触发受击特效和屏幕震动。

## 如何避免未来架构混乱

- **坚持物理与视觉解耦**：永远不要让 16x16 矩阵的大小去影响碰撞判定。碰撞只看 `physics.radius`。
- **坚持动量驱动**：不要给角色添加类似 `moveTo(x, y)` 的绝对坐标修改逻辑。所有的移动必须通过修改 `velocity` 或施加 Impulse 来实现。
- **状态机优先**：新增动画表现时，优先在 `CharacterEntity` 中增加状态标识（如 `isCharging`），让 Renderer 去读取状态，而不是在业务逻辑里直接控制渲染器。
- **技能沙盒化**：所有复杂的业务逻辑（如分裂、反伤、吸血）都必须封装在独立的 `Skill` 实现中，不要污染 `CharacterEntity` 的核心 `update` 循环。
