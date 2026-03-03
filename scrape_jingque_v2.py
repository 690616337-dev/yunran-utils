#!/usr/bin/env python3
"""
精雀赛事数据抓取脚本 - 使用Playwright
"""

import asyncio
import json
import sys

async def scrape_jingque():
    """抓取精雀赛事数据"""
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        print("Playwright未安装，正在安装...")
        import subprocess
        subprocess.run([sys.executable, "-m", "pip", "install", "playwright", "--break-system-packages"], check=True)
        subprocess.run([sys.executable, "-m", "playwright", "install", "chromium"], check=True)
        from playwright.async_api import async_playwright
    
    async with async_playwright() as p:
        # 尝试启动浏览器（使用系统已安装的chromium）
        try:
            browser = await p.chromium.launch(
                headless=True,
                executable_path='/snap/bin/chromium'
            )
        except Exception as e:
            print(f"启动chromium失败: {e}")
            print("尝试使用默认路径...")
            browser = await p.chromium.launch(headless=True)
        
        context = await browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport={'width': 1920, 'height': 1080}
        )
        page = await context.new_page()
        
        # 存储抓取到的数据
        competitions = []
        graphql_responses = []
        
        # 拦截GraphQL请求
        async def handle_route(route, request):
            if 'graphql' in request.url:
                try:
                    response = await route.fetch()
                    json_data = await response.json()
                    graphql_responses.append({
                        'url': request.url,
                        'post_data': request.post_data,
                        'response': json_data
                    })
                    print(f"[GraphQL] {request.url}")
                    print(f"[Response] {json.dumps(json_data, indent=2, ensure_ascii=False)[:1000]}")
                except Exception as e:
                    print(f"[Error] 处理GraphQL请求失败: {e}")
            await route.continue_()
        
        await page.route("**/graphql**", handle_route)
        
        # 访问精雀赛事页面
        print("=" * 50)
        print("访问精雀赛事官网...")
        print("=" * 50)
        
        try:
            await page.goto('https://bm.wudao.pro/competition', wait_until='networkidle', timeout=60000)
        except Exception as e:
            print(f"页面加载超时，继续尝试...")
            await page.goto('https://bm.wudao.pro/competition')
        
        # 等待页面加载
        print("等待页面渲染...")
        await page.wait_for_timeout(8000)
        
        # 截图保存
        await page.screenshot(path='/root/.openclaw/workspace/jingque_screenshot.png', full_page=True)
        print("[截图已保存] /root/.openclaw/workspace/jingque_screenshot.png")
        
        # 获取页面内容
        content = await page.content()
        print(f"[页面内容长度] {len(content)} 字符")
        
        # 尝试提取赛事数据
        print("\n" + "=" * 50)
        print("尝试提取赛事数据...")
        print("=" * 50)
        
        # 方法1: 查找赛事列表元素
        try:
            matches = await page.evaluate('''() => {
                const results = [];
                // 尝试多种可能的选择器
                const selectors = [
                    '[class*="match"]',
                    '[class*="competition"]',
                    '[class*="event"]',
                    '[class*="game"]',
                    '.event-item',
                    '.match-item',
                    '.competition-item',
                    '.card',
                    '.list-item'
                ];
                
                for (const selector of selectors) {
                    const items = document.querySelectorAll(selector);
                    if (items.length > 0) {
                        results.push({
                            selector: selector,
                            count: items.length,
                            items: Array.from(items).slice(0, 5).map(item => ({
                                text: item.textContent?.trim().substring(0, 200) || '',
                                html: item.innerHTML?.substring(0, 300) || ''
                            }))
                        });
                    }
                }
                return results;
            }''')
            
            if matches and len(matches) > 0:
                print(f"[成功] 找到 {len(matches)} 类匹配元素")
                for m in matches:
                    print(f"\n选择器: {m['selector']} (数量: {m['count']})")
                    for i, item in enumerate(m['items'][:3]):
                        print(f"  {i+1}. {item['text'][:100]}")
            else:
                print("[未找到] 未检测到赛事列表元素")
                
        except Exception as e:
            print(f"[错误] 提取数据失败: {e}")
        
        # 方法2: 直接从页面文本中提取
        print("\n" + "=" * 50)
        print("分析页面文本...")
        print("=" * 50)
        
        page_text = await page.evaluate('() => document.body.innerText')
        lines = [line.strip() for line in page_text.split('\n') if line.strip()]
        print(f"页面文本行数: {len(lines)}")
        print(f"前20行:\n" + '\n'.join(lines[:20]))
        
        # 保存完整数据
        output = {
            'page_url': page.url,
            'page_title': await page.title(),
            'content_length': len(content),
            'text_lines': lines[:50],
            'graphql_responses': graphql_responses,
            'extracted_matches': matches if 'matches' in locals() else []
        }
        
        with open('/root/.openclaw/workspace/jingque_data.json', 'w', encoding='utf-8') as f:
            json.dump(output, f, ensure_ascii=False, indent=2)
        print(f"\n[数据已保存] /root/.openclaw/workspace/jingque_data.json")
        
        await browser.close()
        return competitions

if __name__ == '__main__':
    print("开始抓取精雀赛事数据...")
    result = asyncio.run(scrape_jingque())
    print(f"\n抓取完成！")
