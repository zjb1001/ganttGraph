#!/usr/bin/env python3
"""
智谱4.7 专业技术项目测试 - 整车制动系统开发
验证AI对汽车电子/嵌入式领域技术项目的分解能力
"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from datetime import datetime

print("🚀 智谱4.7 专业技术项目测试")
print("=" * 70)
print(f"模型: {os.getenv('LLM_MODEL')}")
print(f"测试项目: 整车制动系统开发")
print(f"时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("=" * 70)

from enhanced_ai_service import LLMClient, TaskDecomposer, DecomposeRequest

llm = LLMClient()
decomposer = TaskDecomposer(llm)

# 整车制动系统开发项目需求（专业技术项目）
braking_goal = """开发一套完整的整车电子制动系统（EBS），包含：

【系统架构】
- 主控制器：基于AUTOSAR架构的制动控制单元（BCU）
- 传感器系统：轮速传感器、制动踏板位置传感器、压力传感器
- 执行机构：ESC模块、ABS阀体、EPB电机驱动
- 通信网络：CAN-FD总线、FlexRay骨干网

【功能需求】
- ABS防抱死功能
- EBD电子制动力分配
- ESC车身电子稳定控制
- EPB电子驻车制动
- Autohold自动驻车
- 跛行回家（Limp Home）模式
- 故障诊断与跛行模式

【技术要求】
- ASIL-D功能安全等级
- 符合ISO 26262、ISO 21434标准
- 制动响应时间 < 200ms
- 故障覆盖率 > 99%
- 支持OTA升级

【团队与周期】
- 团队15人（系统工程师、算法工程师、嵌入式开发、测试工程师）
- 开发周期18个月
- 预算2000万"""

print("\n📋 项目需求：")
for line in braking_goal.split('\n'):
    if line.strip():
        print(f"   {line}")

request = DecomposeRequest(
    goal=braking_goal,
    start_date=datetime.now().strftime("%Y-%m-%d"),
    team_size=15,
    complexity="high"
)

print("\n🤖 智谱4.7 正在分析技术项目并分解任务...")
print("   (汽车电子专业项目，可能需要20-40秒)")

result = decomposer.decompose(request)

if result.success:
    print(f"\n{'='*70}")
    print(f"✅ 制动系统开发项目分解成功！")
    print(f"{'='*70}")
    
    print(f"\n📊 分解概览:")
    print(f"   • {result.message}")
    print(f"   • 预估工期: {result.estimated_duration_days}天 ({result.estimated_duration_days//30}个月)")
    print(f"   • 置信度: {result.confidence * 100:.0f}%")
    
    print(f"\n📌 阶段规划 ({len(result.phases)}个):")
    for i, phase in enumerate(result.phases, 1):
        print(f"\n   {i}. {phase['name']}")
        if phase.get('description'):
            desc = phase['description'][:60] + '...' if len(phase['description']) > 60 else phase['description']
            print(f"      {desc}")
    
    print(f"\n📋 关键任务 ({len(result.tasks)}个):")
    
    # 按阶段分组显示关键任务
    current_phase = None
    task_count = 0
    for task in result.tasks:
        if task['phase'] != current_phase:
            if task_count >= 15:  # 只显示前15个任务
                print(f"\n      ... 还有 {len(result.tasks) - task_count} 个任务")
                break
            current_phase = task['phase']
            print(f"\n   【{current_phase}】")
        
        if task_count < 15:
            duration = (datetime.strptime(task['end_date'], '%Y-%m-%d') - 
                       datetime.strptime(task['start_date'], '%Y-%m-%d')).days + 1
            
            priority = task.get('priority', 'Normal')
            priority_icon = {'Urgent': '🔴', 'Important': '🟠', 'Normal': '⚪', 'Low': '🔵'}.get(priority, '⚪')
            
            print(f"      {priority_icon} {task['title']}")
            print(f"         📅 {task['start_date']} ~ {task['end_date']} ({duration}天)")
            if task.get('dependencies'):
                print(f"         🔗 依赖: {', '.join(task['dependencies'][:3])}")
            task_count += 1
    
    print(f"\n🎯 关键里程碑 ({len(result.milestones)}个):")
    for i, ms in enumerate(result.milestones, 1):
        print(f"   {i}. {ms['title']} (第{ms['date_offset_days']}天)")
        if ms.get('description'):
            desc = ms['description'][:50] + '...' if len(ms['description']) > 50 else ms['description']
            print(f"      {desc}")
    
    # 技术分析：检查是否覆盖了汽车电子开发的关键要素
    print(f"\n{'='*70}")
    print(f"🔍 技术项目覆盖分析:")
    print(f"{'='*70}")
    
    tech_aspects = {
        '系统架构': ['架构', '控制器', 'BCU', '硬件'],
        '传感器': ['传感器', '轮速', '踏板', '压力'],
        '执行机构': ['执行', 'ESC', 'ABS', '阀体', '电机'],
        '通信网络': ['通信', 'CAN', 'FlexRay', '总线'],
        '功能开发': ['功能', 'ABS', 'EBD', 'ESC', 'EPB'],
        '功能安全': ['安全', 'ASIL', 'ISO 26262', '故障'],
        '测试验证': ['测试', '验证', 'HIL', '实车'],
        '标定': ['标定', '参数', '匹配'],
    }
    
    coverage_results = {}
    for aspect, keywords in tech_aspects.items():
        covered = any(
            any(kw in t['title'].upper() or kw in t.get('description', '').upper() 
                for kw in keywords)
            for t in result.tasks
        )
        coverage_results[aspect] = covered
    
    print("\n   技术要素覆盖检查:")
    for aspect, covered in coverage_results.items():
        status = "✅" if covered else "❌"
        print(f"      {status} {aspect}")
    
    coverage_rate = sum(coverage_results.values()) / len(coverage_results) * 100
    print(f"\n   技术覆盖率: {coverage_rate:.0f}%")
    
    if coverage_rate >= 80:
        print(f"\n   🎉 优秀！AI成功覆盖了汽车电子开发的核心技术要素")
    elif coverage_rate >= 60:
        print(f"\n   👍 良好！覆盖了主要技术点，部分专业领域可补充")
    else:
        print(f"\n   ⚠️ 一般！建议补充遗漏的关键技术环节")
    
    # 输出详细任务列表示例
    print(f"\n{'='*70}")
    print(f"📄 完整任务列表示例:")
    print(f"{'='*70}")
    
    # 找出具有代表性的任务
    sample_tasks = []
    phases_seen = set()
    for task in result.tasks:
        if task['phase'] not in phases_seen and len(sample_tasks) < 6:
            sample_tasks.append(task)
            phases_seen.add(task['phase'])
    
    for i, task in enumerate(sample_tasks, 1):
        print(f"\n   任务{i}: {task['title']}")
        print(f"   阶段: {task['phase']}")
        print(f"   时间: {task['start_date']} ~ {task['end_date']}")
        print(f"   优先级: {task.get('priority', 'Normal')}")
        if task.get('dependencies'):
            print(f"   依赖: {', '.join(task['dependencies'])}")

else:
    print(f"\n❌ 分解失败: {result.message}")

print(f"\n{'='*70}")
print("✨ 整车制动系统开发 - AI分解测试完成!")
print(f"{'='*70}")
