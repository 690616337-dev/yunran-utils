#!/usr/bin/env python3
"""
iDance赛事抓取脚本
使用Selenium抓取iDance网页上的赛事信息
"""

import json
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def scrape_idance():
    """抓取iDance赛事数据"""
    
    # 配置Chrome选项
    chrome_options = Options()
    chrome_options.add_argument('--headless')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--disable-gpu')
    chrome_options.add_argument('--window-size=1920,1080')
    chrome_options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
    
    # 启动浏览器
    driver = webdriver.Chrome(options=chrome_options)
    
    try:
        print("开始抓取iDance赛事数据...")
        print("=" * 50)
        
        # 访问iDance赛事页面
        url = "https://match.idance.vip/#/competition"
        driver.get(url)
        print(f"访问: {url}")
        
        # 等待页面加载
        time.sleep(5)
        
        # 等待赛事列表加载
        try:
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, ".competition-item, .match-item, .event-item, [class*='competition'], [class*='match']"))
            )
        except:
            print("等待赛事元素超时，尝试获取页面源码...")
        
        # 获取页面源码
        page_source = driver.page_source
        
        # 保存页面源码用于分析
        with open('idance_page_source.html', 'w', encoding='utf-8') as f:
            f.write(page_source)
        print("页面源码已保存到 idance_page_source.html")
        
        # 尝试提取赛事数据
        competitions = []
        
        # 尝试多种可能的选择器
        selectors = [
            ".competition-item",
            ".match-item", 
            ".event-item",
            "[class*='competition']",
            "[class*='match']",
            ".van-cell",
            ".list-item"
        ]
        
        for selector in selectors:
            try:
                elements = driver.find_elements(By.CSS_SELECTOR, selector)
                if elements:
                    print(f"找到 {len(elements)} 个元素使用选择器: {selector}")
                    for i, elem in enumerate(elements[:10]):  # 只处理前10个
                        try:
                            text = elem.text.strip()
                            if text and len(text) > 10:
                                print(f"  - {text[:50]}...")
                                competitions.append({"text": text})
                        except:
                            pass
                    break
            except Exception as e:
                continue
        
        # 保存结果
        result = {
            "source": "iDance",
            "url": url,
            "total": len(competitions),
            "competitions": competitions
        }
        
        with open('idance_data.json', 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        
        print("=" * 50)
        print(f"抓取完成！共 {len(competitions)} 条赛事数据")
        print("数据已保存到 idance_data.json")
        
        return result
        
    except Exception as e:
        print(f"抓取出错: {e}")
        import traceback
        traceback.print_exc()
        return None
        
    finally:
        driver.quit()

if __name__ == "__main__":
    scrape_idance()
