#!/usr/bin/env python3
"""
iDance赛事抓取脚本
需要安装: pip install selenium
需要安装Chrome浏览器
"""

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import json
import time
import re

def scrape_idance():
    """抓取iDance赛事数据"""
    
    # 配置Chrome选项
    chrome_options = Options()
    # chrome_options.add_argument('--headless')  # 有界面模式便于调试
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--window-size=1920,1080')
    chrome_options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
    
    # 启动浏览器
    driver = webdriver.Chrome(options=chrome_options)
    
    try:
        print("开始抓取iDance赛事数据...")
        print("=" * 60)
        
        # 访问iDance赛事页面
        url = "https://match.idance.vip/#/competition"
        driver.get(url)
        print(f"访问: {url}")
        print("请等待页面完全加载...")
        
        # 等待页面加载（有界面可以看到加载过程）
        time.sleep(10)
        
        # 尝试滚动页面加载更多数据
        for i in range(3):
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(3)
            print(f"滚动页面 {i+1}/3")
        
        # 获取页面文本
        text = driver.find_element(By.TAG_NAME, 'body').text
        print(f"\n页面文本长度: {len(text)}")
        
        # 保存完整文本
        with open('idance_full_text.txt', 'w', encoding='utf-8') as f:
            f.write(text)
        print("完整文本已保存到: idance_full_text.txt")
        
        # 尝试提取赛事信息
        print("\n" + "=" * 60)
        print("提取赛事信息...")
        
        # 查找包含日期和城市的信息
        lines = text.split('\n')
        competitions = []
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # 匹配日期格式: MM月DD日 或 MM月
            date_match = re.search(r'(\d{1,2}月\d{1,2}日|\d{1,2}月)', line)
            if date_match:
                # 提取城市名（通常是中文）
                city_match = re.search(r'[一-龥]{2,10}(?:市|州|岛|横琴)', line)
                if city_match:
                    competitions.append({
                        'date': date_match.group(1),
                        'city': city_match.group(0),
                        'raw': line
                    })
                    print(f"  - {line[:60]}")
        
        print(f"\n共找到 {len(competitions)} 条赛事信息")
        
        # 保存JSON
        result = {
            'source': 'iDance',
            'url': url,
            'total': len(competitions),
            'competitions': competitions
        }
        
        with open('idance_competitions.json', 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        
        print("\n数据已保存到: idance_competitions.json")
        print("=" * 60)
        
        return result
        
    except Exception as e:
        print(f"错误: {e}")
        import traceback
        traceback.print_exc()
        return None
        
    finally:
        input("\n按回车键关闭浏览器...")
        driver.quit()

if __name__ == "__main__":
    scrape_idance()
