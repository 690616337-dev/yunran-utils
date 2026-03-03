#!/bin/bash
# 本地构建脚本 - macOS版本

set -e

echo "=============================================="
echo "云褍实用工具 v3 - macOS本地构建脚本"
echo "=============================================="

# 检查环境
echo "检查构建环境..."

if ! command -v node &> /dev/null; then
    echo "错误: Node.js未安装"
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo "错误: Python3未安装"
    exit 1
fi

echo "Node.js版本: $(node --version)"
echo "Python3版本: $(python3 --version)"

# 安装依赖
echo ""
echo "=============================================="
echo "安装依赖..."
echo "=============================================="

npm install
cd frontend && npm install && cd ..
pip3 install -r backend/requirements.txt pyinstaller

# 构建前端
echo ""
echo "=============================================="
echo "构建前端..."
echo "=============================================="

npm run build:frontend

# 构建后端
echo ""
echo "=============================================="
echo "构建后端 (PyInstaller)..."
echo "=============================================="

cd backend
pyinstaller --onefile --name backend main.py
mkdir -p ../resources/backend
cp dist/backend ../resources/backend/
cd ..

# 构建Electron
echo ""
echo "=============================================="
echo "构建Electron应用..."
echo "=============================================="

# 检测架构
ARCH=$(uname -m)
if [ "$ARCH" == "arm64" ]; then
    echo "检测到 ARM64 架构 (Apple Silicon)"
    npx electron-builder --mac dmg --arm64
else
    echo "检测到 x64 架构 (Intel)"
    npx electron-builder --mac dmg --x64
fi

echo ""
echo "=============================================="
echo "构建完成！"
echo "=============================================="
echo ""
echo "输出文件:"
ls -lh dist/*.dmg 2>/dev/null || echo "未找到.dmg文件"
echo ""
