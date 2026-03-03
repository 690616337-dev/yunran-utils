#!/usr/bin/env python3
"""
将HTML转换为图片 - 使用data URL
"""

import asyncio
import base64

def read_html_file():
    with open('/root/.openclaw/workspace/2026年体育舞蹈赛事数据库.html', 'r', encoding='utf-8') as f:
        return f.read()

async def html_to_image():
    from playwright.async_api import async_playwright
    
    html_content = read_html_file()
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            executable_path='/snap/bin/chromium'
        )
        page = await browser.new_page()
        
        # 使用data URL加载HTML
        await page.set_content(html_content)
        
        # 等待页面加载
        await page.wait_for_timeout(2000)
        
        # 获取页面高度
        height = await page.evaluate('document.body.scrollHeight')
        width = await page.evaluate('document.body.scrollWidth')
        
        # 设置视口大小
        await page.set_viewport_size({'width': max(width, 1200), 'height': height + 100})
        
        # 截图
        await page.screenshot(
            path='/root/.openclaw/workspace/2026年体育舞蹈赛事数据库.png',
            full_page=True
        )
        
        await browser.close()
        
        print("图片已生成: 2026年体育舞蹈赛事数据库.png")
        
        # 检查文件
        import os
        file_size = os.path.getsize('/root/.openclaw/workspace/2026年体育舞蹈赛事数据库.png')
        print(f"文件大小: {file_size} bytes")

if __name__ == '__main__':
    asyncio.run(html_to_image())
