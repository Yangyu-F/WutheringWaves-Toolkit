# 社区 Wiki 定向快照

这里记录 BWiki 与 WikiWiki 的定向离线快照方式。社区页面用于交叉核对名称、别名、满级面板、技能倍率和效果描述，不覆盖库街区官方 Wiki 已确认的中文实体名称。

```bash
npm run wiki:community-snapshot
```

默认以同日期的官方目录快照为实体全集，下载 BWiki 中全部共鸣者、武器、声骸和合鸣效果页面。每份页面保存原始 HTML、响应头，并在 manifest 中记录 URL、获取时间、字节数、ETag、Last-Modified 和 SHA-256。

WikiWiki 当前对自动化出口返回 Cloudflare 403，BWiki 在连续访问后也可能返回 `EO_Bot_Ssid` 自动化挑战。下载器会识别挑战并立即停止，不计算挑战 Cookie或绕过访问控制。仅在站点允许普通页面访问时，可用 `--include-wikiwiki-phase-one=true` 验证少量既有映射；全量社区镜像必须采用站点允许的访问方式，并通过低频增量快照补齐。

输出位于 `data-sources/community-wikis/raw/<YYYY-MM-DD>/`，默认被 Git 忽略。下载器遵守两站 robots.txt：只访问不带查询参数的普通内容页面，不访问编辑、历史、用户、模板、附件或后台路径；请求之间默认等待 1.5 秒。

如需扩大范围，应先确认页面确实属于项目数据需求，不要镜像攻略、评论、用户页面或无关素材。解析结果必须先进入 candidate，并保留站点、语言和页面标题，不能把 WikiWiki 的日文显示名写入简体中文正式名称字段。
