#!/bin/bash

# ============================================================
# Gantt Graph - 启动脚本 (Web + AI Agent 服务)
# ============================================================
# 用途：同时启动前端开发服务器和AI Agent后端服务
# 使用：bash start.sh 或 ./start.sh (需要先 chmod +x start.sh)
# ============================================================

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_step() {
    echo -e "${CYAN}▶${NC} $1"
}

# 清理函数
cleanup() {
    print_info "正在停止所有服务..."

    # 杀掉后台进程
    if [ ! -z "$WEB_PID" ]; then
        kill $WEB_PID 2>/dev/null
        print_success "Web服务已停止"
    fi

    if [ ! -z "$AGENT_PID" ]; then
        kill $AGENT_PID 2>/dev/null
        print_success "Agent服务已停止"
    fi

    # 清理可能的临时文件
    rm -f /tmp/gantt_web.log /tmp/gantt_agent.log

    print_success "所有服务已停止"
    exit 0
}

# 捕获退出信号
trap cleanup SIGINT SIGTERM

# 显示标题
echo -e "${CYAN}"
echo "============================================================"
echo "  Gantt Graph - 启动脚本"
echo "  Web前端 + AI Agent后端"
echo "============================================================"
echo -e "${NC}"

# 检查 Node.js
print_info "检查 Node.js..."
if ! command -v node &> /dev/null; then
    print_error "未找到 Node.js，请先安装 Node.js (v18 或更高版本)"
    echo "下载地址: https://nodejs.org/"
    exit 1
fi
print_success "Node.js 版本: $(node -v)"

# 检查 Python
print_info "检查 Python..."
if ! command -v python3 &> /dev/null; then
    print_error "未找到 Python3，请先安装 Python (v3.8 或更高版本)"
    echo "下载地址: https://www.python.org/"
    exit 1
fi
print_success "Python 版本: $(python3 --version)"

# 检查项目结构
print_info "检查项目结构..."
if [ ! -f "package.json" ]; then
    print_error "未找到 package.json，请确保在项目根目录运行此脚本"
    exit 1
fi

if [ ! -d "agent-service" ]; then
    print_error "未找到 agent-service 目录"
    exit 1
fi

if [ ! -f "agent-service/requirements.txt" ]; then
    print_error "未找到 agent-service/requirements.txt"
    exit 1
fi

print_success "项目结构检查通过"

# 检查并安装 Python 依赖
print_info "检查 Python 依赖..."
if ! python3 -c "import fastapi" 2>/dev/null; then
    print_warning "Python 依赖未安装，正在安装..."
    cd agent-service
    if command -v pip3 &> /dev/null; then
        pip3 install -r requirements.txt
    elif command -v pip &> /dev/null; then
        pip install -r requirements.txt
    else
        print_error "未找到 pip，请手动安装 Python 依赖"
        echo "运行: cd agent-service && pip install -r requirements.txt"
        exit 1
    fi
    cd ..
    print_success "Python 依赖安装完成"
else
    print_success "Python 依赖已安装"
fi

# 检查 node_modules
print_info "检查前端依赖..."
if [ ! -d "node_modules" ]; then
    print_warning "前端依赖未安装，正在安装..."
    npm install
    print_success "前端依赖安装完成"
else
    print_success "前端依赖已安装"
fi

echo ""
print_step "准备启动服务..."
echo ""

# 创建日志目录
mkdir -p logs

# 启动 AI Agent 服务
print_info "启动 AI Agent 服务 (端口 8000)..."

# 清理已占用的端口
if lsof -i :8000 &>/dev/null; then
    print_warning "端口 8000 已被占用，正在释放..."
    fuser -k 8000/tcp 2>/dev/null || kill $(lsof -t -i :8000) 2>/dev/null
    sleep 1
fi

cd agent-service

# 使用 nohup 在后台启动，并重定向输出
nohup python3 main.py > ../logs/agent-service.log 2>&1 &
AGENT_PID=$!

cd ..

# 等待 Agent 服务启动
sleep 3

# 检查 Agent 服务是否启动成功
if kill -0 $AGENT_PID 2>/dev/null; then
    print_success "AI Agent 服务已启动 (PID: $AGENT_PID)"
else
    print_error "AI Agent 服务启动失败"
    print_info "查看日志: logs/agent-service.log"
    cat logs/agent-service.log
    exit 1
fi

# 启动 Web 开发服务器
print_info "启动 Web 开发服务器 (端口 5173)..."
nohup npm run dev > logs/web-dev.log 2>&1 &
WEB_PID=$!

# 等待 Web 服务启动
sleep 3

# 检查 Web 服务是否启动成功
if kill -0 $WEB_PID 2>/dev/null; then
    print_success "Web 开发服务器已启动 (PID: $WEB_PID)"
else
    print_error "Web 开发服务器启动失败"
    print_info "查看日志: logs/web-dev.log"
    cat logs/web-dev.log
    cleanup
    exit 1
fi

echo ""
echo -e "${GREEN}"
echo "============================================================"
echo "  所有服务启动成功！"
echo "============================================================"
echo -e "${NC}"
echo ""
echo "  ${CYAN}Web 前端:${NC}     ${BLUE}http://localhost:5173${NC}"
echo "  ${CYAN}AI Agent:${NC}     ${BLUE}http://localhost:8000${NC}"
echo "  ${CYAN}API 文档:${NC}     ${BLUE}http://localhost:8000/docs${NC}"
echo ""
echo "  ${YELLOW}日志文件:${NC}"
echo "    - Web:   logs/web-dev.log"
echo "    - Agent: logs/agent-service.log"
echo ""
echo -e "${YELLOW}按 Ctrl+C 停止所有服务${NC}"
echo ""

# 实时显示日志
print_info "实时日志 (按 Ctrl+C 停止服务):"
echo ""

# 使用 tail 同时显示两个日志文件
tail -f logs/web-dev.log logs/agent-service.log &
TAIL_PID=$!

# 等待用户中断
wait
