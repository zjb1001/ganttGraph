/**
 * 优化的 Agent 实现 (v2.0)
 * - 严格的类型定义
 * - 改进的意图识别算法
 * - 统一的错误处理
 * - 性能监控
 */

import { 
  Task, 
  GanttContext, 
  AgentAction 
} from '@/types';

import {
  Tool,
  ToolParams,
  ToolResult,
  Intent,
  IntentType,
  IntentRule,
  AgentError,
  ErrorCode,
  LogLevel,
  LogEntry,
  PerformanceMetrics,
  ConversationTurn
} from './types';

import { TaskPlanner } from './TaskPlanner';
import { ContextManager } from './ContextManager';
import { IntelligenceEnhancer } from './IntelligenceEnhancer';

// ========== 意图识别规则库 ==========

const INTENT_RULES: IntentRule[] = [
  {
    type: 'create_task',
    keywords: ['创建', '新建', '添加', '增加'],
    patterns: [
      /(?:创建|新建|添加).*?(?:任务|工作)/,
      /添加.*?(?:到|进)/
    ],
    weight: 1.0
  },
  {
    type: 'read_tasks',
    keywords: ['查看', '读取', '显示', '列出', '所有'],
    patterns: [
      /(?:查看|显示|列出).*?(?:任务|列表)/,
      /(?:所有|全部).*?任务/
    ],
    weight: 1.0
  },
  {
    type: 'update_task',
    keywords: ['更新', '修改', '调整', '改变', '设置'],
    patterns: [
      /(?:更新|修改|调整).*?(?:任务|状态)/,
      /(?:把|将).*?改为/
    ],
    weight: 1.0
  },
  {
    type: 'analyze_dependencies',
    keywords: ['依赖', '关系', '关联', '分析'],
    patterns: [
      /(?:分析|查看).*?(?:依赖|关系)/,
      /(?:循环|闭环)/
    ],
    weight: 1.0
  },
  {
    type: 'auto_schedule',
    keywords: ['排期', '调度', '安排', '规划', '时间'],
    patterns: [
      /(?:自动|智能)?(?:排期|调度)/,
      /(?:安排|规划).*?(?:时间|日期)/
    ],
    weight: 1.0
  },
  {
    type: 'check_risks',
    keywords: ['风险', '检查', '评估', '预警', '问题'],
    patterns: [
      /(?:检查|评估|分析).*?(?:风险|问题)/
    ],
    weight: 1.0
  },
  {
    type: 'save_project',
    keywords: ['保存', '存档', '存储'],
    patterns: [
      /(?:保存|存档|存储).*?(?:项目|计划)/
    ],
    weight: 1.0
  },
  {
    type: 'load_project',
    keywords: ['加载', '读取', '打开', '恢复'],
    patterns: [
      /(?:加载|读取|打开).*?(?:项目|计划)/
    ],
    weight: 1.0
  },
  {
    type: 'query_history',
    keywords: ['历史', '记录', '查询', '之前', '以前'],
    patterns: [
      /(?:查看|查询).*?(?:历史|记录)/
    ],
    weight: 1.0
  },
  {
    type: 'get_stats',
    keywords: ['统计', '信息', '状态', '概览', '总结'],
    patterns: [
      /(?:查看|获取).*?(?:统计|信息|状态)/
    ],
    weight: 1.0
  },
  {
    type: 'assess_risks',
    keywords: ['全面', '详细', '深度', '完整'],
    patterns: [
      /(?:全面|详细|深度).*?(?:评估|分析)/
    ],
    weight: 1.2  // 更具体的匹配，权重更高
  },
  {
    type: 'optimize_resources',
    keywords: ['资源', '优化', '瓶颈', '分配'],
    patterns: [
      /(?:优化|分析).*?(?:资源|分配)/
    ],
    weight: 1.0
  },
  {
    type: 'get_suggestions',
    keywords: ['建议', '推荐', '方案', '优化'],
    patterns: [
      /(?:获取|给出|推荐).*?(?:建议|方案)/
    ],
    weight: 1.0
  },
  {
    type: 'quick_risk_check',
    keywords: ['快速', '概览', '健康', '检查'],
    patterns: [
      /(?:快速|概览).*?(?:检查|评估)/
    ],
    weight: 1.0
  }
];

// ========== 日志记录器 ==========

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  
  log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      message,
      context
    };
    
    this.logs.push(entry);
    
    // 限制日志数量
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    
    // 开发环境输出到控制台
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[${level.toUpperCase()}] ${message}`, context || '');
    }
  }
  
  debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context);
  }
  
  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }
  
  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context);
  }
  
  error(message: string, context?: Record<string, unknown>): void {
    this.log('error', message, context);
  }
  
  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter(l => l.level === level);
    }
    return [...this.logs];
  }
}

// ========== 性能监控器 ==========

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics = 100;
  
  record(toolName: string, duration: number, success: boolean): void {
    this.metrics.push({
      toolName,
      duration,
      success,
      timestamp: Date.now()
    });
    
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }
  
  getAverageDuration(toolName: string): number {
    const toolMetrics = this.metrics.filter(m => m.toolName === toolName);
    if (toolMetrics.length === 0) return 0;
    
    const total = toolMetrics.reduce((sum, m) => sum + m.duration, 0);
    return total / toolMetrics.length;
  }
  
  getSuccessRate(toolName: string): number {
    const toolMetrics = this.metrics.filter(m => m.toolName === toolName);
    if (toolMetrics.length === 0) return 0;
    
    const successCount = toolMetrics.filter(m => m.success).length;
    return successCount / toolMetrics.length;
  }
  
  getReport(): Record<string, { avgDuration: number; successRate: number }> {
    const toolNames = [...new Set(this.metrics.map(m => m.toolName))];
    const report: Record<string, { avgDuration: number; successRate: number }> = {};
    
    toolNames.forEach(name => {
      report[name] = {
        avgDuration: this.getAverageDuration(name),
        successRate: this.getSuccessRate(name)
      };
    });
    
    return report;
  }
}

// ========== 优化的 Agent ==========

export class OptimizedGanttAgent {
  private planner = new TaskPlanner();
  private contextManager = new ContextManager();
  private enhancer = new IntelligenceEnhancer();
  private logger = new Logger();
  private monitor = new PerformanceMonitor();
  
  // 工具注册表
  private tools: Map<IntentType, Tool> = new Map();
  
  constructor() {
    this.registerTools();
  }
  
  /**
   * 注册所有工具
   */
  private registerTools(): void {
    const toolDefinitions: Array<{ type: IntentType; tool: Tool }> = [
      {
        type: 'create_task',
        tool: {
          name: 'create_task',
          description: '创建新任务',
          execute: async (params, ctx) => this.handleCreateTask(params, ctx)
        }
      },
      {
        type: 'read_tasks',
        tool: {
          name: 'read_tasks',
          description: '读取所有任务',
          execute: async (_params, ctx) => this.handleReadTasks(ctx)
        }
      },
      {
        type: 'update_task',
        tool: {
          name: 'update_task',
          description: '更新任务',
          execute: async (params, ctx) => this.handleUpdateTask(params, ctx)
        }
      },
      {
        type: 'analyze_dependencies',
        tool: {
          name: 'analyze_dependencies',
          description: '分析依赖关系',
          execute: async (_params, ctx) => this.handleAnalyzeDependencies(ctx)
        }
      },
      {
        type: 'auto_schedule',
        tool: {
          name: 'auto_schedule',
          description: '自动排期',
          execute: async (params, ctx) => this.handleAutoSchedule(params, ctx)
        }
      },
      {
        type: 'check_risks',
        tool: {
          name: 'check_risks',
          description: '风险检查',
          execute: async (_params, ctx) => this.handleCheckRisks(ctx)
        }
      },
      {
        type: 'save_project',
        tool: {
          name: 'save_project',
          description: '保存项目',
          execute: async (_params, ctx) => this.handleSaveProject(ctx)
        }
      },
      {
        type: 'get_stats',
        tool: {
          name: 'get_stats',
          description: '统计信息',
          execute: async () => this.handleGetStats()
        }
      }
    ];
    
    toolDefinitions.forEach(({ type, tool }) => {
      this.tools.set(type, tool);
    });
  }
  
  /**
   * 核心处理入口
   */
  async process(userMessage: string, context: GanttContext): Promise<AgentAction> {
    const startTime = Date.now();
    
    this.logger.info('Processing user message', { message: userMessage });
    
    try {
      // 1. 多轮对话检查
      if (this.contextManager.multiTurn.isWaitingForResponse()) {
        const multiTurnResult = await this.contextManager.multiTurn.handleResponse(userMessage);
        if (multiTurnResult.handled) {
          return {
            success: true,
            message: multiTurnResult.message || '已处理',
            data: multiTurnResult.result
          };
        }
      }
      
      // 2. 记录用户输入
      this.recordTurn('user', userMessage);
      
      // 3. 意图识别
      const intent = this.recognizeIntent(userMessage);
      this.logger.debug('Intent recognized', { intent });
      
      // 4. 获取工具
      const tool = this.tools.get(intent.tool);
      if (!tool) {
        throw new AgentError(
          `未知工具: ${intent.tool}`,
          ErrorCode.TOOL_NOT_FOUND,
          { availableTools: Array.from(this.tools.keys()) }
        );
      }
      
      // 5. 执行工具
      const toolStart = Date.now();
      const result = await tool.execute(intent.params, context);
      const toolDuration = Date.now() - toolStart;
      
      // 6. 记录性能
      this.monitor.record(tool.name, toolDuration, result.success);
      
      // 7. 构建响应
      const action: AgentAction = {
        success: result.success,
        message: result.success 
          ? `${tool.name} 执行成功` 
          : `执行失败: ${result.error}`,
        data: result.data
      };
      
      // 8. 记录Agent回复
      this.recordTurn('agent', action.message, action, intent);
      
      const totalDuration = Date.now() - startTime;
      this.logger.info('Message processed', { 
        duration: totalDuration,
        tool: tool.name,
        success: result.success 
      });
      
      return action;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      if (error instanceof AgentError) {
        this.logger.error('Agent error', { 
          code: error.code, 
          message: error.message,
          duration 
        });
        
        return {
          success: false,
          message: `错误 [${error.code}]: ${error.message}`,
          data: error.details
        };
      }
      
      // 未知错误
      this.logger.error('Unknown error', { 
        error: error instanceof Error ? error.message : String(error),
        duration 
      });
      
      return {
        success: false,
        message: '发生未知错误',
        data: null
      };
    }
  }
  
  /**
   * 改进的意图识别算法
   * 基于关键词权重 + 模式匹配
   */
  private recognizeIntent(message: string): Intent {
    const scores = new Map<IntentType, number>();
    const lowerMessage = message.toLowerCase();
    
    // 计算每个意图的得分
    INTENT_RULES.forEach(rule => {
      let score = 0;
      
      // 关键词匹配
      rule.keywords.forEach(keyword => {
        if (lowerMessage.includes(keyword.toLowerCase())) {
          score += rule.weight;
        }
      });
      
      // 正则匹配
      rule.patterns.forEach(pattern => {
        if (pattern.test(message)) {
          score += rule.weight * 1.5; // 正则匹配权重更高
        }
      });
      
      if (score > 0) {
        scores.set(rule.type, (scores.get(rule.type) || 0) + score);
      }
    });
    
    // 找出得分最高的意图
    let bestIntent: IntentType = 'read_tasks'; // 默认
    let bestScore = 0;
    
    scores.forEach((score, type) => {
      if (score > bestScore) {
        bestScore = score;
        bestIntent = type;
      }
    });
    
    // 提取参数
    const params = this.extractParams(message, bestIntent);
    
    return {
      tool: bestIntent,
      params,
      confidence: bestScore
    };
  }
  
  /**
   * 参数提取
   */
  private extractParams(message: string, intent: IntentType): ToolParams {
    const params: ToolParams = {};
    
    switch (intent) {
      case 'create_task':
        // 提取标题
        const titlePatterns = [
          /(?:叫|名为|是)\s*["']?([^"'，,\s]{2,20})["']?/,
          /任务\s*["']?([^"'，,\s]{2,20})["']?/,
          /(?:创建|新建|添加)[^"'，,]*?["']?([^"'，,\s]{2,20})["']?/
        ];
        
        for (const pattern of titlePatterns) {
          const match = message.match(pattern);
          if (match) {
            params.title = match[1].trim().replace(/^(?:一个|任务|叫|名为|是)\s*/i, '');
            break;
          }
        }
        
        if (!params.title) {
          params.title = '新任务';
        }
        
        // 提取日期
        const dateMatch = message.match(/(\d{1,2})月(\d{1,2})日/);
        params.startDate = dateMatch 
          ? `2026-${dateMatch[1].padStart(2, '0')}-${dateMatch[2].padStart(2, '0')}`
          : new Date().toISOString().split('T')[0];
        
        // 提取工期
        const durationMatch = message.match(/(\d+)[天|日]/);
        params.duration = durationMatch ? parseInt(durationMatch[1]) : 1;
        
        break;
        
      case 'update_task':
        const idMatch = message.match(/任务["']?(\w+)["']?/) || message.match(/第?\s*(\d+)\s*个/);
        params.taskId = idMatch?.[1] || '0';
        
        const statusMap: Record<string, string> = {
          '进行中': 'InProgress', '已完成': 'Completed', '未开始': 'NotStarted'
        };
        const statusMatch = message.match(/状态\s*为?\s*(\S+)/);
        params.status = statusMatch 
          ? (statusMap[statusMatch[1]] || statusMatch[1]) 
          : 'InProgress';
        break;
        
      case 'auto_schedule':
        const startDateMatch = message.match(/从\s*(\d{4}-\d{2}-\d{2})/);
        params.startDate = startDateMatch?.[1];
        break;
        
      default:
        // 其他意图不需要特定参数
        break;
    }
    
    return params;
  }
  
  // ========== 工具处理函数 ==========
  
  private async handleCreateTask(params: ToolParams, ctx: GanttContext): Promise<ToolResult> {
    try {
      const now = new Date();
      const title = String(params.title || '新任务');
      const duration = Number(params.duration || 1);
      const startDate = String(params.startDate || now.toISOString().split('T')[0]);
      
      const newTask: Task = {
        id: `task_${Date.now()}`,
        projectId: ctx.projectId,
        bucketId: 'default',
        title,
        description: '',
        taskType: 'task',
        startDateTime: new Date(startDate),
        dueDateTime: new Date(
          new Date(startDate).getTime() + duration * 24 * 60 * 60 * 1000
        ),
        status: 'NotStarted',
        priority: 'Normal',
        completedPercent: 0,
        assigneeIds: [],
        labelIds: [],
        order: ctx.tasks.length,
        dependencies: [],
        createdAt: now,
        updatedAt: now
      };
      
      ctx.tasks.push(newTask);
      this.contextManager.recordHistory('create', `创建: ${title}`, newTask.id);
      
      return { success: true, data: newTask };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '创建任务失败'
      };
    }
  }
  
  private async handleReadTasks(ctx: GanttContext): Promise<ToolResult> {
    return { success: true, data: ctx.tasks };
  }
  
  private async handleUpdateTask(params: ToolParams, ctx: GanttContext): Promise<ToolResult> {
    try {
      const taskId = String(params.taskId || '0');
      let task = ctx.tasks.find(t => t.id === taskId);
      
      if (!task && /^\d+$/.test(taskId)) {
        const index = parseInt(taskId);
        if (index >= 0 && index < ctx.tasks.length) {
          task = ctx.tasks[index];
        }
      }
      
      if (!task && ctx.tasks.length > 0) {
        task = ctx.tasks[0];
      }
      
      if (!task) {
        throw new AgentError('任务未找到', ErrorCode.TASK_NOT_FOUND, { taskId });
      }
      
      const updates: Partial<Task> = {};
      if (params.status) updates.status = params.status as Task['status'];
      
      Object.assign(task, updates);
      task.updatedAt = new Date();
      
      this.contextManager.recordHistory('update', `更新: ${task.title}`, task.id);
      
      return { success: true, data: task };
    } catch (error) {
      if (error instanceof AgentError) {
        throw error;
      }
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '更新任务失败'
      };
    }
  }
  
  private async handleAnalyzeDependencies(ctx: GanttContext): Promise<ToolResult> {
    try {
      const cycles = this.planner.analyzer.detectCircularDependency(ctx.tasks);
      const graph = this.planner.analyzer.buildDependencyGraph(ctx.tasks);
      
      return {
        success: true,
        data: {
          hasCycles: cycles.length > 0,
          cycles,
          totalDependencies: Array.from(graph.values()).reduce((sum, d) => sum + d.size, 0)
        }
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '依赖分析失败'
      };
    }
  }
  
  private async handleAutoSchedule(params: ToolParams, ctx: GanttContext): Promise<ToolResult> {
    try {
      const startDate = params.startDate 
        ? new Date(String(params.startDate)) 
        : new Date();
      
      const result = this.planner.plan(ctx.tasks, startDate);
      
      // 更新任务日期
      if (result?.scheduledTasks) {
        result.scheduledTasks.forEach(st => {
          const t = ctx.tasks.find(x => x.id === st.id);
          if (t) {
            (t as any).startDate = st.startDate;
            t.dueDateTime = st.dueDateTime;
          }
        });
      }
      
      return { success: true, data: result };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '自动排期失败'
      };
    }
  }
  
  private async handleCheckRisks(ctx: GanttContext): Promise<ToolResult> {
    try {
      const delayRisks = this.planner.monitor.checkDelayRisks(ctx.tasks);
      const resourceRisks = this.planner.monitor.checkResourceConflicts(ctx.tasks);
      
      return {
        success: true,
        data: {
          totalRisks: delayRisks.length + resourceRisks.length,
          delayRisks,
          resourceRisks,
          hasHighRisk: [...delayRisks, ...resourceRisks].some(r => r.severity === 'high')
        }
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '风险检查失败'
      };
    }
  }
  
  private async handleSaveProject(ctx: GanttContext): Promise<ToolResult> {
    try {
      this.contextManager.saveProject(ctx);
      return { success: true, data: { saved: true } };
    } catch (error) {
      throw new AgentError(
        '保存项目失败',
        ErrorCode.STORAGE_ERROR,
        { error: error instanceof Error ? error.message : String(error) }
      );
    }
  }
  
  private async handleGetStats(): Promise<ToolResult> {
    try {
      const stats = this.contextManager.getStats();
      const perfReport = this.monitor.getReport();
      
      return {
        success: true,
        data: {
          ...stats,
          performance: perfReport
        }
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '获取统计失败'
      };
    }
  }
  
  // ========== 辅助函数 ==========
  
  private recordTurn(
    role: 'user' | 'agent', 
    content: string, 
    action?: AgentAction,
    intent?: Intent
  ): void {
    this.contextManager.recordTurn(role, content, action);
  }
  
  // ========== 公共 API ==========
  
  getContextManager(): ContextManager {
    return this.contextManager;
  }
  
  getStats() {
    return this.contextManager.getStats();
  }
  
  getPerformanceReport() {
    return this.monitor.getReport();
  }
  
  getLogs(level?: LogLevel) {
    return this.logger.getLogs(level);
  }
  
  exportState(ctx: GanttContext): string {
    return this.contextManager.exportFullState(ctx);
  }
}

// 导出兼容旧版本的类名
export { OptimizedGanttAgent as GanttAgentV2 };
