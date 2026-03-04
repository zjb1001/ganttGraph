#!/bin/bash
# Start Enhanced AI Service
# 启动增强版AI服务（包含智能分解、风险分析、进度预测）

cd "$(dirname "$0")"

# 检查Python环境
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 not found"
    exit 1
fi

# 检查虚拟环境
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# 激活虚拟环境
source venv/bin/activate

# 安装依赖
echo "📦 Installing dependencies..."
pip install -q fastapi uvicorn pydantic python-dotenv openai

# 检查环境变量
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found"
    echo "Please create .env file with LLM_API_KEY"
    cp .env.example .env 2>/dev/null || true
fi

# 启动服务
echo "🚀 Starting Enhanced AI Service..."
echo "API Endpoints:"
echo "  - POST /api/v2/decompose       - 智能任务分解"
echo "  - POST /api/v2/analyze-risks   - 风险分析"
echo "  - POST /api/v2/predict-schedule - 进度预测"
echo "  - POST /api/v2/analyze-resources - 资源分析"
echo "  - POST /api/v2/chat            - 统一对话接口"
echo ""

python3 enhanced_ai_service.py
