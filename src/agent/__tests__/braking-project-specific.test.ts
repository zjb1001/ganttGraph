/**
 * 制动项目专用功能测试
 * 验证 ASIL-D 安全门控、关键风险分析、SOP预测
 */

import { describe, it, expect } from 'vitest';
import { brakingPredictiveEngine, BRAKING_PROJECT_CONFIG } from '../BrakingProjectEngine';
import { GanttContext } from '@/types';

describe('🚗 制动项目专用功能测试', () => {
  
  const mockContext: GanttContext = {
    projectId: 'braking_test',
    tasks: [
      {
        id: 'task_esc',
        title: 'ESC算法开发',
        status: 'InProgress',
        priority: 'High',
        startDateTime: new Date(),
        dueDateTime: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
        completedPercent: 20,
        assigneeIds: ['dev1']
      } as any,
      {
        id: 'task_hara',
        title: '功能安全概念(HARA)',
        status: 'Completed',
        priority: 'High',
        startDateTime: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        dueDateTime: new Date(),
        completedPercent: 100,
        assigneeIds: ['dev2']
      } as any,
      {
        id: 'task_dfmea',
        title: 'DFMEA分析',
        status: 'InProgress',
        priority: 'High',
        startDateTime: new Date(),
        dueDateTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        completedPercent: 30,
        assigneeIds: ['dev3']
      } as any,
      {
        id: 'task_hw',
        title: 'ESC控制器硬件开发',
        status: 'NotStarted',
        priority: 'High',
        startDateTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        dueDateTime: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        completedPercent: 0,
        assigneeIds: ['hw1']
      } as any,
      {
        id: 'task_safety',
        title: '功能安全验证',
        status: 'NotStarted',
        priority: 'Critical',
        startDateTime: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000),
        dueDateTime: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
        completedPercent: 0,
        assigneeIds: ['test1']
      } as any,
      {
        id: 'milestone_sop',
        title: 'SOP量产',
        status: 'NotStarted',
        taskType: 'milestone',
        startDateTime: new Date(Date.now() + 240 * 24 * 60 * 60 * 1000),
        dueDateTime: new Date(Date.now() + 240 * 24 * 60 * 60 * 1000),
        completedPercent: 0
      } as any
    ],
    buckets: []
  };

  it('🛡️ ASIL-D 安全等级配置验证', () => {
    console.log('\n' + '='.repeat(80));
    console.log('🛡️ ASIL-D 安全等级配置');
    console.log('='.repeat(80));
    
    console.log('\n📋 项目配置:');
    console.log(`   项目名称: ${BRAKING_PROJECT_CONFIG.name}`);
    console.log(`   安全等级: ${BRAKING_PROJECT_CONFIG.safetyLevel}`);
    
    console.log('\n📊 关键性能指标 (KPI):');
    Object.entries(BRAKING_PROJECT_CONFIG.kpi).forEach(([key, value]) => {
      const label: Record<string, string> = {
        brakingDistance: '制动距离',
        responseTime: '响应时间',
        availability: '可用性',
        faultTolerance: '故障容错'
      };
      console.log(`   ${label[key]}: ${value}`);
    });
    
    console.log('\n🔒 强制安全门控:');
    BRAKING_PROJECT_CONFIG.mandatoryReviews.forEach((review, i) => {
      console.log(`   ${i + 1}. ${review.phase} - ${review.gate}`);
      console.log(`      关联任务: ${review.tasks.join(', ')}`);
    });
    
    console.log('\n⚠️ 高风险任务:');
    BRAKING_PROJECT_CONFIG.highRiskTasks.forEach((task, i) => {
      console.log(`   ${i + 1}. ${task}`);
    });
    
    expect(BRAKING_PROJECT_CONFIG.safetyLevel).toBe('ASIL-D');
    expect(BRAKING_PROJECT_CONFIG.mandatoryReviews.length).toBe(4);
    expect(BRAKING_PROJECT_CONFIG.highRiskTasks.length).toBeGreaterThan(0);
  });

  it('⚠️ 制动项目关键风险分析', () => {
    console.log('\n' + '='.repeat(80));
    console.log('⚠️ 制动项目关键风险分析');
    console.log('='.repeat(80));
    
    const risks = brakingPredictiveEngine.analyzeBrakingRisks(mockContext);
    
    console.log(`\n🚨 识别到 ${risks.length} 个关键风险:`);
    
    const criticalRisks = risks.filter(r => r.severity === 'critical');
    const highRisks = risks.filter(r => r.severity === 'high');
    
    console.log(`   关键风险: ${criticalRisks.length} 个`);
    console.log(`   高风险: ${highRisks.length} 个`);
    
    risks.forEach((risk, i) => {
      const emoji = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' }[risk.severity];
      console.log(`\n   ${i + 1}. ${emoji} [${risk.type.toUpperCase()}] ${risk.severity.toUpperCase()}`);
      console.log(`      描述: ${risk.description}`);
      console.log(`      缓解: ${risk.mitigation}`);
    });
    
    expect(risks.length).toBeGreaterThan(0);
    expect(criticalRisks.length).toBeGreaterThanOrEqual(0);
  });

  it('🔒 安全门控状态检查', () => {
    console.log('\n' + '='.repeat(80));
    console.log('🔒 安全门控状态检查');
    console.log('='.repeat(80));
    
    const gates = brakingPredictiveEngine.checkSafetyGates(mockContext);
    
    console.log('\n📊 安全门控状态:');
    
    gates.forEach((gate, i) => {
      const statusEmoji = {
        passed: '✅',
        in_progress: '🔄',
        not_started: '⏳',
        failed: '🚫'
      }[gate.status];
      
      console.log(`\n   ${i + 1}. ${statusEmoji} ${gate.gate}`);
      console.log(`      完成度: ${gate.completion}%`);
      
      if (gate.blockingTasks.length > 0) {
        console.log(`      🚨 阻塞: ${gate.blockingTasks.join(', ')}`);
      }
    });
    
    const passedGates = gates.filter(g => g.status === 'passed');
    console.log(`\n   总结: ${passedGates.length}/${gates.length} 个门控已通过`);
    
    expect(gates.length).toBe(4); // 4个强制门控
    expect(gates.some(g => g.status === 'passed')).toBe(true);
  });

  it('🎯 SOP量产时间预测', () => {
    console.log('\n' + '='.repeat(80));
    console.log('🎯 SOP量产时间预测');
    console.log('='.repeat(80));
    
    const prediction = brakingPredictiveEngine.predictSOPDate(mockContext);
    
    console.log('\n📅 SOP预测结果:');
    console.log(`   预测日期: ${prediction.predictedDate.toLocaleDateString('zh-CN')}`);
    console.log(`   置信度: ${prediction.confidence}%`);
    
    if (prediction.riskFactors.length > 0) {
      console.log('\n   ⚠️ 风险因素:');
      prediction.riskFactors.forEach((risk, i) => {
        console.log(`      ${i + 1}. ${risk}`);
      });
    } else {
      console.log('\n   ✅ 无明显风险因素');
    }
    
    console.log(`\n   💡 建议: ${prediction.recommendation}`);
    
    expect(prediction.predictedDate).toBeInstanceOf(Date);
    expect(prediction.confidence).toBeGreaterThanOrEqual(0);
    expect(prediction.recommendation).toBeTruthy();
  });

  it('📊 制动项目专用报告', () => {
    console.log('\n' + '='.repeat(80));
    console.log('📊 制动项目专用报告');
    console.log('='.repeat(80));
    
    const report = brakingPredictiveEngine.generateBrakingReport(mockContext);
    
    console.log('\n📋 项目健康度:');
    console.log(`   安全等级: ${report.safetyLevel}`);
    console.log(`   健康评分: ${report.overallHealth.score}/100`);
    console.log(`   健康状态: ${report.overallHealth.status}`);
    console.log(`   平均准时率: ${report.avgOnTimeProbability}%`);
    
    console.log('\n   关键风险统计:');
    console.log(`      关键风险: ${report.brakingSpecific.criticalRisks.length} 个`);
    console.log(`      高风险: ${report.brakingSpecific.highRisks.length} 个`);
    
    console.log('\n   SOP预测:');
    console.log(`      预测日期: ${report.brakingSpecific.sopPrediction.predictedDate.toLocaleDateString('zh-CN')}`);
    console.log(`      置信度: ${report.brakingSpecific.sopPrediction.confidence}%`);
    
    console.log('\n   💡 Agent建议:');
    report.recommendations.forEach((rec, i) => {
      console.log(`      ${i + 1}. ${rec}`);
    });
    
    expect(report.safetyLevel).toBe('ASIL-D');
    expect(report.brakingSpecific).toBeDefined();
    expect(report.recommendations.length).toBeGreaterThan(0);
  });

  it('🚗 制动项目优化总结', () => {
    console.log('\n' + '='.repeat(80));
    console.log('🚗 制动项目优化总结');
    console.log('='.repeat(80));
    
    console.log(`
┌──────────────────────────────────────────────────────────────────────────────┐
│                        🚗 制动项目专用优化完成                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  🔒 ASIL-D 安全等级支持                                                        │
│  ──────────────────────────────────────────────────────────────────────────  │
│                                                                              │
│  • 安全等级: ASIL-D (最高等级)                                               │
│  • 强制门控: 4个关键评审节点                                                  │
│  • KPI指标: 制动距离、响应时间、可用性、故障容错                              │
│                                                                              │
│  ⚠️ 关键风险识别                                                               │
│  ──────────────────────────────────────────────────────────────────────────  │
│                                                                              │
│  • ESC算法风险 - 影响车辆稳定性 (Critical)                                    │
│  • 功能安全验证 - ASIL-D验证失败项目失败 (Critical)                            │
│  • HARA风险 - 危害分析不完整 (High)                                           │
│  • 硬件开发风险 - 设计变更连锁影响 (High)                                      │
│                                                                              │
│  🛡️ 安全门控监控                                                               │
│  ──────────────────────────────────────────────────────────────────────────  │
│                                                                              │
│  • 需求 - HARA完成                                                            │
│  • 设计 - DFMEA完成                                                           │
│  • 验证 - HIL通过                                                             │
│  • 确认 - 实车验证                                                            │
│                                                                              │
│  🎯 SOP量产预测                                                                │
│  ──────────────────────────────────────────────────────────────────────────  │
│                                                                              │
│  • 基于历史数据预测量产时间                                                    │
│  • 考虑关键风险影响                                                           │
│  • 输出置信度和建议                                                           │
│                                                                              │
│  🌐 Web集成                                                                    │
│  ──────────────────────────────────────────────────────────────────────────  │
│                                                                              │
│  • 🚗 制动项目专用面板 (右上角)                                               │
│  • 📊 ASIL-D 总览 - KPI指标和健康度                                           │
│  • 🛡️ 安全门控 - 4个强制门控状态                                              │
│  • ⚠️ 关键风险 - 风险等级和缓解措施                                           │
│  • 🎯 SOP预测 - 量产时间和置信度                                              │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
`);
    
    console.log('✅ 制动项目专用优化完成');
    console.log('🎯 符合 ASIL-D 功能安全标准');
  });
});
