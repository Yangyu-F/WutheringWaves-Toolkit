# 数据维护说明

## 当前实现边界

项目已建立 `data-sources/kuro-wiki/` 来源清单与映射、Zod schema、合成 fixture、候选规范化示例及 `npm run data:validate` 校验命令。`npm run wiki:snapshot` 可从官方 Wiki 页面使用的公开只读接口获取计算器相关五类目录元数据和词条正文；正式版本数据仍需人工审核，不能由快照直接覆盖。

- 所有实体数据都以库街区《鸣潮》WIKI 为主要依据。共鸣者固定与鸣潮 BWiki、`https://wikiwiki.jp/w-w/` 交叉验证；武器、声骸和合鸣只与鸣潮 BWiki 交叉验证。其他社区资料仅补充指定来源均未提供的机制数据。
- 官方目录名称与 BWiki 实际词条标题不一致时，在 `scripts/wiki/mappings/bwiki-title-overrides.json` 记录实体级映射、证据链接、核对日期和原因。抓取脚本只使用已核对的显式映射，不根据模糊相似度自动覆盖标题；多个官方变体可映射到同一个社区词条，但仍分别保存官方实体 ID。
- `npm run wiki:extract-candidates -- --date=YYYY-MM-DD` 将同日官方正文和社区快照整理到 `data-sources/extracted/candidates/<date>/`。输出按 `resonators`、`weapons`、`echoes`、`sonatas` 分类，文件名为 `<无声调拼音>-<kuro-wiki|bwiki>.json`。该目录属于可再生候选数据，不进入生产数据或 Git。
- 候选提取仅保留四星、五星共鸣者与武器，以及 COST 3、COST 4 声骸；声骸效果固定提取五星描述。共鸣者候选包含 90 级基础值、技能名称/描述/等级数值和共鸣链；武器、声骸、合鸣候选包含名称、基础字段、效果名、原始效果描述与其中的数值。
- BWiki 的 MediaWiki revision JSON 可以可靠解析模板字段；早期只缓存渲染 HTML 的页面会在索引中标记为未处理，而不是从页面导航和装饰文本中猜测数据。后续应通过低频增量抓取逐步升级为 revision JSON。
- 截至 `2026-08-13`，`2026-08-10` 社区快照 manifest 已保存 193 个 BWiki revision 文件，尚有 221 个目录实体待处理，其中 165 个仍有旧 HTML 等待升级。最近一次增量在武器实体 `1351371642859593728` 遇到 HTTP 567 后停止；后续运行从 manifest 断点继续，不绕过限流或自动化挑战。
- 3.5 候选集的目标集合为 60 名共鸣者、89 把四/五星武器、95 个 COST 3/4 声骸和 34 套合鸣。当前官方目录还提前展示 3.6 的清宵与景燃，因此原始快照保留 62 条共鸣者记录，候选提取依据 `scripts/wiki/mappings/game-version-scope.json` 排除这两条；不得把目录当前总数直接当作 3.5 的版本集合。backup 的四类数量与 3.5 目标一致，只用于集合差异核对。数量异常时优先检查目录卡片的 `linkUrl`，因为部分卡片会保留过期或空的 `linkConfig.entryId`。
- 当前仓库没有 CI 在线同步任务，也不把站点前端使用的内部接口视为稳定公共 API。快照只能由维护者手动运行。
- `data-sources/kuro-wiki/fixtures/` 当前只保存合成样例，用于验证候选数据的最小规范化与来源状态。
- `data-sources/kuro-wiki/raw/` 保存按日期生成的目录树、共鸣者、武器、声骸、合鸣效果和敌人原始响应；该目录默认被 Git 忽略。
- 合成样例不得被发布为游戏数据；规范化结果始终为 `candidate`。

## 当前本地验证

当前可运行 `npm run data:validate` 校验资料源清单，运行 `npm run wiki:candidates` 演示合成候选数据规范化，并运行 `npm run wiki:snapshot` 获取可复核的官方目录与正文快照。正文通过官方页面使用的匿名 `getEntryDetail` 只读接口取得，不读取登录令牌或 Cookie。可运行 `npm run wiki:process -- --date=YYYY-MM-DD` 生成带标题、可检索正文和原始 SHA-256 的 candidate 索引；结构化字段解析和 candidate diff 仍待后续实现。

项目 backup 中已有的效果说明只作为候选资料，不构成独立验证来源。正式版本按实体记录来源：共鸣者与 BWiki、WikiWiki 交叉核对，武器、声骸和合鸣与 BWiki 交叉核对；不要求每个倍率重复记录字段级链接。任一指定来源缺失或数值冲突时保留候选状态并记录差异。图标资产可以独立迁移，不改变效果数据的验证状态。

## 快照与正式数据之间的门槛

1. 调整访问范围或频率前，重新确认自动化访问、缓存和内容再利用要求。
2. fetcher 保持限速、重试、本地缓存；不得放入 CI 定时运行。
3. 原始响应只进入被 Git 忽略的受控缓存；manifest 保存 URL、上游版本、时间和 SHA-256。
4. 解析输出经人工字段级审阅，不自动覆盖已审核数据。
5. 计算字段必须标注目标游戏版本与来源；估算时序标记策略与参数，实测时序和隐藏机制才需记录测试方法。
6. 主来源与指定交叉验证源冲突时保存两边的值、适用版本和裁决依据，不得静默覆盖。
7. schema、引用、范围和金标准测试全部通过后，才可进入 `src/data/versions/`。

## 解析器边界

当前流程已经能从官方 `role-component`、`basic-component`、`tabs-component` 和 BWiki 模板生成分类 candidate；它会保留效果原文、抽取到的数值、来源实体 ID 和原始 SHA-256。结果仍不能未经人工审阅进入正式版本数据：多音字拼音、复杂合并单元格、同一数字的语义以及未知组件都需要复核，并应逐步补充离线 fixture 与解析器单元测试。
