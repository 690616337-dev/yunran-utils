#!/usr/bin/env python3
"""
iDance赛事抓取脚本 - 使用Playwright
"""

import asyncio
import json
from playwright.async_api import async_playwright

async def scrape_idance():
    """抓取iDance赛事数据"""
    
    async with async_playwright() as p:
        # 启动浏览器
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        try:
            print("开始抓取iDance赛事数据...")
            print("=" * 50)
            
            # 访问iDance赛事页面
            url = "https://match.idance.vip/#/competition"
            await page.goto(url, wait_until='networkidle')
            print(f"访问: {url}")
            
            # 等待页面加载
            await page.wait_for_timeout(5000)
            
            # 获取页面内容
            content = await page.content()
            
            # 保存页面源码
            with open('idance_page.html', 'w', encoding='utf-8') as f:
                f.write(content)
            print("页面源码已保存到 idance_page.html")
            
            # 尝试提取文本内容
            text_content = await page.evaluate('''() => {
                return document.body.innerText;
            }''')
            
            print("\n页面文本内容（前2000字符）:")
            print(text_content[:2000])
            
            # 保存文本内容
            with open('idance_text.txt', 'w', encoding='utf-8') as f:
                f.write(text_content)
            
            print("\n" + "=" * 50)
            print("抓取完成！")
            print("页面源码: idance_page.html")
            print("文本内容: idance_text.txt")
            
        except Exception as e:
            print(f"抓取出错: {e}")
            import traceback
            traceback.print_exc()
            
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(scrape_idance())
