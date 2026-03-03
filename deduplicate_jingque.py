#!/usr/bin/env python3
"""
精雀赛事数据去重脚本
"""

import json

def deduplicate_competitions():
    # 读取原始数据
    with open('/root/.openclaw/workspace/jingque_data.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    competitions = data.get('competitions', [])
    print(f"原始数据条数: {len(competitions)}")
    
    # 使用字典去重（以date+city为key）
    seen = {}
    unique_competitions = []
    
    for comp in competitions:
        key = f"{comp.get('date', '')}_{comp.get('city', '')}"
        if key not in seen:
            seen[key] = comp
            unique_competitions.append(comp)
        else:
            print(f"发现重复: {comp.get('date')} | {comp.get('city')}")
    
    print(f"\n去重后条数: {len(unique_competitions)}")
    print(f"重复条数: {len(competitions) - len(unique_competitions)}")
    
    # 保存去重后的数据
    output = {
        'page_url': data.get('page_url'),
        'page_title': data.get('page_title'),
        'total_pages': data.get('total_pages'),
        'original_count': len(competitions),
        'unique_count': len(unique_competitions),
        'competitions': unique_competitions
    }
    
    with open('/root/.openclaw/workspace/jingque_data_deduplicated.json', 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    print(f"\n去重后的数据已保存到: jingque_data_deduplicated.json")
    
    # 显示四川地区的赛事
    print("\n" + "="*50)
    print("四川地区赛事:")
    print("="*50)
    for comp in unique_competitions:
        if '四川' in comp.get('city', ''):
            print(f"  🔥 {comp.get('date')} | {comp.get('city')} | {comp.get('status', '')}")
    
    return unique_competitions

if __name__ == '__main__':
    deduplicate_competitions()
