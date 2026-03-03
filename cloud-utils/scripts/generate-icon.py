#!/usr/bin/env python3
"""
生成云褍实用工具图标
风格：蓝色渐变背景 + 发光工具箱图标
"""

from PIL import Image, ImageDraw, ImageFilter, ImageFont
import math

# 图标尺寸
SIZES = {
    'icon.png': 1024,
    'icon.ico': 256,  # Windows 图标最大尺寸
}

def create_gradient_background(size, color1=(10, 20, 60), color2=(30, 60, 150)):
    """创建蓝色渐变背景"""
    img = Image.new('RGB', (size, size), color1)
    draw = ImageDraw.Draw(img)
    
    for y in range(size):
        ratio = y / size
        r = int(color1[0] + (color2[0] - color1[0]) * ratio)
        g = int(color1[1] + (color2[1] - color1[1]) * ratio)
        b = int(color1[2] + (color2[2] - color1[2]) * ratio)
        draw.line([(0, y), (size, y)], fill=(r, g, b))
    
    return img

def draw_rounded_rect(draw, xy, radius, fill, outline=None, width=1):
    """绘制圆角矩形"""
    x1, y1, x2, y2 = xy
    # 绘制主体矩形
    draw.rectangle([x1 + radius, y1, x2 - radius, y2], fill=fill)
    draw.rectangle([x1, y1 + radius, x2, y2 - radius], fill=fill)
    # 绘制四个圆角
    draw.ellipse([x1, y1, x1 + radius * 2, y1 + radius * 2], fill=fill)
    draw.ellipse([x2 - radius * 2, y1, x2, y1 + radius * 2], fill=fill)
    draw.ellipse([x1, y2 - radius * 2, x1 + radius * 2, y2], fill=fill)
    draw.ellipse([x2 - radius * 2, y2 - radius * 2, x2, y2], fill=fill)

def draw_glow_effect(draw, center, size, color, intensity=0.3):
    """绘制发光效果"""
    x, y = center
    for i in range(10, 0, -1):
        alpha = int(255 * intensity * (i / 10))
        radius = size + i * 8
        glow_color = (*color, alpha)
        # 这里简化处理，实际应该使用RGBA

def create_toolbox_icon(size=1024):
    """创建工具箱图标"""
    # 创建背景
    img = create_gradient_background(size)
    
    # 转换为RGBA以便处理透明度
    img = img.convert('RGBA')
    
    # 创建发光层
    glow = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    
    # 计算工具箱位置和大小
    center_x = size // 2
    center_y = size // 2 - size // 20  # 稍微偏上
    box_width = size // 2.5
    box_height = size // 3
    
    # 工具箱颜色（青色发光）
    toolbox_color = (100, 200, 255)
    glow_color = (100, 200, 255, 100)
    
    # 绘制发光效果
    for i in range(15, 0, -1):
        alpha = int(30 * (i / 15))
        offset = i * 4
        glow_draw.rounded_rectangle(
            [center_x - box_width//2 - offset, center_y - box_height//2 - offset,
             center_x + box_width//2 + offset, center_y + box_height//2 + offset],
            radius=20 + offset//2,
            fill=(100, 200, 255, alpha)
        )
    
    # 合并发光层
    img = Image.alpha_composite(img, glow)
    draw = ImageDraw.Draw(img)
    
    # 绘制工具箱主体
    box_left = center_x - box_width // 2
    box_top = center_y - box_height // 2
    box_right = center_x + box_width // 2
    box_bottom = center_y + box_height // 2
    
    # 工具箱主体（渐变效果）
    for i in range(int(box_height)):
        ratio = i / box_height
        r = int(80 + 40 * ratio)
        g = int(180 + 40 * ratio)
        b = int(255)
        alpha = 255
        y = box_top + i
        draw.line([(box_left + 15, y), (box_right - 15, y)], 
                  fill=(r, g, b, alpha), width=1)
    
    # 绘制工具箱边框（发光效果）
    border_color = (150, 220, 255)
    draw.rounded_rectangle(
        [box_left, box_top, box_right, box_bottom],
        radius=20,
        outline=border_color,
        width=4
    )
    
    # 绘制工具箱盖子/提手
    handle_height = box_height // 4
    draw.rounded_rectangle(
        [box_left, box_top, box_right, box_top + handle_height],
        radius=20,
        fill=(60, 160, 230)
    )
    
    # 绘制提手
    handle_width = box_width // 3
    handle_top = box_top - box_height // 6
    draw.rounded_rectangle(
        [center_x - handle_width//2, handle_top,
         center_x + handle_width//2, box_top + 10],
        radius=10,
        fill=(100, 200, 255),
        outline=border_color,
        width=3
    )
    
    # 绘制锁扣
    lock_width = box_width // 6
    lock_height = box_height // 8
    draw.rounded_rectangle(
        [center_x - lock_width//2, box_top + handle_height - lock_height//2,
         center_x + lock_width//2, box_top + handle_height + lock_height//2],
        radius=5,
        fill=(200, 240, 255),
        outline=border_color,
        width=2
    )
    
    # 绘制底部音频频谱效果（装饰）
    spectrum_bars = 20
    bar_width = size // (spectrum_bars * 2)
    max_bar_height = size // 12
    bottom_y = size - size // 15
    
    for i in range(spectrum_bars):
        x = size // 4 + i * bar_width * 2
        # 使用正弦波创建起伏效果
        height_factor = abs(math.sin(i * 0.5)) * 0.5 + 0.3
        bar_height = int(max_bar_height * height_factor)
        
        # 渐变色
        for h in range(bar_height):
            ratio = h / max_bar_height
            r = int(30 + 70 * ratio)
            g = int(60 + 100 * ratio)
            b = int(150 + 105 * ratio)
            alpha = int(100 + 155 * ratio)
            y = bottom_y - h
            draw.line([(x, y), (x + bar_width - 2, y)], 
                      fill=(r, g, b, alpha), width=1)
    
    return img

def create_ico_icon(size=256):
    """创建Windows ICO图标"""
    img = create_toolbox_icon(size)
    return img.convert('RGBA')

def create_icns_icon(size=1024):
    """创建macOS ICNS图标"""
    return create_toolbox_icon(size)

def save_icons():
    """保存所有格式的图标"""
    import os
    
    build_dir = '/root/.openclaw/workspace/yunran-tools-v3/build'
    os.makedirs(build_dir, exist_ok=True)
    
    # 生成 PNG (1024x1024)
    print("生成 icon.png (1024x1024)...")
    png_img = create_toolbox_icon(1024)
    png_img.save(f'{build_dir}/icon.png', 'PNG')
    
    # 生成 ICO (多尺寸) - Windows 需要 256x256
    print("生成 icon.ico (多尺寸)...")
    ico_sizes = [16, 32, 48, 64, 128, 256]
    ico_images = []
    for s in ico_sizes:
        img = create_toolbox_icon(s).convert('RGBA')
        ico_images.append(img)
    # PIL 保存 ICO 需要特殊处理
    ico_images[-1].save(f'{build_dir}/icon.ico', format='ICO', sizes=[(s, s) for s in ico_sizes])
    
    # 生成 ICNS (macOS)
    print("生成 icon.icns (macOS)...")
    # ICNS 需要特殊处理，这里先保存为 PNG，后续可以用 iconutil 转换
    icns_img = create_toolbox_icon(1024)
    icns_img.save(f'{build_dir}/icon.icns.png', 'PNG')
    
    # 生成不同尺寸的图标用于 icon.iconset
    iconset_dir = f'{build_dir}/icon.iconset'
    os.makedirs(iconset_dir, exist_ok=True)
    
    sizes = [16, 32, 64, 128, 256, 512, 1024]
    for s in sizes:
        img = create_toolbox_icon(s)
        img.save(f'{iconset_dir}/icon_{s}x{s}.png', 'PNG')
        if s <= 512:
            img2x = create_toolbox_icon(s * 2)
            img2x.save(f'{iconset_dir}/icon_{s}x{s}@2x.png', 'PNG')
    
    print(f"图标已保存到 {build_dir}/")
    print("文件列表:")
    for f in os.listdir(build_dir):
        print(f"  - {f}")

if __name__ == '__main__':
    save_icons()
