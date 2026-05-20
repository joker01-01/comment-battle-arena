# Domain Context

## Project Snapshot

**Date**: 2026-05-20
**Current Stage**: MVP 已经具备像素角色、圆形刚体物理、自动对战、Transform Keyframes 动画和基础技能效果。基础架构和数据层（如 `pixelSprites.ts`）已拆分完毕。Pixel Sprite Previewer 已经完成，并集成了 CharacterConfig 和 Episode 草稿生成器，角色生产工具链进入可用阶段。已加入 Custom Match Setup 自由选角功能。当前阶段重点从功能开发转向角色美术优化，6 个默认角色的像素外观正在打磨，并在 README 中新增了角色展示区，暂不推进 Publishing Helper。

## Core Product Idea

- **开源像素风自动物理对战模拟器**：用于短视频连载和社区互动。
- **Custom Match 优先**：开发、测试和创作的主要入口是自由选角的 Custom Match。
- **Episode 归档**：每期发布的视频作为一个 Episode Preset 保存，用于正式发布和复现。
- **社区共创**：角色可以由评论区投稿，通过配置化快速生产。
- **不是弹球游戏**：虽然有物理碰撞，但核心是角色之间的战斗，不是打砖块或打球。
- **圆形刚体**：角色本身是圆形刚体，通过碰撞和冲量交互。
- **视觉与物理分离**：视觉是 16x16 像素小人，物理是 circle collider，两者完全解耦。

## Important Design Decisions

- **技术栈**：Canvas + TypeScript (Vite 构建)，无后端。
- **无外部图片素材**：作为 MVP 必需项，角色必须通过纯代码矩阵渲染。
- **UI Typography & High-DPI**：UI 字体统一使用 Times New Roman。Canvas 渲染支持 devicePixelRatio 高 DPI，确保名字、血量和伤害数字清晰。高 DPI 缩放仅影响 backing store 分辨率，绝不破坏像素 snapping 和 circle collider 的逻辑对齐。
- **像素矩阵**：角色使用 16x16 matrix + palette 定义外观。
- **动画系统**：使用 Transform Keyframes，通过 Linear Interpolation + Stepped Time Sampling 实现复古跳帧效果。
- **逻辑像素偏移**：动画 keyframe 中的 offset 采用逻辑像素单位，渲染时必须进行 pixel snapping (统一使用 `PIXEL_UNIT`)。
- **物理与视觉解耦**：物理 collider 与像素视觉独立。
- **碰撞伤害机制**：只在相向撞击（relative velocity along normal < 0）且相对速度超过阈值时触发。
- **无持续挤压伤害**：持续挤压默认不造成基础伤害，contact damage 未来应作为特定技能实现。
- **Projectile 定位**：Projectile 只是技能的视觉和伤害表现，不是游戏的核心玩法。
- **复用动画**：新角色应尽量复用 `defaultAnimations`，只替换静态矩阵。
- **角色入库流程**：新角色入库优先走 `Previewer (Import Image -> Clean Matrix) -> Copy Sprite Definition -> Copy CharacterConfig Draft -> Custom Match 测试 -> Export Animation Sheet` 完整工作流。
- **README 角色展示**：README 中的角色动作序列图可以通过 `npm run export:readme-sheets` 自动生成。该脚本通过 headless browser (Playwright) 复用前端 Pixel Sprite Previewer 的渲染逻辑，不参与战斗核心循环。
- **图片导入草稿**：Previewer 支持从本地图片生成 16x16 matrix 草稿。Import Image to Matrix v2 支持裁剪主体和背景清理。导入流程中，背景移除（包括白底特判）在 palette 提取之前执行，确保透明像素不占用颜色槽位。该功能仅用于辅助创作，生成结果应人工清理，不保证直接可用，且不参与战斗核心循环。Future Agents 不要把自动导入结果当成最终角色质量标准。
- **重新定位 Episode 系统**：项目启动不再强依赖 `episodes.ts`。默认进入 Custom Match 模式。`episodes.ts` 仅作为 Published / Saved Match Preset，供 Prev/Next 浏览和正式复现使用。

## Current Architecture

```text
src/
  core/         - 引擎 (BattleEngine), 物理 (collision), 数学 (Vector2), 常量 (constants)
  data/         - 静态数据：角色配置 (characters), 像素精灵 (pixelSprites), 对战剧本 (episodes)
  entities/     - 游戏实体：CharacterEntity, ProjectileEntity, EffectEntity 等
  rendering/    - 渲染逻辑：PixelCharacterRenderer, pixelAnimations
  skills/       - 技能系统：具体技能实现 (dashSkill, healSkill 等)
  ui/           - UI 组件 (预留)
```

## Existing Default Characters

- **Shield Cat / 盾盾猫**：重装防御型，高护盾，慢速。
- **Rush Dog / 冲刺狗**：高速冲撞型，高冲量 Dash。
- **Fire Wizard / 火焰法师**：远程风筝型，低血量，发射火球。
- **Heal Bot / 回血机器人**：消耗防守型，自动回血。
- **Split Slime / 分裂史莱姆**：召唤消耗型，受击分裂小史莱姆。
- **Mirror Knight / 反伤骑士**：防守反击型，概率反弹伤害。

## Animation System Notes

- **接口**：`PixelAnimationName`, `PixelKeyframe`, `PixelAnimation`
- **数据**：`defaultAnimations` 包含 idle, move, attack, charge, dash, hit, skill, death。
- **核心函数**：
  - `sampleAnimation`：处理 fps stepping，计算当前阶梯化时间。
  - `interpolateKeyframes`：找到前后帧，对 numeric fields 执行 lerp，对 string/boolean fields 执行 discrete sample。
- **定格处理**：non-loop 动画（如 hit, death）使用 `Math.min(elapsed, duration)` 定格在最后一帧。
- **当前优先级**：death > hit > dash > charge > skill > attack > move > idle。
- **状态接入**：`charge` / `skill` 通用字段已接入 `CharacterEntity.stateData`。Rush Dog 的 Dash 技能已使用 `charge` 状态（0.5s 蓄力）。`skill` casting 仍主要是预留能力，更多技能待接入。

## Physics / Collision Notes

- **判定原则**：
  - normal 从 A 指向 B。
  - relativeVelocity = B.velocity - A.velocity。
  - velocityAlongNormal = dot(relativeVelocity, normal)。
  - 只有 velocityAlongNormal < 0（相向运动）时才计算冲量和伤害。
  - relativeSpeed = -velocityAlongNormal。
  - 只有 relativeSpeed > IMPACT_THRESHOLD 才触发伤害。
- **位置修正**：只要发生重叠（distance < radiusA + radiusB），必定执行 positional correction，防止卡死。
- **冷却机制**：pair-based collision damage cooldown 已经实现，防止同一对角色在短时间内重复触发伤害，但**不阻止物理反弹**。

## Known Gaps / Open Questions

- **Skill Casting 深度接入**：`skillCastTimer` 还需要接入更多技能。
- **视频录制 / 导出辅助**：尚未实现。
- **复杂 AI 行为**：目前 AI 仅负责触发技能，移动纯靠物理动量，未来可能需要更复杂的战术（如躲避）。

## Instructions for Future Agents

**🚨 极其重要！未来的 Agent 必须遵守以下原则：**

- **不要把项目改成弹球游戏**。
- **不要把 projectile 当作核心玩法**。
- **不要移除圆形刚体碰撞**。
- **不要把像素视觉和物理 collider 耦合**。
- **不要用平滑矢量图形替代像素风**。
- **不要随便引入大型游戏引擎**（坚持纯 Canvas + TS）。
- **不要把所有角色逻辑写死到主循环**，必须通过 Entity 和 Skill System 解耦。
- **新增角色优先通过配置**（`pixelSprites.ts` 和 `characters.ts`），尽量不写 hardcode 逻辑。
- **修改 Renderer 时不要破坏 pixel snapping**（必须使用 `PIXEL_UNIT`）。
- **修改 Canvas DPR 时不要破坏物理逻辑坐标和 collider 居中对齐**。
- **修改碰撞逻辑时不要让持续挤压反复造成基础伤害**。
- **不要破坏 Pixel Sprite Previewer 与 PixelCharacterRenderer 的绘制一致性**。
- **不要让 matrixParser 使用 eval**。
- **不要让 palette 颜色值污染 matrix 解析**。
- **新增 sprite 时优先使用 Previewer + pixelSprites.ts 工作流**。
- **不要让生成器输出与 CharacterConfig 类型不匹配的代码**。
- **不要把自定义对战配置写死到 BattleEngine**。
- **不要移除固定 Episode 流程**。
- **不要让 Custom Match 破坏 Prev / Next Episode 按钮逻辑**。

