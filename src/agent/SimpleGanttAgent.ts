/**
 * Gantt Agent - Level 1 + 2 + 3 + 4 完整实现
 */

import { Task, GanttContext, AgentAction } from '@/types';
import { TaskPlanner } from './TaskPlanner';
import { ContextManager } from './ContextManager';
import { IntelligenceEnhancer } from './IntelligenceEnhancer';

interface Tool {
  name: string;
  description: string;
  execute: (params: any, context: GanttContext) => Promise<any>;
}

export class GanttAgent {
  private planner = new TaskPlanner();
  private contextManager = new ContextManager();
  private enhancer = new IntelligenceEnhancer();
  
  private tools: Tool[] = [
    // Level 1
    {
      name: 'read_tasks',
      description: '读取任务',
      execute: async (_, ctx) => ctx.tasks
    },
    {
      name: 'create_task',
      description: '创建任务',
      execute: async (params, ctx) => {
        const now = new Date();
        const t: Task = {
          id: `task_${Date.now()}`,
          projectId: ctx.projectId,
          bucketId: 'default',
          title: params.title,
          description: '',
          taskType: 'task',
          startDateTime: new Date(params.startDate),
          dueDateTime: new Date(new Date(params.startDate).getTime() + params.duration * 24 * 60 * 60 * 1000),
          status: 'NotStarted',
          priority: 'Normal',
          completedPercent: 0,
          assigneeIds: [],
          labelIds: [],
          order: ctx.tasks.length,
          dependencies: params.dependencies || [],
          createdAt: now,
          updatedAt: now
        };
        ctx.tasks.push(t);
        this.contextManager.recordHistory('create', `创建: ${t.title}`, t.id);
        return t;
      }
    },
    {
      name: 'update_task',
      description: '更新任务',
      execute: async (params, ctx) => {
        let t = ctx.tasks.find(x => x.id === params.taskId);
        if (!t && /^\d+$/.test(params.taskId)) {
          const i = parseInt(params.taskId);
          if (i >= 0 && i < ctx.tasks.length) t = ctx.tasks[i];
        }
        if (!t && ctx.tasks.length > 0) t = ctx.tasks[0];
        if (!t) throw new Error('Task not found');
        Object.assign(t, params.updates);
        this.contextManager.recordHistory('update', `更新: ${t.title}`, t.id);
        return t;
      }
    },
    // Level 2
    {
      name: 'analyze_dependencies',
      description: '依赖分析',
      execute: async (_, ctx) => {
        const cycles = this.planner.analyzer.detectCircularDependency(ctx.tasks);
        const graph = this.planner.analyzer.buildDependencyGraph(ctx.tasks);
        return {
          hasCycles: cycles.length > 0,
          cycles,
          totalDependencies: Array.from(graph.values()).reduce((sum, d) => sum + d.size, 0)
        };
      }
    },
    {
      name: 'auto_schedule',
      description: '自动排期',
      execute: async (params, ctx) => {
        const r = this.planner.plan(ctx.tasks, params.startDate ? new Date(params.startDate) : new Date());
        r.scheduledTasks?.forEach(st => {
          const t = ctx.tasks.find(x => x.id === st.id);
          if (t) { 
            (t as any).startDate = st.startDate; 
            t.dueDateTime = st.dueDateTime; 
          }
        });
        return r;
      }
    },
    {
      name: 'check_risks',
      description: '风险检查',
      execute: async (_, ctx) => {
        const delayRisks = this.planner.monitor.checkDelayRisks(ctx.tasks);
        const resourceRisks = this.planner.monitor.checkResourceConflicts(ctx.tasks);
        return {
          totalRisks: delayRisks.length + resourceRisks.length,
          delayRisks,
          resourceRisks,
          hasHighRisk: [...delayRisks, ...resourceRisks].some(r => r.severity === 'high')
        };
      }
    },
    // Level 3
    {
      name: 'save_project',
      description: '保存项目',
      execute: async (_, ctx) => {
        this.contextManager.saveProject(ctx);
        return { success: true, message: '项目已保存' };
      }
    },
    {
      name: 'load_project',
      description: '加载项目',
      execute: async (params) => this.contextManager.loadProject(params.projectId)
    },
    {
      name: 'query_history',
      description: '查询历史',
      execute: async (params) => {
        const history = this.contextManager.queryHistory(params.query || '');
        return { history, count: history.length };
      }
    },
    {
      name: 'get_stats',
      description: '统计信息',
      execute: async () => this.contextManager.getStats()
    },
    // Level 4
    {
      name: 'assess_risks',
      description: '全面风险评估',
      execute: async (_, ctx) => this.enhancer.analyze(ctx.tasks, ctx).risk
    },
    {
      name: 'optimize_resources',
      description: '资源优化',
      execute: async (_, ctx) => this.enhancer.analyze(ctx.tasks, ctx).resource
    },
    {
      name: 'get_suggestions',
      description: '智能建议',
      execute: async (_, ctx) => ({
        suggestions: this.enhancer.analyze(ctx.tasks, ctx).suggestions
      })
    },
    {
      name: 'quick_risk_check',
      description: '快速风险检查',
      execute: async (_, ctx) => this.enhancer.quickRiskCheck(ctx.tasks)
    }
  ];

  async process(userMessage: string, context: GanttContext): Promise<AgentAction> {
    // 多轮对话检查
    if (this.contextManager.multiTurn.isWaitingForResponse()) {
      const r = await this.contextManager.multiTurn.handleResponse(userMessage);
      if (r.handled) return { success: true, message: r.message || '已处理', data: r.result };
    }
    
    this.contextManager.recordTurn('user', userMessage);
    
    const intent = this.understandIntent(userMessage);
    const tool = this.tools.find(t => t.name === intent.tool);
    if (!tool) return { success: false, message: `未知工具: ${intent.tool}`, data: null };
    
    try {
      const result = await tool.execute(intent.params, context);
      const action: AgentAction = { success: true, message: `${tool.name} 完成`, data: result };
      this.contextManager.recordTurn('agent', action.message, action);
      return action;
    } catch (e: any) {
      const action: AgentAction = { success: false, message: `失败: ${e.message}`, data: null };
      this.contextManager.recordTurn('agent', action.message, action);
      return action;
    }
  }

  private understandIntent(message: string) {
    const m = message.toLowerCase();
    
    // Level 1
    if (/创建|新建|添加/.test(m)) {
      const patterns = [
        /(?:叫|名为|是)\s*["']?([^"'，,\s]{2,20})["']?/,
        /任务\s*["']?([^"'，,\s]{2,20})["']?/,
        /(?:创建|新建|添加)[^"'，,]*?["']?([^"'，,\s]{2,20})["']?/
      ];
      let title = '新任务';
      for (const p of patterns) {
        const match = message.match(p);
        if (match) { title = match[1].trim().replace(/^(?:一个|任务|叫|名为|是)\s*/i, ''); break; }
      }
      const dateMatch = message.match(/(\d{1,2})月(\d{1,2})日/);
      const durationMatch = message.match(/(\d+)[天|日]/);
      return {
        tool: 'create_task',
        params: {
          title,
          startDate: dateMatch ? `2026-${dateMatch[1].padStart(2, '0')}-${dateMatch[2].padStart(2, '0')}` : new Date().toISOString().split('T')[0],
          duration: durationMatch ? parseInt(durationMatch[1]) : 1
        }
      };
    }
    
    if (/更新|修改|调整/.test(m)) {
      const idMatch = message.match(/任务["']?(\w+)["']?/) || message.match(/第?\s*(\d+)\s*个/);
      const statusMap: Record<string, string> = { '进行中': 'InProgress', '已完成': 'Completed', '未开始': 'NotStarted' };
      const statusMatch = message.match(/状态\s*为?\s*(\S+)/);
      return {
        tool: 'update_task',
        params: { taskId: idMatch?.[1] || '0', updates: { status: statusMatch ? (statusMap[statusMatch[1]] || statusMatch[1]) : 'InProgress' } }
      };
    }
    
    // Level 4 (优先更具体的匹配 - 必须放在Level 2之前)
    if (/全面|详细|深度/.test(m)) return { tool: 'assess_risks', params: {} };
    if (/资源分析|资源优化/.test(m)) return { tool: 'optimize_resources', params: {} };
    if (/建议|推荐|方案/.test(m)) return { tool: 'get_suggestions', params: {} };
    if (/快速|概览/.test(m)) return { tool: 'quick_risk_check', params: {} };
    
    // Level 2
    if (/依赖|循环|关系/.test(m)) return { tool: 'analyze_dependencies', params: {} };
    if (/排期|调度|安排|时间/.test(m)) return { tool: 'auto_schedule', params: {} };
    if (/风险|预警/.test(m)) return { tool: 'check_risks', params: {} };
    
    // Level 3
    if (/保存|存档/.test(m)) return { tool: 'save_project', params: {} };
    if (/加载|读取/.test(m)) return { tool: 'load_project', params: {} };
    if (/历史|记录|之前/.test(m)) return { tool: 'query_history', params: { query: message } };
    if (/统计|信息|状态/.test(m)) return { tool: 'get_stats', params: {} };
    
    return { tool: 'read_tasks', params: {} };
  }

  getContextManager() { return this.contextManager; }
  getStats() { return this.contextManager.getStats(); }
  exportState(ctx: GanttContext) { return this.contextManager.exportFullState(ctx); }
}
