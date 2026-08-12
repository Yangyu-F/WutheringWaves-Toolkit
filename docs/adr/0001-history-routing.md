# ADR 0001：GitHub Pages 使用 History Router

- 状态：已接受；替代原 Hash Router 决策
- 日期：2026-08-12

## 决策

Vue Router 使用 `createWebHistory(import.meta.env.BASE_URL)`。Vite 生产构建结束后将 `dist/index.html` 复制为 `dist/404.html`，作为 GitHub Pages 的 SPA 回退入口。

## 原因

产品已收敛为单一计算器工作区，路由数量少，不再需要在公开 URL 中保留 Hash。History URL 更简洁，`BASE_URL` 可继续兼容 GitHub Pages 的仓库子路径。

GitHub Pages 不提供可配置的通用 SPA fallback，因此仍需随构建产物发布 `404.html`。用户直接访问或刷新旧兼容路径时，Pages 会返回相同应用入口，Vue Router 随后执行客户端重定向。

## 后果

- 公开 URL 不再包含 `#`。
- `dist/index.html` 与 `dist/404.html` 必须保持相同；构建验证需确认两者均存在。
- 若迁移到支持服务器端 fallback 的托管平台，可移除构建复制逻辑，但需先更新本 ADR。
