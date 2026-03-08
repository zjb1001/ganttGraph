/**
 * 行业项目模板测试
 * 验证多行业支持：汽车、航空、医疗、消费电子、工业控制
 */

import { describe, it, expect } from 'vitest';
import { 
  ProjectTemplates, 
  getProjectTemplate, 
  detectIndustryType,
  IndustryType 
} from '../ProjectTemplates';
import { predictiveEngine } from '../PredictiveAnalysisEngine';
import { GanttContext } from '@/types';

describe('🏭 行业项目模板通用测试', () => {
  
  it('🏭 支持5种行业类型', () => {
    console.log('\n' + '='.repeat(80));
    console.log('🏭 行业模板注册表');
    console.log('='.repeat(80));
    
    const industries: IndustryType[] = ['automotive', 'aerospace', 'medical', 'consumer', 'industrial'];
    
    industries.forEach(industry => {
      const template = getProjectTemplate(industry);
      console.log(`\n   ${industry.toUpperCase()}:`);
      console.log(`      名称: ${template.name}`);
      console.log(`      描述: ${template.description}`);
      console.log(`      KPI数量: ${template.kpis.length}`);
      console.log(`      强制门控: ${template.mandatoryReviews.length}个`);
      console.log(`      行业风险: ${template.industryRisks.length}个`);
      if (template.safetyLevel) {
        console.log(`      安全等级: ${template.safetyLevel}`);
      }
    });
    
    expect(Object.keys(ProjectTemplates).length).toBe(5);
  });

  it('🚗 自动检测汽车行业', () => {
    const automotiveTasks = [
      { title: 'ESC算法开发' },
      { title: 'HARA分析' },
      { title: 'ASIL-D验证' }
    ];
    
    const detected = detectIndustryType(automotiveTasks);
    console.log(`\n   检测到行业: ${detected}`);
    expect(detected).toBe('automotive');
    
    const template = getProjectTemplate(detected);
    expect(template.safetyLevel).toBe('ASIL-D');
  });

  it('✈️ 自动检测航空行业', () => {
    const aerospaceTasks = [
      { title: '适航认证' },
      { title: 'DO-178C编码' },
      { title: '飞行测试' }
    ];
    
    const detected = detectIndustryType(aerospaceTasks);
    console.log(`   检测到行业: ${detected}`);
    expect(detected).toBe('aerospace');
  });

  it('🏥 自动检测医疗行业', () => {
    const medicalTasks = [
      { title: 'FDA提交' },
      { title: '临床评估' },
      { title: '生物相容性测试' }
    ];
    
    const detected = detectIndustryType(medicalTasks);
    console.log(`   检测到行业: ${detected}`);
    expect(detected).toBe('medical');
  });

  it('🏭 自动检测工业行业', () => {
    const industrialTasks = [
      { title: 'SIL-3认证' },
      { title: 'PLC编程' },
      { title: 'IEC 61508验证' }
    ];
    
    const detected = detectIndustryType(industrialTasks);
    console.log(`   检测到行业: ${detected}`);
    expect(detected).toBe('industrial');
  });

  it('📱 默认消费电子行业', () => {
    const consumerTasks = [
      { title: 'UI设计' },
      { title: 'APP开发' },
      { title: '用户测试' }
    ];
    
    const detected = detectIndustryType(consumerTasks);
    console.log(`   检测到行业: ${detected}`);
    expect(detected).toBe('consumer');
  });

  it('🔮 行业特定风险分析', () => {
    console.log('\n' + '='.repeat(80));
    console.log('🔮 行业特定风险分析');
    console.log('='.repeat(80));
    
    const context: GanttContext = {
      projectId: 'test_auto',
      tasks: [
        { id: '1', title: 'ESC算法开发', status: 'InProgress' } as any,
        { id: '2', title: '功能安全验证', status: 'NotStarted' } as any,
        { id: '3', title: '硬件设计', status: 'InProgress' } as any
      ],
      buckets: []
    };
    
    const risks = predictiveEngine.analyzeIndustryRisks(context, 'automotive');
    
    console.log(`\n   汽车行业识别到 ${risks.length} 个特定风险:`);
    risks.forEach((risk, i) => {
      console.log(`   ${i + 1}. [${risk.severity.toUpperCase()}] ${risk.taskName}`);
      console.log(`      ${risk.description.slice(0, 50)}...`);
    });
    
    expect(risks.length).toBeGreaterThan(0);
    expect(risks.some(r => r.severity === 'critical')).toBe(true);
  });

  it('🛡️ 强制评审节点检查', () => {
    console.log('\n' + '='.repeat(80));
    console.log('🛡️ 强制评审节点检查');
    console.log('='.repeat(80));
    
    const context: GanttContext = {
      projectId: 'test_medical',
      tasks: [
        { id: '1', title: '用户需求', status: 'Completed' } as any,
        { id: '2', title: '风险管理', status: 'Completed' } as any,
        { id: '3', title: '架构设计', status: 'InProgress' } as any
      ],
      buckets: []
    };
    
    const reviews = predictiveEngine.checkMandatoryReviews(context, 'medical');
    
    console.log(`\n   医疗行业强制评审节点:`);
    reviews.forEach((review, i) => {
      const icon = { passed: '✅', in_progress: '🔄', not_started: '⏳' }[review.status];
      console.log(`   ${i + 1}. ${icon} ${review.gate} (${review.completion}%)`);
    });
    
    expect(reviews.length).toBe(4);
  });

  it('📊 行业特定报告生成', () => {
    console.log('\n' + '='.repeat(80));
    console.log('📊 行业特定报告');
    console.log('='.repeat(80));
    
    const context: GanttContext = {
      projectId: 'test_auto',
      tasks: [
        { id: '1', title: 'ESC算法开发', status: 'InProgress', priority: 'High', startDateTime: new Date(), dueDateTime: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), completedPercent: 20 } as any,
        { id: '2', title: '功能安全验证', status: 'NotStarted', priority: 'Critical', startDateTime: new Date(), dueDateTime: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000), completedPercent: 0 } as any
      ],
      buckets: []
    };
    
    const report = predictiveEngine.generateIndustryReport(context);
    
    console.log(`\n   项目类型: ${report.industryName}`);
    console.log(`   安全等级: ${report.safetyLevel || 'N/A'}`);
    console.log(`   健康评分: ${report.overallHealth.score}/100`);
    console.log(`   行业风险: ${report.industryRisks.length}个`);
    console.log(`   强制门控: ${report.mandatoryReviews.length}个`);
    
    expect(report.industry).toBe('automotive');
    expect(report.safetyLevel).toBe('ASIL-D');
    expect(report.industryRisks).toBeDefined();
  });

  it('🎯 不同行业KPI对比', () => {
    console.log('\n' + '='.repeat(80));
    console.log('🎯 不同行业KPI对比');
    console.log('='.repeat(80));
    
    const industries: IndustryType[] = ['automotive', 'aerospace', 'medical', 'consumer', 'industrial'];
    
    industries.forEach(industry => {
      const template = getProjectTemplate(industry);
      console.log(`\n   ${industry.toUpperCase()}:`);
      template.kpis.forEach((kpi: any) => {
        console.log(`      • ${kpi.name}: ${kpi.target}`);
      });
    });
    
    // 每个行业都应该有KPI
    industries.forEach(industry => {
      const template = getProjectTemplate(industry);
      expect(template.kpis.length).toBeGreaterThan(0);
    });
  });

  it('📋 行业特定建议生成', () => {
    const context: GanttContext = {
      projectId: 'test_aero',
      tasks: [
        { id: '1', title: '适航认证', status: 'InProgress', priority: 'High' } as any
      ],
      buckets: []
    };
    
    const report = predictiveEngine.generateIndustryReport(context, 'aerospace');
    
    console.log('\n   航空行业建议:');
    report.recommendations.forEach((rec: string, i: number) => {
      console.log(`      ${i + 1}. ${rec}`);
    });
    
    // 验证包含行业特定建议
    expect(report.recommendations.some((r: string) => r.includes('航空'))).toBe(true);
  });

  it('🏭 通用Agent能力总结', () => {
    console.log('\n' + '='.repeat(80));
    console.log('🏭 通用Agent能力总结');
    console.log('='.repeat(80));
    
    console.log(`
┌──────────────────────────────────────────────────────────────────────────────┐
│                     🏭 Level 8-10: 通用行业Agent能力                          │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  🎯 支持5种行业类型                                                            │
│  ──────────────────────────────────────────────────────────────────────────  │
│                                                                              │
│  • 🚗 汽车 (ASIL-D) - 功能安全标准                                           │
│  • ✈️ 航空 (DAL-A) - DO-178C/DO-254标准                                       │
│  • 🏥 医疗 (Class C) - FDA/IEC 62304标准                                      │
│  • 📱 消费电子 - 快速迭代模式                                                 │
│  • 🏭 工业控制 (SIL-3) - IEC 61508标准                                        │
│                                                                              │
│  🔮 通用能力                                                                   │
│  ──────────────────────────────────────────────────────────────────────────  │
│                                                                              │
│  • 自动行业检测 - 基于任务关键词识别行业类型                                   │
│  • 行业特定风险 - 每个行业定义特定的风险类型                                   │
│  • 强制评审节点 - 各行业定义的门控检查点                                       │
│  • KPI指标 - 行业特定的关键性能指标                                           │
│  • 历史数据 - 各行业的历史项目数据用于预测                                     │
│                                                                              │
│  🛡️ 行业特定风险示例                                                           │
│  ──────────────────────────────────────────────────────────────────────────  │
│                                                                              │
│  汽车: ESC算法失效、ASIL-D验证失败、硬件设计变更                               │
│  航空: 适航认证失败、飞行测试延期、安全评估不通过                              │
│  医疗: FDA审核不通过、临床评估失败、监管提交延期                               │
│  消费电子: 市场窗口期错过、供应链断裂、用户体验不达标                          │
│  工业控制: 安全功能失效、EMC测试失败、现场验收延期                             │
│                                                                              │
│  🌐 Web集成                                                                    │
│  ──────────────────────────────────────────────────────────────────────────  │
│                                                                              │
│  • 自动检测项目行业类型                                                        │
│  • 动态显示行业特定的面板和内容                                                │
│  • 行业图标和颜色主题                                                          │
│  • 可扩展的模板系统                                                            │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
`);
    
    console.log('✅ Level 8-10 通用行业Agent能力完成');
    console.log('🎯 支持5种行业，可扩展的模板系统');
  });
});
