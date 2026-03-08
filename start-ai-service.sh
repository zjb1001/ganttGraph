#!/bin/bash
# 启动 AI 服务脚本

cd "$(dirname "$0")/agent-service"

echo "🚀 启动 AI 后端服务 (v1 + v2)..."
echo "📍 服务地址: http://localhost:8000"
echo "📍 v1 API: /api/chat, /api/health"
echo "📍 v2 API: /api/v2/decompose, /api/v2/analyze-risks, /api/v2/predict-schedule, /api/v2/chat"
echo "🤖 模型: 智谱 GLM-4"
echo ""

# 检查 Python
if ! command -v python3 &> /dev/null; then
    echo "❌ 错误: 未找到 Python3"
    exit 1
fi

# 检查依赖
if ! python3 -c "import fastapi" 2>/dev/null; then
    echo "📦 安装依赖..."
    pip3 install -r requirements.txt
fi

# 启动统一服务（v1 + v2 合并）
python3 main.py
