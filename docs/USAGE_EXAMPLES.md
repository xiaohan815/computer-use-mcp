# 使用示例

本文档展示了 Phase 4 新增功能的实际使用场景。

## 1. 等待应用加载

**场景**：打开应用后需要等待加载完成

```typescript
// 打开应用
{action: 'open_application', text: 'WeChat'}

// 等待应用启动（2秒）
{action: 'wait', text: '2'}

// 截图查看
{action: 'get_screenshot'}
```

---

## 2. 复制粘贴大段文本

**场景**：需要输入大量文本，使用剪贴板比 type 更快

```typescript
// 将文本写入剪贴板
{
  action: 'write_clipboard', 
  text: '这是一段很长的文本...'
}

// 点击输入框
{action: 'left_click', coordinate: [500, 300]}

// 粘贴（Command+V on macOS）
{action: 'key', text: 'Command+v'}
```

---

## 3. 读取并处理剪贴板内容

**场景**：读取用户复制的内容进行处理

```typescript
// 读取剪贴板
{action: 'read_clipboard'}
// 返回: {text: "用户复制的内容"}

// AI 可以分析这段文本，然后执行相应操作
```

---

## 4. 选择整段文本

**场景**：快速选择一整段文字

```typescript
// 三击选择段落
{action: 'triple_click', coordinate: [500, 300]}

// 复制选中的文本
{action: 'key', text: 'Command+c'}

// 读取剪贴板获取内容
{action: 'read_clipboard'}
```

---

## 5. 放大查看小字

**场景**：截图中的文字太小，需要放大查看

```typescript
// 先截图查看整体
{action: 'get_screenshot'}

// AI 发现某个区域的文字太小，放大查看
{action: 'zoom', coordinate: [100, 100, 200, 150]}
// 返回放大后的图片，可以看清楚小字
```

---

## 6. 精细拖拽控制

**场景**：需要精确控制拖拽过程，比如绘图

```typescript
// 按住左键
{action: 'left_mouse_down', coordinate: [100, 100]}

// 移动到第一个点
{action: 'mouse_move', coordinate: [150, 150]}

// 等待一下
{action: 'wait', text: '0.1'}

// 移动到第二个点
{action: 'mouse_move', coordinate: [200, 200]}

// 释放左键
{action: 'left_mouse_up'}
```

---

## 7. 长按快捷键

**场景**：需要长按某个键，比如录音

```typescript
// 按住空格键 3 秒（录音）
{action: 'hold_key', text: 'space:3'}
```

---

## 8. 组合使用：自动填写表单

**场景**：自动填写网页表单

```typescript
// 1. 激活浏览器
{action: 'open_application', text: 'Safari'}
{action: 'wait', text: '0.5'}

// 2. 点击姓名输入框
{action: 'left_click', coordinate: [300, 200]}
{action: 'wait', text: '0.2'}

// 3. 输入姓名
{action: 'type', text: '张三'}

// 4. 点击邮箱输入框
{action: 'left_click', coordinate: [300, 250]}
{action: 'wait', text: '0.2'}

// 5. 使用剪贴板输入长邮箱
{action: 'write_clipboard', text: 'zhangsan@example.com'}
{action: 'key', text: 'Command+v'}

// 6. 三击选择整段地址
{action: 'triple_click', coordinate: [300, 300]}

// 7. 复制地址
{action: 'key', text: 'Command+c'}

// 8. 读取并验证
{action: 'read_clipboard'}

// 9. 提交表单
{action: 'left_click', coordinate: [400, 400]}
```

---

## 9. 组合使用：截图并分析细节

**场景**：先看全局，再放大查看细节

```typescript
// 1. 截取全屏
{action: 'get_screenshot'}
// AI 分析：发现右上角有个小图标需要点击

// 2. 放大右上角区域查看
{action: 'zoom', coordinate: [1400, 50, 200, 100]}
// AI 看清楚了图标的位置

// 3. 点击图标（使用原始坐标）
{action: 'left_click', coordinate: [1450, 80]}
```

---

## 10. 组合使用：等待动画完成

**场景**：点击按钮后有动画效果，需要等待

```typescript
// 1. 点击按钮
{action: 'left_click', coordinate: [500, 300]}

// 2. 等待动画完成（1秒）
{action: 'wait', text: '1'}

// 3. 截图查看结果
{action: 'get_screenshot'}
```

---

## 11. 组合使用：拖拽文件

**场景**：将文件拖拽到应用中

```typescript
// 1. 按住文件图标
{action: 'left_mouse_down', coordinate: [100, 200]}

// 2. 等待一下确保按住
{action: 'wait', text: '0.1'}

// 3. 拖拽到目标位置
{action: 'mouse_move', coordinate: [500, 400]}

// 4. 等待一下
{action: 'wait', text: '0.1'}

// 5. 释放
{action: 'left_mouse_up'}

// 6. 等待上传完成
{action: 'wait', text: '2'}

// 7. 截图确认
{action: 'get_screenshot'}
```

---

## 12. 组合使用：文本编辑

**场景**：编辑文档中的文本

```typescript
// 1. 三击选择段落
{action: 'triple_click', coordinate: [400, 300]}

// 2. 复制
{action: 'key', text: 'Command+c'}

// 3. 读取内容
{action: 'read_clipboard'}
// AI 分析内容，决定如何修改

// 4. 写入修改后的内容
{action: 'write_clipboard', text: '修改后的文本...'}

// 5. 粘贴
{action: 'key', text: 'Command+v'}
```

---

## 性能优化建议

### 1. 使用剪贴板代替 type

**慢**：
```typescript
{action: 'type', text: '很长的文本...'}  // 逐字输入，慢
```

**快**：
```typescript
{action: 'write_clipboard', text: '很长的文本...'}
{action: 'key', text: 'Command+v'}  // 瞬间完成
```

### 2. 合理使用 wait

**不好**：
```typescript
{action: 'left_click', coordinate: [100, 100]}
{action: 'get_screenshot'}  // 可能还没加载完
```

**好**：
```typescript
{action: 'left_click', coordinate: [100, 100]}
{action: 'wait', text: '0.5'}  // 等待加载
{action: 'get_screenshot'}
```

### 3. 使用 zoom 查看细节

**不好**：
```typescript
{action: 'get_screenshot'}  // 文字太小看不清
// AI 猜测位置，可能点错
```

**好**：
```typescript
{action: 'get_screenshot'}
{action: 'zoom', coordinate: [100, 100, 200, 150]}  // 放大查看
// AI 看清楚了，准确点击
```

---

## 调试技巧

### 1. 使用 wait 观察过程

```typescript
{action: 'left_click', coordinate: [100, 100]}
{action: 'wait', text: '1'}  // 暂停 1 秒，方便观察
{action: 'get_screenshot'}
```

### 2. 使用 read_clipboard 验证

```typescript
{action: 'triple_click', coordinate: [100, 100]}
{action: 'key', text: 'Command+c'}
{action: 'read_clipboard'}  // 验证是否选中了正确的文本
```

### 3. 使用 zoom 确认位置

```typescript
{action: 'get_screenshot'}
{action: 'zoom', coordinate: [100, 100, 50, 50]}  // 放大查看目标
// 确认坐标后再点击
{action: 'left_click', coordinate: [125, 125]}
```

---

## 常见问题

### Q: wait 的时间应该设置多长？

A: 根据场景决定：
- 应用启动：1-3 秒
- 页面加载：0.5-2 秒
- 动画效果：0.2-1 秒
- 鼠标移动稳定：0.05-0.1 秒

### Q: 什么时候用 zoom？

A: 当截图中的文字或图标太小，AI 无法准确识别时使用。

### Q: 剪贴板操作会影响用户的剪贴板吗？

A: 是的，会覆盖用户的剪贴板内容。建议在操作完成后恢复原内容。

### Q: left_mouse_down/up 和 left_click_drag 有什么区别？

A: 
- `left_click_drag`: 一步完成，从当前位置拖到目标位置
- `left_mouse_down` + `mouse_move` + `left_mouse_up`: 分步控制，可以在拖拽过程中执行其他操作（如 wait）

---

## 最佳实践

1. **总是在操作后等待**：给应用足够的响应时间
2. **使用剪贴板处理长文本**：比 type 快得多
3. **放大查看细节**：确保 AI 准确识别
4. **三击选择段落**：比拖拽选择更可靠
5. **精细拖拽时使用分步控制**：更精确
6. **长按操作使用 hold_key**：避免手动计时
7. **验证操作结果**：使用 read_clipboard 或 get_screenshot 确认

---

这些示例展示了 Phase 4 新功能的强大能力，可以大大提升 AI 控制电脑的效率和准确性！
