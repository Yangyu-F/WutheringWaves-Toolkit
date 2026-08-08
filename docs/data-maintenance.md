# 数据维护说明

## Phase 0 已实现边界

Phase 0 已建立 `data-sources/kuro-wiki/` 来源清单与映射、Zod schema、合成 fixture、候选规范化示例及 `npm run data:validate` 校验命令。它不包含真实站点抓取器，也没有经过审核的游戏数值数据。

- 库街区《鸣潮》WIKI 是主要资料来源。
- 当前仓库没有获准的在线同步任务，也不把站点内部接口视为公共 API。
- `data-sources/kuro-wiki/fixtures/` 当前只保存合成样例，用于验证候选数据的最小规范化与来源状态。
- 合成样例不得被发布为游戏数据；规范化结果始终为 `candidate`。

## 当前本地验证

当前可运行 `npm run data:validate` 校验资料源清单，运行 `npm run wiki:candidates` 演示合成候选数据规范化。真实候选生成与字段级差异命令留待获得自动化访问许可后实现。

## 将来接入真实数据的门槛

1. 确认自动化访问、缓存和内容再利用许可。
2. 为 fetcher 增加限速、重试、缓存和可识别的 User-Agent。
3. 原始响应只进入受控缓存；manifest 保存 URL、上游版本、时间和哈希。
4. 解析输出经人工字段级审阅，不自动覆盖已审核数据。
5. 计算字段必须标注目标游戏版本与来源；帧数据和隐藏机制记录实测方法。
6. schema、引用、范围和金标准测试全部通过后，才可进入 `src/data/versions/`。

## 解析器边界

Phase 0 没有实现官方 WIKI 富文本或组件解析器；`wiki:candidates` 只对合成 JSON 演示最小规范化，不能用于真实词条。未来解析器可从 `role-component`、`basic-component` 与 `tabs-component` 的最小公共形状开始；遇到未知组件或空内容时必须产生 warning，而不是猜测字段含义。每条新增解析规则都需要离线 fixture 和单元测试。
