#!/usr/bin/env python3
"""
测试增强版AI服务功能
使用Kimi API验证智能分解、风险分析等功能
"""

import json
import requests
import sys
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000"

def test_health():
    """测试服务健康状态"""
    print("=" * 50)
    print("1. 测试服务健康状态")
    print("=" * 50)
    
    try:
        resp = requests.get(f"{BASE_URL}/", timeout=5)
        print(f"✅ 服务状态: {resp.status_code}")
        data = resp.json()
        print(f"📋 服务: {data.get('service')}")
        print(f"📋 版本: {data.get('version')}")
        print(f"📋 功能: {', '.join(data.get('features', []))}")
        return True
    except Exception as e:
        print(f"❌ 错误: {e}")
        return False

def test_decompose():
    """测试智能任务分解"""
    print("\n" + "=" * 50)
    print("2. 测试智能任务分解")
    print("=" * 50)
    
    payload = {
        "goal": "开发一个电商网站，包含用户系统、商品管理、购物车、支付功能",
        "start_date": datetime.now().strftime("%Y-%m-%d"),
        "team_size": 5,
        "complexity": "medium"
    }
    
    print(f"📝 输入: {payload['goal'][:50]}...")
    print(f"👥 团队: {payload['team_size']}人")
    print(f"📊 复杂度: {payload['complexity']}")
    
    try:
        resp = requests.post(f"{BASE_URL}/api/v2/decompose", json=payload, timeout=60)
        data = resp.json()
        
        if data.get('success'):
            print(f"\n✅ 分解成功!")
            print(f"📊 {data.get('message')}")
            print(f"📅 预估工期: {data.get('estimated_duration_days')}天")
            print(f"🎯 置信度: {data.get('confidence', 0) * 100:.0f}%")
            
            print(f"\n📋 阶段 ({len(data.get('phases', []))}):")
            for phase in data.get('phases', [])[:3]:
                print(f"  - {phase.get('name')}: {phase.get('description', '')[:30]}...")
            
            print(f"\n📋 任务 ({len(data.get('tasks', []))}):")
            for task in data.get('tasks', [])[:5]:
                print(f"  - {task.get('title')} ({task.get('phase')}) [{task.get('start_date')} ~ {task.get('end_date')}]")
            
            return True
        else:
            print(f"❌ 分解失败: {data.get('message')}")
            return False
    except Exception as e:
        print(f"❌ 错误: {e}")
        return False

def test_risk_analysis():
    """测试风险分析"""
    print("\n" + "=" * 50)
    print("3. 测试风险分析")
    print("=" * 50)
    
    # 模拟一些有风险的任务
    today = datetime.now()
    payload = {
        "tasks": [
            {
                "id": "task-1",
                "title": "API开发",
                "startDate": (today - timedelta(days=5)).strftime("%Y-%m-%d"),
                "dueDate": (today - timedelta(days=1)).strftime("%Y-%m-%d"),  # 已延期
                "progress": 30,
                "status": "InProgress",
                "priority": "High",
                "dependencies": []
            },
            {
                "id": "task-2",
                "title": "前端页面",
                "startDate": today.strftime("%Y-%m-%d"),
                "dueDate": (today + timedelta(days=3)).strftime("%Y-%m-%d"),
                "progress": 0,
                "status": "NotStarted",
                "priority": "Normal",
                "dependencies": ["task-1"]  # 依赖于延期的任务
            },
            {
                "id": "task-3",
                "title": "数据库设计",
                "startDate": (today - timedelta(days=3)).strftime("%Y-%m-%d"),
                "dueDate": (today + timedelta(days=2)).strftime("%Y-%m-%d"),
                "progress": 80,
                "status": "InProgress",
                "priority": "Important",
                "dependencies": []
            }
        ],
        "current_date": today.strftime("%Y-%m-%d"),
        "check_dependencies": True,
        "check_resources": True,
        "check_schedule": True
    }
    
    print(f"📝 分析 {len(payload['tasks'])} 个任务...")
    
    try:
        resp = requests.post(f"{BASE_URL}/api/v2/analyze-risks", json=payload, timeout=30)
        data = resp.json()
        
        if data.get('success'):
            print(f"\n✅ 分析完成!")
            print(f"📊 {data.get('message')}")
            print(f"🚨 整体风险: {data.get('overall_risk_level', 'unknown')}")
            
            summary = data.get('risk_summary', {})
            print(f"\n📈 风险统计:")
            print(f"  - 严重: {summary.get('critical', 0)}")
            print(f"  - 高: {summary.get('high', 0)}")
            print(f"  - 中: {summary.get('medium', 0)}")
            print(f"  - 低: {summary.get('low', 0)}")
            
            print(f"\n⚠️ 风险详情:")
            for risk in data.get('risks', [])[:3]:
                print(f"  - [{risk.get('level')}] {risk.get('risk_type')}: {risk.get('description', '')[:50]}...")
            
            print(f"\n💡 建议:")
            for rec in data.get('recommendations', [])[:2]:
                print(f"  - {rec}")
            
            return True
        else:
            print(f"❌ 分析失败: {data.get('message')}")
            return False
    except Exception as e:
        print(f"❌ 错误: {e}")
        return False

def test_schedule_prediction():
    """测试进度预测"""
    print("\n" + "=" * 50)
    print("4. 测试进度预测")
    print("=" * 50)
    
    today = datetime.now()
    payload = {
        "tasks": [
            {
                "id": "task-1",
                "title": "需求分析",
                "startDate": (today - timedelta(days=10)).strftime("%Y-%m-%d"),
                "dueDate": (today - timedelta(days=5)).strftime("%Y-%m-%d"),
                "progress": 100,
                "status": "Completed",
                "priority": "High",
                "dependencies": []
            },
            {
                "id": "task-2",
                "title": "架构设计",
                "startDate": (today - timedelta(days=5)).strftime("%Y-%m-%d"),
                "dueDate": today.strftime("%Y-%m-%d"),
                "progress": 100,
                "status": "Completed",
                "priority": "High",
                "dependencies": ["task-1"]
            },
            {
                "id": "task-3",
                "title": "核心开发",
                "startDate": today.strftime("%Y-%m-%d"),
                "dueDate": (today + timedelta(days=14)).strftime("%Y-%m-%d"),
                "progress": 20,
                "status": "InProgress",
                "priority": "Urgent",
                "dependencies": ["task-2"]
            },
            {
                "id": "task-4",
                "title": "测试",
                "startDate": (today + timedelta(days=10)).strftime("%Y-%m-%d"),
                "dueDate": (today + timedelta(days=20)).strftime("%Y-%m-%d"),
                "progress": 0,
                "status": "NotStarted",
                "priority": "Normal",
                "dependencies": ["task-3"]
            }
        ],
        "current_date": today.strftime("%Y-%m-%d")
    }
    
    print(f"📝 预测 {len(payload['tasks'])} 个任务的进度...")
    
    try:
        resp = requests.post(f"{BASE_URL}/api/v2/predict-schedule", json=payload, timeout=30)
        data = resp.json()
        
        if data.get('success'):
            pred = data.get('prediction', {})
            print(f"\n✅ 预测完成!")
            print(f"📅 预测完成日期: {pred.get('predicted_end_date')}")
            print(f"🎯 置信度: {pred.get('confidence', 0) * 100:.0f}%")
            print(f"⚠️ 延期概率: {pred.get('delay_probability', 0) * 100:.0f}%")
            print(f"📊 预估延期: {pred.get('estimated_delay_days', 0)}天")
            
            print(f"\n🔗 关键路径:")
            for task_id in data.get('critical_path', [])[:5]:
                print(f"  - {task_id}")
            
            print(f"\n🚧 瓶颈:")
            for bottleneck in data.get('bottlenecks', [])[:2]:
                print(f"  - {bottleneck.get('task_title')}: {bottleneck.get('impact')}")
            
            return True
        else:
            print(f"❌ 预测失败: {data.get('message')}")
            return False
    except Exception as e:
        print(f"❌ 错误: {e}")
        return False

def test_chat():
    """测试自然语言对话"""
    print("\n" + "=" * 50)
    print("5. 测试自然语言对话")
    print("=" * 50)
    
    test_messages = [
        "帮我分解开发电商网站的项目",
        "分析一下项目风险",
        "预测一下什么时候能完成",
    ]
    
    for msg in test_messages[:2]:  # 只测试前2个
        print(f"\n📝 用户: {msg}")
        
        payload = {
            "message": msg,
            "context": {
                "tasks": [],
                "currentProject": "电商网站"
            }
        }
        
        try:
            resp = requests.post(f"{BASE_URL}/api/v2/chat", json=payload, timeout=30)
            data = resp.json()
            
            if data.get('success'):
                print(f"🤖 AI: {data.get('message', '')[:100]}...")
                print(f"🎯 识别意图: {data.get('intent')}")
                
                if data.get('analysis'):
                    print(f"📊 分析结果: {json.dumps(data.get('analysis'), ensure_ascii=False, indent=2)[:200]}...")
            else:
                print(f"❌ 失败: {data.get('message')}")
        except Exception as e:
            print(f"❌ 错误: {e}")

def main():
    """主测试函数"""
    print("\n" + "🚀" * 25)
    print("Gantt Graph AI 增强功能测试")
    print("🚀" * 25)
    
    results = []
    
    # 测试服务健康
    results.append(("服务健康", test_health()))
    
    # 测试分解功能
    results.append(("任务分解", test_decompose()))
    
    # 测试风险分析
    results.append(("风险分析", test_risk_analysis()))
    
    # 测试进度预测
    results.append(("进度预测", test_schedule_prediction()))
    
    # 测试对话
    test_chat()
    
    # 汇总结果
    print("\n" + "=" * 50)
    print("测试结果汇总")
    print("=" * 50)
    
    for name, passed in results:
        status = "✅ 通过" if passed else "❌ 失败"
        print(f"{status} - {name}")
    
    passed_count = sum(1 for _, p in results if p)
    print(f"\n总计: {passed_count}/{len(results)} 项通过")
    
    if passed_count == len(results):
        print("\n🎉 所有测试通过! AI增强功能工作正常!")
    else:
        print("\n⚠️ 部分测试失败，请检查服务状态和API配置")

if __name__ == "__main__":
    main()
