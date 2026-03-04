#!/usr/bin/env python3
"""
智谱4.7 展销会计划分解测试
验证AI解构项目需求的能力
"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from datetime import datetime

print("🚀 智谱4.7 AI功能验证 - 展销会计划分解")
print("=" * 60)
print(f"模型: {os.getenv('LLM_MODEL')}")
print(f"时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("=" * 60)

# 测试：展销会计划分解
print("\n📝 测试目标：解构展销会项目需求")
print("-" * 60)

from enhanced_ai_service import LLMClient, TaskDecomposer, DecomposeRequest

llm = LLMClient()
decomposer = TaskDecomposer(llm)

# 展销会项目需求
exhibition_goal = """举办一场汽车技术展销会，包括：
- 场地租赁与布置（2000平米展厅）
- 50家供应商展位安排
- 开幕式与3场技术论坛
- 媒体宣传与嘉宾邀请
- 现场接待与后勤保障
- 会后数据整理与总结

要求：3个月内完成筹备，预算500万，团队8人"""

print("\n📋 项目需求：")
for line in exhibition_goal.split('\n'):
    print(f"   {line}")

request = DecomposeRequest(
    goal=exhibition_goal,
    start_date=datetime.now().strftime("%Y-%m-%d"),
    deadline="2025-06-01",  # 3个月期限
    team_size=8,
    complexity="high"
)

print("\n🤖 智谱4.7 正在分析并分解任务...")
print("   (这可能需要15-30秒)")

result = decomposer.decompose(request)

if result.success:
    print(f"\n{'='*60}")
    print(f"✅ 任务分解成功！")
    print(f"{'='*60}")
    
    print(f"\n📊 分解概览:")
    print(f"   • {result.message}")
    print(f"   • 预估工期: {result.estimated_duration_days}天")
    print(f"   • 置信度: {result.confidence * 100:.0f}%")
    
    print(f"\n📌 阶段规划 ({len(result.phases)}个):")
    for i, phase in enumerate(result.phases, 1):
        print(f"\n   {i}. {phase['name']}")
        if phase.get('description'):
            print(f"      {phase['description']}")
    
    print(f"\n📋 详细任务 ({len(result.tasks)}个):")
    current_phase = None
    for i, task in enumerate(result.tasks, 1):
        # 按阶段分组显示
        if task['phase'] != current_phase:
            current_phase = task['phase']
            print(f"\n   【{current_phase}】")
        
        duration = (datetime.strptime(task['end_date'], '%Y-%m-%d') - 
                   datetime.strptime(task['start_date'], '%Y-%m-%d')).days + 1
        
        priority = task.get('priority', 'Normal')
        priority_icon = {'Urgent': '🔴', 'Important': '🟠', 'Normal': '⚪', 'Low': '🔵'}.get(priority, '⚪')
        
        print(f"      {i}. {priority_icon} {task['title']}")
        print(f"         📅 {task['start_date']} ~ {task['end_date']} ({duration}天)")
        if task.get('dependencies'):
            print(f"         🔗 依赖: {', '.join(task['dependencies'])}")
    
    print(f"\n🎯 关键里程碑 ({len(result.milestones)}个):")
    for ms in result.milestones:
        print(f"   • {ms['title']} (第{ms['date_offset_days']}天)")
        if ms.get('description'):
            print(f"     {ms['description']}")
    
    # 分析结果质量
    print(f"\n{'='*60}")
    print(f"📊 分解质量评估:")
    print(f"{'='*60}")
    
    # 检查是否覆盖了需求中的所有要素
    coverage_checks = {
        '场地': any('场地' in t['title'] or '展厅' in t['title'] for t in result.tasks),
        '展位': any('展位' in t['title'] or '供应商' in t['title'] for t in result.tasks),
        '论坛': any('论坛' in t['title'] or '技术' in t['title'] for t in result.tasks),
        '宣传': any('宣传' in t['title'] or '媒体' in t['title'] for t in result.tasks),
        '接待': any('接待' in t['title'] or '后勤' in t['title'] for t in result.tasks),
        '总结': any('总结' in t['title'] or '数据' in t['title'] for t in result.tasks),
    }
    
    print("\n   需求覆盖检查:")
    for aspect, covered in coverage_checks.items():
        status = "✅" if covered else "❌"
        print(f"      {status} {aspect}")
    
    coverage_rate = sum(coverage_checks.values()) / len(coverage_checks) * 100
    print(f"\n   整体覆盖率: {coverage_rate:.0f}%")
    
    if coverage_rate >= 80:
        print(f"\n   🎉 优秀！AI成功解构了大部分项目需求")
    elif coverage_rate >= 60:
        print(f"\n   👍 良好！覆盖了主要需求，部分细节可补充")
    else:
        print(f"\n   ⚠️ 一般！建议补充遗漏的关键要素")

else:
    print(f"\n❌ 分解失败: {result.message}")

print(f"\n{'='*60}")
print("✨ 智谱4.7 AI功能验证完成!")
print(f"{'='*60}")
