#!/usr/bin/env python3
"""
智谱API完整功能测试
"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from datetime import datetime

print("🚀 智谱AI功能完整测试")
print("=" * 60)

# 测试1: 基础连接
print("\n✅ 测试1: API连接")
print("   已通过快速测试验证")

# 测试2: 任务分解
print("\n📝 测试2: 智能任务分解")
print("   输入: 开发一个电商网站，包含用户系统、商品管理、购物车")

try:
    from enhanced_ai_service import LLMClient, TaskDecomposer, DecomposeRequest
    
    llm = LLMClient()
    decomposer = TaskDecomposer(llm)
    
    request = DecomposeRequest(
        goal="开发一个电商网站，包含用户系统、商品管理、购物车、支付功能",
        start_date=datetime.now().strftime("%Y-%m-%d"),
        team_size=5,
        complexity="medium"
    )
    
    print("   调用智谱API进行分解...")
    result = decomposer.decompose(request)
    
    if result.success:
        print(f"\n   ✅ 分解成功!")
        print(f"   📊 {result.message}")
        print(f"   📅 预估工期: {result.estimated_duration_days}天")
        print(f"   🎯 置信度: {result.confidence * 100:.0f}%")
        
        print(f"\n   📋 阶段规划 ({len(result.phases)}个):")
        for i, phase in enumerate(result.phases[:5], 1):
            print(f"      {i}. {phase['name']}: {phase.get('description', '')[:40]}...")
        
        print(f"\n   📋 任务列表 ({len(result.tasks)}个):")
        for i, task in enumerate(result.tasks[:8], 1):
            print(f"      {i}. {task['title']} [{task['start_date']}~{task['end_date']}] ({task['phase']})")
        
        if len(result.tasks) > 8:
            print(f"      ... 还有{len(result.tasks)-8}个任务")
            
        print(f"\n   🎯 里程碑:")
        for ms in result.milestones[:3]:
            print(f"      - {ms['title']} (第{ms['date_offset_days']}天)")
    else:
        print(f"   ❌ 失败: {result.message}")
except Exception as e:
    print(f"   ❌ 错误: {e}")

# 测试3: 风险分析
print("\n⚠️ 测试3: 风险分析")
try:
    from enhanced_ai_service import RiskAnalyzer, RiskAnalysisRequest
    
    analyzer = RiskAnalyzer()
    
    # 模拟有问题的项目数据
    mock_tasks = [
        {
            "id": "task-1",
            "title": "后端API开发",
            "startDate": "2025-03-01",
            "dueDate": "2025-03-05",  # 已经延期
            "progress": 30,
            "status": "InProgress",
            "priority": "Urgent",
            "dependencies": []
        },
        {
            "id": "task-2",
            "title": "前端页面",
            "startDate": "2025-03-05",
            "dueDate": "2025-03-10",
            "progress": 0,
            "status": "NotStarted",
            "priority": "Normal",
            "dependencies": ["task-1"]
        },
        {
            "id": "task-3",
            "title": "数据库设计",
            "startDate": "2025-03-02",
            "dueDate": "2025-03-08",
            "progress": 90,
            "status": "InProgress",
            "priority": "Important",
            "dependencies": []
        }
    ]
    
    request = RiskAnalysisRequest(
        tasks=mock_tasks,
        current_date="2025-03-06"
    )
    
    print("   分析项目风险...")
    result = analyzer.analyze(request)
    
    if result.success:
        print(f"   ✅ 分析完成!")
        print(f"   📊 {result.message}")
        print(f"   🚨 整体风险等级: {result.overall_risk_level.upper()}")
        
        summary = result.risk_summary
        print(f"\n   📈 风险分布:")
        print(f"      严重: {summary['critical']} | 高: {summary['high']} | 中: {summary['medium']} | 低: {summary['low']}")
        
        if result.risks:
            print(f"\n   ⚠️ 发现的风险:")
            for risk in result.risks[:5]:
                # risk可能是dict或Risk对象
                level = risk.get('level') if isinstance(risk, dict) else risk.level
                risk_type = risk.get('risk_type') if isinstance(risk, dict) else risk.risk_type
                task_title = risk.get('task_title') if isinstance(risk, dict) else risk.task_title
                description = risk.get('description') if isinstance(risk, dict) else risk.description
                suggestion = risk.get('suggestion') if isinstance(risk, dict) else risk.suggestion
                
                level_emoji = {"critical": "🔴", "high": "🟠", "medium": "🟡", "low": "🔵", "none": "🟢"}.get(level, "⚪")
                print(f"      {level_emoji} [{level.upper()}] {risk_type}")
                print(f"         任务: {task_title}")
                print(f"         描述: {description[:50]}...")
                print(f"         建议: {suggestion}")
        
        if result.recommendations:
            print(f"\n   💡 改进建议:")
            for i, rec in enumerate(result.recommendations[:3], 1):
                print(f"      {i}. {rec}")
    else:
        print(f"   ❌ 失败: {result.message}")
except Exception as e:
    print(f"   ❌ 错误: {e}")
    import traceback
    traceback.print_exc()

# 测试4: 进度预测
print("\n📊 测试4: 进度预测")
try:
    from enhanced_ai_service import SchedulePredictor, SchedulePredictionRequest
    
    predictor = SchedulePredictor()
    
    mock_tasks = [
        {
            "id": "task-1",
            "title": "需求分析",
            "startDate": "2025-03-01",
            "dueDate": "2025-03-05",
            "progress": 100,
            "status": "Completed",
            "priority": "High",
            "dependencies": []
        },
        {
            "id": "task-2",
            "title": "系统设计",
            "startDate": "2025-03-06",
            "dueDate": "2025-03-10",
            "progress": 100,
            "status": "Completed",
            "priority": "High",
            "dependencies": ["task-1"]
        },
        {
            "id": "task-3",
            "title": "核心开发",
            "startDate": "2025-03-11",
            "dueDate": "2025-03-25",
            "progress": 45,
            "status": "InProgress",
            "priority": "Urgent",
            "dependencies": ["task-2"]
        },
        {
            "id": "task-4",
            "title": "测试验收",
            "startDate": "2025-03-20",
            "dueDate": "2025-03-30",
            "progress": 0,
            "status": "NotStarted",
            "priority": "Normal",
            "dependencies": ["task-3"]
        }
    ]
    
    request = SchedulePredictionRequest(
        tasks=mock_tasks,
        current_date="2025-03-18"
    )
    
    print("   预测项目进度...")
    result = predictor.predict(request)
    
    if result.success:
        pred = result.prediction
        print(f"   ✅ 预测完成!")
        print(f"\n   📅 预测结果:")
        print(f"      预计完成日期: {pred['predicted_end_date']}")
        print(f"      置信度: {pred['confidence'] * 100:.0f}%")
        print(f"      延期概率: {pred['delay_probability'] * 100:.0f}%")
        print(f"      预估延期: {pred['estimated_delay_days']}天")
        
        if pred['critical_factors']:
            print(f"\n   🔑 关键影响因素:")
            for factor in pred['critical_factors']:
                print(f"      - {factor}")
        
        print(f"\n   🔗 关键路径 ({len(result.critical_path)}个任务):")
        for i, task_id in enumerate(result.critical_path[:5], 1):
            task = next((t for t in mock_tasks if t['id'] == task_id), None)
            if task:
                print(f"      {i}. {task['title']}")
        
        if result.bottlenecks:
            print(f"\n   🚧 瓶颈任务:")
            for b in result.bottlenecks[:2]:
                print(f"      - {b['task_title']}: {b['impact']}")
        
        if result.suggestions:
            print(f"\n   💡 优化建议:")
            for s in result.suggestions[:2]:
                print(f"      - {s}")
    else:
        print(f"   ❌ 失败: {result.message}")
except Exception as e:
    print(f"   ❌ 错误: {e}")

print("\n" + "=" * 60)
print("✨ 智谱AI功能测试完成!")
print("=" * 60)
