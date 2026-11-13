# 插件市场收录提交包

本目录存放向 [awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin) 目录仓库投稿所需的文件。收录后会自动出现在 DSH 插件市场（dshmarket）、awesome-dsh-plugin.com 及插件索引中。

## 提交步骤

1. Fork `awesome-dsh-plugin/awesome-dsh-plugin` 仓库。
2. 把本目录的 `lhswei__dsh-session-center.yml` 复制为其 `data/plugins/lhswei__dsh-session-center.yml`（一个文件即全部投稿，两个 README 由脚本生成，不要手编）。
3. 发起 PR（一个 PR 最多 3 条；此处只投 1 条）。
4. CI 依次检查：条目数 → `dsh.bundle` 清单 → 仓库创建满 1 天 → awesome-lint + 站点构建。检查失败会明确说明改什么，推同一分支修复即可。
5. 维护者人工评审（描述与代码核对、分类、真实可用性）。若被打 `held: author` 标签：推修复到同一分支并留**一条**评论说明改动。
6. 合并后网站自动重建，无需其他操作。

## 提交前自查清单

- [ ] 仓库 `package.json` 声明了完整 `dsh.bundle`（`dsh.bundle.patch` + 根目录 `cordis.patch.yml`）——只声明 `dsh.client` 是最常见被拒原因（本仓库已符合）
- [ ] 仓库已添加 GitHub topic `dsh-plugin`
- [ ] 仓库创建已满 1 天（CI 自动检查，不达标就等一天再提，重新提交无任何影响）
- [ ] 描述与代码核实一致，无营销词
- [ ] （可选，加分）仓库根放 `screenshots.json` 声明 1-8 张截图，路径相对该文件；市场详情页会展示
- [ ] （可选，加分）发布 npm 包，市场显示下载量且用户安装免构建授权；npm 包 `repository` 字段必须指回本仓库，映射自动采集

## 字段说明

| 字段 | 值 | 说明 |
| --- | --- | --- |
| `url` | https://github.com/lhswei/dsh-session-center | 必须与仓库完全一致 |
| `name` | lhswei/dsh-session-center | 列表中显示的链接文字 |
| `category` | session | 会话管理类 |
| `description.en` | 必填 | 一句话、句号结尾、事实性描述 |
| `description.zh` | 可选 | 维护者可代补 |
| `icon` | 未填 | 仅接受 GitHub 托管位图（png/jpg/webp），SVG 拒收；不填回退作者头像 |
| `tarball` | 未填 | 若不发 npm，可在 GitHub Release 挂预构建 .tgz 后添加此字段 |
