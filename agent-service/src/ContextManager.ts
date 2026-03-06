/**
 * 上下文管理模块 - Level 3
 * 支持长对话、状态持久化、历史查询
 */

import { Task, GanttContext, AgentAction } from '@/types';

// 对话记录
export interface ConversationTurn {
  id: string;
  timestamp: number;
  role: 'user' | 'agent';
  content: string;
  action?: AgentAction;
}

// 项目快照
export interface ProjectSnapshot {
  id: string;
  name: string;
  timestamp: number;
  tasks: Task[];
  context: Partial<GanttContext>;
}

// 历史操作记录
export interface HistoryEntry {
  id: string;
  timestamp: number;
  type: 'create' | 'update' | 'delete' | 'schedule' | 'analyze';
  description: string;
  taskId?: string;
  before?: any;
  after?: any;
}

// 压缩后的上下文摘要
export interface ContextSummary {
  projectGoal: string;
  keyDecisions: string[];
  activeTasks: string[];
  pendingIssues: string[];
  lastUpdated: number;
}

/**
 * 对话历史管理
 */
export class ConversationMemory {
  private maxTurns: number;
  private turns: ConversationTurn[] = [];
  private summaries: ContextSummary[] = [];
  
  constructor(maxTurns: number = 20) {
    this.maxTurns = maxTurns;
  }
  
  addTurn(role: 'user' | 'agent', content: string, action?: AgentAction): ConversationTurn {
    const turn: ConversationTurn = {
      id: `turn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      role,
      content,
      action
    };
    
    this.turns.push(turn);
    
    // 压缩旧对话
    if (this.turns.length > this.maxTurns) {
      this.compressOldTurns();
    }
    
    return turn;
  }
  
  getRecentTurns(count: number = 5): ConversationTurn[] {
    return this.turns.slice(-count);
  }
  
  getAllTurns(): ConversationTurn[] {
    return [...this.turns];
  }
  
  searchTurns(keyword: string): ConversationTurn[] {
    return this.turns.filter(t => 
      t.content.toLowerCase().includes(keyword.toLowerCase())
    );
  }
  
  /**
   * 压缩旧对话为摘要
   */
  private compressOldTurns(): void {
    const oldTurns = this.turns.splice(0, this.turns.length - this.maxTurns + 5);
    
    // 提取关键决策和任务
    const keyDecisions: string[] = [];
    const activeTasks: string[] = [];
    
    oldTurns.forEach(turn => {
      if (turn.role === 'user') {
        // 提取任务创建
        const taskMatch = turn.content.match(/(?:创建|添加).*?(?:叫|名为)?["']?([^"'，,]{2,20})["']?/);
        if (taskMatch) {
          activeTasks.push(taskMatch[1]);
        }
      }
      
      if (turn.action?.success) {
        keyDecisions.push(`${turn.content.substring(0, 30)}...`);
      }
    });
    
    const summary: ContextSummary = {
      projectGoal: this.inferProjectGoal(oldTurns),
      keyDecisions: keyDecisions.slice(-5),
      activeTasks: activeTasks.slice(-10),
      pendingIssues: [],
      lastUpdated: Date.now()
    };
    
    this.summaries.push(summary);
  }
  
  /**
   * 推断项目目标
   */
  private inferProjectGoal(turns: ConversationTurn[]): string {
    // 简单启发式：找第一个包含"项目"、"计划"、"排期"的用户输入
    const goalTurn = turns.find(t => 
      t.role === 'user' && 
      /(?:项目|计划|排期|管理|开发)/.test(t.content)
    );
    
    return goalTurn ? goalTurn.content.substring(0, 50) + '...' : '项目管理';
  }
  
  /**
   * 获取完整上下文（最近对话 + 摘要）
   */
  getContextForPrompt(): string {
    const recent = this.getRecentTurns(5);
    const latestSummary = this.summaries[this.summaries.length - 1];
    
    let context = '';
    
    if (latestSummary) {
      context += `【项目背景】\n目标: ${latestSummary.projectGoal}\n`;
      context += `活跃任务: ${latestSummary.activeTasks.join(', ')}\n\n`;
    }
    
    context += '【最近对话】\n';
    recent.forEach(turn => {
      const role = turn.role === 'user' ? '用户' : 'Agent';
      context += `${role}: ${turn.content}\n`;
    });
    
    return context;
  }
  
  clear(): void {
    this.turns = [];
    this.summaries = [];
  }
  
  export(): { turns: ConversationTurn[]; summaries: ContextSummary[] } {
    return {
      turns: this.turns,
      summaries: this.summaries
    };
  }
  
  import(data: { turns: ConversationTurn[]; summaries: ContextSummary[] }): void {
    this.turns = data.turns || [];
    this.summaries = data.summaries || [];
  }
}

/**
 * 项目状态持久化
 */
export class ProjectStateManager {
  private storageKey: string = 'gantt_agent_projects';
  private currentProjectId: string | null = null;
  
  /**
   * 保存项目状态
   */
  save(context: GanttContext, memory: ConversationMemory): void {
    const snapshot: ProjectSnapshot = {
      id: context.projectId,
      name: `项目-${context.projectId}`,
      timestamp: Date.now(),
      tasks: context.tasks,
      context: {
        projectId: context.projectId,
        buckets: context.buckets
      }
    };
    
    // 保存项目数据
    const projects = this.getAllProjects();
    projects[snapshot.id] = {
      snapshot,
      memory: memory.export(),
      savedAt: Date.now()
    };
    
    this.saveToStorage(projects);
    this.currentProjectId = context.projectId;
  }
  
  /**
   * 加载项目状态
   */
  load(projectId: string): { snapshot: ProjectSnapshot; memory: ConversationMemory } | null {
    const projects = this.getAllProjects();
    const data = projects[projectId];
    
    if (!data) return null;
    
    const memory = new ConversationMemory();
    memory.import(data.memory);
    
    this.currentProjectId = projectId;
    
    return {
      snapshot: data.snapshot,
      memory
    };
  }
  
  /**
   * 列出所有保存的项目
   */
  listProjects(): Array<{ id: string; name: string; savedAt: number }> {
    const projects = this.getAllProjects();
    return Object.values(projects).map((p: any) => ({
      id: p.snapshot.id,
      name: p.snapshot.name,
      savedAt: p.savedAt
    }));
  }
  
  /**
   * 删除项目
   */
  delete(projectId: string): boolean {
    const projects = this.getAllProjects();
    if (projects[projectId]) {
      delete projects[projectId];
      this.saveToStorage(projects);
      return true;
    }
    return false;
  }
  
  /**
   * 导出为JSON
   */
  exportToJSON(projectId: string): string | null {
    const projects = this.getAllProjects();
    const data = projects[projectId];
    return data ? JSON.stringify(data, null, 2) : null;
  }
  
  /**
   * 从JSON导入
   */
  importFromJSON(json: string): boolean {
    try {
      const data = JSON.parse(json);
      if (data.snapshot && data.memory) {
        const projects = this.getAllProjects();
        projects[data.snapshot.id] = data;
        this.saveToStorage(projects);
        return true;
      }
    } catch (e) {
      console.error('Import failed:', e);
    }
    return false;
  }
  
  /**
   * 自动保存（定时）
   */
  setupAutoSave(context: GanttContext, memory: ConversationMemory, intervalMs: number = 30000): () => void {
    const interval = setInterval(() => {
      this.save(context, memory);
    }, intervalMs);
    
    // 返回清理函数
    return () => clearInterval(interval);
  }
  
  private getAllProjects(): Record<string, any> {
    if (typeof localStorage !== 'undefined') {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : {};
    }
    return {};
  }
  
  private saveToStorage(projects: Record<string, any>): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.storageKey, JSON.stringify(projects));
    }
  }
}

/**
 * 历史记录追踪
 */
export class HistoryTracker {
  private history: HistoryEntry[] = [];
  private maxHistory: number = 100;
  
  record(
    type: HistoryEntry['type'],
    description: string,
    taskId?: string,
    before?: any,
    after?: any
  ): HistoryEntry {
    const entry: HistoryEntry = {
      id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type,
      description,
      taskId,
      before,
      after
    };
    
    this.history.push(entry);
    
    // 限制历史记录数量
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
    
    return entry;
  }
  
  getHistory(count: number = 10): HistoryEntry[] {
    return this.history.slice(-count);
  }
  
  getHistoryForTask(taskId: string): HistoryEntry[] {
    return this.history.filter(h => h.taskId === taskId);
  }
  
  undo(): HistoryEntry | null {
    const lastEntry = this.history.pop();
    return lastEntry || null;
  }
  
  searchHistory(keyword: string): HistoryEntry[] {
    return this.history.filter(h => 
      h.description.toLowerCase().includes(keyword.toLowerCase())
    );
  }
  
  clear(): void {
    this.history = [];
  }
  
  export(): HistoryEntry[] {
    return [...this.history];
  }
}

/**
 * 多轮对话状态
 */
export class MultiTurnState {
  private pendingQuestion: string | null = null;
  private pendingAction: (() => Promise<any>) | null = null;
  private expectedAnswerType: 'confirmation' | 'input' | 'selection' | null = null;
  
  /**
   * 询问确认
   */
  askForConfirmation(question: string, onConfirm: () => Promise<any>): string {
    this.pendingQuestion = question;
    this.pendingAction = onConfirm;
    this.expectedAnswerType = 'confirmation';
    return question;
  }
  
  /**
   * 询问输入
   */
  askForInput(question: string, onInput: (input: string) => Promise<any>): string {
    this.pendingQuestion = question;
    this.pendingAction = (async () => {
      // 需要外部传入input调用
    }) as any;
    this.expectedAnswerType = 'input';
    return question;
  }
  
  /**
   * 处理用户回复
   */
  async handleResponse(response: string): Promise<{ handled: boolean; result?: any; message?: string }> {
    if (!this.pendingQuestion) {
      return { handled: false };
    }
    
    const lowerResponse = response.toLowerCase();
    
    if (this.expectedAnswerType === 'confirmation') {
      if (/^(是|yes|y|确定|确认|好|ok)/i.test(lowerResponse)) {
        const result = await this.pendingAction?.();
        this.clear();
        return { handled: true, result, message: '已确认执行' };
      } else if (/^(否|no|n|取消|不)/i.test(lowerResponse)) {
        this.clear();
        return { handled: true, message: '已取消操作' };
      }
    }
    
    return { handled: false };
  }
  
  isWaitingForResponse(): boolean {
    return this.pendingQuestion !== null;
  }
  
  getPendingQuestion(): string | null {
    return this.pendingQuestion;
  }
  
  clear(): void {
    this.pendingQuestion = null;
    this.pendingAction = null;
    this.expectedAnswerType = null;
  }
}

/**
 * 上下文管理器 - 主类
 */
export class ContextManager {
  memory: ConversationMemory;
  stateManager: ProjectStateManager;
  history: HistoryTracker;
  multiTurn: MultiTurnState;
  
  constructor() {
    this.memory = new ConversationMemory(20);
    this.stateManager = new ProjectStateManager();
    this.history = new HistoryTracker();
    this.multiTurn = new MultiTurnState();
  }
  
  /**
   * 记录对话
   */
  recordTurn(role: 'user' | 'agent', content: string, action?: AgentAction): void {
    this.memory.addTurn(role, content, action);
  }
  
  /**
   * 获取用于Agent的上下文
   */
  getAgentContext(): string {
    return this.memory.getContextForPrompt();
  }
  
  /**
   * 记录操作历史
   */
  recordHistory(
    type: HistoryEntry['type'],
    description: string,
    taskId?: string,
    before?: any,
    after?: any
  ): void {
    this.history.record(type, description, taskId, before, after);
  }
  
  /**
   * 保存项目
   */
  saveProject(context: GanttContext): void {
    this.stateManager.save(context, this.memory);
    this.recordHistory('create', `保存项目: ${context.projectId}`);
  }
  
  /**
   * 加载项目
   */
  loadProject(projectId: string): { snapshot: ProjectSnapshot; memory: ConversationMemory } | null {
    const result = this.stateManager.load(projectId);
    if (result) {
      this.memory = result.memory;
      this.recordHistory('create', `加载项目: ${projectId}`);
    }
    return result;
  }
  
  /**
   * 查询历史
   */
  queryHistory(query: string): HistoryEntry[] {
    // 支持自然语言查询
    if (query.includes('创建')) {
      return this.history.getHistory().filter(h => h.type === 'create');
    }
    if (query.includes('更新') || query.includes('修改')) {
      return this.history.getHistory().filter(h => h.type === 'update');
    }
    return this.history.searchHistory(query);
  }
  
  /**
   * 导出完整状态
   */
  exportFullState(context: GanttContext): string {
    return JSON.stringify({
      context,
      memory: this.memory.export(),
      history: this.history.export(),
      exportedAt: Date.now()
    }, null, 2);
  }
  
  /**
   * 统计信息
   */
  getStats(): {
    totalTurns: number;
    totalHistory: number;
    savedProjects: number;
    hasPendingQuestion: boolean;
  } {
    return {
      totalTurns: this.memory.getAllTurns().length,
      totalHistory: this.history.getHistory(1000).length,
      savedProjects: this.stateManager.listProjects().length,
      hasPendingQuestion: this.multiTurn.isWaitingForResponse()
    };
  }
}
