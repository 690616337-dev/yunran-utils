# 云褍实用工具 v3 - 安装指南

## 系统要求

- **Windows**: Windows 10/11 64位
- **macOS**: macOS 10.15+ (Intel/Apple Silicon)
- **Linux**: Ubuntu 18.04+ / CentOS 7+

## 安装步骤

### 方法一：下载安装包（推荐）

1. 从 Releases 页面下载对应系统的安装包
   - Windows: `云褍实用工具-v3-Setup.exe`
   - macOS: `云褍实用工具-v3.dmg`

2. 运行安装程序，按提示完成安装

3. **安装 ffmpeg**（音频转换功能需要）

### 方法二：从源码运行

#### 1. 安装依赖

**Node.js 依赖：**
```bash
cd yunran-tools-v3
npm install
```

**Python 依赖：**
```bash
cd backend
pip install -r requirements.txt
cd ..
```

#### 2. 安装 ffmpeg

**Windows:**
1. 下载 ffmpeg: https://ffmpeg.org/download.html
2. 解压到 `C:\ffmpeg`
3. 添加到系统 PATH: `C:\ffmpeg\bin`

**macOS:**
```bash
brew install ffmpeg
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install ffmpeg
```

**Linux (CentOS/RHEL):**
```bash
sudo yum install ffmpeg
```

#### 3. 启动开发环境

```bash
# 使用启动脚本（推荐）
npm run dev

# 或手动启动
node scripts/start.js
```

#### 4. 打包

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# 全平台
npm run build
```

## 首次使用说明

### 1. AI 抠图模型下载

首次使用证件照抠图功能时，需要下载 AI 模型（约 176MB）：
- 模型会自动下载到 `~/.u2net/u2net.onnx`
- 下载完成后即可正常使用
- 只需下载一次，后续使用无需重复下载

### 2. 功能状态检查

启动应用后，可以访问 http://127.0.0.1:8000/api/status 查看：
- 各功能模块是否可用
- ffmpeg 是否安装
- AI 模型是否已下载

### 3. 常见问题

#### Q: 音频转换失败？
**A:** 请确保 ffmpeg 已正确安装并添加到系统 PATH。

#### Q: 证件照抠图很慢？
**A:** 首次使用需要下载 176MB 模型文件，请耐心等待。后续使用会快很多。

#### Q: 打包后的应用无法启动？
**A:** 
1. 检查是否安装了 Python 依赖
2. 检查图标文件是否存在 `build/icon.ico` 和 `build/icon.icns`
3. 查看日志文件排查问题

#### Q: 如何查看日志？
**A:** 
- 开发环境：查看终端输出
- 生产环境：
  - Windows: `%APPDATA%/云褍实用工具 v3/logs`
  - macOS: `~/Library/Logs/云褍实用工具 v3`

## 功能说明

| 功能 | 依赖 | 说明 |
|------|------|------|
| 身份证工具 | 无 | 纯前端计算，无需额外依赖 |
| PDF 合并 | pypdf | 支持多文件合并、排序 |
| 证件照抠图 | rembg + 模型 | 首次使用需下载 176MB 模型 |
| 音频转换 | pydub + ffmpeg | 需要系统安装 ffmpeg |
| 视频转换 | 开发中 | 敬请期待 |

## 卸载

**Windows:**
1. 控制面板 → 程序和功能 → 卸载"云褍实用工具 v3"
2. 删除配置目录：`%APPDATA%/云褍实用工具 v3`

**macOS:**
1. 将应用拖到废纸篓
2. 删除配置目录：`~/Library/Application Support/云褍实用工具 v3`

## 技术支持

如有问题，请提交 Issue 或联系开发者。

---

**版本**: v3.0.0  
**更新日期**: 2026-02-27