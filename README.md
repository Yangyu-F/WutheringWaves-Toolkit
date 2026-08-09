# WutheringWaves Toolkit

面向《鸣潮》玩家的 Vue 3 静态 Web 工具站。Phase 0 已建立可运行的应用外壳、工具首页、离线资料候选管线、质量检查与 GitHub Pages 部署流程。

当前唯一规划中的工具是可解释的时间轴伤害计算器：用户配置共鸣者、武器、声骸、合鸣、队伍与敌人，在时间轴安排技能后得到逐次伤害、总伤害、DPS、增益覆盖率和资源变化。首页同时提供角色、武器、声骸与合鸣四类图鉴入口。

## 当前文档

- [网站技术方案](网站技术方案.md)：产品边界、数据来源、领域模型、模拟架构、界面方向与分阶段路线。
- [AGENTS.md](AGENTS.md)：未来实现需要遵守的工程约束。
- [数据维护说明](docs/data-maintenance.md)：官方 WIKI 数据进入项目之前的许可、审阅与追踪要求。
- [ADR 0001](docs/adr/0001-hash-routing.md)：GitHub Pages Hash 路由决策。
- [ADR 0002](docs/adr/0002-offline-source-pipeline.md)：离线静态数据流程决策。

## 本地开发

```bash
npm install
npm run dev
```

提交前运行 `npm run format:check`、`npm run lint`、`npm run type-check`、`npm test`、`npm run data:validate` 和 `npm run build`。

## 当前状态

- Phase 0：已实现。首页提供完全可收起的侧栏、全局顶栏、伤害计算器入口、四类图鉴入口与数据版本页；尚未实现伤害计算器界面。
- 采用 Vue Router Hash 模式，构建产物可直接部署到 GitHub Pages 项目站点。
- 库街区《鸣潮》WIKI 图鉴目录是主要资料源。首批清单覆盖共鸣者、武器、声骸、合鸣效果与敌人；材料、任务、探索和攻略仅列为后续候选。
- 当前 fixture 为合成数据。生产应用不在运行时抓取 WIKI，任何候选数据必须经过人工字段级审阅。
