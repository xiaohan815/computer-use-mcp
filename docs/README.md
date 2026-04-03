# 文档索引

本目录包含 computer-use-mcp 项目的详细文档。

## 📚 核心文档

### [COORDINATES.md](./COORDINATES.md)
坐标系统详细说明文档，解释了三层坐标空间（逻辑、物理、API）的转换关系。

**适合阅读对象**：需要理解坐标转换机制的开发者

---

### [USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md)
12 个实用示例，展示如何使用 Phase 4 新增的功能。

**适合阅读对象**：所有用户，特别是想快速上手的开发者

**包含内容**：
- 等待应用加载
- 复制粘贴大段文本
- 选择整段文本
- 放大查看小字
- 精细拖拽控制
- 组合使用示例

---

## 🔧 开发文档

### [OPTIMIZATION_PLAN.md](./OPTIMIZATION_PLAN.md)
完整的优化计划，记录了从 Phase 1 到 Phase 4 的所有优化项目。

**适合阅读对象**：项目维护者、贡献者

**包含内容**：
- Phase 1: 快速优化（坐标转换、鼠标延迟）
- Phase 2: 功能增强（应用打开）
- Phase 3: 高级功能（窗口过滤，暂不实施）
- Phase 4: 功能对齐 Claude Code（8 个新功能）

---

### [PHASE4_IMPLEMENTATION.md](./PHASE4_IMPLEMENTATION.md)
Phase 4 实施总结，详细记录了 8 个新功能的实现细节。

**适合阅读对象**：想了解实现细节的开发者

**包含内容**：
- wait - 等待功能
- triple_click - 三击选择
- read_clipboard / write_clipboard - 剪贴板操作
- zoom - 区域放大截图
- hold_key - 长按键
- left_mouse_down / left_mouse_up - 精细拖拽控制

---

### [CLAUDE_CODE_TOOLS_COMPARISON.md](./CLAUDE_CODE_TOOLS_COMPARISON.md)
与 Claude Code 源码的功能对比分析。

**适合阅读对象**：想了解与官方实现差异的开发者

**包含内容**：
- 功能覆盖率对比
- 已实现功能列表
- 未实现功能说明

---

## 📝 变更记录

### [RENAME_SUMMARY.md](./RENAME_SUMMARY.md)
`activate_app` → `open_application` 重命名记录。

**适合阅读对象**：需要迁移旧代码的用户

**包含内容**：
- 修改原因
- 修改内容
- 验证结果
- 迁移指南

---

### [TESTING_NOTES.md](./TESTING_NOTES.md)
测试笔记和调试记录。

**适合阅读对象**：测试人员、调试问题的开发者

---

## 🚀 快速开始

1. **新用户**：先阅读主 [README.md](../README.md) 和 [USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md)
2. **开发者**：阅读 [COORDINATES.md](./COORDINATES.md) 和 [OPTIMIZATION_PLAN.md](./OPTIMIZATION_PLAN.md)
3. **贡献者**：阅读 [PHASE4_IMPLEMENTATION.md](./PHASE4_IMPLEMENTATION.md) 了解代码结构

---

## 📊 文档结构

```
computer-use-mcp/
├── README.md                          # 主文档（英文）
├── README_CN.md                       # 主文档（中文）
└── docs/
    ├── README.md                      # 本文件（文档索引）
    ├── COORDINATES.md                 # 坐标系统说明
    ├── USAGE_EXAMPLES.md              # 使用示例
    ├── OPTIMIZATION_PLAN.md           # 优化计划
    ├── PHASE4_IMPLEMENTATION.md       # Phase 4 实施总结
    ├── CLAUDE_CODE_TOOLS_COMPARISON.md # 功能对比
    ├── RENAME_SUMMARY.md              # 重命名记录
    └── TESTING_NOTES.md               # 测试笔记
```

---

## 🔗 相关链接

- [主项目 README](../README.md)
- [中文 README](../README_CN.md)
- [GitHub 仓库](https://github.com/domdomegg/computer-use-mcp)
- [Claude Code 官方文档](https://docs.anthropic.com/en/docs/build-with-claude/computer-use)
