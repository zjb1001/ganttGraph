/**
 * Level 7: 多智能体协作系统 - 专业Agent实现
 * 项目经理、开发、测试、资源调度、风险监控
 */

import { Task, GanttContext } from '@/types';
import { 
  BaseAgent, 
  AgentMessage, 
  MessageBus, 
  AgentRole,
  CollaborationManager 
} from './MultiAgentSystem';
import { adaptiveEngine } from './AdaptiveAdjustmentEngine';

// ========== 项目经理 Agent ==========

export class ProjectManagerAgent extends BaseAgent {
  private decisions: Map<string, any> = new Map();
  private projectGoals: string[] = [];
  
  constructor(id: string, bus: MessageBus) {
    super(
      id,
      'project-manager',
      '项目经理',
      bus,
      ['project-planning', 'decision-making', 'coordination', 'reporting']
    );
  }
  
  protected handleMessage(message: AgentMessage): void {
    switch (message.type) {
      case 'status-update':
        this.handleStatusUpdate(message);
        break;
      case 'request-help':
        this.handleHelpRequest(message);
        break;
      case 'resource-conflict':
        this.handleResourceConflict(message);
        break;
      case 'alert':
        this.handleAlert(message);
        break;
      case 'daily-standup':
        this.handleStandupReport(message);
        break;
    }
  }
  
  async executeDuty(context: GanttContext): Promise<void> {
    this.setContext(context);
    
    // 1. 检查项目整体健康度
    await this.checkProjectHealth(context);
    
    // 2. 处理阻塞问题
    await this.resolveBlockers(context);
    
    // 3. 资源优化建议
    await this.optimizeResources(context);
    
    this.updateState({ 
      status: 'working',
      currentTasks: ['project-monitoring', 'coordination']
    });
  }
  
  private async checkProjectHealth(context: GanttContext): Promise<void> {
    // 使用自适应引擎检测延期
    const result = await adaptiveEngine.runAdaptiveCycle(context.tasks, context);
    
    if (result.detected) {
      this.log(`检测到 ${result.delays.length} 个延期`, result.recommendation);
      
      // 广播风险警报
      this.broadcast('alert', {
        severity: 'high',
        type: 'delay-detected',
        message: `项目有${result.delays.length}个延期，建议采用${result.plans[0]?.name}`,
        details: result
      }, 'high');
    }
  }
  
  private async resolveBlockers(context: GanttContext): Promise<void> {
    // 识别阻塞任务
    const blockedTasks = context.tasks.filter(t => 
      (t as any).status === 'blocked'
    );
    
    if (blockedTasks.length > 0) {
      this.log(`发现 ${blockedTasks.length} 个阻塞任务`, blockedTasks.map(t => t.title));
      
      // 协调资源解决阻塞
      this.broadcast('request-help', {
        type: 'unblock-tasks',
        tasks: blockedTasks.map(t => t.id),
        priority: 'urgent'
      }, 'urgent');
    }
  }
  
  private async optimizeResources(context: GanttContext): Promise<void> {
    // 简单的资源优化逻辑
    const highLoadAgents = this.getHighLoadAgents();
    
    if (highLoadAgents.length > 0) {
      this.log('部分Agent负载过高，建议重新分配', highLoadAgents);
    }
  }
  
  private handleStatusUpdate(message: AgentMessage): void {
    const { agentId, status, workload } = message.payload as any;
    this.log(`收到 ${agentId} 状态更新`, { status, workload });
  }
  
  private handleHelpRequest(message: AgentMessage): void {
    const { type, description } = message.payload as any;
    this.log(`收到求助: ${type}`, description);
    
    // 协调解决方案
    this.send(message.from, 'decision-proposal', {
      decision: 'approve-help',
      resources: this.allocateResources(type)
    });
  }
  
  private handleResourceConflict(message: AgentMessage): void {
    const { conflict, parties } = message.payload as any;
    this.log('资源冲突', { conflict, parties });
    
    // 仲裁决策
    this.broadcast('decision-proposal', {
      type: 'arbitration',
      conflict,
      decision: this.arbitrate(conflict, parties)
    }, 'high');
  }
  
  private handleAlert(message: AgentMessage): void {
    const alert = message.payload as any;
    if (alert.severity === 'critical') {
      this.log('收到严重警报', alert);
      // 立即采取行动
      this.takeEmergencyAction(alert);
    }
  }
  
  private handleStandupReport(message: AgentMessage): void {
    const { reports } = message.payload as any;
    this.log('每日站会报告已生成');
    
    // 识别需要关注的问题
    const issues = reports.filter((r: any) => r.blockers !== '无');
    if (issues.length > 0) {
      this.log(`${issues.length} 位Agent遇到阻塞`, issues.map((i: any) => i.agentName));
    }
  }
  
  private getHighLoadAgents(): string[] {
    // 从上下文中获取Agent状态
    return [];
  }
  
  private allocateResources(type: string): any {
    return { type, allocation: 'pending' };
  }
  
  private arbitrate(conflict: string, parties: string[]): string {
    if (conflict === 'task-assignment') {
      return '优先分配给负载较低的Agent';
    }
    return '需要进一步评估';
  }
  
  private takeEmergencyAction(alert: any): void {
    this.broadcast('alert', {
      type: 'emergency-response',
      action: 'initiated',
      originalAlert: alert
    }, 'urgent');
  }
  
  // 分配任务
  assignTask(task: Task, assigneeId: string): void {
    this.send(assigneeId, 'task-assignment', {
      taskId: task.id,
      taskName: task.title,
      deadline: task.dueDateTime,
      priority: task.priority
    }, 'high');
    
    this.log(`分配任务 "${task.title}" 给 ${assigneeId}`);
  }
}

// ========== 开发 Agent ==========

export class DeveloperAgent extends BaseAgent {
  private techStack: string[] = [];
  private completedTasks: string[] = [];
  
  constructor(id: string, name: string, bus: MessageBus, techStack: string[] = []) {
    super(
      id,
      'developer',
      name,
      bus,
      ['coding', 'code-review', 'debugging', 'architecture', 'technical-design']
    );
    this.techStack = techStack;
  }
  
  protected handleMessage(message: AgentMessage): void {
    switch (message.type) {
      case 'task-assignment':
        this.handleTaskAssignment(message);
        break;
      case 'request-help':
        this.handleHelpRequest(message);
        break;
      case 'decision-proposal':
        this.handleDecisionProposal(message);
        break;
    }
  }
  
  async executeDuty(context: GanttContext): Promise<void> {
    this.setContext(context);
    
    // 获取分配给开发Agent的任务
    const devTasks = context.tasks.filter(t => 
      this.state.currentTasks.includes(t.id)
    );
    
    if (devTasks.length > 0) {
      this.log(`正在处理 ${devTasks.length} 个开发任务`);
      
      // 模拟开发工作
      for (const task of devTasks) {
        await this.workOnTask(task);
      }
    } else {
      this.updateState({ status: 'idle' });
    }
  }
  
  private async workOnTask(task: Task): Promise<void> {
    this.log(`开始开发: ${task.title}`);
    this.updateState({ status: 'working' });
    
    // 模拟开发时间
    await new Promise(r => setTimeout(r, 100));
    
    // 完成任务
    this.completedTasks.push(task.id);
    
    // 通知完成
    this.broadcast('completion-notice', {
      taskId: task.id,
      taskName: task.title,
      completedBy: this.id,
      deliverables: ['code', 'documentation', 'tests']
    });
    
    this.log(`完成开发: ${task.title}`);
    
    // 更新状态
    const remainingTasks = this.state.currentTasks.filter(id => id !== task.id);
    this.updateState({
      currentTasks: remainingTasks,
      status: remainingTasks.length > 0 ? 'working' : 'idle',
      workload: remainingTasks.length * 20
    });
  }
  
  private handleTaskAssignment(message: AgentMessage): void {
    const { taskId, taskName, deadline, priority } = message.payload as any;
    
    this.log(`收到任务分配: ${taskName}`, { deadline, priority });
    
    // 接受任务
    this.state.currentTasks.push(taskId);
    this.updateState({
      status: 'working',
      workload: this.state.currentTasks.length * 20
    });
    
    // 确认接受
    this.send(message.from!, 'status-update', {
      agentId: this.id,
      status: 'accepted',
      taskId,
      estimatedCompletion: this.estimateCompletion(taskName)
    });
  }
  
  private handleHelpRequest(message: AgentMessage): void {
    const { type, taskId } = message.payload as any;
    
    if (type === 'code-review' || type === 'technical-consultation') {
      this.log(`提供技术协助: ${type}`);
      this.send(message.from!, 'request-help', {
        type: 'assistance-provided',
        from: this.id,
        expertise: this.techStack
      });
    }
  }
  
  private handleDecisionProposal(message: AgentMessage): void {
    const { decision, type } = message.payload as any;
    
    if (type === 'technical-decision') {
      // 开发Agent投票支持技术方案
      this.send(message.from!, 'decision-vote', {
        decisionId: decision.id,
        vote: 'approve',
        reasoning: '技术可行'
      });
    }
  }
  
  private estimateCompletion(taskName: string): string {
    // 简单估算
    if (taskName.includes('MCAL') || taskName.includes('基础')) {
      return '10天';
    }
    if (taskName.includes('应用') || taskName.includes('算法')) {
      return '15天';
    }
    return '7天';
  }
}

// ========== 测试 Agent ==========

export class TesterAgent extends BaseAgent {
  private testCases: Map<string, any[]> = new Map();
  private bugsFound: Map<string, any[]> = new Map();
  
  constructor(id: string, name: string, bus: MessageBus) {
    super(
      id,
      'tester',
      name,
      bus,
      ['test-design', 'test-execution', 'bug-tracking', 'quality-assurance', 'automation']
    );
  }
  
  protected handleMessage(message: AgentMessage): void {
    switch (message.type) {
      case 'completion-notice':
        this.handleCompletionNotice(message);
        break;
      case 'task-assignment':
        this.handleTestTaskAssignment(message);
        break;
    }
  }
  
  async executeDuty(context: GanttContext): Promise<void> {
    this.setContext(context);
    
    // 检查待测试的任务
    const pendingTests = this.state.currentTasks;
    
    if (pendingTests.length > 0) {
      this.log(`正在执行 ${pendingTests.length} 个测试任务`);
      
      for (const taskId of pendingTests) {
        await this.executeTest(taskId, context);
      }
    }
  }
  
  private async executeTest(taskId: string, context: GanttContext): Promise<void> {
    const task = context.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    this.log(`开始测试: ${task.title}`);
    
    // 生成测试用例
    const testCases = this.generateTestCases(task);
    this.testCases.set(taskId, testCases);
    
    // 执行测试 (模拟)
    const bugs = this.simulateTesting(task, testCases);
    
    if (bugs.length > 0) {
      this.bugsFound.set(taskId, bugs);
      this.log(`发现 ${bugs.length} 个Bug`, bugs);
      
      // 报告Bug
      this.broadcast('alert', {
        severity: 'high',
        type: 'bugs-found',
        taskId,
        taskName: task.title,
        bugs,
        assignedTo: this.findDeveloperForTask(taskId)
      }, 'high');
    } else {
      this.log(`测试通过: ${task.title}`);
      
      // 标记任务完成
      this.broadcast('completion-notice', {
        taskId,
        type: 'test-passed',
        testCases: testCases.length
      });
    }
  }
  
  private generateTestCases(task: Task): any[] {
    // 根据任务类型生成测试用例
    const cases = [];
    
    if (task.title.includes('MCAL')) {
      cases.push(
        { name: '初始化测试', type: 'unit' },
        { name: '功能测试', type: 'unit' },
        { name: '边界测试', type: 'unit' }
      );
    } else {
      cases.push(
        { name: '功能验证', type: 'integration' },
        { name: '性能测试', type: 'performance' }
      );
    }
    
    return cases;
  }
  
  private simulateTesting(task: Task, testCases: any[]): any[] {
    // 模拟发现Bug (随机)
    const bugs: any[] = [];
    
    if (Math.random() < 0.3) { // 30%概率发现Bug
      bugs.push({
        id: `bug_${Date.now()}`,
        severity: 'medium',
        description: `${task.title} 在边界条件下异常`,
        testCase: testCases[0].name
      });
    }
    
    return bugs;
  }
  
  private handleCompletionNotice(message: AgentMessage): void {
    const { taskId, taskName, deliverables } = message.payload as any;
    
    // 检查是否有测试相关交付物
    if (deliverables?.includes('code')) {
      this.log(`收到开发完成通知: ${taskName}，准备测试`);
      
      // 将任务加入测试队列
      this.state.currentTasks.push(taskId);
      this.updateState({
        status: 'working',
        workload: this.state.currentTasks.length * 25
      });
    }
  }
  
  private handleTestTaskAssignment(message: AgentMessage): void {
    const { taskId, taskName } = message.payload as any;
    this.log(`收到测试任务: ${taskName}`);
    this.state.currentTasks.push(taskId);
  }
  
  private findDeveloperForTask(taskId: string): string {
    // 返回负责该任务的开发者
    return 'dev_001';
  }
  
  // 获取测试报告
  generateTestReport(): any {
    return {
      totalTasksTested: this.testCases.size,
      totalBugsFound: Array.from(this.bugsFound.values()).flat().length,
      testCoverage: 85,
      passRate: 92
    };
  }
}

// ========== 资源调度 Agent ==========

export class ResourceSchedulerAgent extends BaseAgent {
  private resourcePool: Map<string, any> = new Map();
  private allocationHistory: any[] = [];
  
  constructor(id: string, bus: MessageBus) {
    super(
      id,
      'resource-scheduler',
      '资源调度',
      bus,
      ['resource-planning', 'workload-balancing', 'conflict-resolution', 'optimization']
    );
  }
  
  protected handleMessage(message: AgentMessage): void {
    switch (message.type) {
      case 'resource-conflict':
        this.handleResourceConflict(message);
        break;
      case 'status-update':
        this.updateResourceStatus(message);
        break;
      case 'request-help':
        if ((message.payload as any).type === 'resource-request') {
          this.handleResourceRequest(message);
        }
        break;
    }
  }
  
  async executeDuty(context: GanttContext): Promise<void> {
    this.setContext(context);
    
    // 1. 分析资源负载
    await this.analyzeWorkload(context);
    
    // 2. 优化资源分配
    await this.optimizeAllocation(context);
    
    // 3. 检查资源冲突
    await this.checkConflicts(context);
  }
  
  private async analyzeWorkload(context: GanttContext): Promise<void> {
    // 分析各Agent工作负载
    const workload = this.calculateWorkload(context);
    
    // 识别过载和欠载
    const overloaded = workload.filter(w => w.load > 80);
    const underloaded = workload.filter(w => w.load < 30);
    
    if (overloaded.length > 0) {
      this.log('资源过载警告', overloaded);
      
      // 建议重新分配
      this.broadcast('alert', {
        severity: 'medium',
        type: 'workload-imbalance',
        overloaded: overloaded.map(o => o.agentId),
        underloaded: underloaded.map(u => u.agentId)
      });
    }
  }
  
  private async optimizeAllocation(context: GanttContext): Promise<void> {
    // 简单的资源优化：将任务从高负载Agent转移到低负载Agent
    const optimization = this.suggestOptimization(context);
    
    if (optimization.length > 0) {
      this.log('资源优化建议', optimization);
    }
  }
  
  private async checkConflicts(context: GanttContext): Promise<void> {
    // 检查资源使用冲突
    const conflicts = this.detectConflicts(context);
    
    if (conflicts.length > 0) {
      this.broadcast('resource-conflict', {
        conflicts,
        severity: 'high'
      }, 'high');
    }
  }
  
  private calculateWorkload(context: GanttContext): Array<{agentId: string; load: number}> {
    // 从消息总线获取各Agent状态
    return [];
  }
  
  private suggestOptimization(context: GanttContext): any[] {
    return [];
  }
  
  private detectConflicts(context: GanttContext): any[] {
    return [];
  }
  
  private handleResourceConflict(message: AgentMessage): void {
    const { conflicts } = message.payload as any;
    this.log('处理资源冲突', conflicts);
    
    // 仲裁方案
    const resolution = this.arbitrateConflict(conflicts);
    
    this.broadcast('decision-proposal', {
      type: 'resource-arbitration',
      conflicts,
      resolution
    }, 'high');
  }
  
  private handleResourceRequest(message: AgentMessage): void {
    const { resourceType, quantity, requester } = message.payload as any;
    
    this.log(`收到资源请求: ${resourceType} x${quantity} from ${requester}`);
    
    // 检查资源可用性
    const available = this.checkAvailability(resourceType, quantity);
    
    if (available) {
      this.allocate(resourceType, quantity, requester);
      this.send(requester, 'request-help', {
        type: 'resource-granted',
        resourceType,
        quantity
      });
    } else {
      this.send(requester, 'request-help', {
        type: 'resource-denied',
        resourceType,
        reason: '资源不足'
      });
    }
  }
  
  private updateResourceStatus(message: AgentMessage): void {
    const { agentId, workload } = message.payload as any;
    this.resourcePool.set(agentId, { workload, lastUpdate: Date.now() });
  }
  
  private arbitrateConflict(conflicts: any[]): any {
    return {
      strategy: 'priority-based',
      allocation: conflicts.map((c, i) => ({
        resource: c.resource,
        assignedTo: i === 0 ? c.requester : 'queue'
      }))
    };
  }
  
  private checkAvailability(type: string, quantity: number): boolean {
    return true; // 简化实现
  }
  
  private allocate(type: string, quantity: number, to: string): void {
    this.allocationHistory.push({ type, quantity, to, time: Date.now() });
    this.log(`分配资源: ${type} x${quantity} 给 ${to}`);
  }
}

// ========== 风险监控 Agent ==========

export class RiskMonitorAgent extends BaseAgent {
  private riskRegistry: Map<string, any> = new Map();
  private alertThresholds = {
    delay: 3,      // 延期3天预警
    workload: 90,  // 负载90%预警
    bugRate: 0.2   // Bug率20%预警
  };
  
  constructor(id: string, bus: MessageBus) {
    super(
      id,
      'risk-monitor',
      '风险监控',
      bus,
      ['risk-identification', 'risk-assessment', 'early-warning', 'mitigation-planning']
    );
  }
  
  protected handleMessage(message: AgentMessage): void {
    switch (message.type) {
      case 'status-update':
        this.assessRiskFromStatus(message);
        break;
      case 'alert':
        this.escalateIfNeeded(message);
        break;
      case 'completion-notice':
        this.updateRiskProfile(message);
        break;
    }
  }
  
  async executeDuty(context: GanttContext): Promise<void> {
    this.setContext(context);
    
    // 1. 扫描项目风险
    await this.scanRisks(context);
    
    // 2. 评估风险等级
    await this.assessRisks(context);
    
    // 3. 发送预警
    await this.sendAlerts(context);
    
    // 4. 生成风险报告
    await this.generateRiskReport();
  }
  
  private async scanRisks(context: GanttContext): Promise<void> {
    const risks: any[] = [];
    
    // 扫描延期风险
    context.tasks.forEach(task => {
      if (task.status !== 'Completed' && task.dueDateTime) {
        const daysUntilDue = Math.ceil(
          (new Date(task.dueDateTime).getTime() - Date.now()) / (24 * 60 * 60 * 1000)
        );
        const progress = (task as any).completedPercent || 0;
        
        if (daysUntilDue < this.alertThresholds.delay && progress < 80) {
          risks.push({
            id: `risk_${task.id}`,
            type: 'delay',
            severity: daysUntilDue < 1 ? 'critical' : 'high',
            task: task.title,
            description: `任务 "${task.title}" 即将到期但进度仅${progress}%`,
            mitigation: '建议增加资源或调整计划'
          });
        }
      }
    });
    
    // 保存风险
    risks.forEach(risk => this.riskRegistry.set(risk.id, risk));
  }
  
  private async assessRisks(context: GanttContext): Promise<void> {
    // 评估风险等级变化
    let criticalCount = 0;
    
    this.riskRegistry.forEach(risk => {
      if (risk.severity === 'critical') criticalCount++;
    });
    
    if (criticalCount > 0) {
      this.log(`发现 ${criticalCount} 个严重风险`);
    }
  }
  
  private async sendAlerts(context: GanttContext): Promise<void> {
    // 发送风险预警
    this.riskRegistry.forEach((risk, id) => {
      if (risk.severity === 'critical' && !risk.alerted) {
        this.broadcast('alert', {
          severity: 'critical',
          type: 'risk-warning',
          riskId: id,
          description: risk.description,
          mitigation: risk.mitigation
        }, 'urgent');
        
        risk.alerted = true;
      }
    });
  }
  
  private async generateRiskReport(): Promise<void> {
    const report = {
      totalRisks: this.riskRegistry.size,
      critical: Array.from(this.riskRegistry.values()).filter(r => r.severity === 'critical').length,
      high: Array.from(this.riskRegistry.values()).filter(r => r.severity === 'high').length,
      timestamp: Date.now()
    };
    
    if (report.critical > 0) {
      this.log('风险报告', report);
    }
  }
  
  private assessRiskFromStatus(message: AgentMessage): void {
    const { workload, status } = message.payload as any;
    
    // 检测负载风险
    if (workload > this.alertThresholds.workload) {
      this.log(`Agent ${message.from} 负载过高: ${workload}%`);
      
      this.broadcast('alert', {
        severity: 'high',
        type: 'workload-risk',
        agent: message.from,
        workload
      }, 'high');
    }
  }
  
  private escalateIfNeeded(message: AgentMessage): void {
    const alert = message.payload as any;
    
    // 严重警报升级给项目经理
    if (alert.severity === 'critical') {
      this.log('严重警报升级', alert);
    }
  }
  
  private updateRiskProfile(message: AgentMessage): void {
    // 任务完成后更新风险档案
    const { taskId, type } = message.payload as any;
    
    if (type === 'test-passed') {
      // 测试通过，降低相关风险
      this.riskRegistry.forEach((risk, id) => {
        if (risk.taskId === taskId) {
          this.riskRegistry.delete(id);
        }
      });
    }
  }
  
  // 获取风险统计
  getRiskStats(): { total: number; critical: number; high: number } {
    const risks = Array.from(this.riskRegistry.values());
    return {
      total: risks.length,
      critical: risks.filter(r => r.severity === 'critical').length,
      high: risks.filter(r => r.severity === 'high').length
    };
  }
}
