/**
 * Level 7: 多智能体协作系统测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GanttAgent } from '../SimpleGanttAgent';
import { 
  globalMessageBus, 
  CollaborationManager,
  BaseAgent 
} from '../MultiAgentSystem';
import {
  ProjectManagerAgent,
  DeveloperAgent,
  TesterAgent,
  ResourceSchedulerAgent,
  RiskMonitorAgent
} from '../SpecializedAgents';
import { GanttContext } from '@/types';

describe('🤝 Level 7: 多智能体协作系统', () => {
  let bus: typeof globalMessageBus;
  let collabManager: CollaborationManager;
  
  beforeEach(() => {
    // 创建新的消息总线实例用于测试
    bus = globalMessageBus;
    collabManager = new CollaborationManager(bus);
  });
  
  it('创建多Agent团队', () => {
    console.log('\n' + '='.repeat(80));
    console.log('🤝 Level 7: 创建多Agent团队');
    console.log('='.repeat(80));
    
    // 创建5个专业Agent
    const pmAgent = new ProjectManagerAgent('pm_001', bus);
    const devAgent = new DeveloperAgent('dev_001', '开发工程师A', bus, ['C', 'AUTOSAR']);
    const testAgent = new TesterAgent('test_001', '测试工程师A', bus);
    const resourceAgent = new ResourceSchedulerAgent('res_001', bus);
    const riskAgent = new RiskMonitorAgent('risk_001', bus);
    
    // 注册到协作管理器
    collabManager.registerAgent(pmAgent);
    collabManager.registerAgent(devAgent);
    collabManager.registerAgent(testAgent);
    collabManager.registerAgent(resourceAgent);
    collabManager.registerAgent(riskAgent);
    
    console.log('\n📋 Agent团队组建完成:');
    
    const states = collabManager.getAllAgentStates();
    states.forEach((state, i) => {
      const emoji = {
        'project-manager': '👔',
        'developer': '💻',
        'tester': '🔍',
        'resource-scheduler': '📊',
        'risk-monitor': '⚠️'
      }[state.role];
      
      console.log(`   ${i + 1}. ${emoji} ${state.name} (${state.id})`);
      console.log(`      角色: ${state.role}`);
      console.log(`      能力: ${state.capabilities.join(', ')}`);
    });
    
    expect(states.length).toBe(5);
    expect(states.some(s => s.role === 'project-manager')).toBe(true);
    expect(states.some(s => s.role === 'developer')).toBe(true);
  });
  
  it('Agent消息通信', async () => {
    console.log('\n' + '='.repeat(80));
    console.log('🤝 Level 7: Agent消息通信');
    console.log('='.repeat(80));
    
    const pmAgent = new ProjectManagerAgent('pm_002', bus);
    const devAgent = new DeveloperAgent('dev_002', '开发B', bus);
    
    collabManager.registerAgent(pmAgent);
    collabManager.registerAgent(devAgent);
    
    console.log('\n📨 Agent消息通信演示:');
    
    // PM分配任务给开发者
    console.log('\n   👔 项目经理: "分配任务给开发工程师"');
    pmAgent.assignTask(
      { id: 'task_001', title: 'MCAL配置', dueDateTime: new Date(), priority: 'High' } as any,
      'dev_002'
    );
    
    // 开发者发送状态更新
    await new Promise(r => setTimeout(r, 50));
    
    console.log('   💻 开发工程师: "收到任务，开始开发"');
    devAgent['send']('pm_002', 'status-update', {
      agentId: 'dev_002',
      status: 'working',
      workload: 40
    });
    
    // 获取消息历史
    const history = bus.getHistory();
    console.log(`\n📊 消息统计: ${history.length} 条消息`);
    
    expect(history.length).toBeGreaterThanOrEqual(2);
  });
  
  it('每日站会', async () => {
    console.log('\n' + '='.repeat(80));
    console.log('🤝 Level 7: 每日站会');
    console.log('='.repeat(80));
    
    // 创建Agent团队
    const pmAgent = new ProjectManagerAgent('pm_003', bus);
    const devAgent1 = new DeveloperAgent('dev_003', '开发A', bus);
    const devAgent2 = new DeveloperAgent('dev_004', '开发B', bus);
    const testAgent = new TesterAgent('test_002', '测试A', bus);
    
    [pmAgent, devAgent1, devAgent2, testAgent].forEach(a => {
      collabManager.registerAgent(a);
      a.updateState({
        currentTasks: ['task_001'],
        workload: 60,
        status: 'working'
      });
    });
    
    console.log('\n📅 每日站会开始...');
    
    const standupReport = await collabManager.runDailyStandup();
    
    console.log('\n📊 站会报告:');
    console.log(`   时间: ${new Date(standupReport.timestamp).toLocaleTimeString()}`);
    console.log(`   参会Agent: ${standupReport.reports.length} 位`);
    console.log(`   ${standupReport.summary}`);
    
    console.log('\n   各Agent汇报:');
    standupReport.reports.forEach((report, i) => {
      const emoji = {
        'project-manager': '👔',
        'developer': '💻',
        'tester': '🔍'
      }[report.role] || '🤖';
      
      console.log(`\n   ${i + 1}. ${emoji} ${report.agentName}`);
      console.log(`      昨日: ${report.yesterday}`);
      console.log(`      今日: ${report.today}`);
      console.log(`      阻塞: ${report.blockers}`);
      console.log(`      负载: ${report.workload}%`);
    });
    
    expect(standupReport.reports.length).toBe(4);
  });
  
  it('决策投票', async () => {
    console.log('\n' + '='.repeat(80));
    console.log('🤝 Level 7: 决策投票');
    console.log('='.repeat(80));
    
    // 创建Agent
    const pmAgent = new ProjectManagerAgent('pm_004', bus);
    const devAgent = new DeveloperAgent('dev_005', '开发', bus);
    const testAgent = new TesterAgent('test_003', '测试', bus);
    
    [pmAgent, devAgent, testAgent].forEach(a => 
      collabManager.registerAgent(a)
    );
    
    console.log('\n🗳️ 决策投票演示:');
    console.log('   议题: "是否延期一周交付以保证质量？"');
    
    // 发起投票
    const decisionId = collabManager.proposeDecision(
      'pm_004',
      '项目延期一周',
      ['同意延期', '按时交付', '范围削减'],
      5000  // 5秒投票时间
    );
    
    console.log(`   决策ID: ${decisionId}`);
    
    // 各Agent投票
    console.log('\n   各Agent投票:');
    
    collabManager.vote(decisionId, 'pm_004', '同意延期');
    console.log('   👔 项目经理: 同意延期');
    
    collabManager.vote(decisionId, 'dev_005', '同意延期');
    console.log('   💻 开发: 同意延期');
    
    collabManager.vote(decisionId, 'test_003', '范围削减');
    console.log('   🔍 测试: 范围削减');
    
    // 结束投票
    const decision = collabManager.finalizeDecision(decisionId);
    
    console.log('\n📊 投票结果:');
    console.log(`   状态: ${decision?.status}`);
    console.log(`   结果: ${decision?.result || '未决出'}`);
    console.log(`   票数统计:`);
    decision?.votes.forEach((vote, agentId) => {
      console.log(`      ${agentId}: ${vote}`);
    });
    
    expect(decision).toBeDefined();
    expect(decision?.votes.size).toBe(3);
  });
  
  it('完整协作场景: 车身控制器开发', async () => {
    console.log('\n' + '='.repeat(80));
    console.log('🤝 Level 7: 完整协作场景 - 车身控制器开发');
    console.log('='.repeat(80));
    
    // 1. 创建项目
    const agent = new GanttAgent();
    const context: GanttContext = {
      projectId: 'bcm_multiagent',
      tasks: [],
      buckets: []
    };
    
    console.log('\n📋 创建车身控制器项目...');
    
    // 创建任务
    await agent.process('创建任务MCAL配置，持续10天', context);
    await agent.process('创建任务BSW开发，持续15天', context);
    await agent.process('创建任务应用开发，持续20天', context);
    await agent.process('创建任务测试验证，持续10天', context);
    
    // 2. 创建Agent团队
    console.log('\n👥 组建Agent团队:');
    
    const pmAgent = new ProjectManagerAgent('pm_bcm', bus);
    const devAgent1 = new DeveloperAgent('dev_mcal', 'MCAL开发', bus, ['C', 'MCAL']);
    const devAgent2 = new DeveloperAgent('dev_bsw', 'BSW开发', bus, ['C', 'AUTOSAR']);
    const testAgent = new TesterAgent('test_bcm', '测试工程师', bus);
    const riskAgent = new RiskMonitorAgent('risk_bcm', bus);
    
    [pmAgent, devAgent1, devAgent2, testAgent, riskAgent].forEach(a => {
      collabManager.registerAgent(a);
      a.setContext(context);
    });
    
    console.log('   ✅ 项目经理 Agent');
    console.log('   ✅ MCAL开发 Agent');
    console.log('   ✅ BSW开发 Agent');
    console.log('   ✅ 测试 Agent');
    console.log('   ✅ 风险监控 Agent');
    
    // 3. 项目经理分配任务
    console.log('\n📋 项目经理分配任务:');
    pmAgent.assignTask(context.tasks[0], 'dev_mcal');
    pmAgent.assignTask(context.tasks[1], 'dev_bsw');
    
    // 4. 开发者执行
    console.log('\n💻 开发者执行任务:');
    await devAgent1.executeDuty(context);
    
    // 5. 风险监控
    console.log('\n⚠️ 风险监控Agent扫描:');
    await riskAgent.executeDuty(context);
    const riskStats = riskAgent.getRiskStats();
    console.log(`   发现风险: ${riskStats.total}个`);
    
    // 6. 每日站会
    console.log('\n📅 每日站会:');
    const standup = await collabManager.runDailyStandup();
    console.log(`   ${standup.summary}`);
    
    // 7. 获取消息记录
    const messages = bus.getRecent(20);
    console.log(`\n📊 协作统计:`);
    console.log(`   消息总数: ${messages.length}`);
    
    const messageTypes = new Map<string, number>();
    messages.forEach(m => {
      messageTypes.set(m.type, (messageTypes.get(m.type) || 0) + 1);
    });
    
    console.log('   消息类型分布:');
    messageTypes.forEach((count, type) => {
      console.log(`      ${type}: ${count}`);
    });
    
    expect(context.tasks.length).toBe(4);
    expect(collabManager.getAllAgentStates().length).toBe(5);
  });
  
  it('Level 7 功能总结', () => {
    console.log('\n' + '='.repeat(80));
    console.log('📊 Level 7: 多智能体协作系统总结');
    console.log('='.repeat(80));
    
    console.log(`
┌──────────────────────────────────────────────────────────────────────────────┐
│                       Level 7: 多智能体协作系统                               │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  【核心角色】5个专业Agent                                                      │
│                                                                              │
│  👔 项目经理 Agent (ProjectManagerAgent)                                      │
│     • 职责: 整体把控、决策、协调                                              │
│     • 能力: 项目监控、任务分配、冲突仲裁、进度汇报                            │
│     • 协作: 接收各Agent报告，分配任务，协调冲突                               │
│                                                                              │
│  💻 开发 Agent (DeveloperAgent)                                               │
│     • 职责: 技术方案、代码实现                                                │
│     • 能力: 编码、代码审查、技术决策                                          │
│     • 协作: 接收任务，完成开发，报告进度                                      │
│                                                                              │
│  🔍 测试 Agent (TesterAgent)                                                  │
│     • 职责: 测试计划、质量把控                                                │
│     • 能力: 测试设计、Bug跟踪、质量报告                                       │
│     • 协作: 开发完成后测试，报告Bug                                           │
│                                                                              │
│  📊 资源调度 Agent (ResourceSchedulerAgent)                                   │
│     • 职责: 人员分配、资源优化                                                │
│     • 能力: 负载均衡、冲突解决、资源分配                                      │
│     • 协作: 监控负载，优化分配，仲裁冲突                                      │
│                                                                              │
│  ⚠️ 风险监控 Agent (RiskMonitorAgent)                                         │
│     • 职责: 风险识别、预警                                                    │
│     • 能力: 实时监控、预测分析、早期预警                                      │
│     • 协作: 扫描风险，发送警报，生成报告                                      │
│                                                                              │
│  【协作机制】                                                                  │
│                                                                              │
│  📨 消息总线 (MessageBus)                                                     │
│     • 发布-订阅模式                                                           │
│     • 支持单播和广播                                                          │
│     • 消息历史记录                                                            │
│     • 优先级支持 (low/medium/high/urgent)                                     │
│                                                                              │
│  🗳️ 决策投票机制                                                              │
│     • 发起投票提案                                                            │
│     • 多Agent投票                                                             │
│     • 自动统计结果                                                            │
│     • 支持平局处理                                                            │
│                                                                              │
│  📅 每日站会                                                                  │
│     • 各Agent自动汇报昨日进展                                                 │
│     • 今日计划                                                                │
│     • 阻塞问题                                                                │
│     • 工作负载                                                                │
│     • 生成站会报告                                                            │
│                                                                              │
│  ⚖️ 冲突仲裁                                                                  │
│     • 资源冲突检测                                                            │
│     • 仲裁决策                                                                │
│     • 广播仲裁结果                                                            │
│                                                                              │
│  【技术架构】                                                                  │
│  • BaseAgent 抽象基类                                                         │
│  • 各角色继承基类实现特定逻辑                                                 │
│  • CollaborationManager 协调管理                                              │
│  • 完整类型定义 (AgentMessage/AgentState/Decision)                            │
│                                                                              │
│  【应用场景】                                                                  │
│  • 大型项目需要多角色协作                                                     │
│  • 资源冲突需要自动仲裁                                                       │
│  • 重要决策需要投票                                                           │
│  • 每日进度自动跟踪                                                           │
│                                                                              │
│  【与Level 6的关系】                                                           │
│  • Level 6的自适应调整由风险Agent触发                                         │
│  • 调整方案由各Agent协作执行                                                  │
│  • 为Level 8预测分析提供多维度数据                                            │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
`);
    
    console.log('✅ Level 7 多智能体协作系统完成');
    console.log('🎯 Agent 现在可以像真实团队一样协作工作');
    console.log('📦 支持5种专业角色 + 消息总线 + 协作机制');
  });
});
