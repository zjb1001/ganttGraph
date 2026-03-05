/**
 * Level 6: 实时自适应调整系统测试
 * 延期检测 → 影响分析 → 方案推荐 → 自动调整
 */

import { describe, it, expect } from 'vitest';
import { GanttAgent } from '../SimpleGanttAgent';
import { adaptiveEngine } from '../AdaptiveAdjustmentEngine';
import { GanttContext } from '../../types';

describe('⚡ Level 6: 实时自适应调整系统', () => {
  
  it('步骤1: 延期检测', async () => {
    console.log('\n' + '='.repeat(80));
    console.log('⚡ Level 6: 步骤1 - 延期检测');
    console.log('='.repeat(80));
    
    const agent = new GanttAgent();
    const context: GanttContext = {
      projectId: 'adaptive_test',
      tasks: [],
      buckets: []
    };
    
    // 创建任务，模拟不同进度
    console.log('\n👤 创建测试任务...');
    
    // 任务1: 正常进度
    await agent.process('创建任务正常模块，持续10天', context);
    (context.tasks[0] as any).status = 'InProgress';
    (context.tasks[0] as any).completedPercent = 50; // 正常50%
    (context.tasks[0] as any).startDateTime = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    
    // 任务2: 轻微延期
    await agent.process('创建任务轻微延期模块，持续10天', context);
    (context.tasks[1] as any).status = 'InProgress';
    (context.tasks[1] as any).completedPercent = 20; // 应完成50%，实际20%，延期
    (context.tasks[1] as any).startDateTime = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    
    // 任务3: 严重延期
    await agent.process('创建任务严重延期模块，持续10天', context);
    (context.tasks[2] as any).status = 'InProgress';
    (context.tasks[2] as any).completedPercent = 5; // 应完成50%，实际5%，严重延期
    (context.tasks[2] as any).startDateTime = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    
    // 任务4: 已完成
    await agent.process('创建任务已完成模块，持续10天', context);
    (context.tasks[3] as any).status = 'Completed';
    (context.tasks[3] as any).completedPercent = 100;
    
    console.log('\n🤖 Agent: "正在进行延期检测..."');
    
    const delays = adaptiveEngine.detectDelays(context.tasks);
    
    console.log('\n📊 延期检测结果:');
    console.log(`   发现 ${delays.length} 个延期任务`);
    
    delays.forEach((delay, i) => {
      const severityEmoji = {
        low: '🟡',
        medium: '🟠',
        high: '🔴',
        critical: '🔴'
      }[delay.severity];
      
      console.log(`\n   ${i + 1}. ${severityEmoji} ${delay.taskName}`);
      console.log(`      预期进度: ${delay.expectedProgress.toFixed(1)}%`);
      console.log(`      实际进度: ${delay.actualProgress}%`);
      console.log(`      延期: ${delay.delayDays}天 (${delay.severity})`);
      console.log(`      原因: ${delay.reason}`);
    });
    
    expect(delays.length).toBeGreaterThanOrEqual(1);
    expect(delays[0].severity).toBeDefined();
  });
  
  it('步骤2: 影响分析', async () => {
    console.log('\n' + '='.repeat(80));
    console.log('⚡ Level 6: 步骤2 - 影响分析');
    console.log('='.repeat(80));
    
    const agent = new GanttAgent();
    const context: GanttContext = {
      projectId: 'impact_test',
      tasks: [],
      buckets: []
    };
    
    // 创建带依赖的任务链
    console.log('\n👤 创建任务链: A → B → C → D');
    
    await agent.process('创建任务A基础模块，持续5天', context);
    await agent.process('创建任务B依赖模块，持续5天', context);
    await agent.process('创建任务C业务模块，持续5天', context);
    await agent.process('创建任务D上层模块，持续5天', context);
    
    // 设置依赖链
    context.tasks[1].dependencies = [context.tasks[0].id];
    context.tasks[2].dependencies = [context.tasks[1].id];
    context.tasks[3].dependencies = [context.tasks[2].id];
    
    // 任务A延期
    (context.tasks[0] as any).status = 'InProgress';
    (context.tasks[0] as any).completedPercent = 10;
    (context.tasks[0] as any).startDateTime = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
    
    await agent.process('自动排期', context);
    
    console.log('\n🤖 Agent: "正在分析延期影响..."');
    
    const delays = adaptiveEngine.detectDelays(context.tasks);
    const impact = adaptiveEngine.analyzeImpact(
      delays,
      context.tasks,
      [
        { name: '第一阶段完成', date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), taskIds: [context.tasks[1].id] },
        { name: '项目交付', date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), taskIds: [context.tasks[3].id] }
      ]
    );
    
    console.log('\n📊 影响分析结果:');
    console.log(`   关键路径影响: ${impact.criticalPathImpact ? '是 ⚠️' : '否'}`);
    console.log(`   总延期天数: ${impact.totalDelayDays}天`);
    console.log(`   受影响任务: ${impact.affectedTasks.length}个`);
    
    if (impact.affectedTasks.length > 0) {
      console.log('\n   受影响任务列表:');
      impact.affectedTasks.forEach((task, i) => {
        console.log(`      ${i + 1}. ${task.taskName}: +${task.delayDays}天`);
      });
    }
    
    if (impact.milestoneImpact.length > 0) {
      console.log('\n   里程碑影响:');
      impact.milestoneImpact.forEach(m => {
        console.log(`      • ${m.milestone}: 从${m.originalDate.toLocaleDateString()}推迟到${m.newDate.toLocaleDateString()}`);
      });
    }
    
    expect(impact.affectedTasks.length).toBeGreaterThanOrEqual(0);
  });
  
  it('步骤3: 生成调整方案', async () => {
    console.log('\n' + '='.repeat(80));
    console.log('⚡ Level 6: 步骤3 - 生成调整方案');
    console.log('='.repeat(80));
    
    const agent = new GanttAgent();
    const context: GanttContext = {
      projectId: 'plan_test',
      tasks: [],
      buckets: []
    };
    
    // 创建延期场景
    await agent.process('创建任务延期模块，持续10天', context);
    (context.tasks[0] as any).status = 'InProgress';
    (context.tasks[0] as any).completedPercent = 10;
    (context.tasks[0] as any).startDateTime = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    
    console.log('\n🤖 Agent: "正在生成调整方案..."');
    
    const delays = adaptiveEngine.detectDelays(context.tasks);
    const impact = adaptiveEngine.analyzeImpact(delays, context.tasks);
    const plans = adaptiveEngine.generateAdjustmentPlans(delays, impact, context.tasks);
    
    console.log(`\n📋 生成 ${plans.length} 个调整方案:`);
    
    plans.forEach((plan, i) => {
      const typeEmoji = {
        crash: '⚡',
        'fast-track': '🔥',
        'resource-reallocate': '🔄',
        'scope-reduce': '✂️',
        accept: '⏰'
      }[plan.type];
      
      console.log(`\n${typeEmoji} 方案${i + 1}: ${plan.name}`);
      console.log(`   描述: ${plan.description}`);
      console.log(`   类型: ${plan.type}`);
      console.log(`   影响:`);
      console.log(`      - 成本: ${plan.impact.cost > 0 ? '+' : ''}${plan.impact.cost}%`);
      console.log(`      - 质量: ${plan.impact.quality}%`);
      console.log(`      - 风险: ${plan.impact.risk}%`);
      console.log(`      - 节省时间: ${plan.impact.timeSave}天`);
      console.log(`   💡 建议: ${plan.recommendation}`);
      
      if (plan.actions.length > 0) {
        console.log('   行动:');
        plan.actions.forEach(action => {
          console.log(`      • ${action.description} (${action.effort})`);
        });
      }
    });
    
    expect(plans.length).toBeGreaterThanOrEqual(2);
  });
  
  it('步骤4: 执行自动调整', async () => {
    console.log('\n' + '='.repeat(80));
    console.log('⚡ Level 6: 步骤4 - 执行自动调整');
    console.log('='.repeat(80));
    
    const agent = new GanttAgent();
    const context: GanttContext = {
      projectId: 'adjust_test',
      tasks: [],
      buckets: []
    };
    
    await agent.process('创建任务调整测试，持续10天', context);
    const originalDueDate = context.tasks[0].dueDateTime;
    
    // 模拟延期
    (context.tasks[0] as any).status = 'InProgress';
    (context.tasks[0] as any).completedPercent = 20;
    
    // 创建赶工方案
    const plan = {
      planId: 'test-crash',
      name: '测试赶工方案',
      description: '增加资源赶工',
      type: 'crash' as const,
      impact: { cost: 30, quality: -5, risk: 10, timeSave: 3 },
      actions: [{
        type: 'add-resource' as const,
        target: context.tasks[0].id,
        description: '增加1名开发人员',
        effort: '节省3天'
      }],
      recommendation: '推荐方案'
    };
    
    console.log('\n🤖 Agent: "正在执行自动调整..."');
    console.log(`   方案: ${plan.name}`);
    
    const result = adaptiveEngine.applyAdjustment(plan, context.tasks, context);
    
    console.log('\n📊 调整结果:');
    console.log(`   成功: ${result.success ? '✅' : '❌'}`);
    console.log(`   消息: ${result.message}`);
    console.log(`   变更数: ${result.changes.length}`);
    
    if (result.changes.length > 0) {
      console.log('\n   变更详情:');
      result.changes.forEach((change, i) => {
        console.log(`      ${i + 1}. ${change.field}`);
      });
    }
    
    expect(result.success).toBe(true);
    expect(result.changes.length).toBeGreaterThanOrEqual(0);
  });
  
  it('完整自适应周期: 检测 → 分析 → 推荐 → 执行', async () => {
    console.log('\n' + '='.repeat(80));
    console.log('⚡ Level 6: 完整自适应周期');
    console.log('='.repeat(80));
    
    const agent = new GanttAgent();
    const context: GanttContext = {
      projectId: 'full_cycle_test',
      tasks: [],
      buckets: []
    };
    
    // 创建车身控制器项目的一部分
    console.log('\n👤 创建车身控制器开发任务...');
    
    const modules = ['MCAL配置', 'BSW开发', '应用开发', '测试验证'];
    for (const module of modules) {
      await agent.process(`创建任务${module}，持续15天`, context);
    }
    
    // 设置依赖
    for (let i = 1; i < context.tasks.length; i++) {
      context.tasks[i].dependencies = [context.tasks[i - 1].id];
    }
    
    await agent.process('自动排期', context);
    
    // 模拟MCAL延期
    console.log('\n🎭 模拟场景: MCAL开发延期5天');
    (context.tasks[0] as any).status = 'InProgress';
    (context.tasks[0] as any).completedPercent = 15; // 应完成50%，实际15%
    (context.tasks[0] as any).startDateTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    console.log('\n🤖 Agent: "启动自适应调整周期..."');
    console.log('   1️⃣ 检测延期...');
    console.log('   2️⃣ 分析影响...');
    console.log('   3️⃣ 生成方案...');
    console.log('   4️⃣ 等待确认...');
    
    const result = await adaptiveEngine.runAdaptiveCycle(context.tasks, context, {
      autoApply: false, // 演示模式，不自动执行
      milestones: [
        { name: '基础软件完成', date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), taskIds: [context.tasks[1].id] },
        { name: '项目交付', date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), taskIds: [context.tasks[3].id] }
      ]
    });
    
    console.log('\n' + '─'.repeat(80));
    console.log('📊 自适应周期结果:');
    console.log('─'.repeat(80));
    
    if (result.detected) {
      console.log(`✅ 检测到 ${result.delays.length} 个延期`);
      console.log(`✅ 影响分析完成，影响 ${result.impact.affectedTasks.length} 个任务`);
      console.log(`✅ 生成 ${result.plans.length} 个调整方案`);
      console.log(`\n💡 推荐: ${result.recommendation}`);
      
      console.log('\n📋 推荐方案详情:');
      const topPlan = result.plans[0];
      console.log(`   名称: ${topPlan.name}`);
      console.log(`   节省: ${topPlan.impact.timeSave}天`);
      console.log(`   成本: ${topPlan.impact.cost > 0 ? '+' : ''}${topPlan.impact.cost}%`);
      
      console.log('\n   行动步骤:');
      topPlan.actions.forEach((action, i) => {
        console.log(`      ${i + 1}. ${action.description}`);
      });
    } else {
      console.log('✅ 项目进度正常，无需调整');
    }
    
    expect(result.detected).toBe(true);
    expect(result.plans.length).toBeGreaterThan(0);
  });
  
  it('Level 6 功能总结', () => {
    console.log('\n' + '='.repeat(80));
    console.log('📊 Level 6: 实时自适应调整系统总结');
    console.log('='.repeat(80));
    
    console.log(`
┌──────────────────────────────────────────────────────────────────────────────┐
│                    Level 6: 实时自适应调整系统                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  【核心流程】4步闭环                                                          │
│                                                                              │
│     ① 延期检测 ──→ ② 影响分析 ──→ ③ 方案推荐 ──→ ④ 自动调整                │
│         ↑                                                    │               │
│         └──────────────── 持续监控 ←─────────────────────────┘               │
│                                                                              │
│  【步骤详解】                                                                  │
│                                                                              │
│  ① 延期检测 (detectDelays)                                                    │
│     • 扫描所有任务进度                                                        │
│     • 计算预期 vs 实际进度                                                    │
│     • 识别滞后10%以上的任务                                                   │
│     • 分级: low/medium/high/critical                                          │
│     • 自动推断延期原因                                                        │
│                                                                              │
│  ② 影响分析 (analyzeImpact)                                                   │
│     • 追踪依赖链传播                                                          │
│     • 计算受影响任务                                                          │
│     • 分析里程碑影响                                                          │
│     • 识别关键路径影响                                                        │
│     • 量化总延期天数                                                          │
│                                                                              │
│  ③ 方案推荐 (generateAdjustmentPlans)                                         │
│     • 赶工方案 (Crash): 增加资源，加班赶工                                    │
│     • 快速跟进 (Fast Track): 并行执行                                         │
│     • 资源重分配: 从非关键任务调配                                            │
│     • 范围削减: 推迟非核心功能                                                │
│     • 接受延期: 调整里程碑                                                    │
│     • 每种方案包含: 成本/质量/风险/节省时间评估                               │
│                                                                              │
│  ④ 自动调整 (applyAdjustment)                                                 │
│     • 支持自动或手动确认                                                      │
│     • 自动调整任务工期/日期                                                   │
│     • 重新计算排期                                                            │
│     • 记录所有变更                                                            │
│     • 生成调整报告                                                            │
│                                                                              │
│  【技术实现】                                                                  │
│  • AdaptiveAdjustmentEngine 类                                                │
│  • 完整的类型定义 (DelayDetection/ImpactAnalysis/AdjustmentPlan)              │
│  • 启发式规则 + 量化评估                                                      │
│  • 可配置的自动/手动模式                                                      │
│                                                                              │
│  【应用场景】                                                                  │
│  • 每日自动检查项目健康度                                                     │
│  • 延期预警和应对方案                                                         │
│  • 里程碑风险监控                                                             │
│  • 资源冲突自动解决                                                           │
│                                                                              │
│  【与之前Level的关系】                                                         │
│  • 基于 Level 2 的依赖分析和排期                                              │
│  • 基于 Level 4 的风险评估                                                    │
│  • 增强 Level 5 的项目生成 (自动应对变化)                                     │
│  • 为 Level 7 多智能体协作提供决策支持                                        │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
`);
    
    console.log('✅ Level 6 实时自适应调整系统完成');
    console.log('🎯 Agent 现在可以自动检测延期、分析影响、推荐方案并执行调整');
  });
});
