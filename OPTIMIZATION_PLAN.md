# domdomegg-computer-use-mcp 优化计划

基于 Claude Code 原生实现的优化方案，保持跨平台兼容性的同时提升性能和准确性。

## 📋 优化项目清单

### ✅ 已完成
- [x] 添加调试日志系统（`debug-mcp.sh` + stderr 日志）

### 🎯 Phase 1: 快速优化（✅ 已完成）
- [x] 修复 Retina 显示器坐标转换（参考 Claude Code 的 computeTargetDims）
- [x] 红十字光标位置标记（基于正确的坐标转换）
- [x] 鼠标移动延迟（50ms settle time，所有点击操作）
- [x] 坐标系统文档（COORDINATES.md）
- [x] 截图格式：保持 PNG（确保 AI 识别准确，特别是中文）

### 🔄 Phase 2: 功能增强（✅ 已完成）
- [x] 应用激活功能（macOS + Linux + Windows）
  - macOS: `open -a` 命令（已验证有效）
  - Linux: `wmctrl` 或 `xdotool`（自动 fallback）
  - Windows: PowerShell `AppActivate`

### ⏸️ Phase 3: 高级功能（可选，暂不实施）

### 🎯 待实现优化

#### 1. 截图格式优化：PNG → JPEG（已测试，不推荐）
**测试结果**：JPEG 压缩（即使质量 95）对中文识别效果不佳

**结论**：保持 PNG 格式，确保 AI 识别准确

**工作量**：⭐ 简单（已完成测试）

**状态**：❌ 不采用（优先保证识别准确性）

---

#### 2. 鼠标移动延迟优化
**目标**：鼠标移动后等待 50ms 稳定，避免触发悬停效果

**实现方案**：
```typescript
// 在 mouse_move 和所有点击操作前添加延迟
case 'mouse_move': {
  await mouse.setPosition(new Point(scaledCoordinate[0], scaledCoordinate[1]));
  await setTimeout(50);  // 新增：50ms 稳定时间
  return jsonResult({ok: true});
}

case 'left_click': {
  if (scaledCoordinate) {
    await mouse.setPosition(new Point(scaledCoordinate[0], scaledCoordinate[1]));
    await setTimeout(50);  // 新增：50ms 稳定时间
  }
  await mouse.leftClick();
  return jsonResult({ok: true});
}
```

**优点**：
- 避免鼠标移动过程中触发悬停菜单
- 给应用足够时间响应鼠标位置变化
- 提高点击准确性

**工作量**：⭐⭐ 中等（需要修改多个 action）

---

#### 3. 应用激活功能
**目标**：确保操作的应用在前台

**实现方案**：
```typescript
// 新增 action: activate_app
case 'activate_app': {
  if (!text) {
    throw new Error('Text required for activate_app (application name)');
  }
  
  if (process.platform === 'darwin') {
    execFileSync('open', ['-a', text]);
    await setTimeout(500);  // 等待应用激活
    return jsonResult({ok: true});
  } else if (process.platform === 'linux') {
    // Linux: 使用 wmctrl 或 xdotool
    execFileSync('wmctrl', ['-a', text]);
    await setTimeout(500);
    return jsonResult({ok: true});
  } else if (process.platform === 'win32') {
    // Windows: 使用 PowerShell
    execFileSync('powershell', [
      '-Command',
      `(New-Object -ComObject WScript.Shell).AppActivate('${text}')`
    ]);
    await setTimeout(500);
    return jsonResult({ok: true});
  }
}
```

**优点**：
- ✅ macOS: `open -a` 已验证有效
- ✅ 跨平台支持
- AI 可以在操作前先激活目标应用

**工作量**：⭐⭐ 中等（需要跨平台实现）

---

#### 4. 窗口过滤功能（高级）
**目标**：截图时排除干扰窗口（如终端、IDE）

**挑战**：
- nut.js 的 `screen.grab()` 不支持窗口过滤
- 需要使用平台原生 API

**macOS 实现方案**：
```typescript
// 方案 A：使用 screencapture 命令（已有 fallback）
// 当前代码已经有 screencapture fallback，但它截取全屏
// 需要研究 screencapture 是否支持窗口过滤

// 方案 B：调用原生 Swift 模块（复杂）
// 需要编译 Swift 代码，使用 SCContentFilter API
// 参考 Claude Code 的 @ant/computer-use-swift 模块

// 方案 C：后处理方式（折中）
// 截图后，使用 AppleScript 获取窗口位置，遮盖干扰区域
const terminalBounds = execFileSync('osascript', [
  '-e', 
  'tell application "System Events" to get bounds of window 1 of process "Terminal"'
]);
// 然后用 sharp 在这些区域画黑色遮罩
```

**Linux 实现方案**：
```bash
# 使用 xdotool 获取窗口 ID
WINDOW_ID=$(xdotool search --name "WeChat")
# 使用 import 命令截取特定窗口
import -window $WINDOW_ID screenshot.png
```

**优点**：
- 减少 AI 视觉干扰
- 提高坐标判断准确性
- 保护隐私（不截取终端内容）

**缺点**：
- 实现复杂度高
- macOS 需要编译原生模块或使用复杂的 AppleScript
- 跨平台实现差异大

**工作量**：⭐⭐⭐⭐⭐ 非常复杂（需要原生模块或复杂脚本）

**建议**：暂时搁置，优先实现前 3 项

---

#### 5. 坐标系统文档化
**目标**：添加类似 Claude Code 的 COORDINATES.md 文档

**内容**：
```markdown
# 坐标系统说明

## 三层坐标空间

1. **逻辑坐标（Logical）**：操作系统报告的屏幕尺寸
   - macOS Retina: 1728x1117
   - 这是 nut.js 的 screen.width/height 返回值

2. **物理坐标（Physical）**：实际像素分辨率
   - macOS Retina: 3456x2234 (2x scale)
   - 截图原始尺寸

3. **API 图像坐标（API Image）**：缩放后的图像尺寸
   - 限制：长边 ≤ 1568px，总像素 ≤ 1.15MP
   - 实际：1365x882 (39.5% scale)

## 转换链

```
AI 坐标 (API Image)
    ↓ × (1 / apiScaleFactor)
逻辑坐标 (Logical)
    ↓ × retinaScale
物理坐标 (Physical)
    ↓ × apiScaleFactor
API 图像坐标 (for cursor drawing)
```
```

**工作量**：⭐ 简单（文档编写）

---

## 🚀 实施优先级

### Phase 1：快速优化（1-2 小时）
1. ✅ JPEG 格式转换（减小文件 60%）
2. ✅ 鼠标移动延迟（提高准确性）
3. ✅ 坐标系统文档

### Phase 2：功能增强（2-4 小时）
4. ✅ 应用激活功能（macOS + Linux + Windows）
5. ⏸️ 测试和调试

### Phase 3：高级功能（可选，8+ 小时）
6. ⏸️ 窗口过滤（需要原生模块或复杂脚本）

---

## 📊 预期效果

| 优化项 | 当前状态 | 优化后 | 提升 |
|--------|---------|--------|------|
| 截图格式 | PNG | PNG | 保持最佳质量 |
| 鼠标准确性 | 偶尔触发悬停 | 稳定点击 | ✅ |
| 应用管理 | 手动 Cmd+Space | 自动激活 | ✅ |
| 窗口干扰 | 全屏截图 | 过滤终端 | 🔄 |
| AI 识别 | - | 完美识别中文 | ✅ |

---

## 🔧 技术细节

### 截图格式选择

经过测试，决定使用 PNG 格式：

- **JPEG 75**（Claude Code 默认）：~120KB，但中文识别不佳 ❌
- **JPEG 85**：~180KB，识别一般 ⚠️
- **JPEG 95**：~300KB，接近无损但仍有压缩伪影 ⚠️
- **PNG**：~550KB，完美识别中文 ✅

结论：虽然 PNG 文件较大，但为了确保 AI 准确识别中文文字，选择 PNG 格式。

### 鼠标延迟时间
- Claude Code: 50ms (`MOVE_SETTLE_MS`)
- 原因：HID → AppKit → NSEvent 往返时间
- 建议：保持 50ms

### 应用激活验证
```bash
# macOS 测试
open -a WeChat && sleep 0.5 && osascript -e 'tell application "System Events" to get name of first application process whose frontmost is true'
# 应该输出: WeChat

# Linux 测试（需要 wmctrl）
wmctrl -a firefox && sleep 0.5 && xdotool getactivewindow getwindowname

# Windows 测试（PowerShell）
(New-Object -ComObject WScript.Shell).AppActivate('notepad')
```

---

## 📝 实施注意事项

1. **向后兼容**：所有新功能都是可选的，不影响现有功能
2. **跨平台测试**：每个功能都需要在 macOS/Linux/Windows 上测试
3. **错误处理**：应用激活失败时应该优雅降级，不阻塞后续操作
4. **文档更新**：README.md 和 README_CN.md 都需要更新

---

## 🎯 下一步行动

1. 用户确认优化方案
2. 按 Phase 1 → Phase 2 → Phase 3 顺序实施
3. 每个 Phase 完成后测试验证
4. 更新文档和示例
