#!/bin/bash
# ==============================================
# 一鸣鲜果 - 一键启动脚本（后台运行，关终端也不停）
# 用法：bash start.sh
# 停止：bash stop.sh
# ==============================================

cd "$(dirname "$0")"

# 检查是否已经在运行
if lsof -ti :3456 > /dev/null 2>&1; then
    echo "⚠️  服务好像已经在运行了！"
    echo ""
    # 读取之前保存的地址
    if [ -f /tmp/fruit_store_url.txt ]; then
        cat /tmp/fruit_store_url.txt
    fi
    echo "如果要重启，请先运行 bash stop.sh"
    exit 1
fi

echo "🍍 一鸣鲜果 启动中..."
echo ""

# ========== 1. 启动后端服务（后台运行） ==========
cd server
nohup node index.js > /tmp/fruit_server.log 2>&1 &
SERVER_PID=$!
cd ..

sleep 2

# 检查服务是否启动成功
if ! lsof -ti :3456 > /dev/null 2>&1; then
    echo "❌ 服务启动失败！查看日志："
    cat /tmp/fruit_server.log
    exit 1
fi

echo "✅ 后端服务已启动（PID: $SERVER_PID）"
echo ""

# ========== 2. 启动公网隧道 ==========
echo "🌐 正在生成公网链接..."
nohup npx localtunnel --port 3456 > /tmp/fruit_lt.log 2>&1 &
LT_PID=$!

# 等待 localtunnel 生成链接
for i in $(seq 1 10); do
    sleep 2
    URL=$(grep -o 'https://[a-z0-9.-]*\.loca\.lt' /tmp/fruit_lt.log 2>/dev/null | head -1)
    if [ -n "$URL" ]; then
        break
    fi
done

# 保存地址到文件
cat > /tmp/fruit_store_url.txt << EOF
========================================
🍍 一鸣鲜果 访问地址
========================================

【公网链接 - 发到微信群用这个！】
📱 手机商城：${URL}/web
📊 商家后台：${URL}/admin

【本机测试 - 只有你自己能看】
📱 手机商城：http://localhost:3456/web
📊 商家后台：http://localhost:3456/admin

【服务管理】
🛑 关闭服务：bash $(pwd)/stop.sh
📋 查看日志：tail -f /tmp/fruit_server.log

⚠️ 注意：公网链接每次重启都会变！
   如需固定链接，看 小白部署手册.md 里的 Render 部署方案。
========================================
EOF

cat /tmp/fruit_store_url.txt

# 保存 PID 方便 stop 脚本用
echo "$SERVER_PID" > /tmp/fruit_server.pid
echo "$LT_PID" > /tmp/fruit_lt.pid
