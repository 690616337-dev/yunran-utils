#!/usr/bin/env python3
"""
使用飞书API直接写入文档内容
"""

import json
import requests

def write_to_feishu_doc():
    # 读取数据
    with open('/root/.openclaw/workspace/2026年体育舞蹈赛事数据库_v2.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    competitions = data['competitions']
    
    # 构建文档内容
    content = "# 2026年体育舞蹈赛事数据库（含蓝舞者渠道）\n\n"
    content += "**数据来源**: 精雀赛事、蓝舞者、中国香港体育舞蹈总会、TBDF、中拉超联、河南省艺术舞蹈协会、BOC官网、WDC等\n\n"
    content += "**整理时间**: 2026年2月25日\n\n"
    content += f"**赛事总数**: {len(competitions)} 场\n\n"
    content += "---\n\n"
    
    # 按月份分组
    months = {}
    for comp in competitions:
        month = comp['date'][:7] if len(comp['date']) >= 7 else comp['date']
        if month not in months:
            months[month] = []
        months[month].append(comp)
    
    # 生成内容
    for month in sorted(months.keys()):
        month_display = month.replace("2026-", "") + "月" if "2026-" in month else month
        content += f"## {month_display}赛事 ({len(months[month])}场)\n\n"
        
        for i, comp in enumerate(months[month], 1):
            city = comp['city']
            highlight = "🔥 " if '四川' in city or '成都' in city else ""
            content += f"{i}. **{comp['date']}** | {highlight}{city} | {comp['name']} | *{comp['source']}*\n"
        
        content += "\n"
    
    # 数据来源统计
    content += "---\n\n"
    content += "## 数据来源统计\n\n"
    source_count = {}
    for comp in competitions:
        source = comp['source']
        source_count[source] = source_count.get(source, 0) + 1
    
    for source, count in sorted(source_count.items(), key=lambda x: -x[1]):
        content += f"- {source}: {count}场\n"
    
    content += "\n---\n\n"
    content += "**四川地区赛事**: 2026-03-28 四川成都 - 成都体育舞蹈锦标赛 🔥\n"
    
    # 保存为Markdown文件
    md_path = '/root/.openclaw/workspace/2026年体育舞蹈赛事数据库_完整版.md'
    with open(md_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"Markdown文件已生成: {md_path}")
    print(f"总字数: {len(content)}")
    
    return content

if __name__ == '__main__':
    write_to_feishu_doc()
