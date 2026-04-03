# Claude Code vs domdomegg-computer-use-mcp 工具对比

从 Claude Code 源码中找到的所有 computer-use MCP tools。

## Claude Code 的 Tools（共 20 个）

从 `src/utils/computerUse/toolRendering.tsx` 中提取：

### 鼠标操作（8 个）
1. **left_click** - 左键点击 ✅
2. **right_click** - 右键点击 ✅
3. **middle_click** - 中键点击 ✅
4. **double_click** - 双击 ✅
5. **triple_click** - 三击 ❌
6. **left_click_drag** - 拖拽 ✅
7. **mouse_move** - 移动鼠标 ✅
8. **left_mouse_down** - 按下左键（不释放）❌
9. **left_mouse_up** - 释放左键 ❌

### 键盘操作（3 个）
10. **key** - 按键 ✅
11. **type** - 输入文字 ✅
12. **hold_key** - 长按键 ❌

### 屏幕操作（4 个）
13. **screenshot** - 截图 ✅
14. **zoom** - 区域放大截图 ❌
15. **cursor_position** - 获取光标位置 ✅
16. **scroll** - 滚动 ✅

### 剪贴板操作（2 个）
17. **read_clipboard** - 读取剪贴板 ❌
18. **write_clipboard** - 写入剪贴板 ❌

### 应用管理（2 个）
19. **open_application** - 打开应用 ❌
20. **request_access** - 请求访问权限 ❌
21. **list_granted_applications** - 列出已授权应用 ❌

### 其他（2 个）
22. **wait** - 等待 ❌
23. **computer_batch** - 批量操作 ❌

## domdomegg-computer-use-mcp 的 Tools（共 12 个）

### 鼠标操作（7 个）
1. **left_click** - 左键点击 ✅
2. **right_click** - 右键点击 ✅
3. **middle_click** - 中键点击 ✅
4. **double_click** - 双击 ✅
5. **left_click_drag** - 拖拽 ✅
6. **mouse_move** - 移动鼠标 ✅
7. **scroll** - 滚动 ✅

### 键盘操作（2 个）
8. **key** - 按键 ✅
9. **type** - 输入文字 ✅

### 屏幕操作（2 个）
10. **get_screenshot** - 截图 ✅
11. **get_cursor_position** - 获取光标位置 ✅

### 应用管理（1 个）
12. **activate_app** - 激活应用（新增）✅

## 对比总结

### domdomegg 有但 Claude Code 没有的
- **activate_app** - 激活应用到前台（我们新增的功能）

### Claude Code 有但 domdomegg 没有的（11 个）

#### 高级鼠标操作（3 个）
- **triple_click** - 三击（用于选择段落）
- **left_mouse_down** - 按下左键不释放
- **left_mouse_up** - 释放左键
  - 用途：精细控制拖拽操作

#### 高级键盘操作（1 个）
- **hold_key** - 长按键
  - 用途：游戏、特殊快捷键

#### 高级屏幕操作（1 个）
- **zoom** - 区域放大截图
  - 用途：查看小字、精确操作

#### 剪贴板操作（2 个）
- **read_clipboard** - 读取剪贴板
- **write_clipboard** - 写入剪贴板
  - 用途：复制粘贴文本

#### 应用管理（2 个）
- **open_application** - 打开应用（通过 bundle ID）
- **request_access** - 请求访问权限（权限管理）
- **list_granted_applications** - 列出已授权应用

#### 其他（2 个）
- **wait** - 等待指定时间
  - 用途：等待应用加载、动画完成
- **computer_batch** - 批量执行多个操作
  - 用途：减少往返次数，提高效率

## 功能覆盖率

| 类别 | Claude Code | domdomegg | 覆盖率 |
|------|-------------|-----------|--------|
| 基础鼠标操作 | 7 | 7 | 100% |
| 高级鼠标操作 | 3 | 0 | 0% |
| 基础键盘操作 | 2 | 2 | 100% |
| 高级键盘操作 | 1 | 0 | 0% |
| 屏幕操作 | 3 | 2 | 67% |
| 剪贴板操作 | 2 | 0 | 0% |
| 应用管理 | 3 | 1 | 33% |
| 其他 | 2 | 0 | 0% |
| **总计** | **23** | **12** | **52%** |

## 建议优先实现的功能

### 高优先级（实用性强）
1. **wait** - 等待功能
   - 实现简单：`await setTimeout(duration * 1000)`
   - 用途广泛：等待页面加载、动画完成

2. **read_clipboard / write_clipboard** - 剪贴板操作
   - macOS: `pbcopy` / `pbpaste`
   - Linux: `xclip` / `xsel`
   - Windows: PowerShell
   - 用途：复制粘贴大段文本

3. **zoom** - 区域放大截图
   - 用途：查看小字、精确点击
   - 实现：截取指定区域并放大

### 中优先级（提升体验）
4. **triple_click** - 三击
   - 实现简单：调用 `mouse.click(Button.LEFT, 3)`
   - 用途：选择段落

5. **hold_key** - 长按键
   - 实现：`pressKey` + `setTimeout` + `releaseKey`
   - 用途：特殊快捷键

6. **computer_batch** - 批量操作
   - 用途：减少往返，提高效率
   - 实现复杂度：中等

### 低优先级（特殊场景）
7. **left_mouse_down / left_mouse_up** - 精细拖拽控制
   - 用途：游戏、特殊拖拽
   - 使用频率低

8. **open_application** - 打开应用
   - 已有 `activate_app`，功能类似
   - 区别：`open_application` 用 bundle ID，更精确

9. **request_access / list_granted_applications** - 权限管理
   - 用途：企业级权限控制
   - 实现复杂度：高

## 实现难度评估

| 功能 | 难度 | 工作量 | 价值 |
|------|------|--------|------|
| wait | ⭐ | 10 分钟 | ⭐⭐⭐⭐⭐ |
| triple_click | ⭐ | 10 分钟 | ⭐⭐⭐ |
| read_clipboard | ⭐⭐ | 30 分钟 | ⭐⭐⭐⭐ |
| write_clipboard | ⭐⭐ | 30 分钟 | ⭐⭐⭐⭐ |
| hold_key | ⭐⭐ | 30 分钟 | ⭐⭐⭐ |
| zoom | ⭐⭐⭐ | 1 小时 | ⭐⭐⭐⭐ |
| left_mouse_down/up | ⭐⭐ | 30 分钟 | ⭐⭐ |
| computer_batch | ⭐⭐⭐⭐ | 2 小时 | ⭐⭐⭐⭐⭐ |
| open_application | ⭐⭐⭐ | 1 小时 | ⭐⭐ |
| request_access | ⭐⭐⭐⭐⭐ | 4+ 小时 | ⭐⭐ |

## 结论

1. **domdomegg 覆盖了 Claude Code 52% 的功能**
2. **基础操作 100% 覆盖**（鼠标、键盘、截图）
3. **缺少的主要是高级功能**（剪贴板、批量操作、权限管理）
4. **我们新增了 activate_app**，这是 Claude Code 没有的独立功能

建议：
- 优先实现 `wait` 和剪贴板操作（实用性强，实现简单）
- 考虑实现 `zoom` 和 `computer_batch`（提升体验）
- 权限管理功能可以暂缓（复杂度高，使用频率低）
