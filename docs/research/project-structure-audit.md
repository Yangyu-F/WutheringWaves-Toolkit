# 项目结构审计

> 审计日期：2026-08-12

## 结论

当前运行时代码已经收敛为单一 `calculator` feature，依赖方向保持为 `app/features → simulator → domain/data`。时间轴文档、临时视口状态、项目持久化、模拟器和 UI 组件之间已有明确边界；本轮没有发现重复实现目录或循环依赖。

## 本轮清理

以下目录为空，且属于已移除产品形态或从未落地的预留结构，已删除：

- `src/app/layouts/`
- `src/features/catalogue/`
- `src/features/data-status/`
- `src/features/home/`
- `src/features/settings/`
- `src/features/calculator/persistence/migrations/`
- `src/shared/components/`
- `src/shared/styles/`
- `src/workers/`

其中首页、图鉴和数据状态页已经不属于单一计算器产品；公共布局与样式已迁入计算器工作区；Worker 只有在性能基准证明必要时才建立；项目 schema 目前仍为首版，不提前创建空迁移目录。

## 保留的边界

- `components/` 按 team、skills、timeline、results、inspector、shell 和 ui 分区，避免全屏工作区组件互相承担内部细节。
- `timeline/` 保存 schema、版本迁移和动作时间模型；`stores/timeline.ts` 只管理持久化文档状态，`stores/timelineViewport.ts` 只管理缩放和可视范围。
- `persistence/` 统一管理 IndexedDB、完整项目 schema 和 JSON 导入导出，不再保留时间轴自己的 localStorage 文档。
- `styles/` 按 toolbar、workspace、primitives、overlays、scrollbars、panels、timeline 和 tokens 分离。
- `data-sources/` 的官方与社区快照属于内部数据实现依据，即使不进入生产包也必须保留。

## 后续结构触发点

本轮追加优化已经完成：`phaseOne.ts` 已拆为来源、实体、秧秧动作和默认配装模块并降为兼容入口；`timeline.css` 与 `panels.css` 已降为聚合入口，内部按组件职责拆分。后续触发点为：

1. 接入第二名共鸣者时，在 `resonators/` 增加独立文件；武器、声骸和合鸣数量增长后再从 `entities.ts` 分为对应实体目录。
2. 当项目 schema 出现第二个已发布版本时，再创建 `persistence/migrations/`，并为每条迁移添加 fixture。
3. 只有 120 秒三人时间轴的性能基准持续超出交互预算时，才创建 `src/workers/` 和稳定消息协议。
4. 新增共享组件前，至少确认两个独立业务区域存在相同语义；不要仅因视觉相似提前扩大 `shared/`。
