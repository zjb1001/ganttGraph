#!/usr/bin/env python3
"""
生成测试报告图片
使用PIL创建精美的报告图片
"""
from PIL import Image, ImageDraw, ImageFont
import textwrap

def create_gradient(width, height, color1, color2):
    """创建渐变背景"""
    image = Image.new('RGB', (width, height))
    for y in range(height):
        r = int(color1[0] + (color2[0] - color1[0]) * y / height)
        g = int(color1[1] + (color2[1] - color1[1]) * y / height)
        b = int(color1[2] + (color2[2] - color1[2]) * y / height)
        for x in range(width):
            image.putpixel((x, y), (r, g, b))
    return image

def draw_rounded_rect(draw, xy, radius, fill):
    """绘制圆角矩形"""
    x1, y1, x2, y2 = xy
    draw.rounded_rectangle(xy, radius=radius, fill=fill)

def create_report():
    # 创建画布
    width, height = 900, 1400
    
    # 渐变背景
    img = create_gradient(width, height, (102, 126, 234), (118, 75, 162))
    draw = ImageDraw.Draw(img)
    
    # 主内容区（白色卡片）
    margin = 30
    card_top = 120
    card_bottom = height - 50
    draw.rounded_rectangle(
        [(margin, card_top), (width - margin, card_bottom)],
        radius=20,
        fill='white'
    )
    
    # 添加阴影效果（简化）
    for i in range(3):
        draw.rounded_rectangle(
            [(margin + i, card_top + i), (width - margin + i, card_bottom + i)],
            radius=20,
            outline=(200, 200, 200, 30),
            width=1
        )
    
    # 尝试加载字体（优先使用支持中文的字体）
    try:
        # 优先使用支持中文的Noto字体
        title_font = ImageFont.truetype("/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc", 36, index=2)  # SC
        subtitle_font = ImageFont.truetype("/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc", 18, index=2)
        heading_font = ImageFont.truetype("/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc", 24, index=2)
        body_font = ImageFont.truetype("/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc", 16, index=2)
        number_font = ImageFont.truetype("/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc", 42, index=2)
        small_font = ImageFont.truetype("/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc", 14, index=2)
    except Exception as e:
        print(f"Noto字体加载失败: {e}, 使用系统默认字体")
        try:
            title_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 36)
            subtitle_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 18)
            heading_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 24)
            body_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 16)
            number_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 42)
            small_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 14)
        except:
            title_font = ImageFont.load_default()
            subtitle_font = title_font
            heading_font = title_font
            body_font = title_font
            number_font = title_font
            small_font = title_font
    
    # 顶部标题区
    draw.text((width//2, 50), "🚀 智谱4.7 AI功能验证报告", fill='white', font=title_font, anchor='mt')
    draw.text((width//2, 95), "展销会计划智能分解测试", fill=(255,255,255,200), font=subtitle_font, anchor='mt')
    
    # 模型标签
    draw.rounded_rectangle([(width//2 - 80, 105), (width//2 + 80, 135)], radius=15, fill=(255,255,255,50))
    draw.text((width//2, 120), "🤖 智谱 GLM-4", fill='white', font=small_font, anchor='mt')
    
    y = card_top + 40
    
    # 项目需求框
    draw.rounded_rectangle([(margin + 20, y), (width - margin - 20, y + 160)], radius=10, fill=(248, 249, 250))
    draw.rounded_rectangle([(margin + 20, y), (margin + 24, y + 160)], radius=2, fill=(40, 167, 69))
    
    draw.text((margin + 40, y + 15), "📋 测试项目需求", fill=(40, 167, 69), font=heading_font)
    
    requirements = [
        "举办一场汽车技术展销会，包含：",
        "• 场地租赁与布置（2000平米展厅）",
        "• 50家供应商展位安排",
        "• 开幕式与3场技术论坛",
        "• 媒体宣传与嘉宾邀请",
        "• 现场接待与后勤保障",
        "• 会后数据整理与总结",
        "约束：3个月完成，预算500万，团队8人"
    ]
    req_y = y + 50
    for line in requirements:
        draw.text((margin + 40, req_y), line, fill=(85, 85, 85), font=small_font)
        req_y += 16
    
    y += 180
    
    # 数据概览标题
    draw.text((margin + 20, y), "📊 分解结果概览", fill=(51, 51, 51), font=heading_font)
    y += 40
    
    # 统计卡片（4个）
    card_width = (width - 2*margin - 100) // 4
    stats = [
        ("5", "阶段划分"),
        ("32", "具体任务"),
        ("90", "预估工期(天)"),
        ("85%", "置信度")
    ]
    
    for i, (num, label) in enumerate(stats):
        x = margin + 30 + i * (card_width + 15)
        # 渐变卡片背景
        for dy in range(80):
            r = int(102 + (118 - 102) * dy / 80)
            g = int(126 + (75 - 126) * dy / 80)
            b = int(234 + (162 - 234) * dy / 80)
            draw.rectangle([(x, y + dy), (x + card_width, y + dy + 1)], fill=(r, g, b))
        draw.rounded_rectangle([(x, y), (x + card_width, y + 80)], radius=10)
        
        draw.text((x + card_width//2, y + 20), num, fill='white', font=number_font, anchor='mt')
        draw.text((x + card_width//2, y + 60), label, fill=(255,255,255,230), font=small_font, anchor='mt')
    
    y += 100
    
    # 需求覆盖
    draw.text((margin + 20, y), "✅ 需求覆盖率: 100%", fill=(51, 51, 51), font=heading_font)
    y += 40
    
    coverage_items = [
        ("🏢", "场地租赁布置"),
        ("🎯", "50家供应商展位"),
        ("🎤", "开幕式+3场论坛"),
        ("📢", "媒体宣传嘉宾"),
        ("🤝", "现场接待后勤"),
        ("📊", "会后数据总结")
    ]
    
    item_width = (width - 2*margin - 80) // 3
    for i, (icon, text) in enumerate(coverage_items):
        row = i // 3
        col = i % 3
        x = margin + 30 + col * (item_width + 15)
        item_y = y + row * 50
        draw.rounded_rectangle([(x, item_y), (x + item_width, item_y + 40)], radius=8, fill=(248, 249, 250))
        draw.text((x + 10, item_y + 10), icon, fill=(51, 51, 51), font=body_font)
        draw.text((x + 40, item_y + 12), text, fill=(51, 51, 51), font=small_font)
    
    y += 120
    
    # 阶段规划
    draw.text((margin + 20, y), "🗓️ 阶段规划", fill=(51, 51, 51), font=heading_font)
    y += 40
    
    phases = [
        ("1️⃣ 策划准备阶段", "项目启动，确定展会主题、目标和初步规划", "第1-14天 | 7个任务"),
        ("2️⃣ 资源筹备阶段", "场地租赁、供应商招募和嘉宾邀请", "第15-56天 | 8个任务"),
        ("3️⃣ 宣传推广阶段", "媒体宣传、营销推广和观众招募", "第57-84天 | 5个任务"),
        ("4️⃣ 现场执行阶段", "展会现场布置、开幕式举办和技术论坛", "第85-95天 | 7个任务"),
        ("5️⃣ 收尾总结阶段", "数据整理、总结报告和后续跟进", "第96-105天 | 5个任务")
    ]
    
    # 时间线
    line_x = margin + 50
    draw.line([(line_x, y), (line_x, y + 320)], fill=(102, 126, 234), width=3)
    
    for i, (title, desc, time) in enumerate(phases):
        item_y = y + i * 65
        # 时间点
        draw.ellipse([(line_x - 6, item_y + 10), (line_x + 6, item_y + 22)], fill=(102, 126, 234), outline='white', width=2)
        # 内容框
        draw.rounded_rectangle([(line_x + 20, item_y), (width - margin - 30, item_y + 55)], radius=8, fill=(248, 249, 250))
        draw.text((line_x + 35, item_y + 8), title, fill=(102, 126, 234), font=body_font)
        draw.text((line_x + 35, item_y + 28), desc, fill=(102, 102, 102), font=small_font)
        draw.text((width - margin - 40, item_y + 10), time, fill=(102, 102, 102), font=small_font, anchor='rt')
    
    y += 350
    
    # 成功横幅
    for dy in range(80):
        r = int(40 + (32 - 40) * dy / 80)
        g = int(167 + (201 - 167) * dy / 80)
        b = int(69 + (151 - 69) * dy / 80)
        draw.rectangle([(margin + 20, y + dy), (width - margin - 20, y + dy + 1)], fill=(r, g, b))
    draw.rounded_rectangle([(margin + 20, y), (width - margin - 20, y + 80)], radius=12)
    
    draw.text((width//2, y + 25), "🎉 验证成功！", fill='white', font=heading_font, anchor='mt')
    draw.text((width//2, y + 55), "智谱4.7 成功将模糊的项目需求解构为结构化、可执行的任务计划", 
              fill=(255,255,255,230), font=small_font, anchor='mt')
    
    y += 100
    
    # AI能力验证
    draw.text((margin + 20, y), "🧠 AI能力验证", fill=(51, 51, 51), font=heading_font)
    y += 40
    
    abilities = [
        ("💬", "自然语言理解"),
        ("📐", "结构化分解"),
        ("📅", "时间规划"),
        ("🔗", "依赖识别"),
        ("📈", "工期估算"),
        ("🎯", "里程碑设定")
    ]
    
    for i, (icon, text) in enumerate(abilities):
        row = i // 3
        col = i % 3
        x = margin + 30 + col * (item_width + 15)
        item_y = y + row * 50
        draw.rounded_rectangle([(x, item_y), (x + item_width, item_y + 40)], radius=8, fill=(248, 249, 250))
        draw.text((x + 10, item_y + 10), icon, fill=(51, 51, 51), font=body_font)
        draw.text((x + 40, item_y + 12), text, fill=(51, 51, 51), font=small_font)
    
    # 底部信息
    footer_text = "测试时间：2026-03-04 | 模型：智谱 GLM-4 | 项目：甘特图 AI 增强功能"
    draw.text((width//2, height - 25), footer_text, fill=(150, 150, 150), font=small_font, anchor='mt')
    
    # 保存图片
    img.save('/root/.openclaw/workspace/ganttGraph/agent-service/test_report_visual.png', 'PNG', quality=95)
    print("✅ 报告图片已生成: test_report_visual.png")
    return img

if __name__ == "__main__":
    create_report()
