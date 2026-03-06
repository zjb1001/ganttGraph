/**
 * 整车项目开发计划测试
 * 验证完整的整车开发流程
 */

import { describe, it, expect } from 'vitest';
import { predictiveEngine } from '../PredictiveAnalysisEngine';
import { autonomousEngine } from '../AutonomousExecutionEngine';
import { getProjectTemplate, detectIndustryType } from '../ProjectTemplates';
import { GanttContext } from '@/types';

describe('🚗 整车项目开发计划测试', () => {
  
  const mockVehicleContext: GanttContext = {
    projectId: 'vehicle_platform_x',
    tasks: [
      // 产品战略
      { id: 'v1', title: '产品需求规格书(PRS)', status: 'Completed', completedPercent: 100, priority: 'Critical' } as any,
      { id: 'v2', title: '整车技术规格书(VTS)', status: 'Completed', completedPercent: 100, priority: 'Critical' } as any,
      
      // 概念设计
      { id: 'v3', title: '创意草图与方案发散', status: 'Completed', completedPercent: 100, priority: 'High' } as any,
      { id: 'v4', title: '造型方案评审与选定', status: 'InProgress', completedPercent: 80, priority: 'High' } as any,
      { id: 'v5', title: '油泥模型制作(1:4)', status: 'InProgress', completedPercent: 60, priority: 'High' } as any,
      
      // 工程设计
      { id: 'v6', title: '总布置设计(DMU)', status: 'InProgress', completedPercent: 40, priority: 'Critical' } as any,
      { id: 'v7', title: '车身结构设计', status: 'NotStarted', completedPercent: 0, priority: 'Critical' } as any,
      { id: 'v8', title: '电池包系统设计', status: 'NotStarted', completedPercent: 0, priority: 'Critical' } as any,
      { id: 'v9', title: 'BMS电池管理系统开发', status: 'NotStarted', completedPercent: 0, priority: 'Critical' } as any,
      { id: 'v10', title: 'MCU电机控制器开发', status: 'NotStarted', completedPercent: 0, priority: 'Critical' } as any,
      { id: 'v11', title: '整车电气架构设计', status: 'NotStarted', completedPercent: 0, priority: 'Critical' } as any,
      { id: 'v12', title: '域控制器设计', status: 'NotStarted', completedPercent: 0, priority: 'Critical' } as any,
      
      // 智驾
      { id: 'v13', title: 'ADAS功能开发(L2+)', status: 'NotStarted', completedPercent: 0, priority: 'High' } as any,
      { id: 'v14', title: '自动驾驶算法训练', status: 'NotStarted', completedPercent: 0, priority: 'High' } as any,
      
      // 座舱
      { id: 'v15', title: '智能座舱域控制器开发', status: 'NotStarted', completedPercent: 0, priority: 'High' } as any,
      { id: 'v16', title: '中控大屏软件开发', status: 'NotStarted', completedPercent: 0, priority: 'High' } as any,
      
      // 验证
      { id: 'v17', title: '整车可靠性试验', status: 'NotStarted', completedPercent: 0, priority: 'Critical' } as any,
      { id: 'v18', title: '碰撞安全试验', status: 'NotStarted', completedPercent: 0, priority: 'Critical' } as any,
      { id: 'v19', title: '三高试验(高温/高寒/高原)', status: 'NotStarted', completedPercent: 0, priority: 'Critical' } as any,
      
      // 量产
      { id: 'v20', title: '生产线规划与设计', status: 'NotStarted', completedPercent: 0, priority: 'Critical' } as any,
      { id: 'v21', title: '小批量试生产(SOP前)', status: 'NotStarted', completedPercent: 0, priority: 'Critical' } as any,
      
      // 里程碑
      { id: 'm1', title: 'G0-项目立项', status: 'Completed', taskType: 'milestone' } as any,
      { id: 'm2', title: 'G1-概念冻结', status: 'InProgress', taskType: 'milestone' } as any,
      { id: 'm3', title: 'G2-造型冻结', status: 'NotStarted', taskType: 'milestone' } as any,
      { id: 'm4', title: 'G3-工程发布', status: 'NotStarted', taskType: 'milestone' } as any,
      { id: 'm5', title: 'G4-设计验证完成', status: 'NotStarted', taskType: 'milestone' } as any,
      { id: 'm6', title: 'G5-生产验证完成', status: 'NotStarted', taskType: 'milestone' } as any,
      { id: 'm7', title: 'G6-SOP量产启动', status: 'NotStarted', taskType: 'milestone' } as any
    ],
    buckets: []
  };

  it('🚗 整车项目结构验证', () => {
    console.log('\n' + '='.repeat(80));
    console.log('🚗 整车项目结构');
    console.log('='.repeat(80));
    
    const phases = {
      '产品战略': mockVehicleContext.tasks.filter(t => t.title.includes('PRS') || t.title.includes('VTS')).length,
      '概念设计': mockVehicleContext.tasks.filter(t => t.title.includes('造型') || t.title.includes('草图')).length,
      '工程设计': mockVehicleContext.tasks.filter(t => 
        t.title.includes('设计') || t.title.includes('开发') || t.title.includes('系统')
      ).length,
      '智驾系统': mockVehicleContext.tasks.filter(t => t.title.includes('ADAS') || t.title.includes('自动驾驶')).length,
      '智能座舱': mockVehicleContext.tasks.filter(t => t.title.includes('座舱') || t.title.includes('大屏')).length,
      '验证测试': mockVehicleContext.tasks.filter(t => t.title.includes('试验') || t.title.includes('测试')).length,
      '量产准备': mockVehicleContext.tasks.filter(t => t.title.includes('生产') || t.title.includes('SOP')).length,
      '里程碑': mockVehicleContext.tasks.filter(t => t.taskType === 'milestone').length
    };
    
    console.log('\n   项目阶段分布:');
    Object.entries(phases).forEach(([phase, count]) => {
      if (count > 0) {
        console.log(`      ${phase}: ${count} 个任务`);
      }
    });
    
    console.log(`\n   总任务数: ${mockVehicleContext.tasks.length}`);
    console.log(`   里程碑数: ${phases['里程碑']}`);
    
    expect(mockVehicleContext.tasks.length).toBeGreaterThan(20);
    expect(phases['里程碑']).toBe(7); // G0-G6
  });

  it('⚡ 三电系统关键路径分析', () => {
    console.log('\n' + '='.repeat(80));
    console.log('⚡ 三电系统(电动车核心)');
    console.log('='.repeat(80));
    
    const powertrainTasks = mockVehicleContext.tasks.filter(t => 
      t.title.includes('电池') || 
      t.title.includes('BMS') || 
      t.title.includes('MCU') || 
      t.title.includes('电机') ||
      t.title.includes('OBC') ||
      t.title.includes('高压')
    );
    
    console.log('\n   三电系统关键任务:');
    powertrainTasks.forEach((task, i) => {
      const status = task.status === 'Completed' ? '✅' : 
                    task.status === 'InProgress' ? '🔄' : '⏳';
      console.log(`   ${i + 1}. ${status} ${task.title}`);
    });
    
    expect(powertrainTasks.length).toBeGreaterThan(0);
  });

  it('🤖 智能驾驶系统规划', () => {
    console.log('\n' + '='.repeat(80));
    console.log('🤖 智能驾驶系统');
    console.log('='.repeat(80));
    
    const adasTasks = mockVehicleContext.tasks.filter(t => 
      t.title.includes('ADAS') || 
      t.title.includes('自动驾驶') ||
      t.title.includes('感知') ||
      t.title.includes('NOA') ||
      t.title.includes('AEB')
    );
    
    console.log('\n   智驾系统开发:');
    adasTasks.forEach((task, i) => {
      console.log(`   ${i + 1}. ${task.title} [${task.priority}]`);
    });
    
    console.log(`\n   智驾功能等级: L2+`);
    console.log(`   关键功能: NOA高速领航、自动泊车、AEB`);
    
    expect(adasTasks.length).toBeGreaterThan(0);
  });

  it('🖥️ 智能座舱系统规划', () => {
    console.log('\n' + '='.repeat(80));
    console.log('🖥️ 智能座舱系统');
    console.log('='.repeat(80));
    
    const cockpitTasks = mockVehicleContext.tasks.filter(t => 
      t.title.includes('座舱') || 
      t.title.includes('中控') ||
      t.title.includes('仪表') ||
      t.title.includes('语音') ||
      t.title.includes('车联网') ||
      t.title.includes('OTA') ||
      t.title.includes('数字钥匙')
    );
    
    console.log('\n   座舱系统开发:');
    cockpitTasks.forEach((task, i) => {
      console.log(`   ${i + 1}. ${task.title}`);
    });
    
    expect(cockpitTasks.length).toBeGreaterThan(0);
  });

  it('🔍 整车验证测试矩阵', () => {
    console.log('\n' + '='.repeat(80));
    console.log('🔍 整车验证测试矩阵');
    console.log('='.repeat(80));
    
    const validationCategories = {
      '性能验证': ['可靠性', '耐久', '三高'],
      '安全验证': ['碰撞', '安全'],
      '电磁兼容': ['EMC'],
      '智驾验证': ['ADAS', '自动驾驶', '场地', '道路'],
      '座舱验证': ['座舱', '压力'],
      '法规认证': ['法规', '公告', '3C', '欧盟']
    };
    
    console.log('\n   验证测试类别:');
    Object.entries(validationCategories).forEach(([category, keywords]) => {
      const tasks = mockVehicleContext.tasks.filter(t => 
        keywords.some(kw => t.title.includes(kw))
      );
      if (tasks.length > 0) {
        console.log(`      ${category}: ${tasks.length} 项`);
      }
    });
  });

  it('🏭 行业检测与模板匹配', () => {
    console.log('\n' + '='.repeat(80));
    console.log('🏭 行业检测与模板匹配');
    console.log('='.repeat(80));
    
    // 创建带有汽车行业关键词的任务列表
    const automotiveTasks = [
      ...mockVehicleContext.tasks,
      { title: 'ASIL-D功能安全设计' } as any,
      { title: 'HARA危害分析' } as any,
      { title: 'ESC制动系统开发' } as any
    ];
    
    const detectedIndustry = detectIndustryType(automotiveTasks);
    console.log(`\n   检测到的行业: ${detectedIndustry}`);
    
    const template = getProjectTemplate(detectedIndustry);
    console.log(`   匹配的模板: ${template.name}`);
    console.log(`   安全等级: ${template.safetyLevel || 'N/A'}`);
    console.log(`   KPI数量: ${template.kpis.length}`);
    console.log(`   强制门控: ${template.mandatoryReviews.length}个`);
    
    expect(detectedIndustry).toBe('automotive');
    expect(template.safetyLevel).toBe('ASIL-D');
  });

  it('🔮 整车项目风险预测', () => {
    console.log('\n' + '='.repeat(80));
    console.log('🔮 整车项目风险预测');
    console.log('='.repeat(80));
    
    // 三电系统风险
    const batteryTask = mockVehicleContext.tasks.find(t => t.title.includes('电池包'));
    if (batteryTask) {
      const prediction = predictiveEngine.predictTaskDelay(batteryTask);
      console.log('\n   电池包系统风险预测:');
      console.log(`      准时概率: ${prediction.onTimeProbability}%`);
      console.log(`      预计延期: ${prediction.predictedDelay}天`);
      console.log(`      风险因素: ${prediction.riskFactors.length}个`);
    }
    
    // 智驾系统风险
    const adasTask = mockVehicleContext.tasks.find(t => t.title.includes('ADAS'));
    if (adasTask) {
      const prediction = predictiveEngine.predictTaskDelay(adasTask);
      console.log('\n   ADAS系统风险预测:');
      console.log(`      准时概率: ${prediction.onTimeProbability}%`);
      console.log(`      预计延期: ${prediction.predictedDelay}天`);
    }
    
    // 生成整车项目报告
    const report = predictiveEngine.generateIndustryReport(mockVehicleContext);
    
    console.log('\n   整车项目健康度:');
    console.log(`      评分: ${report.overallHealth.score}/100`);
    console.log(`      状态: ${report.overallHealth.status}`);
    console.log(`      平均准时率: ${report.avgOnTimeProbability}%`);
    console.log(`      行业风险: ${report.industryRisks.length}个`);
    
    expect(report.overallHealth.score).toBeGreaterThanOrEqual(0);
    expect(report.industryRisks).toBeDefined();
  });

  it('🎯 里程碑达成预测', () => {
    console.log('\n' + '='.repeat(80));
    console.log('🎯 里程碑达成预测');
    console.log('='.repeat(80));
    
    const milestonePredictions = predictiveEngine.predictMilestones(mockVehicleContext);
    
    console.log('\n   关键里程碑预测:');
    milestonePredictions.forEach((m, i) => {
      const riskEmoji = m.delayProbability > 50 ? '🔴' : 
                       m.delayProbability > 30 ? '🟠' : '🟢';
      console.log(`   ${i + 1}. ${riskEmoji} ${m.milestone}`);
      console.log(`      计划: ${m.originalDate.toLocaleDateString()}`);
      console.log(`      预测: ${m.predictedDate.toLocaleDateString()}`);
      console.log(`      延期概率: ${m.delayProbability}%`);
    });
    
    expect(milestonePredictions.length).toBeGreaterThan(0);
  });

  it('📊 整车项目开发计划总结', () => {
    console.log('\n' + '='.repeat(80));
    console.log('📊 整车项目开发计划总结');
    console.log('='.repeat(80));
    
    console.log(`
┌──────────────────────────────────────────────────────────────────────────────┐
│                    🚗 全新电动SUV整车开发计划                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  📋 项目概况                                                                   │
│  ──────────────────────────────────────────────────────────────────────────  │
│  • 项目名称: V-Platform 全新电动SUV                                          │
│  • 开发周期: 36个月 (2026-2028)                                              │
│  • 目标市场: 中高端智能电动SUV市场                                            │
│  • 平台架构: 全新纯电平台                                                     │
│  • 智驾等级: L2+ (高速NOA + 自动泊车)                                        │
│                                                                              │
│  📊 项目规模                                                                   │
│  ──────────────────────────────────────────────────────────────────────────  │
│  • 总任务数: 85+ 个                                                          │
│  • 开发阶段: 6个阶段 (G0-G6)                                                 │
│  • 里程碑: 7个关键门控                                                        │
│  • 工程团队: 车身/底盘/三电/电子/智驾/座舱/制造                               │
│                                                                              │
│  🏗️ 开发阶段                                                                   │
│  ──────────────────────────────────────────────────────────────────────────  │
│  Phase 0: 产品战略 (6个月)                                                   │
│           PRS/VTS定义 → 项目立项(G0)                                          │
│                                                                              │
│  Phase 1: 概念设计 (9个月)                                                   │
│           造型设计 → 油泥模型 → 概念冻结(G1)                                   │
│                                                                              │
│  Phase 2: 工程设计 (15个月)                                                  │
│           车身/底盘/三电/电子 → 造型冻结(G2)                                  │
│                                                                              │
│  Phase 3: 样车开发 (12个月)                                                  │
│           Mule → EP → DV → PV → 工程发布(G3)                                  │
│                                                                              │
│  Phase 4: 验证测试 (18个月)                                                  │
│           整车测试 → 智驾验证 → 座舱验证 → 设计验证完成(G4)                    │
│                                                                              │
│  Phase 5: 量产准备 (12个月)                                                  │
│           生产线建设 → 试生产 → 生产验证完成(G5) → SOP量产(G6)                │
│                                                                              │
│  ⚡ 核心技术                                                                    │
│  ──────────────────────────────────────────────────────────────────────────  │
│  • 三电系统: 800V高压平台 + CTP电池 + SiC电驱                                │
│  • 智能驾驶: L2+ ADAS + 高速NOA + 自动泊车                                    │
│  • 智能座舱: 双域控架构 + 大屏 + 语音 + OTA                                   │
│  • 电子架构: 域集中式 + 千兆以太网 + 功能安全(ASIL-D)                         │
│                                                                              │
│  🔒 功能安全与法规                                                               │
│  ──────────────────────────────────────────────────────────────────────────  │
│  • 功能安全: ASIL-D (最高等级)                                               │
│  • 网络安全: ISO/SAE 21434                                                   │
│  • 国内认证: 公告/3C/环保                                                    │
│  • 海外认证: 欧盟ECE/EEC (WVTA)                                              │
│                                                                              │
│  🎯 关键成功因素                                                                │
│  ──────────────────────────────────────────────────────────────────────────  │
│  • 三电系统按时交付 (电池/电控/电机)                                          │
│  • 智驾功能安全验证 (ADAS道路测试10万+公里)                                    │
│  • 生产线按时就绪 (SOP前完成产能爬坡)                                         │
│  • 法规认证一次通过 (国内+海外)                                               │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
`);
    
    console.log('✅ 整车项目开发计划制定完成');
    console.log('🎯 覆盖从概念到量产的完整开发流程');
    console.log('⚡ 重点关注三电系统和智能驾驶');
  });
});
