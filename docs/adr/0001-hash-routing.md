# ADR 0001：GitHub Pages 使用 Hash Router

- 状态：已接受；Phase 0 已实施
- 日期：2026-08-08

## 决策

Vue Router 使用 `createWebHashHistory()`。

## 原因

GitHub Pages 不提供通用的 SPA history fallback。Hash Router 能在仓库子路径和直接刷新时工作，无需复制 `index.html` 为 `404.html`。

## 后果

URL 形如 `/#/calculator`。若未来使用自定义托管或加入经过验证的 fallback，可通过新 ADR 重新评估 history 模式。
