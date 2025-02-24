#!/bin/bash

# 设置工作目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# 终止其他相关进程
pkill -f "node backend/app.js"
pkill -f "vite"

# 等待端口释放
sleep 2

# 启动后端服务器
echo "启动后端服务器..."
# 使用 npm start 而不是直接运行 node
osascript -e "tell application \"Terminal\" to do script \"cd \\\"$SCRIPT_DIR/backend\\\" && echo '启动后端服务器...' && npm install && NODE_ENV=development DEBUG=* node app.js\""

# 等待后端服务器启动
echo "等待后端服务器启动..."
sleep 5

# 测试后端服务器
echo "测试后端服务器..."
curl -v "http://localhost:3002/test" || echo "后端服务器未响应"

# 启动前端服务器
echo "启动前端服务器..."
osascript -e "tell application \"Terminal\" to do script \"cd \\\"$SCRIPT_DIR/frontend\\\" && npm install && npm run dev\""

echo "所有服务已启动！"
echo "前端地址: http://localhost:3001"
echo "后端地址: http://localhost:3002"
echo "请查看各个终端窗口以获取详细信息"

# 显示运行状态
echo "检查服务状态..."
echo "后端进程:"
ps aux | grep "node backend/app.js" | grep -v grep
echo "ngrok 进程:"
ps aux | grep "ngrok http" | grep -v grep
echo "前端进程:"
ps aux | grep "vite" | grep -v grep 