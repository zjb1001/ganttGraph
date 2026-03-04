#!/usr/bin/env python3
"""
直接测试AI功能，无需启动HTTP服务
"""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

print("🚀 AI功能直接测试")
print("=" * 50)

# 测试1: 检查配置
print("\n1. 检查环境配置")
print(f"   LLM_PROVIDER: {os.getenv('LLM_PROVIDER')}")
print(f"   LLM_BASE_URL: {os.getenv('LLM_BASE_URL')}")
print(f"   LLM_MODEL: {os.getenv('LLM_MODEL')}")
print(f"   API_KEY: {'已配置 ✅' if os.getenv('LLM_API_KEY') else '未配置 ❌'}")

# 测试2: 导入模块
print("\n2. 检查模块导入")
try:
    from enhanced_ai_service import (
        LLMClient, TaskDecomposer, RiskAnalyzer, 
        SchedulePredictor, ResourceOptimizer
    )
    print("   模块导入成功 ✅")
except Exception as e:
    print(f"   模块导入失败 ❌: {e}")
    sys.exit(1)

# 测试3: 测试LLM连接
print("\n3. 测试Kimi API连接")
try:
    llm = LLMClient()
    print(f"   API Key: {'有效 ✅' if llm.api_key else '无效 ❌'}")
    print(f"   Base URL: {llm.base_url}")
    print(f"   Model: {llm.model}")
except Exception as e:
    print(f"   LLM初始化失败 ❌: {e}")

# 测试4: 测试任务分解
print("\n4. 测试智能任务分解")
print("   输入: 开发一个任务管理App")
try:
    from datetime import datetime
    from enhanced_ai_service import DecomposeRequest
    
    decomposer = TaskDecomposer(llm)
    request = DecomposeRequest(
        goal="开发一个任务管理App，包含任务创建、分类、提醒功能",
        start_date=datetime.now().strftime("%Y-%m-%d"),
        team_size=3,
        complexity="medium"
    )
    
    print("   正在调用Kimi API进行任务分解...")
    result = decomposer.decompose(request)
    
    if result.success:
        print(f"   ✅ 分解成功!")
        print(f"   📊 {result.message}")
        print(f"   📅 预估工期: {result.estimated_duration_days}天")
        print(f"   🎯 置信度: {result.confidence * 100:.0f}%")
        print(f"\n   📋 阶段 ({len(result.phases)}):")
        for phase in result.phases[:3]:
            print(f"      - {phase['name']}")
        print(f"\n   📋 任务示例 ({len(result.tasks)}个):")
        for task in result.tasks[:3]:
            print(f"      - {task['title']} ({task['start_date']}~{task['end_date']})")
    else:
        print(f"   ❌ 分解失败: {result.message}")
except Exception as e:
    print(f"   ❌ 错误: {e}")
    import traceback
    traceback.print_exc()

# 测试5: 测试风险分析
print("\n5. 测试风险分析")
try:
    from enhanced_ai_service import RiskAnalysisRequest
    
    analyzer = RiskAnalyzer()
    
    # 模拟有风险的任务数据
    mock_tasks = [
        {
            "id": "task-1",
            "title": "后端API开发",
            "startDate": "2025-03-01",
            "dueDate": "2025-03-05",
            "progress": 20,  # 进度落后
            "status": "InProgress",
            "priority": "High",
            "dependencies": []
        },
        {
            "id": "task-2", 
            "title": "前端页面开发",
            "startDate": "2025-03-05",
            "dueDate": "2025-03-10",
            "progress": 0,
            "status": "NotStarted",
            "priority": "Normal",
            "dependencies": ["task-1"]
        }
    ]
    
    request = RiskAnalysisRequest(
        tasks=mock_tasks,
        current_date="2025-03-06"  # 已经过了一天
    )
    
    print("   正在分析项目风险...")
    result = analyzer.analyze(request)
    
    if result.success:
        print(f"   ✅ 分析成功!")
        print(f"   📊 {result.message}")
        print(f"   🚨 整体风险: {result.overall_risk_level}")
        print(f"   📈 风险统计: 严重{result.risk_summary['critical']} 高{result.risk_summary['high']} 中{result.risk_summary['medium']} 低{result.risk_summary['low']}")
        
        if result.risks:
            print(f"\n   ⚠️ 发现的风险:")
            for risk in result.risks[:3]:
                print(f"      - [{risk.level}] {risk.risk_type}: {risk.task_title}")
        
        if result.recommendations:
            print(f"\n   💡 建议:")
            for rec in result.recommendations[:2]:
                print(f"      - {rec}")
    else:
        print(f"   ❌ 分析失败: {result.message}")
except Exception as e:
    print(f"   ❌ 错误: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 50)
print("测试完成!")
