/**
 * 旧房改造项目 - Agent 演示测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GanttAgent } from '../SimpleGanttAgent';
import { GanttContext } from '../../types';

describe('🏠 旧房改造项目演示', () => {
  let agent: GanttAgent;
  let context: GanttContext;
  
  beforeEach(() => {
    agent = new GanttAgent();
    context = {
      projectId: 'renovation_2026',
      tasks: [],
      buckets: []
    };
  });
  
  it('完整项目流程：从创建到风险评估', async () => {
    console.log('\n' + '='.repeat(60));
    console.log('🏠 旧房改造项目 - Agent 完整演示');
    console.log('='.repeat(60));
    
    // ========== Level 1: 创建任务 ==========
    console.log('\n📋 【Level 1】创建改造任务\n');
    
    const taskNames = [
      '设计方案确定',
      '拆除旧装修', 
      '水电改造',
      '防水处理',
      '瓦工铺砖',
      '木工制作',
      '油漆涂刷',
      '安装橱柜',
      '灯具安装',
      '清洁验收'
    ];
    
    for (let i = 0; i < taskNames.length; i++) {
      const result = await agent.process(`创建任务${taskNames[i]}`, context);
      expect(result.success).toBe(true);
      // 确保每个任务ID唯一
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    console.log(`✅ 已创建 ${context.tasks.length} 个任务`);
    context.tasks.forEach((t, i) => {
      console.log(`   ${i + 1}. ${t.title}`);
    });
    
    // ========== Level 2: 设置依赖 & 排期 ==========
    console.log('\n📋 【Level 2】设置依赖关系 & 自动排期\n');
    
    // 设置依赖链：设计 → 拆除 → 水电 → 防水 → 瓦工 → 木工 → 油漆 → (橱柜/灯具) → 验收
    console.log('\n设置依赖关系:');
    const depChain = [
      { taskIdx: 1, depIdx: 0 },   // 拆除 依赖 设计
      { taskIdx: 2, depIdx: 1 },   // 水电 依赖 拆除
      { taskIdx: 3, depIdx: 2 },   // 防水 依赖 水电
      { taskIdx: 4, depIdx: 3 },   // 瓦工 依赖 防水
      { taskIdx: 5, depIdx: 4 },   // 木工 依赖 瓦工
      { taskIdx: 6, depIdx: 5 },   // 油漆 依赖 木工
      { taskIdx: 7, depIdx: 6 },   // 橱柜 依赖 油漆
      { taskIdx: 8, depIdx: 6 },   // 灯具 依赖 油漆
      { taskIdx: 9, depIdx: 7 }    // 验收 依赖 橱柜
    ];
    
    for (const { taskIdx, depIdx } of depChain) {
      const taskId = context.tasks[taskIdx].id;
      const depId = context.tasks[depIdx].id;
      console.log(`  ${context.tasks[taskIdx].title} (${taskId}) -> 依赖 -> ${context.tasks[depIdx].title} (${depId})`);
      context.tasks[taskIdx].dependencies = [depId];
    }
    
    console.log('\n任务依赖详情:');
    context.tasks.forEach((t, i) => {
      console.log(`  ${i}. ${t.title}: id=${t.id}, deps=${JSON.stringify(t.dependencies)}`);
    });
    
    const scheduleResult = await agent.process('自动排期从2026-03-10开始', context);
    expect(scheduleResult.success).toBe(true);
    expect(scheduleResult.data.criticalPath).toBeDefined();
    
    console.log(`✅ ${scheduleResult.message}`);
    console.log(`\n📅 项目时间线:`);
    console.log(`   总工期: ${scheduleResult.data.totalDuration} 天`);
    console.log(`   关键路径: ${scheduleResult.data.criticalPath.length} 个任务`);
    
    // 显示前5个任务的排期
    context.tasks.slice(0, 5).forEach((t, i) => {
      const start = t.startDateTime ? new Date(t.startDateTime).toISOString().split('T')[0] : 'N/A';
      const end = t.dueDateTime ? new Date(t.dueDateTime).toISOString().split('T')[0] : 'N/A';
      console.log(`   ${i + 1}. ${t.title}: ${start} ~ ${end}`);
    });
    
    // ========== Level 3: 保存项目 ==========
    console.log('\n📋 【Level 3】保存项目状态\n');
    
    const saveResult = await agent.process('保存项目', context);
    expect(saveResult.success).toBe(true);
    console.log(`✅ 项目已保存`);
    
    const stats = agent.getStats();
    console.log(`\n📊 项目统计:`);
    console.log(`   对话轮数: ${stats.totalTurns}`);
    console.log(`   历史记录: ${stats.totalHistory} 条`);
    
    // ========== Level 4: 风险评估 ==========
    console.log('\n📋 【Level 4】风险评估 & 智能建议\n');
    
    // 模拟水电改造进度滞后（制造风险场景）
    context.tasks[2].status = 'InProgress';
    context.tasks[2].completedPercent = 15; // 仅完成15%
    
    const riskResult = await agent.process('全面风险评估', context);
    expect(riskResult.success).toBe(true);
    expect(riskResult.data.riskScore).toBeDefined();
    
    console.log(`✅ 风险评估完成`);
    console.log(`\n⚠️ 风险报告:`);
    console.log(`   风险等级: ${riskResult.data.overallRisk}`);
    console.log(`   风险分数: ${riskResult.data.riskScore}/100`);
    
    if (riskResult.data.delayRisks?.length > 0) {
      console.log(`\n🚨 延期风险预警:`);
      riskResult.data.delayRisks.forEach((risk: any) => {
        console.log(`   • ${risk.taskName}: ${risk.reason}`);
        console.log(`     概率: ${(risk.probability * 100).toFixed(0)}%, 影响: ${risk.impact}`);
      });
    }
    
    if (riskResult.data.mitigation?.length > 0) {
      console.log(`\n💡 建议措施:`);
      riskResult.data.mitigation.forEach((action: any, i: number) => {
        console.log(`   ${i + 1}. ${action.description}`);
      });
    }
    
    // 获取优化建议
    const suggestionResult = await agent.process('获取智能建议', context);
    expect(suggestionResult.success).toBe(true);
    
    console.log(`\n💡 优化建议:`);
    if (suggestionResult.data?.suggestions?.length > 0) {
      suggestionResult.data.suggestions.slice(0, 3).forEach((s: any, i: number) => {
        console.log(`   ${i + 1}. [${s.priority}] ${s.title}`);
        console.log(`      ${s.description}`);
      });
    }
    
    // ========== 项目总结 ==========
    console.log('\n' + '='.repeat(60));
    console.log('🎉 旧房改造项目演示完成！');
    console.log('='.repeat(60));
    console.log(`\n📊 项目总结:`);
    console.log(`   • 总任务数: ${context.tasks.length}`);
    console.log(`   • 预计工期: ${scheduleResult.data.totalDuration} 天`);
    console.log(`   • 风险等级: ${riskResult.data.overallRisk}`);
    console.log(`   • 建议措施: ${riskResult.data.mitigation?.length || 0} 条`);
    console.log('\n✅ 所有测试通过！\n');
  });
  
  it('支持自然语言交互', async () => {
    console.log('\n💬 自然语言交互示例:\n');
    
    // 创建任务
    const r1 = await agent.process('创建一个任务叫厨房改造', context);
    expect(r1.success).toBe(true);
    console.log(`用户: "创建一个任务叫厨房改造"`);
    console.log(`Agent: "${r1.message}"`);
    
    // 查询任务
    const r2 = await agent.process('查看所有任务', context);
    expect(r2.success).toBe(true);
    console.log(`\n用户: "查看所有任务"`);
    console.log(`Agent: "${r2.message}"`);
    
    // 更新状态
    const r3 = await agent.process('更新第0个任务状态为进行中', context);
    expect(r3.success).toBe(true);
    console.log(`\n用户: "更新第0个任务状态为进行中"`);
    console.log(`Agent: "${r3.message}"`);
    
    // 风险检查
    const r4 = await agent.process('检查风险', context);
    expect(r4.success).toBe(true);
    console.log(`\n用户: "检查风险"`);
    console.log(`Agent: "${r4.message}"`);
    
    console.log('\n✅ 自然语言交互测试通过！\n');
  });
});
