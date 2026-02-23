#!/bin/bash

# ============================================================
# Gantt Graph - 依赖安装脚本
# ============================================================
# 用途：克隆仓库后快速安装所有依赖
# 使用：bash setup.sh 或 ./setup.sh (需要先 chmod +x setup.sh)
# ============================================================

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# 显示标题
echo -e "${BLUE}"
echo "============================================================"
echo "  Gantt Graph - 依赖安装脚本"
echo "============================================================"
echo -e "${NC}"

# 检查 Node.js
print_info "检查 Node.js..."
if ! command -v node &> /dev/null; then
    print_error "未找到 Node.js，请先安装 Node.js (v18 或更高版本)"
    echo "下载地址: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v)
print_success "Node.js 版本: $NODE_VERSION"

# 检查 npm
print_info "检查 npm..."
if ! command -v npm &> /dev/null; then
    print_error "未找到 npm"
    exit 1
fi

NPM_VERSION=$(npm -v)
print_success "npm 版本: $NPM_VERSION"

# 检查 package.json
print_info "检查项目文件..."
if [ ! -f "package.json" ]; then
    print_error "未找到 package.json，请确保在项目根目录运行此脚本"
    exit 1
fi

print_success "找到 package.json"

# 检查 node_modules
if [ -d "node_modules" ]; then
    print_warning "检测到已存在的 node_modules 目录"
    read -p "是否要删除并重新安装依赖？(y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "删除旧的 node_modules..."
        rm -rf node_modules
        print_success "已删除"
    else
        print_info "跳过安装，使用现有依赖"
        echo -e "${GREEN}"
        echo "============================================================"
        echo "  设置完成！"
        echo "============================================================"
        echo -e "${NC}"
        echo "运行开发服务器: ${BLUE}npm run dev${NC}"
        echo "构建生产版本: ${BLUE}npm run build${NC}"
        exit 0
    fi
fi

# 安装依赖
echo ""
print_info "正在安装依赖..."
echo "这可能需要几分钟，请耐心等待..."
echo ""

if npm install; then
    echo ""
    print_success "依赖安装完成！"
else
    echo ""
    print_error "依赖安装失败"
    echo "请尝试手动运行: npm install"
    exit 1
fi

# 完成
echo ""
echo -e "${GREEN}"
echo "============================================================"
echo "  设置完成！"
echo "============================================================"
echo -e "${NC}"
echo "现在可以运行以下命令:"
echo ""
echo "  ${BLUE}npm run dev${NC}       - 启动开发服务器"
echo "  ${BLUE}npm run build${NC}    - 构建生产版本"
echo "  ${BLUE}npm run preview${NC}  - 预览生产构建"
echo ""
echo "访问开发服务器: ${BLUE}http://localhost:5173${NC}"
echo ""
