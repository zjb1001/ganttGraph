@echo off
REM ============================================================
REM Gantt Graph - 依赖安装脚本 (Windows)
REM ============================================================
REM 用途：克隆仓库后快速安装所有依赖
REM 使用：双击运行或在命令行执行 setup.bat
REM ============================================================

setlocal enabledelayedexpansion

echo.
echo ============================================================
echo   Gantt Graph - 依赖安装脚本
echo ============================================================
echo.

REM 检查 Node.js
echo [INFO] 检查 Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] 未找到 Node.js，请先安装 Node.js (v18 或更高版本)
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo [SUCCESS] Node.js 版本: %NODE_VERSION%

REM 检查 npm
echo [INFO] 检查 npm...
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] 未找到 npm
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
echo [SUCCESS] npm 版本: %NPM_VERSION%

REM 检查 package.json
echo [INFO] 检查项目文件...
if not exist "package.json" (
    echo [ERROR] 未找到 package.json，请确保在项目根目录运行此脚本
    pause
    exit /b 1
)
echo [SUCCESS] 找到 package.json

REM 检查 node_modules
if exist "node_modules" (
    echo [WARNING] 检测到已存在的 node_modules 目录
    set /p REINSTALL="是否要删除并重新安装依赖？(y/N): "
    if /i "!REINSTALL!"=="y" (
        echo [INFO] 删除旧的 node_modules...
        rmdir /s /q node_modules
        echo [SUCCESS] 已删除
    ) else (
        echo [INFO] 跳过安装，使用现有依赖
        goto :done
    )
)

REM 安装依赖
echo.
echo [INFO] 正在安装依赖...
echo 这可能需要几分钟，请耐心等待...
echo.

call npm install
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] 依赖安装失败
    echo 请尝试手动运行: npm install
    pause
    exit /b 1
)

echo.
echo [SUCCESS] 依赖安装完成！

:done
echo.
echo ============================================================
echo   设置完成！
echo ============================================================
echo.
echo 现在可以运行以下命令:
echo.
echo   npm run dev       - 启动开发服务器
echo   npm run build     - 构建生产版本
echo   npm run preview   - 预览生产构建
echo.
echo 访问开发服务器: http://localhost:5173
echo.
pause
