#!/usr/bin/env python3
"""
生成制动系统开发计划报告图片
"""
from PIL import Image, ImageDraw, ImageFont
from datetime import datetime

def create_gradient(width, height, color1, color2, horizontal=False):
    """创建渐变背景"""
    image = Image.new('RGB', (width, height))
    for y in range(height):
        if horizontal:
            for x in range(width):
                r = int(color1[0] + (color2[0] - color1[0]) * x / width)
                g = int(color1[1] + (color2[1] - color1[1]) * x / width)
                b = int(color1[2] + (color2[2] - color1[2]) * x / width)
                image.putpixel((x, y), (r, g, b))
        else:
            r = int(color1[0] + (color2[0] - color1[0]) * y / height)
            g = int(color1[1] + (color2[1] - color1[1]) * y / height)
            b = int(color1[2] + (color2[2] - color1[2]) * y / height)
            for x in range(width):
                image.putpixel((x, y), (r, g, b))
    return image

def create_braking_report():
    # 创建长图
    width, height = 900, 2000
    
    # 深色背景渐变
    img = create_gradient(width, height, (26, 26, 46), (22, 33, 62))
    draw = ImageDraw.Draw(img)
    
    # 加载字体
    try:
        title_font = ImageFont.truetype("/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc", 36, index=2)
        heading_font = ImageFont.truetype("/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc", 24, index=2)
        body_font = ImageFont.truetype("/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc", 16, index=2)
        number_font = ImageFont.truetype("/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc", 42, index=2)
        small_font = ImageFont.truetype("/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc", 14, index=2)
        tag_font = ImageFont.truetype("/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc", 12, index=2)
    except:
        title_font = ImageFont.load_default()
        heading_font = title_font
        body_font = title_font
        number_font = title_font
        small_font = title_font
        tag_font = title_font
    
    # 顶部渐变标题区
    header_height = 180
    for y in range(header_height):
        r = int(230 + (247 - 230) * y / header_height)
        g = int(57 + (127 - 57) * y / header_height)
        b = int(70 + (0 - 70) * y / header_height)
        for x in range(width):
            img.putpixel((x, y), (r, g, b))
    
    # 标题
    draw.text((width//2, 50), "🚗 整车制动系统开发计划", fill='white', font=title_font, anchor='mt')
    draw.text((width//2, 95), "AI智能任务分解报告", fill=(255,255,255,200), font=body_font, anchor='mt')
    
    # 标签
    tags = ["🤖 智谱 GLM-4", "⚡ ASIL-D 功能安全", "🔧 汽车电子"]
    tag_x = width//2 - 180
    for tag in tags:
        draw.rounded_rectangle([(tag_x, 125), (tag_x + 120, 155)], radius=15, fill=(255,255,255,50))
        draw.text((tag_x + 60, 140), tag, fill='white', font=tag_font, anchor='mt')
        tag_x += 130
    
    y = header_height + 30
    margin = 40
    
    # 项目需求卡片
    card_h = 220
    draw.rounded_rectangle([(margin, y), (width - margin, y + card_h)], radius=16, fill='white')
    
    # 卡片标题
    draw.text((margin + 20, y + 15), "📋 项目需求", fill=(26, 26, 46), font=heading_font)
    draw.rectangle([(margin + 20, y + 50), (margin + 24, y + 200)], fill=(230, 57, 70))
    
    # 需求内容
    requirements = [
        "开发一套完整的整车电子制动系统（EBS）",
        "▸ 主控制器：基于AUTOSAR架构的BCU",
        "▸ 传感器：轮速、踏板位置、压力传感器",
        "▸ 执行机构：ESC模块、ABS阀体、EPB电机",
        "▸ 核心功能：ABS、EBD、ESC、EPB、Autohold",
        "▸ 技术要求：ASIL-D、ISO 26262、响应<200ms",
        "▸ 周期：18个月 | 团队：15人 | 预算：2000万"
    ]
    
    req_y = y + 60
    for i, line in enumerate(requirements):
        if i == 0:
            draw.text((margin + 35, req_y), line, fill=(230, 57, 70), font=body_font)
            req_y += 25
        else:
            draw.text((margin + 35, req_y), line, fill=(85, 85, 85), font=small_font)
            req_y += 20
    
    y += card_h + 25
    
    # 核心数据卡片
    card_h = 150
    draw.rounded_rectangle([(margin, y), (width - margin, y + card_h)], radius=16, fill='white')
    draw.text((margin + 20, y + 15), "📊 分解结果", fill=(26, 26, 46), font=heading_font)
    
    # 统计数字
    stats = [("7", "开发阶段"), ("28", "技术任务"), ("540", "工期(天)"), ("85%", "置信度")]
    stat_width = (width - 2*margin - 60) // 4
    
    for i, (num, label) in enumerate(stats):
        x = margin + 30 + i * stat_width
        # 深色统计卡片
        for dy in range(80):
            r = int(26 + (22 - 26) * dy / 80)
            g = int(26 + (33 - 26) * dy / 80)
            b = int(46 + (62 - 46) * dy / 80)
            draw.rectangle([(x, y + 50 + dy), (x + stat_width - 15, y + 50 + dy + 1)], fill=(r, g, b))
        draw.rounded_rectangle([(x, y + 50), (x + stat_width - 15, y + 130)], radius=10)
        
        draw.text((x + (stat_width-15)//2, y + 70), num, fill=(247, 127, 0), font=number_font, anchor='mt')
        draw.text((x + (stat_width-15)//2, y + 115), label, fill=(255,255,255,230), font=small_font, anchor='mt')
    
    y += card_h + 25
    
    # 技术覆盖卡片
    card_h = 180
    draw.rounded_rectangle([(margin, y), (width - margin, y + card_h)], radius=16, fill='white')
    draw.text((margin + 20, y + 15), "🔍 技术要素覆盖: 88%", fill=(26, 26, 46), font=heading_font)
    
    coverage = [
        ("🏗️", "系统架构", True), ("📡", "传感器系统", True),
        ("⚙️", "执行机构", True), ("🌐", "通信网络", True),
        ("🎯", "功能开发", True), ("🛡️", "功能安全", True),
        ("🧪", "测试验证", True), ("⚡", "系统标定", False)
    ]
    
    item_width = (width - 2*margin - 60) // 4
    for i, (icon, text, covered) in enumerate(coverage):
        row = i // 4
        col = i % 4
        x = margin + 30 + col * item_width
        item_y = y + 55 + row * 55
        
        bg_color = (212, 237, 218) if covered else (248, 249, 250)
        border_color = (40, 167, 69) if covered else (221, 221, 221)
        
        draw.rounded_rectangle([(x, item_y), (x + item_width - 15, item_y + 45)], radius=8, fill=bg_color)
        draw.rounded_rectangle([(x, item_y), (x + item_width - 15, item_y + 45)], radius=8, outline=border_color, width=2)
        
        draw.text((x + 8, item_y + 10), icon, fill=(51, 51, 51), font=body_font)
        draw.text((x + 38, item_y + 15), text, fill=(51, 51, 51), font=small_font)
    
    y += card_h + 25
    
    # 阶段规划卡片
    phases = [
        ("1️⃣ 需求分析与架构设计", "第1-35天", "系统需求分析、AUTOSAR架构设计、通信网络设计和功能安全需求定义"),
        ("2️⃣ 硬件设计与开发", "第36-85天", "硬件架构设计、传感器与执行机构电路设计、PCB布局和原型制作"),
        ("3️⃣ 底层软件开发", "第86-145天", "底层驱动开发、AUTOSAR基础软件移植、通信栈开发和HIL测试环境搭建"),
        ("4️⃣ 功能算法开发", "第146-265天", "ABS、EBD、ESC、EPB、Autohold核心算法开发和故障诊断策略实现"),
        ("5️⃣ 系统集成与测试", "第266-360天", "软硬件集成、功能测试、性能测试、硬件在环测试和实车测试"),
        ("6️⃣ 安全验证与认证", "第361-435天", "HARA分析、安全机制设计、安全案例开发和功能安全认证准备"),
        ("7️⃣ 系统优化与量产准备", "第436-540天", "系统优化、EMC测试、OTA开发、产线测试工装开发和量产准备")
    ]
    
    card_h = 90 + len(phases) * 110
    draw.rounded_rectangle([(margin, y), (width - margin, y + card_h)], radius=16, fill='white')
    draw.text((margin + 20, y + 15), "🗓️ 开发阶段规划", fill=(26, 26, 46), font=heading_font)
    
    # 时间线
    line_x = margin + 40
    line_y_start = y + 60
    line_y_end = y + card_h - 30
    draw.line([(line_x, line_y_start), (line_x, line_y_end)], fill=(230, 57, 70), width=3)
    
    for i, (title, time, desc) in enumerate(phases):
        item_y = y + 60 + i * 105
        
        # 时间点
        draw.ellipse([(line_x - 7, item_y + 5), (line_x + 7, item_y + 19)], fill=(230, 57, 70), outline='white', width=2)
        
        # 内容区
        draw.rounded_rectangle([(line_x + 20, item_y), (width - margin - 20, item_y + 90)], radius=10, fill=(248, 249, 250))
        
        # 标题和时间
        draw.text((line_x + 35, item_y + 10), title, fill=(26, 26, 46), font=body_font)
        draw.text((width - margin - 30, item_y + 12), time, fill=(102, 102, 102), font=small_font, anchor='rt')
        
        # 描述
        # 截断描述以适应空间
        desc_short = desc[:55] + "..." if len(desc) > 55 else desc
        draw.text((line_x + 35, item_y + 40), desc_short, fill=(102, 102, 102), font=small_font)
    
    y += card_h + 25
    
    # 关键里程碑卡片
    milestones = [
        ("需求分析与架构设计完成", "第35天", (230, 57, 70)),
        ("硬件原型完成", "第85天", (247, 127, 0)),
        ("底层软件完成", "第145天", (247, 127, 0)),
        ("功能算法开发完成", "第265天", (230, 57, 70)),
        ("系统集成与测试完成", "第360天", (247, 127, 0)),
        ("安全验证完成", "第435天", (230, 57, 70))
    ]
    
    card_h = 200
    draw.rounded_rectangle([(margin, y), (width - margin, y + card_h)], radius=16, fill='white')
    draw.text((margin + 20, y + 15), "🎯 关键里程碑", fill=(26, 26, 46), font=heading_font)
    
    ms_width = (width - 2*margin - 50) // 2
    for i, (title, day, color) in enumerate(milestones):
        row = i // 2
        col = i % 2
        x = margin + 25 + col * (ms_width + 15)
        ms_y = y + 55 + row * 65
        
        draw.rounded_rectangle([(x, ms_y), (x + ms_width, ms_y + 55)], radius=8, fill=(248, 249, 250))
        draw.rectangle([(x, ms_y), (x + 4, ms_y + 55)], fill=color)
        
        draw.text((x + 15, ms_y + 10), title, fill=(26, 26, 46), font=body_font)
        draw.text((x + 15, ms_y + 32), day, fill=(102, 102, 102), font=small_font)
    
    y += card_h + 25
    
    # 最终里程碑（项目交付）
    draw.rounded_rectangle([(margin, y), (width - margin, y + 70)], radius=12, 
                           fill=(5, 150, 105))
    draw.text((width//2, y + 20), "🎉 系统优化与量产准备完成", fill='white', font=heading_font, anchor='mt')
    draw.text((width//2, y + 48), "第540天 - 项目交付", fill=(255,255,255,230), font=body_font, anchor='mt')
    
    y += 100
    
    # 成功横幅
    banner_h = 100
    for dy in range(banner_h):
        r = int(5 + (16 - 5) * dy / banner_h)
        g = int(150 + (185 - 150) * dy / banner_h)
        b = int(105 + (129 - 105) * dy / banner_h)
        draw.rectangle([(margin, y + dy), (width - margin, y + dy + 1)], fill=(r, g, b))
    draw.rounded_rectangle([(margin, y), (width - margin, y + banner_h)], radius=16)
    
    draw.text((width//2, y + 30), "🎉 专业技术项目分解成功!", fill='white', font=heading_font, anchor='mt')
    draw.text((width//2, y + 65), "智谱4.7 成功将复杂的汽车电子制动系统开发需求解构为结构化计划", 
              fill=(255,255,255,230), font=small_font, anchor='mt')
    
    y += banner_h + 30
    
    # Footer
    footer_text = "测试时间：2026-03-04 | 模型：智谱 GLM-4 | 项目：整车制动系统开发"
    draw.text((width//2, y), footer_text, fill=(150, 150, 150), font=small_font, anchor='mt')
    
    # 裁剪到实际高度
    img = img.crop((0, 0, width, y + 50))
    
    # 保存
    img.save('/root/.openclaw/workspace/ganttGraph/agent-service/braking_system_report.png', 'PNG', quality=95)
    print("✅ 制动系统开发计划报告图片已生成: braking_system_report.png")
    return img

if __name__ == "__main__":
    create_braking_report()
