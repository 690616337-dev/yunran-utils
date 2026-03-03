#!/usr/bin/env python3
"""
更新数据库，添加蓝舞者渠道数据
"""

import json
from datetime import datetime

def update_database_with_lanwuzhe():
    # 读取现有数据
    with open('/root/.openclaw/workspace/2026年体育舞蹈赛事数据库.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    competitions = data['competitions']
    
    # 添加蓝舞者渠道的赛事（根据之前搜索到的信息）
    lanwuzhe_competitions = [
        {"date": "2026-04-05", "city": "浙江杭州", "name": "中华同心·舞动华夏浙江省队选拔", "source": "蓝舞者"},
        {"date": "2026-05-01", "city": "河南郑州", "name": "2026第六届舞王杯国标舞全国公开赛", "source": "蓝舞者"},
        {"date": "2026-06-18", "city": "北京", "name": "2026第四届BOC国际标准舞世界公开赛", "source": "蓝舞者"},
        {"date": "2026-08-18", "city": "广东深圳", "name": "2026世界杯国标舞环球巨星公开赛", "source": "蓝舞者"},
    ]
    
    # 更新现有赛事的渠道（部分赛事可能在蓝舞者和精雀都有发布）
    for comp in competitions:
        # 杭州浙江省队选拔 - 蓝舞者也有发布
        if comp['city'] == '杭州' and '浙江' in comp['name']:
            comp['source'] = '精雀赛事/蓝舞者'
        # 郑州舞王杯 - 蓝舞者也有发布
        if comp['city'] == '河南郑州' and '舞王杯' in comp['name']:
            comp['source'] = '河南省艺术舞蹈协会/蓝舞者'
        # BOC北京 - 蓝舞者也有发布
        if comp['city'] == '北京' and 'BOC' in comp['name']:
            comp['source'] = 'BOC官网/蓝舞者'
        # 深圳世界杯 - 蓝舞者也有发布
        if comp['city'] == '广东深圳' and '世界杯' in comp['name']:
            comp['source'] = '精雀赛事/蓝舞者'
    
    # 添加蓝舞者特有的赛事（如果不在列表中）
    existing_keys = {f"{c['date']}_{c['city']}_{c['name']}" for c in competitions}
    
    for comp in lanwuzhe_competitions:
        key = f"{comp['date']}_{comp['city']}_{comp['name']}"
        if key not in existing_keys:
            competitions.append(comp)
            print(f"添加蓝舞者赛事: {comp['date']} | {comp['city']} | {comp['name']}")
    
    # 重新排序
    competitions.sort(key=lambda x: x['date'])
    
    # 更新数据来源列表
    if '蓝舞者' not in data['sources']:
        data['sources'].append('蓝舞者')
    
    data['total'] = len(competitions)
    data['competitions'] = competitions
    
    # 保存更新后的数据
    with open('/root/.openclaw/workspace/2026年体育舞蹈赛事数据库_v2.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"\n更新完成!")
    print(f"总赛事数: {len(competitions)}")
    
    # 统计各渠道数量
    source_count = {}
    for comp in competitions:
        source = comp['source']
        source_count[source] = source_count.get(source, 0) + 1
    
    print("\n数据来源统计:")
    for source, count in sorted(source_count.items(), key=lambda x: -x[1]):
        print(f"  {source}: {count}场")
    
    # 蓝舞者渠道赛事
    print("\n蓝舞者渠道赛事:")
    for comp in competitions:
        if '蓝舞者' in comp['source']:
            print(f"  {comp['date']} | {comp['city']} | {comp['name']} | {comp['source']}")
    
    return competitions

if __name__ == '__main__':
    update_database_with_lanwuzhe()
