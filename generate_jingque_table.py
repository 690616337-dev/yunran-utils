#!/usr/bin/env python3
"""
生成精雀赛事Markdown表格
"""

import json

def generate_markdown_table():
    # 读取去重后的数据
    with open('/root/.openclaw/workspace/jingque_data_deduplicated.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    competitions = data.get('competitions', [])
    
    # 按月份分组
    months = {}
    for comp in competitions:
        date = comp.get('date', '')
        # 提取月份
        if '月' in date:
            month = date.split('月')[0] + '月'
            if month not in months:
                months[month] = []
            months[month].append(comp)
    
    # 生成Markdown表格
    md_content = "# 精雀赛事 - 2026年体育舞蹈赛事列表\n\n"
    md_content += f"**数据来源**: 精雀赛事 (https://bm.wudao.pro)\n\n"
    md_content += f"**抓取时间**: 2026年2月25日\n\n"
    md_content += f"**赛事总数**: {len(competitions)} 场\n\n"
    md_content += "---\n\n"
    
    # 按月份排序
    sorted_months = sorted(months.keys(), key=lambda x: int(x.replace('月', '')) if x.replace('月', '').isdigit() else 99)
    
    for month in sorted_months:
        md_content += f"## {month}赛事\n\n"
        md_content += "| 日期 | 城市 | 状态 |\n"
        md_content += "|------|------|------|\n"
        
        for comp in months[month]:
            city = comp.get('city', '')
            status = comp.get('status', '')
            date = comp.get('date', '')
            
            # 四川地区标注
            if '四川' in city:
                city = f"🔥 {city}"
            
            md_content += f"| {date} | {city} | {status} |\n"
        
        md_content += "\n"
    
    # 保存Markdown文件
    with open('/root/.openclaw/workspace/精雀赛事_2026年赛事列表.md', 'w', encoding='utf-8') as f:
        f.write(md_content)
    
    print("Markdown表格已生成: 精雀赛事_2026年赛事列表.md")
    print(f"\n共 {len(competitions)} 场赛事")
    
    # 显示四川地区赛事
    print("\n" + "="*50)
    print("四川地区赛事:")
    print("="*50)
    for comp in competitions:
        if '四川' in comp.get('city', ''):
            print(f"  🔥 {comp.get('date')} | {comp.get('city')} | {comp.get('status', '')}")
    
    return md_content

if __name__ == '__main__':
    generate_markdown_table()
