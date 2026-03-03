# 云褍实用工具 v3 - 打包指南

## 支持的平台

| 平台 | 架构 | 输出文件 | 说明 |
|------|------|----------|------|
| Windows | x64 | `.exe` (Setup + Portable) | Intel/AMD 64位 |
| Windows | ARM64 | `.exe` (Setup + Portable) | ARM 64位 (Surface Pro X 等) |
| macOS | x64 | `.dmg` + `.zip` | Intel Mac |
| macOS | ARM64 | `.dmg` + `.zip` | Apple Silicon (M1/M2/M3) |

## 本地打包

### 一键打包所有平台

```bash
npm run build:all:platforms
```

### 单独打包某个平台

```bash
# Windows x64 (Intel/AMD)
npm run build:win:x64

# Windows ARM64
npm run build:win:arm64

# macOS x64 (Intel)
npm run build:mac:x64

# macOS ARM64 (Apple Silicon)
npm run build:mac:arm64
```

### 使用打包脚本

```bash
# 打包所有平台
node scripts/build-all.js all

# 只打包 Windows x64
node scripts/build-all.js win-x64

# 只打包 macOS ARM64
node scripts/build-all.js mac-arm64

# 跳过依赖安装（如果已经安装过）
node scripts/build-all.js all --skip-install
```

## CI/CD 自动打包

项目已配置 GitHub Actions，推送 tag 时自动打包所有平台：

```bash
# 创建新标签
git tag v3.0.0

# 推送标签
git push origin v3.0.0
```

GitHub Actions 会自动：
1. 在 4 个不同平台运行打包
2. 生成安装包
3. 创建 Release 并上传安装包

## 输出文件

打包完成后，文件位于 `dist/` 目录：

```
dist/
├── 云褍实用工具 v3 Setup 3.0.0.exe      # Windows x64 安装包
├── 云褍实用工具 v3 3.0.0.exe            # Windows x64 便携版
├── 云褍实用工具 v3 Setup 3.0.0-arm64.exe # Windows ARM64 安装包
├── 云褍实用工具 v3 3.0.0-arm64.exe       # Windows ARM64 便携版
├── 云褍实用工具 v3-3.0.0.dmg            # macOS x64 DMG
├── 云褍实用工具 v3-3.0.0.zip            # macOS x64 ZIP
├── 云褍实用工具 v3-3.0.0-arm64.dmg      # macOS ARM64 DMG
└── 云褍实用工具 v3-3.0.0-arm64.zip      # macOS ARM64 ZIP
```

## 跨平台打包注意事项

### Windows 打包

- 可以在 Windows、macOS、Linux 上打包 Windows 应用
- 需要安装 Wine（macOS/Linux 上）
- 推荐在 Windows 上打包以获得最佳兼容性

### macOS 打包

- **必须在 macOS 上打包**
- 需要 Xcode Command Line Tools
- 可选：Apple Developer ID 用于代码签名

### 代码签名（可选）

#### Windows
需要购买代码签名证书，然后在 `package.json` 中配置：

```json
"win": {
  "certificateFile": "path/to/certificate.p12",
  "certificatePassword": "password"
}
```

#### macOS
需要 Apple Developer ID，在环境变量中设置：

```bash
export CSC_NAME="Developer ID Application: Your Name"
export CSC_IDENTITY_AUTO_DISCOVERY=true
```

## 减小安装包体积

当前安装包约 200-300MB，可以通过以下方式减小：

1. **移除不必要的依赖**
   - 检查 `backend/requirements.txt`
   - 移除未使用的 Python 包

2. **压缩资源文件**
   - 使用 UPX 压缩可执行文件
   - 压缩 Python 库

3. **分离模型文件**
   - AI 模型（176MB）可以单独下载
   - 首次使用时自动下载

## 测试安装包

打包完成后，请在对应平台上测试：

1. **安装测试**
   - 运行安装程序
   - 检查安装目录
   - 验证快捷方式

2. **功能测试**
   - 身份证工具
   - PDF 合并
   - 证件照抠图
   - 音频转换

3. **卸载测试**
   - 卸载程序
   - 检查残留文件

## 发布流程

1. 更新版本号（`package.json` 和 `backend/main.py`）
2. 更新 CHANGELOG.md
3. 创建 git tag
4. 推送 tag 触发 GitHub Actions
5. 等待所有平台打包完成
6. 在 GitHub Release 中发布

## 常见问题

### Q: macOS 打包失败，提示 "hardenedRuntime"
A: 在 `package.json` 中设置 `"hardenedRuntime": false` 或配置代码签名

### Q: Windows 打包后杀毒软件报毒
A: 这是 Electron 应用的常见问题，建议：
- 购买代码签名证书
- 向杀毒软件厂商提交白名单申请

### Q: 打包后的应用无法启动
A: 检查：
- Python 依赖是否正确打包
- 图标文件是否存在
- 后端服务是否能正常启动

### Q: 如何查看打包日志
A: 设置环境变量 `DEBUG=electron-builder`，然后重新打包