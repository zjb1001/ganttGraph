/**
 * 旧房改造项目 - Agent 完整演示
 * 测试所有 4 个 Level 的功能
 */

import { GanttAgent } from '../SimpleGanttAgent';
import { GanttContext } from '../../types';

async function runRenovationDemo() {
  console.log('🏠 旧房改造项目 - Agent 演示\n');
  console.log('=' .repeat(50));
  
  const agent = new GanttAgent();
  const context: GanttContext = {
    projectId: 'renovation_2026',
    tasks: [],
    buckets: []
  };
  
  // ========== Level 1: 创建任务 ==========
  console.log('\n📋 Level 1: 创建改造任务\n');
  
  const tasks = [
    { title: '设计方案确定', days: 5 },
    { title: '拆除旧装修', days: 3 },
    { title: '水电改造', days: 7 },
    { title: '防水处理', days: 3 },
    { title: '瓦工铺砖', days: 5 },
    { title: '木工制作', days: 7 },
    { title: '油漆涂刷', days: 5 },
    { title: '安装橱柜', days: 2 },
    { title: '灯具安装', days: 1 },
    { title: '清洁验收', days: 2 }
  ];
  
  for (const task of tasks) {
    const result = await agent.process(
      `创建任务${task.title}，持续${task.days}天`, 
      context
    );
    console.log(`✅ ${result.message}`);
  }
  
  console.log(`\n📊 已创建 ${context.tasks.length} 个任务`);
  
  // ========== Level 2: 设置依赖 & 自动排期 ==========
  console.log('\n📋 Level 2: 设置依赖关系 & 自动排期\n');
  
  // 手动设置依赖（实际项目中可以通过自然语言识别）
  const dependencies = [
    { task: 1, dependsOn: [0] },      // 拆除 -> 设计
    { task: 2, dependsOn: [1] },      // 水电 -> 拆除
    { task: 3, dependsOn: [2] },      // 防水 -> 水电
    { task: 4, dependsOn: [3] },      // 瓦工 -> 防水
    { task: 5, dependsOn: [4] },      // 木工 -> 瓦工
    { task: 6, dependsOn: [5] },      // 油漆 -> 木工
    { task: 7, dependsOn: [6] },      // 橱柜 -> 油漆
    { task: 8, dependsOn: [6] },      // 灯具 -> 油漆
    { task: 9, dependsOn: [7, 8] }    // 验收 -> 橱柜+灯具
  ];
  
  for (const dep of dependencies) {
    context.tasks[dep.task].dependencies = dep.dependsOn.map(i => context.tasks[i].id);
  }
  
  // 自动排期
  const scheduleResult = await agent.process('自动排期从2026-03-10开始', context);
  console.log(`✅ ${scheduleResult.message}`);
  
  // 显示排期结果
  console.log('\n📅 排期结果:');
  context.tasks.forEach((task, i) => {
    const start = task.startDateTime ? new Date(task.startDateTime).toISOString().split('T')[0] : 'N/A';
    const end = task.dueDateTime ? new Date(task.dueDateTime).toISOString().split('T')[0] : 'N/A';
    console.log(`  ${i + 1}. ${task.title}`);
    console.log(`     📆 ${start} ~ ${end}`);
  });
  
  // ========== Level 3: 保存项目 ==========
  console.log('\n📋 Level 3: 保存项目状态\n');
  
  const saveResult = await agent.process('保存项目', context);
  console.log(`✅ ${saveResult.message}`);
  
  const stats = agent.getStats();
  console.log(`\n📊 项目统计:`);
  console.log(`  - 对话轮数: ${stats.totalTurns}`);
  console.log(`  - 历史记录: ${stats.totalHistory}`);
  console.log(`  - 已保存项目: ${stats.savedProjects}`);
  
  // ========== Level 4: 风险评估 & 智能建议 ==========
  console.log('\n📋 Level 4: 风险评估 & 智能建议\n');
  
  // 模拟一些风险情况
  context.tasks[2].completedPercent = 20;  // 水电进度20%
  context.tasks[2].status = 'InProgress';
  
  const riskResult = await agent.process('全面风险评估', context);
  console.log(`✅ ${riskResult.message}`);
  
  if (riskResult.data) {
    console.log(`\n⚠️ 风险等级: ${riskResult.data.overallRisk}`);
    console.log(`📈 风险分数: ${riskResult.data.riskScore}/100`);
    
    if (riskResult.data.delayRisks?.length > 0) {
      console.log(`\n🚨 延期风险:`);
      riskResult.data.delayRisks.forEach((risk: any) => {
        console.log(`  - ${risk.taskName}: ${risk.reason} (概率: ${(risk.probability * 100).toFixed(0)}%)`);
      });
    }
    
    if (riskResult.data.mitigation?.length > 0) {
      console.log(`\n💡 缓解措施:`);
      riskResult.data.mitigation.forEach((action: any, i: number) => {
        console.log(`  ${i + 1}. ${action.description}`);
      });
    }
  }
  
  // 获取智能建议
  const suggestionResult = await agent.process('获取智能建议', context);
  console.log(`\n✅ ${suggestionResult.message}`);
  
  if (suggestionResult.data?.suggestions?.length > 0) {
    console.log(`\n💡 优化建议:`);
    suggestionResult.data.suggestions.slice(0, 3).forEach((s: any, i: number) => {
      console.log(`  ${i + 1}. [${s.priority}] ${s.title}`);
      console.log(`     ${s.description}`);
    });
  }
  
  // ========== 最终总结 ==========
  console.log('\n' + '='.repeat(50));
  console.log('\n🎉 旧房改造项目 Agent 演示完成！\n');
  console.log(`📊 项目概况:`);
  console.log(`  - 总任务数: ${context.tasks.length}`);
  console.log(`  - 预计工期: ${calculateTotalDuration(context.tasks)} 天`);
  console.log(`  - 关键路径: ${getCriticalPath(context.tasks).join(' → ')}`);
  
  // 导出项目状态
  const exportData = agent.exportState(context);
  console.log(`\n💾 项目数据已导出，可用于后续恢复`);
}

function calculateTotalDuration(tasks: any[]): number {
  if (tasks.length === 0) return 0;
  const startDates = tasks.map(t => t.startDateTime ? new Date(t.startDateTime).getTime() : Date.now());
  const endDates = tasks.map(t => t.dueDateTime ? new Date(t.dueDateTime).getTime() : Date.now());
  const minStart = Math.min(...startDates);
  const maxEnd = Math.max(...endDates);
  return Math.ceil((maxEnd - minStart) / (24 * 60 * 60 * 1000));
}

function getCriticalPath(tasks: any[]): string[] {
  // 简化版：找出最长的依赖链
  const result: string[] = [];
  const visited = new Set<string>();
  
  // 找到没有依赖的任务作为起点
  const startTasks = tasks.filter(t => !t.dependencies || t.dependencies.length === 0);
  
  if (startTasks.length > 0) {
    // 简化处理：按顺序列出任务
    tasks.forEach(t => {
      if (!visited.has(t.id)) {
        result.push(t.title);
        visited.add(t.id);
      }
    });
  }
  
  return result.slice(0, 5); // 只显示前5个
}

// 运行演示
runRenovationDemo().catch(console.error);
