# Comment Battle Arena

> **Can an auto-battle toy become a reproducible content engine instead of a one-off demo?**

Comment Battle Arena is a configurable pixel auto-battle simulator built with TypeScript and Canvas. Characters are 16×16 pixel sprites visually, but behave as circular rigid bodies underneath: they move, collide, bounce, deal impact damage, and trigger character-specific skills.

The interesting part for me was not just making two characters fight. It was building enough structure around the fight that a match can be **reproduced, tuned, saved as an episode, and used as a creator workflow**.

`TypeScript` · `Canvas` · `deterministic physics` · `seeded randomness` · `Vitest` · `creator tooling`

## What I built

### A reproducible battle engine

- Automatic `BattleEngine` game loop.
- Circular rigid-body collision and wall response.
- Impulse-based impact damage using relative velocity.
- Pair-based collision damage cooldown to avoid continuous squeeze damage.
- Constant-speed correction so matches do not decay into motionless states.
- Seeded LCG randomness for reproducible matches.
- Configurable episodes as saved/published match presets.

### Characters that are configuration, not hardcoded scenes

The current MVP includes six default characters with different physical properties and skills:

- **Shield Cat** — slow, defensive, high shield.
- **Rush Dog** — high-speed dash / collision pressure.
- **Fire Wizard** — ranged fireball playstyle.
- **Heal Bot** — sustain through healing.
- **Split Slime** — split / summon-style attrition.
- **Mirror Knight** — defensive reflection.

Visual sprites use a 16×16 numeric matrix plus palette. Physics and visuals are intentionally separate: the sprite controls appearance; `physics.radius` and other configuration control collision behavior.

### A creator workflow around the engine

I did not want adding a character to mean manually editing several unrelated files every time, so the project grew its own tooling:

- **Custom Match Setup** — choose left/right characters and an optional seed, then run a temporary match.
- **Pixel Sprite Previewer** — import an image, crop it, remove a background, convert it into a 16×16 draft, edit the matrix/palette, and preview animation states.
- **CharacterConfig generator** — create a draft character configuration from presets.
- **Temporary registration + test** — register a draft character in browser memory and immediately test it in Custom Match.
- **Episode Draft generator** — turn an interesting test match into copyable episode configuration.
- **Animation Sheet export** — generate sprite sheets for documentation/content use.

That tooling is the main reason this project is more useful to me than a single battle demo: the engine and the content-production loop can evolve separately.

## Architecture

```text
src/
├─ core/         BattleEngine, physics, math, shared types
├─ data/         characters, pixel sprites, episode presets
├─ entities/     Character / Projectile / Effect entities
├─ rendering/    Canvas renderer and pixel animation system
├─ skills/       event-driven character skills
├─ app.ts        UI and tooling bindings
└─ main.ts       application entry

tests/           physics and damage tests
docs/            architecture notes and ADRs
```

Core responsibilities:

- **BattleEngine** — game loop, entity updates, physics iterations, collision handling, match result.
- **Physics / Collision** — overlap correction, impulse response, wall collisions, impact damage.
- **CharacterEntity** — health, velocity, state and movement correction.
- **Skill System** — event-driven hooks such as `onTick`, `onAttack`, and `onDamageTaken`.
- **PixelCharacterRenderer** — renders matrix + palette sprites with pixel alignment.
- **Transform Keyframes** — interpolates transform extrema and samples them at a low stepped frame rate for retro-style animation.
- **Episode System** — stores reproducible match presets for published/saved battles.

## Run it

```bash
npm install
npm run dev

npm run build
npx vitest run
```

Current tests live in `tests/`, including physics and damage behavior. There is no CI yet.

## Reproducibility matters

An auto-battle system becomes difficult to debug if every run is different. Custom matches can therefore use an explicit integer seed. Interesting results can be copied into an Episode draft and replayed later.

The goal is not perfectly deterministic simulation across every possible runtime forever; the practical goal is to make authored/tested match scenarios reproducible enough to inspect and tune.

## Current limitations

- There is no hosted public demo yet.
- Generated README sprite-sheet PNGs are not committed yet; `assets/readme/` currently only contains `.keep`.
- Community-submitted characters are a product/content idea, not an implemented submission system.
- Skill/state-machine test coverage is incomplete.
- There is no CI.

Generate animation sheets locally with:

```bash
npm run export:readme-sheets
```

## Next

- Improve the six default character sprites and animation presentation.
- Expand charge / skill-state integration beyond the current uses.
- Add stronger skill and state-machine tests.
- Add a clearer Previewer / character-creation walkthrough.
- Add real screenshots or animation sheets to this README.

---

<details>
<summary><strong>中文：完整玩法与角色制作说明</strong></summary>

<br>

# Comment Battle Arena

> **一个自动对战点子，能不能变成可复现、可配置、可以持续生产角色与对战内容的系统？**

这是一个像素风角色物理自动对战模拟器。角色视觉上是 16×16 像素小人，底层使用圆形刚体碰撞，在封闭竞技场中自动移动、冲撞、反弹、释放技能。

项目的重点不只是“两个角色自动打一架”，而是把它逐渐做成一套完整的内容生产链：角色可以配置、比赛可以用 Seed 复现、Episode 可以保存、角色可以通过 Previewer 制作并快速测试。

## 当前项目定位

- **不是传统手操小游戏**：玩家不直接控制角色移动或攻击。
- **不是弹球游戏**：场上默认没有独立小球，两个像素角色本身拥有圆形刚体物理特性。
- **配置化对战**：比赛可以按 Episode 配置生成并复现。
- **社区共创是下一阶段想法**：评论区投稿角色目前还不是完整线上功能。

## 当前已实现功能（MVP）

- Vite + TypeScript + Canvas 本地项目
- 自动对战 `BattleEngine`
- 圆形刚体物理系统：角色碰撞、墙体碰撞、冲量响应
- 基于相对速度的撞击伤害，无持续挤压伤害
- pair-based collision damage cooldown
- Constant Speed Correction 动量维持
- 6 个默认角色及不同物理特性 / 技能
- Episode 配置系统，作为 Saved / Published Match Preset
- 16×16 matrix + palette 的纯代码像素角色
- Transform Keyframes 动画：Linear Interpolation + Stepped Time Sampling
- pixel projectile / effect：spark、heal、reflect 等
- High-DPI Canvas 文本渲染
- Debug collider 可视化
- 战斗结果统计与 Copy Episode Result
- **Custom Match Setup**：自由选择左右角色、自定义 Seed
- **Pixel Sprite Previewer**：矩阵解析、动画预览、Animation Sheet 导出
- **CharacterConfig & Episode Draft Generator**

## 六个默认角色

### Shield Cat / 盾盾猫

重装防御型，高护盾、慢速，猫耳与重盾视觉。

### Rush Dog / 冲刺狗

高速冲撞型，高冲量 Dash，Dash 前有短暂蓄力。

### Fire Wizard / 火焰法师

远程风筝型，低血量，使用火球。

### Heal Bot / 回血机器人

消耗防守型，可以自动回血。

### Split Slime / 分裂史莱姆

召唤 / 消耗型，受击分裂，带 squash-and-stretch 视觉。

### Mirror Knight / 反伤骑士

防守反击型，概率反弹伤害。

## 本地运行

```bash
npm install
npm run dev
npm run build
npx vitest run
```

测试位于 `tests/`，目前覆盖物理与伤害等核心行为。暂时没有 CI。

## 项目结构

```text
CommentBattleArena/
├─ src/
│  ├─ core/         # 核心引擎、物理、数学、类型定义
│  ├─ data/         # 角色配置、像素矩阵数据、对战剧本
│  ├─ entities/     # Character / Projectile / Effect 等实体
│  ├─ rendering/    # 渲染器、像素动画系统
│  ├─ skills/       # 技能实现与注册表
│  ├─ app.ts        # 应用入口、UI 绑定
│  └─ main.ts       # 启动文件
├─ tests/           # 单元测试
├─ docs/            # 架构文档、ADR
├─ README.md
├─ CONTEXT.md
├─ CHANGELOG.md
└─ package.json
```

## 核心系统

- **BattleEngine**：游戏主循环、实体更新、物理迭代、碰撞与胜负判定。
- **Physics / Collision**：圆形刚体碰撞、位置修正、冲量和撞击伤害。
- **CharacterEntity**：生命、速度、状态机与速度修正。
- **Skill System**：通过 `onTick`、`onAttack`、`onDamageTaken` 等事件触发技能。
- **PixelCharacterRenderer**：把 16×16 数字矩阵和调色板渲染到 Canvas。
- **Transform Keyframes**：线性插值极值点，再以低帧率阶梯采样得到复古动画。
- **Episode System**：保存双方角色、等级、队伍和 Seed 等正式比赛配置。

## Custom Match：自由测试一场对战

页面控制区有 **Custom Match Setup**：

1. 在 **Left Character** / **Right Character** 中选择双方，支持同角色内战。
2. 可选输入一个整数 Seed；不填时自动生成。
3. 点击 **Start Custom Match** 启动临时比赛。
4. 如果比赛值得保留，点击 **Copy Episode Draft**，复制配置到 `src/data/episodes.ts`。
5. 使用 **Prev Episode** / **Next Episode** 可以切回代码中保存的 Episode。

## Character Creation Workflow

项目包含一套从参考图到可测试角色的工具链：

1. **Open Previewer**：打开 Pixel Sprite Previewer。
2. **Import Image to Matrix v2**：选择 PNG/JPG 参考图。
   - 调整 Crop X/Y/Size，只保留主体。
   - `Remove Background` 可提取背景色；浅色背景会优先按透明处理。
   - `Preview Result` 后再 `Apply to Matrix`。自动转换只作为草稿。
3. **Clean & Color**：手动清理 16×16 矩阵，并用 Palette Editor 调整 7 色调色板。
4. **Preview Animation**：切换 `move`、`attack`、`dash` 等状态查看动画。
5. **Copy Definition**：复制 Sprite Definition，写入 `src/data/pixelSprites.ts` 并注册。
6. **Generate Config**：填写角色名称、设定、战斗风格模板和技能预设，生成角色配置草稿。
7. **Register Temp Character** + **Test In Custom Match**：先只注册到浏览器内存，不写正式代码，直接进行对战验证。
8. 测试满意后复制 Sprite Definition 与 CharacterConfig 到正式数据文件。
9. 使用 **Export Animation Sheet** 或 `npm run export:readme-sheets` 生成展示图。

## Matrix Parser

Previewer 输入框支持多种格式：

- 优先提取 `matrix: [...]`
- 其次提取标准 `[[...], [...]]` 二维数组
- 最后尝试提取前 256 个有效数字（0–7）
- 粘贴完整 TypeScript Sprite Definition 时会尝试忽略十六进制颜色值，避免污染矩阵

为了稳定，仍建议直接粘贴 matrix 部分或使用 Load Existing Sprite。

## 像素矩阵规范

默认尺寸：**16×16**。

```text
0 = transparent
1 = outline
2 = shadow
3 = main
4 = highlight
5 = accent
6 = weapon / accessory
7 = effect
```

视觉矩阵和 collider 完全独立。Matrix 决定长什么样，`physics.radius` 等配置决定碰撞行为。

## 评论区角色投稿格式（产品想法）

```text
角色名：
一句话设定：
外观特征：
球体/碰撞特性：
战斗风格：
技能：
弱点：
想挑战谁：
是否原创：
```

这目前是未来社区共创流程的输入格式，不代表已经实现线上投稿系统。

## 当前下一阶段

- 更多技能接入 charge / skill 状态；基础字段已有，Rush Dog 已使用 charge。
- 优化六个默认角色的像素美术与展示效果。
- 增加 Previewer 使用示例和角色制作教程。
- 增加技能与状态机测试覆盖。
- 生成并提交真实 Animation Sheet / Screenshot 到 README。

</details>
