#!/usr/bin/env python3
"""
生成赛事数据HTML表格并转换为图片
"""

import json

def generate_html_table():
    # 读取数据
    with open('/root/.openclaw/workspace/2026年体育舞蹈赛事数据库_v2.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    competitions = data['competitions']
    
    # 按月份分组
    months = {}
    for comp in competitions:
        month = comp['date'][:7] if len(comp['date']) >= 7 else comp['date']
        if month not in months:
            months[month] = []
        months[month].append(comp)
    
    # 生成HTML
    html = """<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
body { font-family: Arial, sans-serif; margin: 20px; }
h1 { color: #333; text-align: center; }
h2 { color: #4472C4; margin-top: 30px; }
table { border-collapse: collapse; width: 100%; margin: 10px 0; }
th { background-color: #4472C4; color: white; padding: 10px; text-align: left; }
td { border: 1px solid #ddd; padding: 8px; }
tr:nth-child(even) { background-color: #f2f2f2; }
.highlight { background-color: #FFE699; }
.source { font-size: 12px; color: #666; }
</style>
</head>
<body>
<h1>2026年体育舞蹈赛事数据库</h1>
<p style="text-align: center;">数据来源: 精雀赛事、蓝舞者、中国香港体育舞蹈总会、TBDF、中拉超联、河南省艺术舞蹈协会、BOC官网、WDC等</p>
<p style="text-align: center;">赛事总数: 61场 | 整理时间: 2026年2月25日</p>
"""
    
    # 按月份生成表格
    sorted_months = sorted(months.keys())
    for month in sorted_months:
        month_display = month.replace("2026-", "") + "月" if "2026-" in month else month
        html += f"<h2>{month_display}赛事 ({len(months[month])}场)</h2>"
        html += "<table>"
        html += "<tr><th>日期</th><th>地点</th><th>比赛名称</th><th>数据渠道</th></tr>"
        
        for comp in months[month]:
            city = comp['city']
            highlight_class = "highlight" if '四川' in city or '成都' in city else ""
            html += f"<tr class='{highlight_class}'>"
            html += f"<td>{comp['date']}</td>"
            html += f"<td>{city}</td>"
            html += f"<td>{comp['name']}</td>"
            html += f"<td class='source'>{comp['source']}</td>"
            html += "</tr>"
        
        html += "</table>"
    
    html += "</body></html>"
    
    # 保存HTML
    html_path = '/root/.openclaw/workspace/2026年体育舞蹈赛事数据库.html'
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html)
    
    print(f"HTML文件已生成: {html_path}")
    return html_path

if __name__ == '__main__':
    generate_html_table()
