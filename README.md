# DSH Session Center（会话中心）

DeepSeek Harness（DSH）Web GUI 的会话中心面板插件。

左侧工作目录越积越多、会话散落在「视图选项 - 单列表」里不好找？这个插件在侧边栏新增一个「会话中心」面板，把**工作目录 / 最近 / 进行中**三栏并排呈现，每行一个按钮直达目标。

> 版本 1.0.0 · 适用 DSH 0.2.x（web 平台）· 纯视图插件，不改任何官方行为

## 功能

**工作目录**
- 列出全部工作区：目录名 + 完整路径 + 会话数
- 点击目录名打开该工作区
- 行尾「+ 新会话」按钮：一键在该目录下开启新会话并跳转

**进行中**
- 正在运行的顶层会话（自动排除 subagent 子会话）
- 状态点颜色区分：🟢 运行中 / 🟠 等待批准 / 🟣 计划待审 / 🔵 等待回答
- 行尾「打开会话」按钮直达

**最近**
- 最近 30 条非空会话，按更新时间倒序
- 双行布局：标题 + 时间在上，所属工作目录名在下
- 当前打开的会话带「当前」徽标高亮

## 安装

### 方式 A：从本地目录安装

1. 克隆或下载本仓库到本地任意目录
2. 打开 DSH Web GUI 的 **Plugin Manager**
3. 安装 bundle，选择本插件目录（含 `package.json` 的那层）

### 方式 B：从插件市场安装（发布后可用）

在市场内搜索 **dsh-session-center** 直接安装。

## 使用

1. 点击侧边栏的会话中心图标（面板顺序排在 Plugins / Schedule / task-board 之后）
2. 三栏并排：工作目录 | 最近 | 进行中
3. 所有操作都是行尾按钮：
   - 工作目录行 →「+ 新会话」
   - 最近 / 进行中行 →「打开会话」

## 工作原理（给插件开发者）

- **注册方式**：client 模块经 `window.__ModuleLoader__.load` 加载，向 `sidebar.panellist` 注册面板入口（order 30），向 layout 的 `main` 槽注册 keyed 页面（key `session-hub`），与官方 Plugins / Schedule 页面同一条通道
- **数据源**：客户端响应式 catalog —— `sessions.list` 与 `workspaces.list` 两个 `ObservableSnapshot`，无轮询、无 Host RPC
- **动作**：优先走官方导航面 `ctx.uiWorkspace.openSession / startSession / openWorkspace`，异常时降级为 `sessions.retain / sessions.create`
- **Host 半**：空 `apply()`（纯视图插件，Host 无逻辑）
- **样式**：只使用 `--dsw-alias-*` 主题 token，自动适配亮暗主题
- **文本**：全部走 locale 服务（内置 zh / en 双语字典）

## 目录结构

```
session-hub/
├── package.json        # bundle 清单（exports / dsh.client 注入声明）
├── cordis.patch.yml    # bundle 注册补丁
├── index.js            # Host 半（空实现）
├── client.js           # Client 半（面板 + 三栏视图 + 动作）
├── locale/
│   ├── en.json
│   └── zh.json         # 显示元数据（Plugin Manager 里展示的名称/描述）
├── icon.svg            # 面板图标
└── README.md
```

## 发布（维护者）

发布到 DSH 插件市场的路径：

1. **改正式包名**：`package.json` 的 `name` 从 `@local/session-hub` 改为 npm 上的正式名（如 `dsh-session-center`），同步修改 `cordis.patch.yml` 里的 `name` 与 client 模块 `id`
2. **发布到 npm**：`npm publish`（公开包）
3. **提交市场收录**：按 dshmarket 的收录流程提交仓库地址

## License

暂未定（欢迎提 issue 讨论）。
