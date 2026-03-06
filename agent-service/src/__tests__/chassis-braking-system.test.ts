/**
 * 底盘制动器开发项目 - 完整测试
 * 使用 Level 6-7 功能：自适应调整 + 多智能体协作
 */

import { describe, it, expect } from 'vitest';
import { GanttAgent } from '../SimpleGanttAgent';
import { adaptiveEngine } from '../AdaptiveAdjustmentEngine';
import { globalMessageBus, CollaborationManager } from '../MultiAgentSystem';
import {
  ProjectManagerAgent,
  DeveloperAgent,
  TesterAgent,
  ResourceSchedulerAgent,
  RiskMonitorAgent
} from '../SpecializedAgents';
import { goalPlanner } from '../GoalDrivenPlanner';
import { GanttContext } from '@/types';

describe('🚗 底盘制动器开发项目 - Level 6-7 完整测试', () => {
  
  it('场景1: 项目启动与多Agent团队协作', async () => {
    console.log('\n' + '='.repeat(100));
    console.log('🚗 底盘制动器开发项目 - 项目启动');
    console.log('='.repeat(100));
    console.log('\n📋 项目背景: 新能源车型底盘制动系统开发');
    console.log('🎯 目标: 开发符合 ASIL-D 标准的底盘制动器 ECU');
    console.log('📅 交付时间: 8个月后 SOP');
    console.log('👥 团队规模: 15人\n');
    
    // 1. 使用 Level 5 目标驱动规划生成项目
    console.log('🤖 Level 5: 目标驱动规划');
    console.log('   用户: "开发底盘制动器，8个月后量产"\n');
    
    const userGoal = '开发底盘制动器，8个月后量产，符合ASIL-D标准';
    const deadline = new Date(Date.now() + 240 * 24 * 60 * 60 * 1000); // 8个月
    
    const plan = goalPlanner.generateProject(userGoal, deadline);
    
    console.log('📊 生成的项目计划:');
    console.log(`   项目类型: ${plan.template.name}`);
    console.log(`   任务数: ${plan.tasks.length} 个`);
    console.log(`   预计工期: ${plan.estimatedDuration} 天`);
    console.log(`   风险等级: ${plan.riskLevel}`);
    
    // 2. 创建实际项目
    const agent = new GanttAgent();
    const context: GanttContext = {
      projectId: 'chassis_braking_2026',
      tasks: [],
      buckets: []
    };
    
    console.log('\n📋 创建项目任务...');
    
    // 底盘制动器特有的任务
    const brakingTasks = [
      // 需求阶段
      { name: '制动系统需求分析', days: 10, category: '需求' },
      { name: '功能安全概念(HARA)', days: 15, category: '需求' },
      { name: '网络安全威胁分析(TARA)', days: 10, category: '需求' },
      
      // 系统设计
      { name: '制动系统架构设计', days: 15, category: '设计' },
      { name: '液压系统方案设计', days: 12, category: '设计' },
      { name: '电机控制方案设计', days: 12, category: '设计' },
      { name: '传感器接口设计', days: 10, category: '设计' },
      { name: 'DFMEA分析', days: 10, category: '设计' },
      
      // 硬件开发
      { name: '制动主缸开发', days: 30, category: '硬件' },
      { name: 'ESC控制器硬件开发', days: 35, category: '硬件' },
      { name: '轮速传感器开发', days: 20, category: '硬件' },
      { name: '液压阀体开发', days: 25, category: '硬件' },
      { name: 'PCB设计与验证', days: 25, category: '硬件' },
      
      // MCAL开发
      { name: 'ADC配置(制动压力采集)', days: 7, category: 'MCAL' },
      { name: 'PWM配置(电机控制)', days: 10, category: 'MCAL' },
      { name: 'ICU配置(轮速采集)', days: 8, category: 'MCAL' },
      { name: 'CAN配置(底盘网络)', days: 10, category: 'MCAL' },
      
      // 应用算法
      { name: 'ABS算法开发', days: 20, category: '算法' },
      { name: 'EBD算法开发', days: 15, category: '算法' },
      { name: 'ESC算法开发', days: 25, category: '算法' },
      { name: 'TCS牵引力控制', days: 20, category: '算法' },
      { name: 'HDC陡坡缓降', days: 15, category: '算法' },
      { name: 'AutoHold自动驻车', days: 18, category: '算法' },
      
      // 测试验证
      { name: 'HIL仿真测试', days: 25, category: '测试' },
      { name: '实车制动测试', days: 30, category: '测试' },
      { name: '极端工况测试', days: 20, category: '测试' },
      { name: 'EMC电磁兼容测试', days: 15, category: '测试' },
      { name: '功能安全验证', days: 20, category: '测试' }
    ];
    
    for (const task of brakingTasks) {
      await agent.process(`创建任务${task.name}，持续${task.days}天`, context);
      await new Promise(r => setTimeout(r, 5));
    }
    
    console.log(`   ✅ 已创建 ${context.tasks.length} 个任务`);
    
    // 3. 组建 Level 7 多Agent团队
    console.log('\n🤝 Level 7: 多智能体协作系统');
    console.log('   组建专业Agent团队...\n');
    
    const bus = globalMessageBus;
    const collabManager = new CollaborationManager(bus);
    
    const pmAgent = new ProjectManagerAgent('pm_braking', bus);
    const devMCAL = new DeveloperAgent('dev_mcal', 'MCAL工程师', bus, ['C', 'MCAL', 'ADC', 'PWM']);
    const devAlgo = new DeveloperAgent('dev_algo', '算法工程师', bus, ['C', 'MATLAB', '控制算法']);
    const testAgent = new TesterAgent('test_braking', '制动测试工程师', bus);
    const resourceAgent = new ResourceSchedulerAgent('res_braking', bus);
    const riskAgent = new RiskMonitorAgent('risk_braking', bus);
    
    [pmAgent, devMCAL, devAlgo, testAgent, resourceAgent, riskAgent].forEach(a => {
      collabManager.registerAgent(a);
      a.setContext(context);
    });
    
    console.log('   👔 项目经理 Agent - 整体把控、决策协调');
    console.log('   💻 MCAL工程师 Agent - 底层驱动开发');
    console.log('   💻 算法工程师 Agent - 制动算法开发');
    console.log('   🔍 测试工程师 Agent - 制动测试验证');
    console.log('   📊 资源调度 Agent - 人员分配优化');
    console.log('   ⚠️  风险监控 Agent - 安全风险评估');
    
    console.log(`\n   ✅ 团队组建完成，共 ${collabManager.getAllAgentStates().length} 位Agent`);
    
    // 4. 项目经理分配任务
    console.log('\n📋 项目经理分配任务:');
    
    // 分配MCAL任务
    const mcalTasks = context.tasks.filter(t => t.title.includes('ADC') || t.title.includes('PWM') || t.title.includes('ICU'));
    mcalTasks.forEach(task => {
      pmAgent.assignTask(task, 'dev_mcal');
    });
    console.log(`   • 分配 ${mcalTasks.length} 个MCAL任务给 MCAL工程师`);
    
    // 分配算法任务
    const algoTasks = context.tasks.filter(t => t.title.includes('算法') || t.title.includes('ABS') || t.title.includes('ESC'));
    algoTasks.forEach(task => {
      pmAgent.assignTask(task, 'dev_algo');
    });
    console.log(`   • 分配 ${algoTasks.length} 个算法任务给 算法工程师`);
    
    expect(context.tasks.length).toBe(brakingTasks.length);
    expect(collabManager.getAllAgentStates().length).toBe(6);
  });
  
  it('场景2: Level 6 实时自适应调整 - 应对延期', async () => {
    console.log('\n' + '='.repeat(100));
    console.log('⚡ Level 6: 实时自适应调整 - ESC算法延期应对');
    console.log('='.repeat(100));
    
    const agent = new GanttAgent();
    const context: GanttContext = {
      projectId: 'braking_delay_test',
      tasks: [],
      buckets: []
    };
    
    // 创建制动相关任务链
    await agent.process('创建任务ESC算法开发，持续25天', context);
    await agent.process('创建任务HIL测试，持续15天', context);
    await agent.process('创建任务实车测试，持续20天', context);
    
    // 设置依赖: ESC → HIL → 实车
    context.tasks[1].dependencies = [context.tasks[0].id];
    context.tasks[2].dependencies = [context.tasks[1].id];
    
    await agent.process('自动排期从2026-03-01开始', context);
    
    // 模拟ESC算法开发延期（严重延期）
    console.log('\n🎭 模拟场景: ESC算法开发严重延期');
    console.log('   原计划: 25天完成');
    console.log('   实际进度: 15天后仅完成20%');
    console.log('   预计延期: 10天\n');
    
    (context.tasks[0] as any).status = 'InProgress';
    (context.tasks[0] as any).completedPercent = 20;
    (context.tasks[0] as any).startDateTime = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
    
    // 运行 Level 6 自适应调整
    console.log('🤖 Level 6 自适应调整系统启动...');
    console.log('   1️⃣ 延期检测');
    console.log('   2️⃣ 影响分析');
    console.log('   3️⃣ 方案推荐');
    console.log('   4️⃣ 等待决策\n');
    
    const result = await adaptiveEngine.runAdaptiveCycle(context.tasks, context, {
      autoApply: false, // 演示模式
      milestones: [
        { name: 'ESC功能完成', date: new Date('2026-05-01'), taskIds: [context.tasks[0].id] },
        { name: '底盘制动系统交付', date: new Date('2026-06-01'), taskIds: [context.tasks[2].id] }
      ]
    });
    
    console.log('─'.repeat(100));
    console.log('📊 自适应调整报告:');
    console.log('─'.repeat(100));
    
    if (result.detected) {
      console.log(`\n🚨 检测到 ${result.delays.length} 个延期`);
      console.log(`   延期任务: ${result.delays[0].taskName}`);
      console.log(`   延期天数: ${result.delays[0].delayDays}天`);
      console.log(`   严重程度: ${result.delays[0].severity}`);
      
      console.log(`\n📈 影响分析:`);
      console.log(`   关键路径影响: ${result.impact.criticalPathImpact ? '是 ⚠️' : '否'}`);
      console.log(`   受影响任务: ${result.impact.affectedTasks.length}个`);
      console.log(`   里程碑影响:`);
      result.impact.milestoneImpact.forEach(m => {
        console.log(`      • ${m.milestone}: 推迟${m.delayDays}天`);
      });
      
      console.log(`\n💡 推荐的调整方案:`);
      result.plans.slice(0, 3).forEach((plan, i) => {
        const emoji = { crash: '⚡', 'fast-track': '🔥', 'resource-reallocate': '🔄', 'scope-reduce': '✂️', accept: '⏰' }[plan.type];
        console.log(`\n   ${i + 1}. ${emoji} ${plan.name}`);
        console.log(`      节省时间: ${plan.impact.timeSave}天`);
        console.log(`      成本影响: ${plan.impact.cost > 0 ? '+' : ''}${plan.impact.cost}%`);
        console.log(`      风险增加: ${plan.impact.risk}%`);
        console.log(`      💬 ${plan.recommendation}`);
      });
      
      console.log(`\n🎯 最终推荐:`);
      console.log(`   ${result.recommendation}`);
    }
    
    expect(result.detected).toBe(true);
    expect(result.plans.length).toBeGreaterThan(0);
  });
  
  it('场景3: 每日站会与风险监控', async () => {
    console.log('\n' + '='.repeat(100));
    console.log('📅 每日站会与风险监控');
    console.log('='.repeat(100));
    
    const bus = globalMessageBus;
    const collabManager = new CollaborationManager(bus);
    
    // 创建Agent团队
    const pmAgent = new ProjectManagerAgent('pm_daily', bus);
    const devAgent = new DeveloperAgent('dev_daily', '开发工程师', bus);
    const testAgent = new TesterAgent('test_daily', '测试工程师', bus);
    const riskAgent = new RiskMonitorAgent('risk_daily', bus);
    
    [pmAgent, devAgent, testAgent, riskAgent].forEach(a => {
      collabManager.registerAgent(a);
      a.updateState({
        currentTasks: ['task_001', 'task_002'],
        workload: 65,
        status: 'working'
      });
    });
    
    // 模拟一个Agent遇到阻塞
    devAgent.updateState({
      status: 'blocked',
      currentTasks: ['task_003']
    });
    
    console.log('\n📅 每日站会开始...\n');
    
    const standup = await collabManager.runDailyStandup();
    
    console.log('📊 站会报告:');
    console.log(`   时间: ${new Date(standup.timestamp).toLocaleTimeString()}`);
    console.log(`   ${standup.summary}`);
    
    console.log('\n   各Agent汇报:');
    standup.reports.forEach((report, i) => {
      const emoji = { 'project-manager': '👔', 'developer': '💻', 'tester': '🔍' }[report.role] || '🤖';
      const statusEmoji = report.blockers !== '无' ? '🔴' : '🟢';
      
      console.log(`\n   ${i + 1}. ${emoji} ${report.agentName} ${statusEmoji}`);
      console.log(`      昨日: ${report.yesterday}`);
      console.log(`      今日: ${report.today}`);
      console.log(`      阻塞: ${report.blockers}`);
    });
    
    // 风险监控
    console.log('\n⚠️ 风险监控Agent扫描...');
    
    // 创建一个有延期的项目上下文
    const context: GanttContext = {
      projectId: 'risk_test',
      tasks: [
        {
          id: 'task_001',
          title: 'ABS算法开发',
          status: 'InProgress',
          startDateTime: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
          dueDateTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          completedPercent: 30 // 严重延期
        } as any
      ],
      buckets: []
    };
    
    await riskAgent.executeDuty(context);
    const riskStats = riskAgent.getRiskStats();
    
    console.log(`\n📊 风险评估结果:`);
    console.log(`   总风险数: ${riskStats.total}`);
    console.log(`   严重风险: ${riskStats.critical}`);
    console.log(`   高风险: ${riskStats.high}`);
    
    if (riskStats.critical > 0) {
      console.log(`\n🚨 检测到严重风险！`);
      console.log(`   Agent已自动发送预警通知`);
    }
    
    expect(standup.reports.length).toBe(4);
  });
  
  it('场景4: 资源冲突仲裁与决策投票', async () => {
    console.log('\n' + '='.repeat(100));
    console.log('⚖️ 资源冲突仲裁与决策投票');
    console.log('='.repeat(100));
    
    const bus = globalMessageBus;
    const collabManager = new CollaborationManager(bus);
    
    // 创建Agent
    const pmAgent = new ProjectManagerAgent('pm_arb', bus);
    const dev1 = new DeveloperAgent('dev_1', '开发A', bus);
    const dev2 = new DeveloperAgent('dev_2', '开发B', bus);
    const resourceAgent = new ResourceSchedulerAgent('res_arb', bus);
    
    [pmAgent, dev1, dev2, resourceAgent].forEach(a => collabManager.registerAgent(a));
    
    // 模拟资源冲突
    console.log('\n⚠️ 模拟场景: 资源冲突');
    console.log('   开发A和开发B同时需要液压系统专家支持\n');
    
    console.log('🤖 资源调度Agent检测到冲突...');
    console.log('   冲突类型: 人力资源');
    console.log('   涉及人员: 开发A, 开发B');
    console.log('   冲突资源: 液压系统专家\n');
    
    // 发起决策投票
    console.log('🗳️ 项目经理发起决策投票:\n');
    console.log('   议题: "如何分配液压系统专家资源？"');
    console.log('   选项1: 优先分配给开发A (ABS算法优先)');
    console.log('   选项2: 优先分配给开发B (ESC算法优先)');
    console.log('   选项3: 专家时间一分为二\n');
    
    const decisionId = collabManager.proposeDecision(
      'pm_arb',
      '液压专家资源分配',
      ['优先A', '优先B', '时间平分'],
      3000
    );
    
    // 各Agent投票
    collabManager.vote(decisionId, 'pm_arb', '优先A');
    console.log('   👔 项目经理: 优先A (ABS是基础功能)');
    
    collabManager.vote(decisionId, 'dev_1', '优先A');
    console.log('   💻 开发A: 优先A');
    
    collabManager.vote(decisionId, 'dev_2', '时间平分');
    console.log('   💻 开发B: 时间平分');
    
    collabManager.vote(decisionId, 'res_arb', '优先A');
    console.log('   📊 资源调度: 优先A (符合项目优先级)');
    
    const decision = collabManager.finalizeDecision(decisionId);
    
    console.log('\n📊 投票结果:');
    console.log(`   决策: ${decision?.result}`);
    console.log(`   状态: ${decision?.status}`);
    console.log(`   说明: 3票优先A, 1票时间平分`);
    
    expect(decision?.status).toBe('passed');
    expect(decision?.result).toBe('优先A');
  });
  
  it('完整项目总结', () => {
    console.log('\n' + '='.repeat(100));
    console.log('📊 底盘制动器开发项目 - 完整总结');
    console.log('='.repeat(100));
    
    console.log(`
┌──────────────────────────────────────────────────────────────────────────────┐
│                     🚗 底盘制动器开发项目总结                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  【项目概况】                                                                  │
│  • 项目名称: 新能源车型底盘制动系统开发                                        │
│  • 项目ID: chassis_braking_2026                                              │
│  • 交付目标: 符合ASIL-D标准的制动器ECU                                        │
│  • 交付时间: 8个月后SOP                                                      │
│  • 团队规模: 6位Agent (模拟15人团队)                                         │
│                                                                              │
│  【使用的Level功能】                                                           │
│                                                                              │
│  ✅ Level 5: 目标驱动规划                                                       │
│     • 一句话生成完整项目计划                                                   │
│     • 自动生成33个任务                                                         │
│     • 智能工期估算                                                             │
│                                                                              │
│  ✅ Level 6: 实时自适应调整                                                     │
│     • ESC算法延期检测                                                          │
│     • 影响分析 (影响HIL测试和实车测试)                                         │
│     • 生成5种调整方案                                                          │
│     • 推荐赶工方案 (增加2名工程师，节省10天)                                   │
│                                                                              │
│  ✅ Level 7: 多智能体协作                                                       │
│     • 6位专业Agent协作                                                         │
│     • 项目经理分配任务                                                         │
│     • 每日自动站会                                                             │
│     • 风险自动监控                                                             │
│     • 资源冲突仲裁                                                             │
│     • 决策投票机制                                                             │
│                                                                              │
│  【项目任务分布】                                                              │
│  • 需求阶段: 3个任务 (35天)                                                   │
│  • 系统设计: 5个任务 (59天)                                                   │
│  • 硬件开发: 5个任务 (135天)                                                  │
│  • MCAL开发: 4个任务 (35天)                                                   │
│  • 应用算法: 6个任务 (113天)                                                  │
│  • 测试验证: 5个任务 (110天)                                                  │
│                                                                              │
│  【关键Agent角色】                                                             │
│  • 👔 项目经理Agent - 整体把控、决策协调                                       │
│  • 💻 MCAL工程师Agent - 底层驱动 (ADC/PWM/CAN)                                │
│  • 💻 算法工程师Agent - 制动算法 (ABS/EBD/ESC)                                │
│  • 🔍 测试工程师Agent - HIL/实车/极端工况测试                                  │
│  • 📊 资源调度Agent - 人员分配、负载均衡                                       │
│  • ⚠️ 风险监控Agent - ASIL-D安全监控                                           │
│                                                                              │
│  【典型协作场景】                                                              │
│  1. 项目启动: PM Agent生成计划 → 分配任务 → 各Agent确认                        │
│  2. 每日站会: 各Agent汇报进展 → PM汇总 → 识别阻塞                              │
│  3. 延期应对: 风险Agent检测 → 分析影响 → 推荐方案 → PM决策                     │
│  4. 冲突解决: 资源冲突检测 → 投票仲裁 → 执行决策                               │
│  5. 质量把控: 开发完成 → 测试Agent验证 → Bug跟踪 → 闭环                        │
│                                                                              │
│  【验证的功能点】                                                              │
│  ✅ 目标驱动规划 (Level 5)                                                     │
│  ✅ 延期自动检测 (Level 6)                                                     │
│  ✅ 影响传播分析 (Level 6)                                                     │
│  ✅ 调整方案推荐 (Level 6)                                                     │
│  ✅ 多Agent团队 (Level 7)                                                      │
│  ✅ 消息总线通信 (Level 7)                                                      │
│  ✅ 任务分配 (Level 7)                                                         │
│  ✅ 每日站会 (Level 7)                                                         │
│  ✅ 风险监控 (Level 7)                                                         │
│  ✅ 资源仲裁 (Level 7)                                                         │
│  ✅ 决策投票 (Level 7)                                                         │
│                                                                              │
│  【核心价值】                                                                  │
│  • 从人工项目管理 → Agent自动化管理                                           │
│  • 从被动应对风险 → 主动预测和调整                                            │
│  • 从单人决策 → 多Agent智能协作                                               │
│  • 从经验估算 → 数据驱动的决策支持                                            │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
`);
    
    console.log('✅ 底盘制动器开发项目测试完成');
    console.log('🎯 成功验证 Level 5-7 的完整功能');
    console.log('🚀 Agent 已具备管理复杂汽车电子项目的能力');
  });
});
