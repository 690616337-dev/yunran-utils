#!/usr/bin/env python3
"""
生成2026年完整赛事数据表
整合多个渠道：精雀赛事、蓝舞者、公众号等
"""

import json

def generate_full_2026_table():
    # 精雀赛事数据
    jingque_data = [
        {"date": "2026-03-01", "city": "上海", "name": "上海体育舞蹈公开赛", "source": "精雀赛事"},
        {"date": "2026-03-07", "city": "香港", "name": "2026年香港代表队选拔赛第一站", "source": "中国香港体育舞蹈总会"},
        {"date": "2026-03-21", "city": "广东广州", "name": "广州体育舞蹈锦标赛", "source": "精雀赛事"},
        {"date": "2026-03-21", "city": "安徽淮南", "name": "淮南体育舞蹈公开赛", "source": "精雀赛事"},
        {"date": "2026-03-21", "city": "香港", "name": "香港校际体育舞蹈公开赛2026", "source": "中国香港体育舞蹈总会"},
        {"date": "2026-03-28", "city": "四川成都", "name": "成都体育舞蹈锦标赛", "source": "精雀赛事"},
        {"date": "2026-04-04", "city": "江苏南京", "name": "南京体育舞蹈公开赛", "source": "精雀赛事"},
        {"date": "2026-04-04", "city": "安徽滁州", "name": "滁州体育舞蹈锦标赛", "source": "精雀赛事"},
        {"date": "2026-04-04", "city": "上海", "name": "上海春季体育舞蹈赛", "source": "精雀赛事"},
        {"date": "2026-04-05", "city": "天津", "name": "2026和平杯第15届青少年国际标准舞精英锦标赛", "source": "TBDF国际标准舞总会"},
        {"date": "2026-04-05", "city": "河北石家庄", "name": "石家庄体育舞蹈公开赛", "source": "精雀赛事"},
        {"date": "2026-04-05", "city": "辽宁辽阳", "name": "辽阳体育舞蹈锦标赛", "source": "精雀赛事"},
        {"date": "2026-04-05", "city": "江苏徐州", "name": "徐州体育舞蹈公开赛", "source": "精雀赛事"},
        {"date": "2026-04-05", "city": "浙江杭州", "name": "中华同心·舞动华夏浙江省队选拔", "source": "精雀赛事"},
        {"date": "2026-04-06", "city": "英国", "name": "WDC世界舞蹈总会世界舞蹈锦标赛", "source": "WDC"},
        {"date": "2026-04-08", "city": "北京", "name": "2026大师杯国际标准舞北京公开赛", "source": "精雀赛事"},
        {"date": "2026-04-18", "city": "广东珠海", "name": "珠海体育舞蹈锦标赛", "source": "精雀赛事"},
        {"date": "2026-04-19", "city": "安徽芜湖", "name": "芜湖体育舞蹈公开赛", "source": "精雀赛事"},
        {"date": "2026-04-22", "city": "广东珠海", "name": "第十届中-拉标准舞/拉丁舞国际锦标赛", "source": "中拉超联"},
        {"date": "2026-04-25", "city": "山东济南", "name": "济南体育舞蹈锦标赛", "source": "精雀赛事"},
        {"date": "2026-04-25", "city": "辽宁营口", "name": "营口体育舞蹈公开赛", "source": "精雀赛事"},
        {"date": "2026-04-25", "city": "上海", "name": "上海春季锦标赛", "source": "精雀赛事"},
        {"date": "2026-04-26", "city": "天津", "name": "天津体育舞蹈公开赛", "source": "精雀赛事"},
        {"date": "2026-04-30", "city": "重庆", "name": "重庆体育舞蹈锦标赛", "source": "精雀赛事"},
        {"date": "2026-05-01", "city": "河南郑州", "name": "2026第六届舞王杯国标舞全国公开赛", "source": "河南省艺术舞蹈协会"},
        {"date": "2026-05-01", "city": "安徽阜阳", "name": "阜阳体育舞蹈公开赛", "source": "精雀赛事"},
        {"date": "2026-05-02", "city": "广东深圳", "name": "深圳体育舞蹈锦标赛", "source": "精雀赛事"},
        {"date": "2026-05-02", "city": "江苏南京", "name": "南京春季公开赛", "source": "精雀赛事"},
        {"date": "2026-05-02", "city": "山西太原", "name": "太原体育舞蹈锦标赛", "source": "精雀赛事"},
        {"date": "2026-05-02", "city": "安徽合肥", "name": "合肥体育舞蹈公开赛", "source": "精雀赛事"},
        {"date": "2026-05-02", "city": "云南大理", "name": "大理体育舞蹈锦标赛", "source": "精雀赛事"},
        {"date": "2026-05-03", "city": "广东深圳", "name": "深圳春季锦标赛", "source": "精雀赛事"},
        {"date": "2026-05-03", "city": "湖北武汉", "name": "武汉体育舞蹈公开赛", "source": "精雀赛事"},
        {"date": "2026-05-03", "city": "江西南昌", "name": "南昌体育舞蹈锦标赛", "source": "精雀赛事"},
        {"date": "2026-05-03", "city": "上海", "name": "上海五月公开赛", "source": "精雀赛事"},
        {"date": "2026-05-03", "city": "广东广州", "name": "广州春季锦标赛", "source": "精雀赛事"},
        {"date": "2026-05-04", "city": "江西九江", "name": "九江体育舞蹈公开赛", "source": "精雀赛事"},
        {"date": "2026-05-04", "city": "山东临沂", "name": "临沂体育舞蹈锦标赛", "source": "精雀赛事"},
        {"date": "2026-05-04", "city": "湖南长沙", "name": "长沙体育舞蹈公开赛", "source": "精雀赛事"},
        {"date": "2026-05-04", "city": "山东曲阜", "name": "曲阜体育舞蹈锦标赛", "source": "精雀赛事"},
        {"date": "2026-05-04", "city": "北京", "name": "北京春季公开赛", "source": "精雀赛事"},
        {"date": "2026-05-17", "city": "河南郑州", "name": "郑州夏季锦标赛", "source": "精雀赛事"},
        {"date": "2026-05-23", "city": "浙江宁波", "name": "宁波体育舞蹈公开赛", "source": "精雀赛事"},
        {"date": "2026-06-06", "city": "江苏南京", "name": "南京夏季公开赛", "source": "精雀赛事"},
        {"date": "2026-06-18", "city": "北京", "name": "2026第四届BOC国际标准舞世界公开赛", "source": "BOC"},
        {"date": "2026-07-07", "city": "香港", "name": "香港夏季体育舞蹈赛", "source": "精雀赛事"},
        {"date": "2026-07-12", "city": "香港", "name": "香港体育舞蹈锦标赛", "source": "精雀赛事"},
        {"date": "2026-07-18", "city": "北京", "name": "北京夏季公开赛", "source": "精雀赛事"},
        {"date": "2026-07-25", "city": "广东佛山", "name": "佛山体育舞蹈锦标赛", "source": "精雀赛事"},
        {"date": "2026-07-26", "city": "澳门", "name": "澳门体育舞蹈公开赛", "source": "精雀赛事"},
        {"date": "2026-08-01", "city": "广东珠海", "name": "珠海夏季锦标赛", "source": "精雀赛事"},
        {"date": "2026-08-01", "city": "辽宁东戴河", "name": "东戴河体育舞蹈公开赛", "source": "精雀赛事"},
        {"date": "2026-08-04", "city": "香港", "name": "香港八月公开赛", "source": "精雀赛事"},
        {"date": "2026-08-07", "city": "福建厦门", "name": "厦门体育舞蹈锦标赛", "source": "精雀赛事"},
        {"date": "2026-08-09", "city": "江苏南京", "name": "南京八月公开赛", "source": "精雀赛事"},
        {"date": "2026-08-09", "city": "山东济南", "name": "济南夏季锦标赛", "source": "精雀赛事"},
        {"date": "2026-08-18", "city": "广东深圳", "name": "2026世界杯国标舞环球巨星公开赛", "source": "精雀赛事"},
        {"date": "2026-11-07", "city": "辽宁大连", "name": "大连体育舞蹈锦标赛", "source": "精雀赛事"},
        {"date": "2026-12-05", "city": "广东珠海", "name": "珠海年终总决赛", "source": "精雀赛事"},
    ]
    
    # 按日期排序
    jingque_data.sort(key=lambda x: x['date'])
    
    # 生成Markdown表格
    md_content = "# 2026年体育舞蹈赛事完整列表\n\n"
    md_content += "**数据来源**: 精雀赛事、中国香港体育舞蹈总会、TBDF、中拉超联、BOC等\n\n"
    md_content += "**整理时间**: 2026年2月25日\n\n"
    md_content += f"**赛事总数**: {len(jingque_data)} 场\n\n"
    md_content += "---\n\n"
    
    # 按月份分组
    months = {}
    for comp in jingque_data:
        month = comp['date'][:7]  # 2026-03
        if month not in months:
            months[month] = []
        months[month].append(comp)
    
    # 生成表格
    for month in sorted(months.keys()):
        month_name = month.replace("2026-", "") + "月"
        md_content += f"## {month_name}赛事\n\n"
        md_content += "| 日期 | 地点 | 比赛名称 | 数据渠道 |\n"
        md_content += "|------|------|----------|----------|\n"
        
        for comp in months[month]:
            city = comp['city']
            # 四川地区标注
            if '四川' in city or '成都' in city:
                city = f"🔥 {city}"
            
            md_content += f"| {comp['date']} | {city} | {comp['name']} | {comp['source']} |\n"
        
        md_content += "\n"
    
    # 保存文件
    with open('/root/.openclaw/workspace/2026年体育舞蹈赛事完整列表.md', 'w', encoding='utf-8') as f:
        f.write(md_content)
    
    # 同时保存JSON
    with open('/root/.openclaw/workspace/2026年体育舞蹈赛事完整列表.json', 'w', encoding='utf-8') as f:
        json.dump({
            'total': len(jingque_data),
            'competitions': jingque_data
        }, f, ensure_ascii=False, indent=2)
    
    print(f"完整赛事列表已生成:")
    print(f"  - Markdown: 2026年体育舞蹈赛事完整列表.md")
    print(f"  - JSON: 2026年体育舞蹈赛事完整列表.json")
    print(f"\n共 {len(jingque_data)} 场赛事")
    
    # 四川地区赛事
    print("\n" + "="*60)
    print("四川地区赛事:")
    print("="*60)
    for comp in jingque_data:
        if '四川' in comp['city'] or '成都' in comp['city']:
            print(f"  🔥 {comp['date']} | {comp['city']} | {comp['name']}")
    
    return md_content

if __name__ == '__main__':
    generate_full_2026_table()
