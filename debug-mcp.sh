#!/bin/bash
# 调试 MCP 服务器，捕获所有输出

LOG_FILE="/tmp/computer-use-mcp-debug.log"

echo "=== MCP Debug Log Started at $(date) ===" > "$LOG_FILE"
echo "Screen Resolution: $(system_profiler SPDisplaysDataType | grep Resolution)" >> "$LOG_FILE"
echo "Logical Resolution: $(osascript -e 'tell application "Finder" to get bounds of window of desktop')" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

cd "$(dirname "$0")"

# 运行 MCP 服务器，将 stderr 输出到日志文件
node dist/main.js 2>> "$LOG_FILE"
