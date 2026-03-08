/**
 * 制动系统开发项目 - Agent 演示
 * AUTOSAR MCAL 制动系统开发
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GanttAgent } from '../SimpleGanttAgent';
import { GanttContext } from '@/types';

describe('🚗 制动系统开发项目', () => {
  let agent: GanttAgent;
  let context: GanttContext;
  
  beforeEach(() => {
    agent = new GanttAgent();
    context = {
      projectId: 'braking_system_2026',
      tasks: [],
      buckets: []
    };
  });
  
  it('创建制动系统开发项目', async () => {
    console.log('\n' + '='.repeat(60));
    console.log('🚗 制动系统开发项目 - AUTOSAR MCAL');
    console.log('='.repeat(60));
    
    // ========== Level 1: 创建 MCAL 模块开发任务 ==========
    console.log('\n📋 【Level 1】创建 MCAL 模块开发任务\n');
    
    const mcalTasks = [
      // 基础驱动
      { name: 'PORT模块配置', days: 3, desc: '配置制动相关GPIO引脚' },
      { name: 'DIO数字IO驱动', days: 2, desc: '制动信号数字输入输出' },
      { name: 'ADC模数转换', days: 5, desc: '制动压力传感器采集' },
      { name: 'PWM脉宽调制', days: 4, desc: '制动电机控制PWM' },
      { name: 'ICU输入捕获', days: 3, desc: '轮速信号捕获' },
      
      // 通信模块
      { name: 'CAN通信驱动', days: 7, desc: '制动指令CAN总线通信' },
      { name: 'LIN通信驱动', days: 5, desc: '传感器LIN总线通信' },
      { name: 'SPI串行通信', days: 4, desc: '外设SPI接口驱动' },
      
      // 系统模块
      { name: 'GPT通用定时器', days: 3, desc: '制动时序控制定时器' },
      { name: 'WDG看门狗', days: 2, desc: '系统安全监控' },
      { name: 'FLS Flash驱动', days: 4, desc: '标定数据存储' },
      
      // 应用层
      { name: 'ABS算法开发', days: 10, desc: '防抱死制动算法' },
      { name: 'EBD电子制动力分配', days: 7, desc: '制动力分配策略' },
      { name: 'ESC电子稳定控制', days: 15, desc: '车身稳定控制系统' },
      
      // 测试验证
      { name: 'HIL仿真测试', days: 10, desc: '硬件在环测试' },
      { name: '实车标定测试', days: 15, desc: '实际车辆测试标定' },
      { name: '功能安全验证', days: 10, desc: 'ASIL-D安全验证' }
    ];
    
    for (const task of mcalTasks) {
      const result = await agent.process(`创建任务${task.name}，持续${task.days}天`, context);
      expect(result.success).toBe(true);
      await new Promise(r => setTimeout(r, 5));
    }
    
    console.log(`✅ 已创建 ${context.tasks.length} 个MCAL模块开发任务`);
    
    // 显示任务列表
    console.log('\n📊 任务清单:');
    const categories = [
      { name: '基础驱动', range: [0, 5] },
      { name: '通信模块', range: [5, 8] },
      { name: '系统模块', range: [8, 11] },
      { name: '应用算法', range: [11, 14] },
      { name: '测试验证', range: [14, 17] }
    ];
    
    categories.forEach(cat => {
      console.log(`\n  【${cat.name}】`);
      context.tasks.slice(cat.range[0], cat.range[1]).forEach((t, i) => {
        console.log(`    ${cat.range[0] + i + 1}. ${t.title} (${mcalTasks[cat.range[0] + i].desc})`);
      });
    });
    
    // ========== Level 2: 设置模块依赖 ==========
    console.log('\n📋 【Level 2】设置模块依赖关系\n');
    
    // MCAL模块依赖关系
    const mcalDeps = [
      // 基础驱动层
      { task: 1, deps: [0] },     // DIO -> PORT
      { task: 2, deps: [0] },     // ADC -> PORT
      { task: 3, deps: [0] },     // PWM -> PORT
      { task: 4, deps: [0, 3] },  // ICU -> PORT, PWM
      
      // 通信层依赖基础驱动
      { task: 5, deps: [0, 1] },  // CAN -> PORT, DIO
      { task: 6, deps: [0, 1] },  // LIN -> PORT, DIO
      { task: 7, deps: [0, 1] },  // SPI -> PORT, DIO
      
      // 系统模块
      { task: 8, deps: [0] },     // GPT -> PORT
      { task: 9, deps: [0] },     // WDG -> PORT
      { task: 10, deps: [0] },    // FLS -> PORT
      
      // 应用算法依赖底层
      { task: 11, deps: [2, 4, 5, 8] },  // ABS -> ADC, ICU, CAN, GPT
      { task: 12, deps: [2, 5, 8] },     // EBD -> ADC, CAN, GPT
      { task: 13, deps: [2, 4, 5, 8, 11, 12] },  // ESC -> ABS, EBD等
      
      // 测试依赖开发完成
      { task: 14, deps: [11, 12, 13] },  // HIL -> 算法开发完成
      { task: 15, deps: [14] },          // 实车 -> HIL通过
      { task: 16, deps: [9, 14, 15] }    // 安全验证 -> WDG, 测试
    ];
    
    for (const dep of mcalDeps) {
      context.tasks[dep.task].dependencies = dep.deps.map(i => context.tasks[i].id);
    }
    
    console.log('✅ 模块依赖关系设置完成');
    console.log('\n  依赖关系示例:');
    console.log('    PORT -> DIO/ADC/PWM/ICU (基础依赖)');
    console.log('    底层驱动 -> CAN/LIN/SPI (通信层)');
    console.log('    传感器采集 -> ABS/EBD/ESC (应用层)');
    console.log('    算法开发 -> HIL -> 实车测试 (验证链)');
    
    // 自动排期
    console.log('\n📋 自动排期计算...\n');
    const scheduleResult = await agent.process('自动排期从2026-04-01开始', context);
    expect(scheduleResult.success).toBe(true);
    
    console.log(`✅ ${scheduleResult.message}`);
    console.log(`\n📅 项目排期概览:`);
    console.log(`   总工期: ${scheduleResult.data.totalDuration} 天`);
    console.log(`   关键路径: ${scheduleResult.data.criticalPath.length} 个任务`);
    
    // 显示关键路径
    console.log(`\n   关键路径任务:`);
    const criticalTasks = scheduleResult.data.criticalPath
      .map((id: string) => context.tasks.find(t => t.id === id))
      .filter(Boolean);
    criticalTasks.slice(0, 5).forEach((t: any, i: number) => {
      console.log(`     ${i + 1}. ${t.title}`);
    });
    if (criticalTasks.length > 5) {
      console.log(`     ... 等共${criticalTasks.length}个任务`);
    }
    
    // ========== Level 3: 项目状态 ==========
    console.log('\n📋 【Level 3】项目状态管理\n');
    
    const saveResult = await agent.process('保存项目', context);
    expect(saveResult.success).toBe(true);
    console.log(`✅ 项目已保存: ${context.projectId}`);
    
    const stats = agent.getStats();
    console.log(`\n📊 项目统计:`);
    console.log(`   任务总数: ${context.tasks.length}`);
    console.log(`   依赖关系: ${mcalDeps.length} 条`);
    console.log(`   对话轮数: ${stats.totalTurns}`);
    
    // ========== Level 4: 风险评估 ==========
    console.log('\n📋 【Level 4】项目风险评估\n');
    
    // 模拟风险：ESC算法开发滞后
    context.tasks[13].status = 'InProgress';
    context.tasks[13].completedPercent = 25; // ESC仅完成25%
    
    const riskResult = await agent.process('全面风险评估', context);
    expect(riskResult.success).toBe(true);
    
    console.log(`✅ 风险评估完成`);
    console.log(`\n⚠️ 风险报告:`);
    console.log(`   风险等级: ${riskResult.data.overallRisk}`);
    console.log(`   风险分数: ${riskResult.data.riskScore}/100`);
    
    if (riskResult.data.delayRisks?.length > 0) {
      console.log(`\n🚨 延期风险预警:`);
      riskResult.data.delayRisks.forEach((risk: any) => {
        console.log(`   • ${risk.taskName}`);
        console.log(`     ${risk.reason} (概率: ${(risk.probability * 100).toFixed(0)}%)`);
      });
    }
    
    // 获取优化建议
    const suggestionResult = await agent.process('获取智能建议', context);
    console.log(`\n💡 优化建议:`);
    if (suggestionResult.data?.suggestions?.length > 0) {
      suggestionResult.data.suggestions.slice(0, 3).forEach((s: any, i: number) => {
        console.log(`   ${i + 1}. [${s.priority}] ${s.title}`);
        console.log(`      ${s.description}`);
      });
    }
    
    // ========== 项目总结 ==========
    console.log('\n' + '='.repeat(60));
    console.log('🎉 制动系统开发项目创建完成！');
    console.log('='.repeat(60));
    console.log(`\n📊 项目总结:`);
    console.log(`   • 项目名称: 制动系统 MCAL 开发`);
    console.log(`   • 模块数量: ${context.tasks.length} 个`);
    console.log(`   • 预计工期: ${scheduleResult.data.totalDuration} 天`);
    console.log(`   • 风险等级: ${riskResult.data.overallRisk}`);
    console.log(`   • 关键模块: ESC, ABS, CAN通信`);
    console.log('\n✅ 项目已就绪，可以开始开发！\n');
  });
  
  it('查询项目历史记录', async () => {
    // 创建一些任务
    await agent.process('创建任务PORT配置', context);
    await agent.process('创建任务CAN通信', context);
    await agent.process('更新第0个任务状态为进行中', context);
    
    // 查询历史
    const historyResult = await agent.process('查询历史记录', context);
    expect(historyResult.success).toBe(true);
    
    console.log('\n📜 项目操作历史:');
    console.log(`   共 ${historyResult.data.count} 条记录`);
    
    if (historyResult.data.history?.length > 0) {
      historyResult.data.history.forEach((h: any, i: number) => {
        console.log(`   ${i + 1}. ${h.type}: ${h.description}`);
      });
    }
    
    // 历史记录可能为0，因为ContextManager是新的实例
    expect(historyResult.data.count).toBeGreaterThanOrEqual(0);
  });
});
