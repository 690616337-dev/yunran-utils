#!/usr/bin/env node

/**
 * 图标生成脚本
 * 从 SVG 生成 PNG、ICO、ICNS 格式图标
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BUILD_DIR = path.join(__dirname, '..', 'build');
const SVG_FILE = path.join(BUILD_DIR, 'icon.svg');

// 检查 sharp 是否安装
function checkSharp() {
  try {
    require.resolve('sharp');
    return true;
  } catch {
    return false;
  }
}

// 使用 ImageMagick 转换
function convertWithImageMagick() {
  console.log('使用 ImageMagick 生成图标...');
  
  try {
    // 生成 PNG (512x512)
    execSync(`convert -background none ${SVG_FILE} -resize 512x512 ${path.join(BUILD_DIR, 'icon.png')}`);
    console.log('✓ icon.png (512x512)');
    
    // 生成 ICO (多尺寸)
    execSync(`convert -background none ${SVG_FILE} -define icon:auto-resize=256,128,64,48,32,16 ${path.join(BUILD_DIR, 'icon.ico')}`);
    console.log('✓ icon.ico (多尺寸)');
    
    // 生成 ICNS (macOS)
    const iconsetDir = path.join(BUILD_DIR, 'icon.iconset');
    if (!fs.existsSync(iconsetDir)) {
      fs.mkdirSync(iconsetDir, { recursive: true });
    }
    
    const sizes = [16, 32, 64, 128, 256, 512];
    sizes.forEach(size => {
      execSync(`convert -background none ${SVG_FILE} -resize ${size}x${size} ${path.join(iconsetDir, `icon_${size}x${size}.png`)}`);
      execSync(`convert -background none ${SVG_FILE} -resize ${size*2}x${size*2} ${path.join(iconsetDir, `icon_${size}x${size}@2x.png`)}`);
    });
    
    execSync(`iconutil -c icns ${iconsetDir} -o ${path.join(BUILD_DIR, 'icon.icns')}`);
    console.log('✓ icon.icns (macOS)');
    
    return true;
  } catch (error) {
    console.error('ImageMagick 转换失败:', error.message);
    return false;
  }
}

// 使用 sharp 转换
async function convertWithSharp() {
  console.log('使用 sharp 生成图标...');
  
  try {
    const sharp = require('sharp');
    
    // 生成 PNG (512x512)
    await sharp(SVG_FILE)
      .resize(512, 512)
      .png()
      .toFile(path.join(BUILD_DIR, 'icon.png'));
    console.log('✓ icon.png (512x512)');
    
    // 生成 ICO 需要额外处理，这里使用 png-to-ico
    try {
      const pngToIco = require('png-to-ico');
      const buf = await pngToIco([path.join(BUILD_DIR, 'icon.png')]);
      fs.writeFileSync(path.join(BUILD_DIR, 'icon.ico'), buf);
      console.log('✓ icon.ico');
    } catch {
      console.log('⚠ icon.ico 生成失败，请手动转换');
    }
    
    console.log('✓ 图标生成完成');
    return true;
  } catch (error) {
    console.error('sharp 转换失败:', error.message);
    return false;
  }
}

// 主函数
async function main() {
  console.log('=================================');
  console.log('  云褍实用工具 v3 - 图标生成');
  console.log('=================================\n');
  
  // 检查 SVG 文件
  if (!fs.existsSync(SVG_FILE)) {
    console.error('错误: 找不到 icon.svg 文件');
    console.log('请确保 build/icon.svg 存在');
    process.exit(1);
  }
  
  // 确保 build 目录存在
  if (!fs.existsSync(BUILD_DIR)) {
    fs.mkdirSync(BUILD_DIR, { recursive: true });
  }
  
  let success = false;
  
  // 尝试使用 sharp
  if (checkSharp()) {
    success = await convertWithSharp();
  }
  
  // 如果 sharp 失败，尝试 ImageMagick
  if (!success) {
    success = convertWithImageMagick();
  }
  
  if (success) {
    console.log('\n✅ 图标生成完成！');
    console.log('生成的文件:');
    console.log('  - build/icon.png');
    console.log('  - build/icon.ico');
    console.log('  - build/icon.icns (macOS)');
  } else {
    console.error('\n❌ 图标生成失败');
    console.log('\n请手动安装以下工具之一:');
    console.log('  1. sharp: npm install sharp png-to-ico');
    console.log('  2. ImageMagick: https://imagemagick.org');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('错误:', err);
  process.exit(1);
});