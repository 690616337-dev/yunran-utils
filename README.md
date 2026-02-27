# 云褍实用工具 v3

基于 Electron + React + Python FastAPI 的桌面实用工具集。

## 功能模块

- **身份证工具**：查询验证、号码生成
- **PDF合并**：文件列表、合并、下载、打印
- **证件照抠图**：上传、AI抠图、背景替换
- **音频转换**：格式转换
- **视频转换**：格式转换（预留）

## 技术栈

- **前端**：React 18 + Vite + Ant Design 5
- **后端**：Python FastAPI + Uvicorn
- **桌面**：Electron 28
- **打包**：electron-builder

## 项目结构

```
yunran-tools-v3/
├── package.json              # 主项目配置
├── frontend/                 # React前端
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx          # React入口
│       ├── App.jsx           # 主布局
│       ├── index.css
│       └── pages/
│           └── IdCardPage.jsx
├── backend/                  # Python后端
│   ├── requirements.txt
│   └── main.py               # FastAPI主入口
├── electron/                 # Electron主进程
│   ├── main.js               # 主进程
│   └── preload.js            # IPC通信
└── build/                    # 打包资源
    ├── icon.ico              # Windows图标
    └── icon.icns             # macOS图标
```

## 开发环境

### 1. 安装依赖

```bash
# 安装Node.js依赖
npm install

# 安装Python依赖
cd backend
pip install -r requirements.txt
```

### 2. 启动开发服务器

```bash
# 同时启动前端、后端和Electron
npm run dev
```

或者分别启动：

```bash
# 终端1：启动Python后端
cd backend
python -m uvicorn main:app --reload --port 8000

# 终端2：启动前端开发服务器
cd frontend
npm run dev

# 终端3：启动Electron（等前端启动后）
npx electron .
```

## 打包发布

### Windows (.exe)

```bash
npm run build:win
```

输出：`dist/云褍实用工具 v3 Setup.exe`

### macOS (.dmg)

```bash
npm run build:mac
```

输出：`dist/云褍实用工具 v3.dmg`

### 全平台

```bash
npm run build
```

## API文档

启动后端后访问：http://127.0.0.1:8000/docs

### 主要接口

- `POST /api/idcard/validate` - 验证身份证
- `POST /api/idcard/generate` - 生成身份证
- `GET /api/idcard/areas` - 获取地区列表
- `POST /api/pdf/merge` - 合并PDF
- `POST /api/photo/remove-bg` - 移除背景
- `POST /api/photo/change-bg` - 更换背景色
- `POST /api/audio/convert` - 转换音频格式

## 许可证

MIT
