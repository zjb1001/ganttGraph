@echo off
REM ============================================================
REM Gantt Graph - 启动脚本 (Web + AI Agent 服务)
REM ============================================================
REM 用途：同时启动前端开发服务器和AI Agent后端服务
REM 使用：双击 start.bat 或在命令行运行 start.bat
REM ============================================================

setlocal enabledelayedexpansion

REM 颜色定义 (Windows 10+)
set "INFO=[94m"
set "SUCCESS=[92m"
set "WARNING=[93m"
set "ERROR=[91m"
set "CYAN=[96m"
set "NC=[0m"

REM 显示标题
echo.
echo %CYAN%============================================================
echo   Gantt Graph - 启动脚本
echo   Web前端 + AI Agent后端
echo ============================================================%NC%
echo.

REM 检查 Node.js
echo %INFO%检查 Node.js...%NC%
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo %ERROR%未找到 Node.js，请先安装 Node.js (v18 或更高版本)
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo %SUCCESS%Node.js 版本: !NODE_VERSION!%NC%

REM 检查 Python
echo %INFO%检查 Python...%NC%
where python >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo %ERROR%未找到 Python，请先安装 Python (v3.8 或更高版本)
    echo 下载地址: https://www.python.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('python --version') do set PYTHON_VERSION=%%i
echo %SUCCESS%Python 版本: !PYTHON_VERSION!%NC%

REM 检查项目结构
echo %INFO%检查项目结构...%NC%
if not exist "package.json" (
    echo %ERROR%未找到 package.json，请确保在项目根目录运行此脚本
    pause
    exit /b 1
)

if not exist "agent-service" (
    echo %ERROR%未找到 agent-service 目录
    pause
    exit /b 1
)

if not exist "agent-service\requirements.txt" (
    echo %ERROR%未找到 agent-service\requirements.txt
    pause
    exit /b 1
)
echo %SUCCESS%项目结构检查通过%NC%

REM 检查并安装 Python 依赖
echo %INFO%检查 Python 依赖...%NC%
python -c "import fastapi" >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo %WARNING%Python 依赖未安装，正在安装...%NC%
    cd agent-service
    pip install -r requirements.txt
    if %ERRORLEVEL% neq 0 (
        echo %ERROR%Python 依赖安装失败
        pause
        exit /b 1
    )
    cd ..
    echo %SUCCESS%Python 依赖安装完成%NC%
) else (
    echo %SUCCESS%Python 依赖已安装%NC%
)

REM 检查 node_modules
echo %INFO%检查前端依赖...%NC%
if not exist "node_modules" (
    echo %WARNING%前端依赖未安装，正在安装...%NC%
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo %ERROR%前端依赖安装失败
        pause
        exit /b 1
    )
    echo %SUCCESS%前端依赖安装完成%NC%
) else (
    echo %SUCCESS%前端依赖已安装%NC%
)

echo.
echo %CYAN%准备启动服务...%NC%
echo.

REM 创建日志目录
if not exist "logs" mkdir logs

REM 启动 AI Agent 服务（使用 start 命令在新窗口中）
echo %INFO%启动 AI Agent 服务 (端口 8000)...%NC%
cd agent-service
start "Gantt Graph - AI Agent Service" python main.py
cd ..

REM 等待 Agent 服务启动
timeout /t 3 /nobreak >nul
echo %SUCCESS%AI Agent 服务已启动%NC%

REM 启动 Web 开发服务器（使用 start 命令在新窗口中）
echo %INFO%启动 Web 开发服务器 (端口 5173)...%NC%
start "Gantt Graph - Web Dev Server" npm run dev

REM 等待 Web 服务启动
timeout /t 3 /nobreak >nul
echo %SUCCESS%Web 开发服务器已启动%NC%

echo.
echo %SUCCESS%============================================================
echo   所有服务启动成功！
echo ============================================================%NC%
echo.
echo   %CYAN%Web 前端:%NC%     http://localhost:5173
echo   %CYAN%AI Agent:%NC%     http://localhost:8000
echo   %CYAN%API 文档:%NC%     http://localhost:8000/docs
echo.
echo   %WARNING%关闭此窗口不会停止服务，请关闭各自的服务窗口来停止%NC%
echo.
pause
