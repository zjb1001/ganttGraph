/**
 * MKC2制动器项目测试
 * 验证线控制动系统开发完整流程
 */

import { describe, it, expect } from 'vitest';
import { predictiveEngine } from '../PredictiveAnalysisEngine';
import { getProjectTemplate, detectIndustryType } from '../ProjectTemplates';
import { GanttContext } from '@/types';

describe('🔧 MKC2制动器项目开发计划测试', () => {
  
  const mockMKC2Context: GanttContext = {
    projectId: 'mkc2_braking_system',
    tasks: [
      // 系统需求
      { id: 'm1', title: '客户需求收集与分析', status: 'Completed', completedPercent: 100, priority: 'High' } as any,
      { id: 'm2', title: '竞品制动系统对标分析(Benchmark)', status: 'Completed', completedPercent: 100, priority: 'High' } as any,
      { id: 'm3', title: '系统需求规格书(SRS)', status: 'Completed', completedPercent: 100, priority: 'Critical' } as any,
      { id: 'm4', title: '功能安全需求(HARA分析)', status: 'InProgress', completedPercent: 80, priority: 'Critical' } as any,
      { id: 'm5', title: '网络安全需求(TARA分析)', status: 'InProgress', completedPercent: 60, priority: 'High' } as any,
      { id: 'm6', title: 'DFMEA潜在失效分析', status: 'InProgress', completedPercent: 40, priority: 'Critical' } as any,
      
      // 系统设计
      { id: 'm7', title: '系统架构设计(One-Box方案)', status: 'InProgress', completedPercent: 20, priority: 'Critical' } as any,
      { id: 'm8', title: '液压系统方案设计', status: 'NotStarted', completedPercent: 0, priority: 'Critical' } as any,
      { id: 'm9', title: '电机选型与传动设计', status: 'NotStarted', completedPercent: 0, priority: 'Critical' } as any,
      { id: 'm10', title: '冗余安全架构设计', status: 'NotStarted', completedPercent: 0, priority: 'Critical' } as any,
      
      // 硬件
      { id: 'm11', title: '主缸阀体设计开发', status: 'NotStarted', completedPercent: 0, priority: 'Critical' } as any,
      { id: 'm12', title: 'ESC控制器PCB设计', status: 'NotStarted', completedPercent: 0, priority: 'Critical' } as any,
      { id: 'm13', title: '无刷直流电机(BLDC)开发', status: 'NotStarted', completedPercent: 0, priority: 'Critical' } as any,
      
      // 软件
      { id: 'm14', title: 'MCAL底层驱动开发', status: 'NotStarted', completedPercent: 0, priority: 'Critical' } as any,
      { id: 'm15', title: '电机控制算法开发(FOC)', status: 'NotStarted', completedPercent: 0, priority: 'Critical' } as any,
      { id: 'm16', title: '液压控制算法开发', status: 'NotStarted', completedPercent: 0, priority: 'Critical' } as any,
      { id: 'm17', title: 'ABS控制算法开发', status: 'NotStarted', completedPercent: 0, priority: 'High' } as any,
      { id: 'm18', title: 'ESC车身稳定控制开发', status: 'NotStarted', completedPercent: 0, priority: 'Critical' } as any,
      { id: 'm19', title: 'EPB电子驻车制动开发', status: 'NotStarted', completedPercent: 0, priority: 'High' } as any,
      { id: 'm20', title: '线控制动解耦算法开发', status: 'InProgress', completedPercent: 25, priority: 'Critical' } as any,
      { id: 'm21', title: '能量回收策略开发', status: 'NotStarted', completedPercent: 0, priority: 'High' } as any,
      { id: 'm22', title: '功能安全监控(E2E/SafeMonitor)', status: 'InProgress', completedPercent: 30, priority: 'Critical' } as any,
      { id: 'm23', title: '网络安全模块开发(HSM/Crypto)', status: 'NotStarted', completedPercent: 0, priority: 'High' } as any,
      
      // 标定
      { id: 'm24', title: '基础制动性能标定', status: 'NotStarted', completedPercent: 0, priority: 'Critical' } as any,
      { id: 'm25', title: 'ABS标定(低附/高附/对接)', status: 'NotStarted', completedPercent: 0, priority: 'Critical' } as any,
      { id: 'm26', title: 'ESC标定(稳态/瞬态/切换)', status: 'NotStarted', completedPercent: 0, priority: 'Critical' } as any,
      { id: 'm27', title: '踏板感标定(解耦特性)', status: 'NotStarted', completedPercent: 0, priority: 'High' } as any,
      { id: 'm28', title: '冬季低温标定(-30℃)', status: 'NotStarted', completedPercent: 0, priority: 'Critical' } as any,
      { id: 'm29', title: '夏季高温标定(50℃)', status: 'NotStarted', completedPercent: 0, priority: 'Critical' } as any,
      
      // 测试
      { id: 'm30', title: 'HIL硬件在环测试', status: 'NotStarted', completedPercent: 0, priority: 'Critical' } as any,
      { id: 'm31', title: '台架性能测试', status: 'NotStarted', completedPercent: 0, priority: 'Critical' } as any,
      { id: 'm32', title: 'EMC电磁兼容测试', status: 'NotStarted', completedPercent: 0, priority: 'Critical' } as any,
      { id: 'm33', title: '耐久寿命测试(100万次)', status: 'NotStarted', completedPercent: 0, priority: 'Critical' } as any,
      { id: 'm34', title: '实车匹配测试', status: 'NotStarted', completedPercent: 0, priority: 'Critical' } as any,
      { id: 'm35', title: 'ADAS联调测试(AEB/ACC)', status: 'NotStarted', completedPercent: 0, priority: 'Critical' } as any,
      { id: 'm36', title: '功能安全验证(FTA/FMEA)', status: 'NotStarted', completedPercent: 0, priority: 'Critical' } as any,
      { id: 'm37', title: '法规认证测试(ECE R13/GB)', status: 'NotStarted', completedPercent: 0, priority: 'Critical' } as any,
      
      // 量产
      { id: 'm38', title: 'PFMEA过程失效分析', status: 'NotStarted', completedPercent: 0, priority: 'High' } as any,
      { id: 'm39', title: '试生产(PPAP)', status: 'NotStarted', completedPercent: 0, priority: 'Critical' } as any,
      
      // 里程碑
      { id: 'tr1', title: 'TR1-需求冻结', status: 'Completed', taskType: 'milestone' } as any,
      { id: 'tr2', title: 'TR2-方案冻结', status: 'InProgress', taskType: 'milestone' } as any,
      { id: 'tr3', title: 'TR3-设计冻结', status: 'NotStarted', taskType: 'milestone' } as any,
      { id: 'tr4', title: 'TR4-工程样件', status: 'NotStarted', taskType: 'milestone' } as any,
      { id: 'tr5', title: 'TR5-生产样件', status: 'NotStarted', taskType: 'milestone' } as any,
      { id: 'tr6', title: 'TR6-SOP量产', status: 'NotStarted', taskType: 'milestone' } as any
    ],
    buckets: []
  };

  it('🔧 MKC2项目结构验证', () => {
    console.log('\n' + '='.repeat(80));
    console.log('🔧 MKC2线控制动系统项目');
    console.log('='.repeat(80));
    
    const phases = {
      '系统需求': mockMKC2Context.tasks.filter(t => 
        t.title.includes('需求') || t.title.includes('HARA') || t.title.includes('TARA') || t.title.includes('DFMEA')
      ).length,
      '系统设计': mockMKC2Context.tasks.filter(t => 
        t.title.includes('设计') || t.title.includes('架构') || t.title.includes('选型')
      ).length,
      '硬件开发': mockMKC2Context.tasks.filter(t => 
        t.title.includes('主缸') || t.title.includes('PCB') || t.title.includes('电机') || t.title.includes('阀体')
      ).length,
      '软件开发': mockMKC2Context.tasks.filter(t => 
        t.title.includes('开发') && (t.title.includes('算法') || t.title.includes('MCAL') || t.title.includes('BSW'))
      ).length,
      '标定匹配': mockMKC2Context.tasks.filter(t => t.title.includes('标定')).length,
      '测试验证': mockMKC2Context.tasks.filter(t => 
        t.title.includes('测试') || t.title.includes('验证') || t.title.includes('HIL')
      ).length,
      '量产准备': mockMKC2Context.tasks.filter(t => 
        t.title.includes('PFMEA') || t.title.includes('PPAP') || t.title.includes('生产')
      ).length,
      '里程碑': mockMKC2Context.tasks.filter(t => t.taskType === 'milestone').length
    };
    
    console.log('\n   项目阶段分布:');
    Object.entries(phases).forEach(([phase, count]) => {
      if (count > 0) {
        console.log(`      ${phase}: ${count} 个任务`);
      }
    });
    
    console.log(`\n   总任务数: ${mockMKC2Context.tasks.length}`);
    console.log(`   里程碑数: ${phases['里程碑']}`);
    
    expect(mockMKC2Context.tasks.length).toBeGreaterThan(35);
    expect(phases['里程碑']).toBe(6);
  });

  it('⚡ One-Box线控技术特性', () => {
    console.log('\n' + '='.repeat(80));
    console.log('⚡ MKC2 One-Box线控制动技术');
    console.log('='.repeat(80));
    
    const xByWireTasks = mockMKC2Context.tasks.filter(t => 
      t.title.includes('线控') || 
      t.title.includes('解耦') ||
      t.title.includes('电机') ||
      t.title.includes('踏板感')
    );
    
    console.log('\n   线控制动核心任务:');
    xByWireTasks.forEach((task, i) => {
      const emoji = task.title.includes('解耦') ? '🔑' : 
                   task.title.includes('踏板') ? '👣' : '⚡';
      console.log(`   ${i + 1}. ${emoji} ${task.title} [${task.priority}]`);
    });
    
    console.log('\n   技术特点:');
    console.log('   • One-Box集成式架构 (ESC+eBooster+EPB三合一)');
    console.log('   • 电机助力解耦 (100%解耦率)');
    console.log('   • 支持L3/L4自动驾驶');
    console.log('   • 再生制动最大化');
    
    expect(xByWireTasks.length).toBeGreaterThan(0);
  });

  it('🛡️ 功能安全与网络安全', () => {
    console.log('\n' + '='.repeat(80));
    console.log('🛡️ ASIL-D功能安全 + 网络安全');
    console.log('='.repeat(80));
    
    const safetyTasks = mockMKC2Context.tasks.filter(t => 
      t.title.includes('功能安全') || 
      t.title.includes('HARA') || 
      t.title.includes('E2E') ||
      t.title.includes('SafeMonitor') ||
      t.title.includes('冗余')
    );
    
    const securityTasks = mockMKC2Context.tasks.filter(t => 
      t.title.includes('网络安全') || 
      t.title.includes('TARA') || 
      t.title.includes('HSM') ||
      t.title.includes('Crypto')
    );
    
    console.log('\n   功能安全任务:');
    safetyTasks.forEach((task, i) => {
      console.log(`   ${i + 1}. 🛡️ ${task.title}`);
    });
    
    console.log('\n   网络安全任务:');
    securityTasks.forEach((task, i) => {
      console.log(`   ${i + 1}. 🔐 ${task.title}`);
    });
    
    console.log('\n   安全等级:');
    console.log('   • 功能安全: ASIL-D (最高等级)');
    console.log('   • 网络安全: ISO/SAE 21434');
    
    expect(safetyTasks.length).toBeGreaterThan(0);
  });

  it('🤖 ADAS集成与自动驾驶支持', () => {
    console.log('\n' + '='.repeat(80));
    console.log('🤖 ADAS集成与自动驾驶支持');
    console.log('='.repeat(80));
    
    const adasTasks = mockMKC2Context.tasks.filter(t => 
      t.title.includes('ADAS') || 
      t.title.includes('AEB') || 
      t.title.includes('ACC') ||
      t.title.includes('自动驾驶')
    );
    
    console.log('\n   ADAS集成任务:');
    adasTasks.forEach((task, i) => {
      console.log(`   ${i + 1}. 🤖 ${task.title}`);
    });
    
    console.log('\n   支持功能:');
    console.log('   • AEB自动紧急制动');
    console.log('   • ACC自适应巡航');
    console.log('   • L3/L4自动驾驶冗余');
    console.log('   • 请求式制动 (Requested Braking)');
    
    expect(adasTasks.length).toBeGreaterThan(0);
  });

  it('🔋 能量回收系统', () => {
    console.log('\n' + '='.repeat(80));
    console.log('🔋 新能源车能量回收系统');
    console.log('='.repeat(80));
    
    const regenTasks = mockMKC2Context.tasks.filter(t => 
      t.title.includes('能量回收') || 
      t.title.includes('再生制动')
    );
    
    console.log('\n   能量回收相关:');
    regenTasks.forEach((task, i) => {
      console.log(`   ${i + 1}. 🔋 ${task.title}`);
    });
    
    console.log('\n   技术特性:');
    console.log('   • 解耦式能量回收 (不影响踏板感)');
    console.log('   • 回收效率最大化');
    console.log('   • 平滑的回收力度控制');
    
    expect(regenTasks.length).toBeGreaterThan(0);
  });

  it('🌍 法规认证规划', () => {
    console.log('\n' + '='.repeat(80));
    console.log('🌍 法规认证规划');
    console.log('='.repeat(80));
    
    const regulationTasks = mockMKC2Context.tasks.filter(t => 
      t.title.includes('法规') || 
      t.title.includes('认证') || 
      t.title.includes('ECE') ||
      t.title.includes('GB')
    );
    
    console.log('\n   法规认证任务:');
    regulationTasks.forEach((task, i) => {
      console.log(`   ${i + 1}. 🌍 ${task.title}`);
    });
    
    console.log('\n   认证范围:');
    console.log('   • 国内: GB标准 + CCC认证');
    console.log('   • 欧盟: ECE R13 + WVTA');
    console.log('   • 功能安全: ISO 26262 ASIL-D');
    
    expect(regulationTasks.length).toBeGreaterThan(0);
  });

  it('🔮 MKC2项目风险预测', () => {
    console.log('\n' + '='.repeat(80));
    console.log('🔮 MKC2项目风险预测');
    console.log('='.repeat(80));
    
    // 检测行业
    const detectedIndustry = detectIndustryType(mockMKC2Context.tasks);
    console.log(`\n   检测行业: ${detectedIndustry}`);
    
    // 行业风险分析
    const risks = predictiveEngine.analyzeIndustryRisks(mockMKC2Context, detectedIndustry);
    console.log(`\n   识别到 ${risks.length} 个行业特定风险`);
    
    // 线控制动解耦算法风险
    const decoupleTask = mockMKC2Context.tasks.find(t => t.title.includes('线控制动解耦'));
    if (decoupleTask) {
      const prediction = predictiveEngine.predictTaskDelay(decoupleTask);
      console.log('\n   线控制动解耦算法风险:');
      console.log(`      准时概率: ${prediction.onTimeProbability}%`);
      console.log(`      预计延期: ${prediction.predictedDelay}天`);
      console.log(`      风险因素: ${prediction.riskFactors.length}个`);
      
      prediction.riskFactors.forEach((rf, i) => {
        console.log(`      ${i + 1}. [${rf.severity}] ${rf.type}: ${rf.description.slice(0, 40)}...`);
      });
    }
    
    // 生成项目报告
    const report = predictiveEngine.generateIndustryReport(mockMKC2Context, detectedIndustry);
    
    console.log('\n   项目健康度:');
    console.log(`      评分: ${report.overallHealth.score}/100`);
    console.log(`      状态: ${report.overallHealth.status}`);
    console.log(`      平均准时率: ${report.avgOnTimeProbability}%`);
    
    expect(report.overallHealth.score).toBeGreaterThanOrEqual(0);
    expect(detectedIndustry).toBe('automotive');
  });

  it('📊 MKC2开发计划总结', () => {
    console.log('\n' + '='.repeat(80));
    console.log('📊 MKC2线控制动开发计划总结');
    console.log('='.repeat(80));
    
    console.log(`
┌──────────────────────────────────────────────────────────────────────────────┐
│                  🔧 MKC2 One-Box线控制动系统开发计划                            │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  📋 项目概况                                                                   │
│  ──────────────────────────────────────────────────────────────────────────  │
│  • 产品名称: MKC2 One-Box线控制动系统                                         │
│  • 开发周期: 18个月                                                          │
│  • 架构类型: One-Box集成式 (ESC+eBooster+EPB)                                │
│  • 支持车型: 高端乘用车 (L3/L4自动驾驶)                                       │
│  • 任务总数: 40+                                                             │
│                                                                              │
│  ⚡ 核心技术                                                                   │
│  ──────────────────────────────────────────────────────────────────────────  │
│  • 线控解耦: 100%解耦率，支持自动驾驶                                         │
│  • 电机助力: 无刷直流电机(BLDC) + FOC控制                                     │
│  • 液压控制: 高精度压力控制 (±0.1MPa)                                        │
│  • 功能安全: ASIL-D等级 + 冗余架构                                            │
│  • 网络安全: HSM硬件加密 + 安全启动                                           │
│  • 能量回收: 解耦式再生制动，最大化回收效率                                    │
│                                                                              │
│  🛡️ 功能安全设计                                                               │
│  ──────────────────────────────────────────────────────────────────────────  │
│  • 双冗余电机驱动 (主+备)                                                    │
│  • 双冗余压力传感器                                                          │
│  • 双绕组电机设计                                                            │
│  • E2E端到端保护                                                             │
│  • SafeMonitor安全监控                                                       │
│                                                                              │
│  🏗️ 开发阶段                                                                   │
│  ──────────────────────────────────────────────────────────────────────────  │
│  Phase 1: 系统需求 (3个月)                                                   │
│           需求定义 → HARA/TARA → DFMEA → TR1                                  │
│                                                                              │
│  Phase 2: 系统设计 (4个月)                                                   │
│           架构设计 → 液压设计 → 电机选型 → 冗余设计 → TR2                      │
│                                                                              │
│  Phase 3: 硬件开发 (5个月)                                                   │
│           阀体/PCB/电机/传感器开发 → TR3                                       │
│                                                                              │
│  Phase 4: 软件开发 (6个月)                                                   │
│           MCAL/BSW/算法/安全/通信开发 → TR4                                    │
│                                                                              │
│  Phase 5: 标定匹配 (4个月)                                                   │
│           基础标定 → ABS/ESC标定 → 三高标定 → TR5                              │
│                                                                              │
│  Phase 6: 测试验证 (5个月)                                                   │
│           HIL/台架/实车/ADAS联调/法规认证 → TR6                                │
│                                                                              │
│  Phase 7: 量产准备 (3个月)                                                   │
│           PFMEA/产线/PPAP → SOP量产                                            │
│                                                                              │
│  🎯 关键成功因素                                                                │
│  ──────────────────────────────────────────────────────────────────────────  │
│  • 线控制动解耦算法按时交付 (关键技术)                                        │
│  • 功能安全ASIL-D认证一次通过 (最高等级)                                      │
│  • ADAS联调测试顺利完成 (自动驾驶支持)                                        │
│  • 法规认证(ECE/GB)一次通过 (市场准入)                                        │
│  • 耐久测试100万次无故障 (可靠性)                                             │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
`);
    
    console.log('✅ MKC2制动器开发计划制定完成');
    console.log('⚡ One-Box线控技术 + ASIL-D功能安全');
    console.log('🤖 支持L3/L4自动驾驶');
  });
});
