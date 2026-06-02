#!/bin/bash
# ==============================================
# 一鸣鲜果 - 停止服务脚本
# 用法：bash stop.sh
# ==============================================

echo "🛑 正在停止一鸣鲜果..."

# 停掉后端服务
if lsof -ti :3456 > /dev/null 2>&1; then
    kill $(lsof -ti :3456) 2>/dev/null
    echo "✅ 后端服务已停止"
else
    echo "⚠️  后端服务未在运行"
fi

# 停掉 localtunnel
pkill -f "localtunnel.*3456" 2>/dev/null && echo "✅ 公网隧道已停止"

# 清理 PID 文件
rm -f /tmp/fruit_server.pid /tmp/fruit_lt.pid

echo "👋 一鸣鲜果已完全关闭"
