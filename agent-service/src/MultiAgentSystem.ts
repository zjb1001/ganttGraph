/**
 * Level 7: 多智能体协作系统 - 基础架构
 * 消息总线、Agent基类、协作协议
 */

import { Task, GanttContext } from '@/types';

// ========== 消息类型定义 ==========

export type MessageType = 
  | 'status-update'      // 状态更新
  | 'request-help'       // 请求协助
  | 'resource-conflict'  // 资源冲突
  | 'decision-proposal'  // 决策提议
  | 'decision-vote'      // 决策投票
  | 'alert'              // 警报
  | 'daily-standup'      // 每日站会
  | 'task-assignment'    // 任务分配
  | 'completion-notice'; // 完成通知

export interface AgentMessage {
  id: string;
  timestamp: number;
  from: string;          // 发送者Agent ID
  to?: string;           // 接收者Agent ID (空表示广播)
  type: MessageType;
  payload: unknown;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  requireAck?: boolean;  // 是否需要确认
}

// ========== Agent角色类型 ==========

export type AgentRole = 
  | 'project-manager'    // 项目经理
  | 'developer'          // 开发
  | 'tester'             // 测试
  | 'resource-scheduler' // 资源调度
  | 'risk-monitor';      // 风险监控

// ========== Agent状态 ==========

export interface AgentState {
  id: string;
  role: AgentRole;
  name: string;
  status: 'idle' | 'working' | 'blocked' | 'offline';
  currentTasks: string[];
  workload: number;      // 0-100
  lastActive: number;
  capabilities: string[];
}

// ========== 决策投票 ==========

export interface Decision {
  id: string;
  proposal: string;
  proposer: string;
  options: string[];
  votes: Map<string, string>;  // Agent ID -> 选项
  deadline: number;
  status: 'voting' | 'passed' | 'rejected' | 'tie';
  result?: string;
}

// ========== 消息总线 ==========

export class MessageBus {
  private subscribers = new Map<string, ((msg: AgentMessage) => void)[]>();
  private messageHistory: AgentMessage[] = [];
  private maxHistory = 1000;
  
  // 订阅消息
  subscribe(agentId: string, callback: (msg: AgentMessage) => void): () => void {
    if (!this.subscribers.has(agentId)) {
      this.subscribers.set(agentId, []);
    }
    this.subscribers.get(agentId)!.push(callback);
    
    // 返回取消订阅函数
    return () => {
      const callbacks = this.subscribers.get(agentId);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) callbacks.splice(index, 1);
      }
    };
  }
  
  // 广播消息
  broadcast(message: Omit<AgentMessage, 'id' | 'timestamp'>): void {
    const fullMessage: AgentMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };
    
    // 保存历史
    this.messageHistory.push(fullMessage);
    if (this.messageHistory.length > this.maxHistory) {
      this.messageHistory.shift();
    }
    
    // 发送给所有订阅者
    if (fullMessage.to) {
      // 单播
      const callbacks = this.subscribers.get(fullMessage.to);
      callbacks?.forEach(cb => {
        try {
          cb(fullMessage);
        } catch (e) {
          console.error(`Error delivering message to ${fullMessage.to}:`, e);
        }
      });
    } else {
      // 广播
      this.subscribers.forEach((callbacks, agentId) => {
        if (agentId !== fullMessage.from) {
          callbacks.forEach(cb => {
            try {
              cb(fullMessage);
            } catch (e) {
              console.error(`Error broadcasting to ${agentId}:`, e);
            }
          });
        }
      });
    }
  }
  
  // 获取消息历史
  getHistory(agentId?: string, type?: MessageType): AgentMessage[] {
    let history = this.messageHistory;
    
    if (agentId) {
      history = history.filter(m => m.to === agentId || m.from === agentId || !m.to);
    }
    
    if (type) {
      history = history.filter(m => m.type === type);
    }
    
    return [...history];
  }
  
  // 获取最近消息
  getRecent(count: number = 10): AgentMessage[] {
    return this.messageHistory.slice(-count);
  }
}

// ========== Agent基类 ==========

export abstract class BaseAgent {
  protected id: string;
  protected role: AgentRole;
  protected name: string;
  protected bus: MessageBus;
  protected state: AgentState;
  protected context?: GanttContext;
  private unsubscribe?: () => void;
  
  constructor(
    id: string,
    role: AgentRole,
    name: string,
    bus: MessageBus,
    capabilities: string[] = []
  ) {
    this.id = id;
    this.role = role;
    this.name = name;
    this.bus = bus;
    this.state = {
      id,
      role,
      name,
      status: 'idle',
      currentTasks: [],
      workload: 0,
      lastActive: Date.now(),
      capabilities
    };
    
    // 订阅消息
    this.unsubscribe = this.bus.subscribe(this.id, this.handleMessage.bind(this));
  }
  
  // 抽象方法：处理消息
  protected abstract handleMessage(message: AgentMessage): void;
  
  // 抽象方法：执行职责
  abstract executeDuty(context: GanttContext): Promise<void>;
  
  // 发送消息
  protected send(to: string | undefined, type: MessageType, payload: unknown, priority: AgentMessage['priority'] = 'medium'): void {
    this.bus.broadcast({
      from: this.id,
      to,
      type,
      payload,
      priority
    });
  }
  
  // 广播消息
  protected broadcast(type: MessageType, payload: unknown, priority: AgentMessage['priority'] = 'medium'): void {
    this.send(undefined, type, payload, priority);
  }
  
  // 更新状态
  protected updateState(updates: Partial<AgentState>): void {
    Object.assign(this.state, updates);
    this.state.lastActive = Date.now();
  }
  
  // 获取状态
  getState(): AgentState {
    return { ...this.state };
  }
  
  // 设置上下文
  setContext(context: GanttContext): void {
    this.context = context;
  }
  
  // 销毁
  destroy(): void {
    this.unsubscribe?.();
  }
  
  // 日志
  protected log(action: string, details?: unknown): void {
    console.log(`[${this.role}] ${this.name}: ${action}`, details || '');
  }
}

// ========== 协作管理器 ==========

export class CollaborationManager {
  private bus: MessageBus;
  private decisions = new Map<string, Decision>();
  private agents = new Map<string, BaseAgent>();
  
  constructor(bus: MessageBus) {
    this.bus = bus;
  }
  
  // 注册Agent
  registerAgent(agent: BaseAgent): void {
    this.agents.set(agent.getState().id, agent);
  }
  
  // 获取所有Agent状态
  getAllAgentStates(): AgentState[] {
    return Array.from(this.agents.values()).map(a => a.getState());
  }
  
  // 发起决策投票
  proposeDecision(
    proposer: string,
    proposal: string,
    options: string[],
    durationMs: number = 5 * 60 * 1000 // 默认5分钟
  ): string {
    const decisionId = `decision_${Date.now()}`;
    
    const decision: Decision = {
      id: decisionId,
      proposal,
      proposer,
      options,
      votes: new Map(),
      deadline: Date.now() + durationMs,
      status: 'voting'
    };
    
    this.decisions.set(decisionId, decision);
    
    // 广播决策提议
    this.bus.broadcast({
      from: proposer,
      type: 'decision-proposal',
      payload: { decisionId, proposal, options, deadline: decision.deadline },
      priority: 'high'
    });
    
    return decisionId;
  }
  
  // 投票
  vote(decisionId: string, agentId: string, option: string): boolean {
    const decision = this.decisions.get(decisionId);
    if (!decision) return false;
    if (decision.status !== 'voting') return false;
    if (Date.now() > decision.deadline) return false;
    if (!decision.options.includes(option)) return false;
    
    decision.votes.set(agentId, option);
    
    // 广播投票
    this.bus.broadcast({
      from: agentId,
      type: 'decision-vote',
      payload: { decisionId, agentId, option },
      priority: 'medium'
    });
    
    // 检查是否所有Agent都投票了
    if (decision.votes.size >= this.agents.size) {
      this.finalizeDecision(decisionId);
    }
    
    return true;
  }
  
  // 结束投票并计算结果
  finalizeDecision(decisionId: string): Decision | null {
    const decision = this.decisions.get(decisionId);
    if (!decision) return null;
    if (decision.status !== 'voting') return decision;
    
    // 统计票数
    const counts = new Map<string, number>();
    decision.votes.forEach(option => {
      counts.set(option, (counts.get(option) || 0) + 1);
    });
    
    // 找出最高票
    let maxVotes = 0;
    let winner: string | null = null;
    let tie = false;
    
    counts.forEach((count, option) => {
      if (count > maxVotes) {
        maxVotes = count;
        winner = option;
        tie = false;
      } else if (count === maxVotes) {
        tie = true;
      }
    });
    
    if (tie) {
      decision.status = 'tie';
    } else if (winner) {
      decision.status = 'passed';
      decision.result = winner;
    } else {
      decision.status = 'rejected';
    }
    
    // 广播结果
    this.bus.broadcast({
      from: 'system',
      type: 'decision-proposal',
      payload: { 
        decisionId, 
        status: decision.status, 
        result: decision.result,
        votes: Object.fromEntries(decision.votes)
      },
      priority: 'high'
    });
    
    return decision;
  }
  
  // 每日站会
  async runDailyStandup(): Promise<StandupReport> {
    const reports: AgentReport[] = [];
    
    // 收集各Agent昨日进展和今日计划
    for (const agent of this.agents.values()) {
      const state = agent.getState();
      reports.push({
        agentId: state.id,
        agentName: state.name,
        role: state.role,
        yesterday: `完成了 ${state.currentTasks.length} 个任务`,
        today: `继续处理 ${state.currentTasks.join(', ')}`,
        blockers: state.status === 'blocked' ? '遇到阻塞问题' : '无',
        workload: state.workload
      });
    }
    
    // 广播站会报告
    this.bus.broadcast({
      from: 'system',
      type: 'daily-standup',
      payload: { reports },
      priority: 'medium'
    });
    
    return {
      timestamp: Date.now(),
      reports,
      summary: this.generateStandupSummary(reports)
    };
  }
  
  private generateStandupSummary(reports: AgentReport[]): string {
    const totalTasks = reports.reduce((sum, r) => sum + r.workload, 0);
    const blocked = reports.filter(r => r.blockers !== '无').length;
    
    return `今日共有 ${reports.length} 位Agent参会，总工作负载 ${totalTasks}%，${blocked} 位Agent遇到阻塞`;
  }
  
  // 冲突仲裁
  arbitrateConflict(
    conflictType: string,
    parties: string[],
    description: string
  ): ArbitrationResult {
    // 简化的仲裁逻辑：项目经理Agent决定
    const pmAgent = Array.from(this.agents.values())
      .find(a => a.getState().role === 'project-manager');
    
    const result: ArbitrationResult = {
      conflictType,
      parties,
      description,
      decision: 'pending',
      reasoning: ''
    };
    
    if (conflictType === 'resource') {
      result.decision = 'reallocate';
      result.reasoning = '建议重新分配资源，优先保障关键路径';
    } else if (conflictType === 'priority') {
      result.decision = 'pm-decides';
      result.reasoning = '由项目经理评估优先级';
    }
    
    // 广播仲裁结果
    this.bus.broadcast({
      from: 'system',
      type: 'alert',
      payload: { type: 'arbitration', result },
      priority: 'high'
    });
    
    return result;
  }
}

// ========== 类型定义 ==========

export interface AgentReport {
  agentId: string;
  agentName: string;
  role: AgentRole;
  yesterday: string;
  today: string;
  blockers: string;
  workload: number;
}

export interface StandupReport {
  timestamp: number;
  reports: AgentReport[];
  summary: string;
}

export interface ArbitrationResult {
  conflictType: string;
  parties: string[];
  description: string;
  decision: string;
  reasoning: string;
}

// 导出单例消息总线
export const globalMessageBus = new MessageBus();
