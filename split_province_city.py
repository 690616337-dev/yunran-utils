#!/usr/bin/env python3
"""
更新数据库，将地点分成省份和城市
"""

import json

# 省份映射表
province_map = {
    '北京': ('北京', '北京'),
    '上海': ('上海', '上海'),
    '天津': ('天津', '天津'),
    '重庆': ('重庆', '重庆'),
    '香港': ('香港', '香港'),
    '澳门': ('澳门', '澳门'),
    '广东广州': ('广东', '广州'),
    '广东深圳': ('广东', '深圳'),
    '广东珠海': ('广东', '珠海'),
    '广东佛山': ('广东', '佛山'),
    '广东广州': ('广东', '广州'),
    '江苏南京': ('江苏', '南京'),
    '江苏徐州': ('江苏', '徐州'),
    '浙江杭州': ('浙江', '杭州'),
    '浙江宁波': ('浙江', '宁波'),
    '四川成都': ('四川', '成都'),
    '河南郑州': ('河南', '郑州'),
    '河北石家庄': ('河北', '石家庄'),
    '山东济南': ('山东', '济南'),
    '山东临沂': ('山东', '临沂'),
    '山东曲阜': ('山东', '曲阜'),
    '山西太原': ('山西', '太原'),
    '安徽合肥': ('安徽', '合肥'),
    '安徽芜湖': ('安徽', '芜湖'),
    '安徽滁州': ('安徽', '滁州'),
    '安徽淮南': ('安徽', '淮南'),
    '安徽阜阳': ('安徽', '阜阳'),
    '安徽阜阳': ('安徽', '阜阳'),
    '湖北武汉': ('湖北', '武汉'),
    '湖南长沙': ('湖南', '长沙'),
    '江西南昌': ('江西', '南昌'),
    '江西九江': ('江西', '九江'),
    '福建厦门': ('福建', '厦门'),
    '辽宁沈阳': ('辽宁', '沈阳'),
    '辽宁大连': ('辽宁', '大连'),
    '辽宁营口': ('辽宁', '营口'),
    '辽宁辽阳': ('辽宁', '辽阳'),
    '辽宁东戴河': ('辽宁', '东戴河'),
    '云南大理': ('云南', '大理'),
    '英国': ('海外', '英国'),
}

def split_location(city):
    """将地点分成省份和城市"""
    if city in province_map:
        return province_map[city]
    
    # 尝试从城市名称提取省份
    for full_name, (prov, city_name) in province_map.items():
        if city_name in city or full_name in city:
            return (prov, city)
    
    # 特殊处理
    if '横琴' in city:
        return ('广东', '珠海横琴')
    if '东戴河' in city:
        return ('辽宁', '东戴河')
    
    # 默认返回原值
    return ('', city)

def update_database():
    # 读取数据
    with open('/root/.openclaw/workspace/2026年体育舞蹈赛事数据库_v2.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    competitions = data['competitions']
    
    # 更新每条记录
    for comp in competitions:
        city = comp['city']
        province, city_name = split_location(city)
        comp['province'] = province
        comp['city'] = city_name
    
    # 保存更新后的数据
    with open('/root/.openclaw/workspace/2026年体育舞蹈赛事数据库_v3.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"数据库已更新，共 {len(competitions)} 场赛事")
    
    # 显示部分数据
    print("\n前10条数据预览:")
    for comp in competitions[:10]:
        print(f"  {comp['date']} | {comp['province']} | {comp['city']} | {comp['name']} | {comp['source']}")
    
    # 按省份统计
    province_count = {}
    for comp in competitions:
        prov = comp['province'] if comp['province'] else '其他'
        province_count[prov] = province_count.get(prov, 0) + 1
    
    print("\n按省份统计:")
    for prov, count in sorted(province_count.items(), key=lambda x: -x[1]):
        print(f"  {prov}: {count}场")
    
    return competitions

if __name__ == '__main__':
    update_database()
