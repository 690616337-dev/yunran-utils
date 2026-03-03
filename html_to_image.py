#!/usr/bin/env python3
"""
将HTML转换为图片
"""

import asyncio

async def html_to_image():
    from playwright.async_api import async_playwright
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            executable_path='/snap/bin/chromium'
        )
        page = await browser.new_page()
        
        # 加载HTML文件
        await page.goto('file:///root/.openclaw/workspace/2026年体育舞蹈赛事数据库.html')
        
        # 等待页面加载
        await page.wait_for_timeout(2000)
        
        # 获取页面高度
        height = await page.evaluate('document.body.scrollHeight')
        
        # 设置视口大小
        await page.set_viewport_size({'width': 1200, 'height': height})
        
        # 截图
        await page.screenshot(
            path='/root/.openclaw/workspace/2026年体育舞蹈赛事数据库.png',
            full_page=True
        )
        
        await browser.close()
        
        print("图片已生成: 2026年体育舞蹈赛事数据库.png")

if __name__ == '__main__':
    asyncio.run(html_to_image())
