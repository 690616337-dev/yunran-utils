#!/usr/bin/env node

/**
 * 云褍实用工具 v3 - 多平台打包脚本
 * 
 * 支持平台：
 * - Windows x64 (Intel/AMD)
 * - Windows ARM64
 * - macOS x64 (Intel)
 * - macOS ARM64 (Apple Silicon M1/M2/M3)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.cyan}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}[WARN]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  step: (msg) => console.log(`\n${colors.bright}${colors.blue}▶ ${msg}${colors.reset}`),
};

// 平台配置
const platforms = [
  {
    name: 'Windows x64 (Intel/AMD)',
    id: 'win-x64',
    script: 'build:win:x64',
    outputPattern: /云褍实用工具.*Setup.*exe/,
    ext: '.exe'
  },
  {
    name: 'Windows ARM64',
    id: 'win-arm64',
    script: 'build:win:arm64',
    outputPattern: /云褍实用工具.*arm64.*exe/,
    ext: '.exe'
  },
  {
    name: 'macOS x64 (Intel)',
    id: 'mac-x64',
    script: 'build:mac:x64',
    outputPattern: /云褍实用工具.*x64.*dmg/,
    ext: '.dmg'
  },
  {
    name: 'macOS ARM64 (Apple Silicon)',
    id: 'mac-arm64',
    script: 'build:mac:arm64',
    outputPattern: /云褍实用工具.*arm64.*dmg/,
    ext: '.dmg'
  }
];

// 检查前置条件
function checkPrerequisites() {
  log.step('检查前置条件');
  
  // 检查 Node.js
  try {
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    log.info(`Node.js: ${nodeVersion}`);
  } catch {
    log.error('Node.js 未安装');
    return false;
  }
  
  // 检查 npm
  try {
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    log.info(`npm: ${npmVersion}`);
  } catch {
    log.error('npm 未安装');
    return false;
  }
  
  // 检查 Python
  try {
    const pythonVersion = execSync('python3 --version || python --version', { encoding: 'utf8' }).trim();
    log.info(`Python: ${pythonVersion}`);
  } catch {
    log.warn('Python 可能未安装，打包可能失败');
  }
  
  // 检查图标文件
  const iconFiles = ['build/icon.png', 'build/icon.ico', 'build/icon.icns'];
  const missingIcons = iconFiles.filter(f => !fs.existsSync(f));
  if (missingIcons.length > 0) {
    log.warn(`缺少图标文件: ${missingIcons.join(', ')}`);
    log.info('运行 npm run generate-icons 生成图标');
  }
  
  return true;
}

// 安装依赖
function installDependencies() {
  log.step('安装依赖');
  
  try {
    log.info('安装 Node.js 依赖...');
    execSync('npm install', { stdio: 'inherit' });
    
    log.info('安装前端依赖...');
    execSync('cd frontend && npm install', { stdio: 'inherit' });
    
    log.success('依赖安装完成');
    return true;
  } catch (error) {
    log.error('依赖安装失败');
    return false;
  }
}

// 打包单个平台
function buildPlatform(platform) {
  log.step(`打包: ${platform.name}`);
  
  try {
    // 清理之前的构建
    const distDir = path.join(__dirname, '..', 'dist');
    if (fs.existsSync(distDir)) {
      const files = fs.readdirSync(distDir);
      files.forEach(file => {
        if (file.includes(platform.ext)) {
          fs.unlinkSync(path.join(distDir, file));
        }
      });
    }
    
    // 执行打包
    execSync(`npm run ${platform.script}`, { stdio: 'inherit' });
    
    // 检查输出文件
    if (fs.existsSync(distDir)) {
      const files = fs.readdirSync(distDir);
      const outputFile = files.find(f => platform.outputPattern.test(f));
      
      if (outputFile) {
        const filePath = path.join(distDir, outputFile);
        const stats = fs.statSync(filePath);
        const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
        log.success(`打包成功: ${outputFile} (${sizeMB} MB)`);
        return { success: true, file: outputFile, size: sizeMB };
      }
    }
    
    log.warn('未找到输出文件');
    return { success: false, error: '未找到输出文件' };
  } catch (error) {
    log.error(`打包失败: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// 主函数
async function main() {
  console.log(`${colors.bright}`);
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     云褍实用工具 v3 - 多平台打包脚本                    ║');
  console.log('║     支持: Win(x64/ARM64) + macOS(x64/ARM64)           ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log(`${colors.reset}\n`);
  
  // 获取命令行参数
  const args = process.argv.slice(2);
  const platformArg = args[0];
  const skipInstall = args.includes('--skip-install');
  
  // 检查前置条件
  if (!checkPrerequisites()) {
    process.exit(1);
  }
  
  // 安装依赖
  if (!skipInstall) {
    if (!installDependencies()) {
      process.exit(1);
    }
  }
  
  // 确定要打包的平台
  let platformsToBuild = platforms;
  if (platformArg && platformArg !== 'all') {
    const selected = platforms.find(p => p.id === platformArg);
    if (!selected) {
      log.error(`未知平台: ${platformArg}`);
      log.info(`可用平台: ${platforms.map(p => p.id).join(', ')}`);
      process.exit(1);
    }
    platformsToBuild = [selected];
  }
  
  // 打包
  log.step(`开始打包 ${platformsToBuild.length} 个平台`);
  const results = [];
  
  for (const platform of platformsToBuild) {
    const result = buildPlatform(platform);
    results.push({ ...platform, ...result });
  }
  
  // 输出结果
  console.log(`\n${colors.bright}══════════════════════════════════════════════════════════${colors.reset}`);
  log.step('打包结果汇总');
  
  results.forEach(result => {
    if (result.success) {
      log.success(`${result.name}: ${result.file} (${result.size} MB)`);
    } else {
      log.error(`${result.name}: 失败 - ${result.error}`);
    }
  });
  
  const successCount = results.filter(r => r.success).length;
  const failCount = results.length - successCount;
  
  console.log(`\n${colors.bright}══════════════════════════════════════════════════════════${colors.reset}`);
  log.info(`总计: ${successCount} 成功, ${failCount} 失败`);
  
  if (successCount === results.length) {
    log.success('所有平台打包完成！');
    log.info('输出目录: dist/');
  } else {
    log.warn('部分平台打包失败，请检查错误信息');
    process.exit(1);
  }
}

// 显示帮助
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
用法: node scripts/build-all.js [平台] [选项]

平台:
  all         打包所有平台 (默认)
  win-x64     Windows x64 (Intel/AMD)
  win-arm64   Windows ARM64
  mac-x64     macOS x64 (Intel)
  mac-arm64   macOS ARM64 (Apple Silicon)

选项:
  --skip-install  跳过依赖安装
  --help, -h      显示帮助

示例:
  node scripts/build-all.js              # 打包所有平台
  node scripts/build-all.js win-x64      # 只打包 Windows x64
  node scripts/build-all.js mac-arm64    # 只打包 macOS ARM64
`);
  process.exit(0);
}

// 运行主函数
main().catch(err => {
  log.error('发生错误:', err);
  process.exit(1);
});