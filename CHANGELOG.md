# 更新日志

## [Unreleased] - 2026-04-03

### ✨ 新增功能 (Phase 4)

实现了 8 个新工具，功能覆盖率从 52% 提升到 87%：

1. **wait** - 等待指定时长
   - 支持小数秒（如 0.5 秒）
   - 用于等待应用加载、动画完成

2. **triple_click** - 三击选择段落
   - 快速选择整段文本
   - 比拖拽选择更可靠

3. **read_clipboard** - 读取剪贴板
   - 跨平台支持（macOS/Linux/Windows）
   - 返回文本内容

4. **write_clipboard** - 写入剪贴板
   - 跨平台支持
   - 比 type 更快处理大段文本

5. **zoom** - 区域放大截图
   - 接受 [x, y, width, height] 参数
   - 自动放大到 API 限制的最大尺寸
   - 方便查看小字和细节

6. **hold_key** - 长按键盘按键
   - 格式：`key:duration` 或 `key`
   - 默认时长 1 秒

7. **left_mouse_down** - 按住左键
   - 用于精细拖拽控制
   - 可与 mouse_move 组合使用

8. **left_mouse_up** - 释放左键
   - 与 left_mouse_down 配合
   - 实现分步拖拽

### 🔄 重命名

- `activate_app` → `open_application`（与 Claude Code 源码保持一致）

### 📚 文档改进

- 重组文档结构，所有文档移至 `docs/` 目录
- 新增 `docs/README.md` 作为文档索引
- 新增 `docs/USAGE_EXAMPLES.md` - 12 个实用示例
- 新增 `docs/PHASE4_IMPLEMENTATION.md` - 实施细节
- 新增 `docs/RENAME_SUMMARY.md` - 重命名记录
- 更新主 README 添加文档链接

### 🐛 修复

- 修复坐标类型处理（支持 2 值和 4 值坐标）
- 改进错误处理和参数验证

### 🧪 测试

- ✅ 所有测试通过 (9 passed | 1 skipped)
- ✅ TypeScript 编译成功
- ✅ 跨平台功能验证

---

## 文档结构

```
computer-use-mcp/
├── README.md                          # 主文档（英文）
├── README_CN.md                       # 主文档（中文）
├── CHANGELOG.md                       # 本文件
└── docs/
    ├── README.md                      # 文档索引
    ├── COORDINATES.md                 # 坐标系统说明
    ├── USAGE_EXAMPLES.md              # 使用示例
    ├── OPTIMIZATION_PLAN.md           # 优化计划
    ├── PHASE4_IMPLEMENTATION.md       # Phase 4 实施总结
    ├── CLAUDE_CODE_TOOLS_COMPARISON.md # 功能对比
    ├── RENAME_SUMMARY.md              # 重命名记录
    └── TESTING_NOTES.md               # 测试笔记
```

---

## 统计数据

| 指标 | 之前 | 现在 | 提升 |
|------|------|------|------|
| 工具数量 | 12 | 20 | +67% |
| 功能覆盖率 | 52% | 87% | +35% |
| 代码行数 | ~530 | 830 | +300 行 |
| 文档数量 | 5 | 10 | +5 个 |

---

## 迁移指南

如果你使用了旧版本的 `activate_app`，需要更新为 `open_application`：

```typescript
// 旧代码
{action: 'activate_app', text: 'WeChat'}

// 新代码
{action: 'open_application', text: 'WeChat'}
```

功能保持不变，只是名称更改。

---

## 致谢

感谢 Claude Code 团队提供的优秀实现参考。
