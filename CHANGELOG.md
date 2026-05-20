# Changelog

## 2026-05-20

### Added

- 自动对战模拟器 MVP 核心框架
- 圆形刚体角色物理系统（碰撞、冲量、位置修正）
- 6 个默认角色（Shield Cat, Rush Dog, Fire Wizard, Heal Bot, Split Slime, Mirror Knight）
- Episode 配置系统
- 纯代码像素矩阵渲染系统（16x16 matrix + palette）
- Transform Keyframes 动画系统
- Stepped Time Sampling 像素风跳帧采样
- 像素风 projectile 和 particle effects (spark, heal, reflect)
- README / CONTEXT / ARCHITECTURE 等核心项目文档
- **Pixel Sprite Previewer** 开发工具，支持实时编辑矩阵、调色板和预览 Transform Keyframes 动画。
- Previewer 内置 `example_custom_character` 示例，方便从零捏角色。
- 健壮的 `matrixParser`，支持多层级宽松解析，自动过滤颜色值干扰。
- **CharacterConfig Generator** 和 **Episode Draft Generator**，集成在 Previewer 中，大幅加速新角色入库流程。
- `characterTemplates.ts` 战斗风格模板，为生成器提供预设的物理和战斗属性。
- **High-DPI Canvas Text Rendering**，支持高分辨率屏幕下清晰显示文字，并引入 `textStyles.ts` 统一管理。
- **Custom Match Setup** 自由选角面板，支持在页面上直接选择左右角色、输入 Seed 并启动临时对战。
- **Copy Episode Draft** 功能，支持将 Custom Match 的配置一键复制为代码。
- 重新定位了 Episode 系统，将其作为 Published/Saved Match Presets。应用现在默认启动进入 Custom Match 模式，移除了对 `episodes.ts` 的启动强依赖。

### Changed

- **角色美术优化**：全面重绘了 6 个默认角色（Shield Cat, Rush Dog, Fire Wizard, Heal Bot, Split Slime, Mirror Knight）的 16x16 像素矩阵，提升了头身比、轮廓特征和颜色层次，减少了杂乱像素点。
- **README 更新**：在 README.md 中新增了“角色展示”章节，预留了各角色关键动作的 GIF 展示位，并添加了角色视觉特征说明。
- 角色视觉从简单的 Canvas 图形升级为 16x16 像素矩阵
- Projectile 和 Effects 的渲染方式改为严格对齐网格的像素风
- 动画状态由基于速度的简单判断升级为数据驱动的优先级状态机
- 重构了渲染器，将 sprite 数据拆分到 `src/data/pixelSprites.ts`，动画数据拆分到 `src/rendering/pixelAnimations.ts`
- 统一了像素对齐常量 `PIXEL_UNIT`
- 完善了 `CharacterEntity` 的状态机字段，新增 `isCharging` 和 `isCasting` 等通用状态。
- Rush Dog 的 Dash 技能接入了 `charge` 动画状态（冲刺前会有 0.5s 的蓄力表现）。
- **UI Typography**：全局 UI 字体统一更换为 "Times New Roman", Times, serif。

### Known Issues / Next

- 更多技能接入 charge / skill 状态
- 视频录制 / 回放 / 导出辅助
- 更完整的 Previewer 使用示例和角色制作教程
- 技能和状态机测试覆盖

