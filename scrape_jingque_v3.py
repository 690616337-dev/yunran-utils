#!/usr/bin/env python3
"""
精雀赛事数据抓取脚本 - 使用Playwright
支持翻页抓取所有赛事
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
        
        # 存储所有抓取到的赛事
        all_competitions = []
        
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
        await page.wait_for_timeout(5000)
        
        # 翻页抓取所有赛事
        page_num = 1
        has_more = True
        
        while has_more and page_num <= 10:  # 最多翻10页
            print(f"\n{'=' * 50}")
            print(f"正在抓取第 {page_num} 页...")
            print(f"{'=' * 50}")
            
            # 获取当前页面的赛事数据
            page_data = await page.evaluate('''() => {
                const lines = [];
                const text = document.body.innerText;
                const allLines = text.split('\\n').map(l => l.trim()).filter(l => l);
                
                // 查找赛事信息
                let inCompetitionSection = false;
                for (let i = 0; i < allLines.length; i++) {
                    const line = allLines[i];
                    // 检测赛事区域
                    if (line.includes('近期赛事') || line.includes('赛事列表')) {
                        inCompetitionSection = true;
                    }
                    if (inCompetitionSection) {
                        lines.push(line);
                    }
                }
                
                // 如果没有找到特定区域，返回所有文本
                if (lines.length === 0) {
                    return allLines.slice(0, 100);
                }
                
                return lines;
            }''')
            
            print(f"第 {page_num} 页文本行数: {len(page_data)}")
            
            # 解析赛事数据
            competitions = parse_competitions(page_data)
            print(f"解析到 {len(competitions)} 条赛事数据")
            for comp in competitions[:5]:  # 显示前5条
                print(f"  - {comp.get('date', 'N/A')} | {comp.get('city', 'N/A')}")
            
            all_competitions.extend(competitions)
            
            # 查找下一页按钮并点击
            has_more = await page.evaluate('''() => {
                // 查找可能的翻页按钮
                const nextBtns = document.querySelectorAll(
                    'button[class*="next"], .pagination button:last-child, [class*="page-next"], .ant-pagination-next'
                );
                for (const btn of nextBtns) {
                    if (!btn.disabled && btn.offsetParent !== null) {
                        btn.click();
                        return true;
                    }
                }
                return false;
            }''')
            
            if has_more:
                print("点击下一页...")
                await page.wait_for_timeout(3000)  # 等待页面加载
                page_num += 1
            else:
                print("没有更多页面了")
                break
        
        # 截图保存
        await page.screenshot(path='/root/.openclaw/workspace/jingque_screenshot.png', full_page=True)
        print(f"\n[截图已保存] /root/.openclaw/workspace/jingque_screenshot.png")
        
        # 保存完整数据
        output = {
            'page_url': page.url,
            'page_title': await page.title(),
            'total_pages': page_num,
            'total_competitions': len(all_competitions),
            'competitions': all_competitions
        }
        
        with open('/root/.openclaw/workspace/jingque_data.json', 'w', encoding='utf-8') as f:
            json.dump(output, f, ensure_ascii=False, indent=2)
        print(f"\n[数据已保存] /root/.openclaw/workspace/jingque_data.json")
        print(f"总共抓取到 {len(all_competitions)} 条赛事数据")
        
        await browser.close()
        return all_competitions

def parse_competitions(lines):
    """从文本行中解析赛事数据"""
    competitions = []
    i = 0
    while i < len(lines):
        line = lines[i]
        # 检测日期格式（如：03月01日-02日 或 03月21日）
        if '月' in line and ('日' in line or '报名' in line):
            date = line
            city = ''
            status = ''
            
            # 查找城市（下一行）
            if i + 1 < len(lines):
                next_line = lines[i + 1]
                if not ('月' in next_line and '日' in next_line) and not ('报名' in next_line):
                    city = next_line
                    i += 1
            
            # 查找状态（再下一行）
            if i + 1 < len(lines):
                next_line = lines[i + 1]
                if '报名' in next_line or '预告' in next_line:
                    status = next_line
                    i += 1
            
            if city:  # 只有有城市信息才算有效赛事
                competitions.append({
                    'date': date,
                    'city': city,
                    'status': status
                })
        i += 1
    
    return competitions

if __name__ == '__main__':
    print("开始抓取精雀赛事数据...")
    result = asyncio.run(scrape_jingque())
    print(f"\n抓取完成！共 {len(result)} 条赛事数据")
