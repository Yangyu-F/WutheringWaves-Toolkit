# 库街区《鸣潮》WIKI 离线快照

此目录保存官方 Wiki 的离线数据获取约定。生产应用不会在运行时请求 Wiki；下载结果只作为候选输入，必须经过人工复核、schema 校验和测试后才能进入 `src/data/versions/`。

## 下载范围

`npm run wiki:snapshot` 获取：

- 完整公开目录树；
- 共鸣者（目录 ID `1105`）；
- 武器（目录 ID `1106`）；
- 声骸（目录 ID `1107`）；
- 合鸣效果（目录 ID `1219`）；
- 敌人（目录 ID `1158`）。

分类快照包含官方名称、词条 ID、标签、实装版本、目录版本和素材 URL 等公开元数据，并通过官方页面当前使用的 `getEntryDetail` 只读接口下载共鸣者、武器、声骸和合鸣效果的全部词条正文。脚本不会下载图片、视频、攻略、剧情或同人内容。

正文接口无需登录令牌。脚本不会读取 `KURO_WIKI_TOKEN`、浏览器 Cookie 或其他登录凭据；请求仅包含官方页面匿名访问时使用的公开请求头。

## 使用

```bash
npm run wiki:snapshot
npm run wiki:process
```

可选参数直接传给脚本：

```bash
npm run wiki:snapshot -- --date=2026-08-10 --delay-ms=1000 --retries=3
```

输出位于 `data-sources/kuro-wiki/raw/<YYYY-MM-DD>/`。原始响应可能较大且属于可重新获取的上游快照，因此该目录已被 Git 忽略。每次快照包含 `manifest.json`，记录获取时间、在线目录版本、文件大小和 SHA-256。

`wiki:process` 将同日期的正文快照转换到 `data-sources/kuro-wiki/processed/<YYYY-MM-DD>/`：每个词条包含官方实体名、正文版本、去重标题、可检索纯文本和原始响应哈希。处理结果仍是 `candidate`，不会自动进入正式数据。

下载器默认使用 Node 内置 `fetch`；若当前 Windows/WSL 网络代理导致连接失败，会自动回退到系统 `curl`。两种传输方式使用相同的公开接口、请求头、限速和重试策略。

## 数据使用规则

1. 简体中文名称以官方 Wiki 为准。
2. 上游目录 ID、卡片 ID、词条 ID 只用于来源映射，不作为项目稳定 ID。
3. BWiki 与 WikiWiki 用于数值、动作对应关系和别名交叉验证。
4. 任何解析结果先进入 candidate，不允许下载后直接覆盖正式版本数据。
5. 调整下载范围或频率前，应重新检查站点条款、robots 和内容再利用要求。
