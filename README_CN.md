# computer-use-mcp

💻 一个让 Claude 控制你电脑的模型上下文协议（MCP）服务器。这与 [computer use](https://docs.anthropic.com/en/docs/build-with-claude/computer-use) 非常相似，但更容易在本地设置和使用。

这是 Claude Haiku 4.5 更改我的桌面背景的演示（4倍速）：

https://github.com/user-attachments/assets/cd0bc190-52c4-49db-b3bc-4b8a74544789

> [!WARNING]
> 警告：目前的 AI 模型经常会犯错，并且容易受到提示注入攻击。由于这个 MCP 服务器让模型完全控制你的电脑，可能会造成很大的损害。因此，你应该把这当作让一个多动的幼儿访问你的电脑 - 你可能需要密切监督，并考虑只在沙盒用户账户中使用。

## 安装方法

<details>
<summary><strong>Claude Code - 方式1：全局安装（推荐）</strong></summary>

全局安装 npm 包，适合日常使用：

```bash
# 安装包
npm install -g computer-use-mcp

# 添加到 Claude Code
claude mcp add --scope user --transport stdio computer-use-local -- computer-use-mcp
```

这会在用户范围安装服务器（在所有项目中可用）。

</details>

<details>
<summary><strong>Claude Code - 方式2：源码安装（开发调试）</strong></summary>

从源码构建，适合需要修改代码或调试：

```bash
# 1. 进入源码目录
cd computer-use-research/domdomegg-computer-use-mcp

# 2. 安装依赖
npm install

# 3. 构建项目
npm run build

# 4. 添加到 Claude Code（使用绝对路径）
claude mcp add --scope user --transport stdio computer-use-local -- node /Users/xhm5/work/cc_research/computer-use-research/domdomegg-computer-use-mcp/dist/main.js
```

修改源码后，重新运行 `npm run build`，然后在 Claude Code 中输入 `/mcp` 重新连接即可。

</details>

<details>
<summary><strong>Claude Code - 方式3：npx 在线安装（不推荐）</strong></summary>

直接使用 npx 运行（可能会遇到依赖问题）：

```bash
claude mcp add --scope user --transport stdio computer-use-local -- npx -y computer-use-mcp
```

注意：npx 方式可能因为依赖问题导致连接失败，推荐使用方式1或方式2。

</details>

<details>
<summary><strong>Claude Desktop</strong></summary>

#### （推荐）通过手动安装 .dxt 文件

1. 在 [GitHub Actions 历史记录](https://github.com/domdomegg/computer-use-mcp/actions/workflows/dxt.yaml?query=branch%3Amaster)中找到最新的 dxt 构建（最上面的那个）
2. 在 'Artifacts' 部分，下载 `computer-use-mcp-dxt` 文件
3. 将 `.zip` 文件重命名为 `.dxt`
4. 双击 `.dxt` 文件，用 Claude Desktop 打开
5. 点击 "Install"（安装）

#### （高级）备选方案：通过 JSON 配置

1. 安装 [Node.js](https://nodejs.org/en/download)
2. 打开 Claude Desktop，进入 Settings → Developer
3. 点击 "Edit Config" 打开你的 `claude_desktop_config.json` 文件
4. 在 "mcpServers" 部分添加以下配置：

```json
{
  "mcpServers": {
    "computer-use": {
      "command": "npx",
      "args": [
        "-y",
        "computer-use-mcp"
      ]
    }
  }
}
```

5. 保存文件并重启 Claude Desktop

</details>

<details>
<summary><strong>Cursor</strong></summary>

#### （推荐）通过一键安装

1. 点击 [![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/install-mcp?name=computer-use&config=JTdCJTIyY29tbWFuZCUyMiUzQSUyMm5weCUyMC15JTIwY29tcHV0ZXItdXNlLW1jcCUyMiU3RA%3D%3D)

#### （高级）备选方案：通过 JSON 配置

创建全局配置文件（`~/.cursor/mcp.json`）或项目特定配置文件（`.cursor/mcp.json`）：

```json
{
  "mcpServers": {
    "computer-use": {
      "command": "npx",
      "args": ["-y", "computer-use-mcp"]
    }
  }
}
```

</details>

<details>
<summary><strong>Cline</strong></summary>

#### （推荐）通过市场安装

1. 点击 Cline 扩展中的 "MCP Servers" 图标
2. 搜索 "Computer Use" 并点击 "Install"
3. 按照提示安装服务器

#### （高级）备选方案：通过 JSON 配置

1. 点击 Cline 扩展中的 "MCP Servers" 图标
2. 点击 "Installed" 标签，然后点击底部的 "Configure MCP Servers" 按钮
3. 在 "mcpServers" 部分添加以下配置：

```json
{
  "mcpServers": {
    "computer-use": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "computer-use-mcp"]
    }
  }
}
```

</details>

## 使用技巧

这个工具开箱即用。

但是，为了获得最佳效果：
- 使用擅长 computer use 的模型 - 推荐使用[最新的 Claude 模型](https://platform.claude.com/docs/en/about-claude/models/overview)
- 使用小而常见的分辨率 - 720p 效果特别好。在 macOS 上，你可以使用 [displayoverride-mac](https://github.com/domdomegg/displayoverride-mac) 来实现。如果无法使用不同的分辨率，尝试放大活动窗口
- 安装并启用 [Rango 浏览器扩展](https://chromewebstore.google.com/detail/rango/lnemjdnjjofijemhdogofbpcedhgcpmb)。这可以为网站启用键盘导航，比 Claude 尝试点击坐标要可靠得多。你可以在 Rango 中增加字体大小设置，使提示更清晰可见

## 工作原理

我们实现了与 [Anthropic 官方 computer use 指南](https://docs.anthropic.com/en/docs/build-with-claude/computer-use)几乎相同的 computer use 工具，并增加了一些提示来优先使用键盘快捷键。

这个工具使用 [nut.js](https://github.com/nut-tree/nut.js) 与你的电脑通信。

## 贡献

欢迎在 GitHub 上提交 Pull Request！开始步骤：

1. 安装 Git 和 Node.js
2. 克隆仓库
3. 使用 `npm install` 安装依赖
4. 运行 `npm run test` 执行测试
5. 使用 `npm run build` 构建

## 发布

版本遵循[语义化版本规范](https://semver.org/)。

发布步骤：

1. 使用 `npm version <major | minor | patch>` 更新版本号
2. 运行 `git push --follow-tags` 推送并带上标签
3. 等待 GitHub Actions 发布到 NPM 仓库


非源码安装到claude code里:
npm install -g computer-use-mcp

claude mcp remove computer-use-local

claude mcp add --scope user --transport stdio computer-use-local -- computer-use-mcp
