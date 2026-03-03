#!/usr/bin/env python3
"""
精雀赛事数据抓取脚本
使用Playwright模拟浏览器访问
"""

import asyncio
import json
from playwright.async_api import async_playwright

async def scrape_jingque():
    """抓取精雀赛事数据"""
    async with async_playwright() as p:
        # 启动浏览器
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        )
        page = await context.new_page()
        
        # 存储抓取到的数据
        competitions = []
        
        # 监听网络请求
        async def handle_route(route, request):
            if 'graphql' in request.url:
                try:
                    response = await route.fetch()
                    json_data = await response.json()
                    if json_data and 'data' in json_data:
                        print(f"GraphQL Response: {json.dumps(json_data, indent=2, ensure_ascii=False)[:500]}")
                except Exception as e:
                    print(f"Error handling request: {e}")
            await route.continue_()
        
        await page.route("**/*", handle_route)
        
        # 访问精雀赛事页面
        print("访问精雀赛事官网...")
        await page.goto('https://bm.wudao.pro/competition', wait_until='networkidle')
        
        # 等待页面加载
        await page.wait_for_timeout(5000)
        
        # 尝试获取页面内容
        content = await page.content()
        print(f"页面内容长度: {len(content)}")
        
        # 查找赛事列表元素
        try:
            # 等待赛事列表加载
            await page.wait_for_selector('[class*="match"], [class*="competition"], .event-item, .match-item', timeout=10000)
            
            # 提取赛事数据
            matches = await page.evaluate('''() => {
                const items = document.querySelectorAll('[class*="match"], [class*="competition"], .event-item, .match-item');
                return Array.from(items).map(item => ({
                    text: item.textContent?.trim() || '',
                    html: item.innerHTML?.substring(0, 200) || ''
                }));
            }''')
            
            print(f"找到 {len(matches)} 个赛事元素")
            for i, match in enumerate(matches[:10]):
                print(f"{i+1}. {match['text'][:100]}")
                
        except Exception as e:
            print(f"提取赛事数据失败: {e}")
        
        # 截图保存
        await page.screenshot(path='/root/.openclaw/workspace/jingque_screenshot.png')
        print("截图已保存")
        
        await browser.close()
        return competitions

if __name__ == '__main__':
    result = asyncio.run(scrape_jingque())
    print(f"\n抓取完成，获取到 {len(result)} 条数据")
