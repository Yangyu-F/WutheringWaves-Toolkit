# 鸣潮伤害计算器

面向《鸣潮》玩家的 Vue 3 静态伤害计算器。产品采用单一全屏工作区，不再提供工具箱首页或独立图鉴页面。

用户可创建多个计算项目，配置共鸣者、武器、声骸、合鸣与敌人，在时间轴安排技能后得到逐次伤害、总伤害和 DPS。项目保存在浏览器 IndexedDB，也可通过 JSON 导入和导出。

## 当前文档

- [网站技术方案](网站技术方案.md)：产品边界、数据来源、领域模型、模拟架构、界面方向与分阶段路线。
- [AGENTS.md](AGENTS.md)：未来实现需要遵守的工程约束。
- [数据维护说明](docs/data-maintenance.md)：官方 WIKI 数据进入项目之前的许可、审阅与追踪要求。
- [项目结构审计](docs/research/project-structure-audit.md)：当前目录边界、已清理的历史目录和后续拆分触发点。
- [ADR 0001](docs/adr/0001-hash-routing.md)：GitHub Pages Hash 路由决策。
- [ADR 0002](docs/adr/0002-offline-source-pipeline.md)：离线静态数据流程决策。
- [ADR 0003](docs/adr/0003-estimated-timeline-semantics.md)：估算时序、任意重叠、长度裁剪与同时间戳结算规则。
- [ADR 0004](docs/adr/0004-timeline-editor-and-local-storage.md)：Pointer Events、多项目 IndexedDB 与导入导出决策。

## 本地开发

```bash
npm install
npm run dev
```

提交前运行 `npm run format:check`、`npm run lint`、`npm run type-check`、`npm test`、`npm run data:validate` 和 `npm run build`。

## 当前状态

- 产品外壳：已改为类似代码编辑器的全屏深色工作区。顶栏只承载项目与编辑操作；左右固定宽度侧栏通过窄工具栏切换，左侧显示队伍配置或技能库，右侧显示技能状态或计算结果；中间为共享标尺的技能与效果时间轴。
- Phase 1：已实现 3.5 单共鸣者纵向切片。秧秧固定 90 级与满技能，千古洑流固定 90 级并开放 1–5 阶谐振，五星声骸固定 +25/最高技能阶；玩家调整共鸣链、五个声骸位置的合法词条，以及敌人等级/抗性。伤害乘区、声明式动态效果、逐命中分解和外部锚定金标准已接入。
- Phase 2：进行中。已接入首段即时命中、后续每 `50ms` 一段的估算动作区间、自由毫秒定位、播放头吸附、缩放、长度裁剪和撤销/重做。同一共鸣者最多显示 4 个并行动作，轨道按并发数扩展；效果区固定为三行共鸣者增益、一行全队增益和一行敌方减益。时间轴支持 30/60/120 秒，多项目通过 IndexedDB 保存并可用 JSON 导入导出。
- 采用 Vue Router Hash 模式，构建产物可直接部署到 GitHub Pages 项目站点。
- 库街区《鸣潮》WIKI 图鉴目录是主要资料源。首批清单覆盖共鸣者、武器、声骸、合鸣效果与敌人；材料、任务、探索和攻略仅列为后续候选。
- Phase 0 数据管线 fixture 是合成样例；Phase 1 的 3.5 纵向数据与金标准 fixture 是人工交叉核对数据。生产应用不在运行时抓取 WIKI，候选数据必须经过实体级人工审阅。

## 源码结构

```text
src/
├─ app/                         # 应用壳层与 Hash 路由
├─ data/                        # schema、来源清单和版本化游戏数据
├─ domain/                      # 与 UI 无关的领域类型
├─ features/calculator/
│  ├─ components/              # 按 team、skills、timeline、inspector 等分区
│  ├─ composables/             # UI 与模拟结果的组合逻辑
│  ├─ layout/                   # 时间轴泳道排布算法
│  ├─ persistence/              # IndexedDB、项目 schema 与导入导出
│  ├─ stores/                   # 项目库、项目内容、时间轴文档与视口状态
│  ├─ timeline/                 # 时间轴 schema、迁移和动作模型
│  ├─ styles/                   # 壳层、面板和时间轴按组件职责拆分的样式
│  └─ views/                    # 全屏计算工作区
├─ shared/                      # i18n 等无业务归属能力
└─ simulator/                   # 动作编译、事件模拟与伤害公式
```

时间轴 Pointer、播放头、键盘和视口行为位于独立 composable，文档状态与仅供界面使用的缩放/视口状态分别存储。3.5 数据按来源、实体、共鸣者动作和默认配装组织，`phaseOne.ts` 只保留兼容 re-export。`tests/` 覆盖公式、效果引擎、动作编译、时间轴状态、泳道排布、项目持久化协议和数据校验；`scripts/` 存放数据校验及 Wiki 快照处理脚本。当前模拟器在主线程同步运行，但保持纯 TypeScript 边界；只有性能基准证明必要时才引入 Worker。
