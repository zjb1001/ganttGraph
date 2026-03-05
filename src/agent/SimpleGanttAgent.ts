/**
 * Gantt Agent - Level 1 + Level 2 + Level 3 完整实现
 * 基于 learn-claude-code 思想
 */

import { Task, GanttContext, AgentAction } from '@/types';
import { TaskPlanner } from './TaskPlanner';
import { ContextManager } from './ContextManager';

interface Tool {
  name: string;
  description: string;
  execute: (params: any, context: GanttContext) => Promise<any>;
}

export class GanttAgent {
  private planner = new TaskPlanner();
  private contextManager = new ContextManager();
  
  // 6个工具 + 3个上下文工具
  private tools: Tool[] = [
    // Level 1: 基础
    {
      name: 'read_tasks',
      description: '读取当前项目的所有任务',
      execute: async (_, context) => context.tasks
    },
    {
      name: 'create_task',
      description: '创建新任务，参数: {title, startDate, duration, dependencies?}',
      execute: async (params, context) => {
        const newTask: Task = {
          id: `task_${Date.now()}`,
          title: params.title,
          startDate: new Date(params.startDate),
          dueDateTime: new Date(
            new Date(params.startDate).getTime() + params.duration * 24 * 60 * 60 * 1000
          ),
          status: 'NotStarted',
          completedPercent: 0,
          dependencies: params.dependencies || []
        };
        context.tasks.push(newTask);
        
        // 记录历史
        this.contextManager.recordHistory('create', `创建任务: ${params.title}`, newTask.id);
        
        return newTask;
      }
    },
    {
      name: 'update_task',
      description: '更新任务，参数: {taskId, updates}',
      execute: async (params, context) => {
        let task = context.tasks.find(t => t.id === params.taskId);
        if (!task && /^\d+$/.test(params.taskId)) {
          const index = parseInt(params.taskId);
          if (index >= 0 && index < context.tasks.length) {
            task = context.tasks[index];
          }
        }
        if (!task && context.tasks.length > 0) task = context.tasks[0];
        if (!task) throw new Error('Task not found');
        
        const before = { ...task };
        Object.assign(task, params.updates);
        
        // 记录历史
        this.contextManager.recordHistory('update', `更新任务: ${task.title}`, task.id, before, task);
        
        return task;
      }
    },
    // Level 2: 规划
    {
      name: 'analyze_dependencies',
      description: '分析任务依赖关系，检测循环依赖',
      execute: async (_, context) => {
        const cycles = this.planner.analyzer.detectCircularDependency(context.tasks);
        const graph = this.planner.analyzer.buildDependencyGraph(context.tasks);
        return {
          hasCycles: cycles.length > 0,
          cycles,
          totalDependencies: Array.from(graph.values()).reduce((sum, d) => sum + d.size, 0)
        };
      }
    },
    {
      name: 'auto_schedule',
      description: '自动排期，基于依赖关系计算最优时间安排',
      execute: async (params, context) => {
        const start = params.startDate ? new Date(params.startDate) : new Date();
        const result = this.planner.plan(context.tasks, start);
        
        if (result?.scheduledTasks) {
          result.scheduledTasks.forEach(st => {
            const t = context.tasks.find(x => x.id === st.id);
            if (t) {
              t.startDate = st.startDate;
              t.dueDateTime = st.dueDateTime;
            }
          });
        }
        
        // 记录历史
        this.contextManager.recordHistory('schedule', '自动排期');
        
        return result;
      }
    },
    {
      name: 'check_risks',
      description: '检查项目风险（延期、资源冲突）',
      execute: async (_, context) => {
        const delayRisks = this.planner.monitor.checkDelayRisks(context.tasks);
        const resourceRisks = this.planner.monitor.checkResourceConflicts(context.tasks);
        return {
          totalRisks: delayRisks.length + resourceRisks.length,
          delayRisks,
          resourceRisks,
          hasHighRisk: [...delayRisks, ...resourceRisks].some(r => r.severity === 'high')
        };
      }
    },
    // Level 3: 上下文管理
    {
      name: 'save_project',
      description: '保存项目状态',
      execute: async (_, context) => {
        this.contextManager.saveProject(context);
        return { success: true, message: '项目已保存' };
      }
    },
    {
      name: 'load_project',
      description: '加载项目状态',
      execute: async (params) => {
        const result = this.contextManager.loadProject(params.projectId);
        return result || { success: false, message: '项目未找到' };
      }
    },
    {
      name: 'query_history',
      description: '查询历史操作记录',
      execute: async (params) => {
        const history = this.contextManager.queryHistory(params.query || '');
        return { history, count: history.length };
      }
    },
    {
      name: 'get_stats',
      description: '获取对话统计信息',
      execute: async () => {
        return this.contextManager.getStats();
      }
    }
  ];

  /**
   * 核心处理入口
   */
  async process(userMessage: string, context: GanttContext): Promise<AgentAction> {
    // Step 1: 检查是否有待处理的多轮对话
    if (this.contextManager.multiTurn.isWaitingForResponse()) {
      const multiTurnResult = await this.contextManager.multiTurn.handleResponse(userMessage);
      if (multiTurnResult.handled) {
        const action: AgentAction = {
          success: true,
          message: multiTurnResult.message || '多轮对话已处理',
          data: multiTurnResult.result
        };
        this.contextManager.recordTurn('agent', action.message, action);
        return action;
      }
    }
    
    // Step 2: 记录用户输入
    this.contextManager.recordTurn('user', userMessage);
    
    // Step 3: 理解意图
    const intent = await this.understandIntent(userMessage);
    
    // Step 4: 选择并执行工具
    const tool = this.selectTool(intent);
    
    try {
      const result = await tool.execute(intent.params, context);
      const action: AgentAction = { 
        success: true, 
        message: this.formatResultMessage(tool.name, result), 
        data: result 
      };
      
      // 记录Agent回复
      this.contextManager.recordTurn('agent', action.message, action);
      
      return action;
    } catch (error: any) {
      const action: AgentAction = { 
        success: false, 
        message: `执行失败: ${error.message}`, 
        data: null 
      };
      this.contextManager.recordTurn('agent', action.message, action);
      return action;
    }
  }
  
  /**
   * 格式化结果消息
   */
  private formatResultMessage(toolName: string, result: any): string {
    switch (toolName) {
      case 'create_task':
        return `已创建任务「${result.title}」`;
      case 'update_task':
        return `已更新任务「${result.title}」`;
      case 'auto_schedule':
        return `排期完成，总工期${result.totalDuration}天，关键路径包含${result.criticalPath.length}个任务`;
      case 'check_risks':
        return result.totalRisks > 0 
          ? `发现${result.totalRisks}个风险${result.hasHighRisk ? '（含高危）' : ''}`
          : '未发现明显风险';
      case 'save_project':
        return '项目已保存';
      default:
        return `已执行 ${toolName}`;
    }
  }

  private async understandIntent(message: string) {
    const m = message.toLowerCase();
    
    // Level 1: 创建
    if (m.includes('创建') || m.includes('新建') || m.includes('添加')) {
      const patterns = [
        /(?:叫|名为|是)\s*["']?([^"'，,\s]{2,20})["']?/,
        /任务\s*["']?([^"'，,\s]{2,20})["']?(?:\s*[，,]|\s+\d+月|$)/,
        /(?:创建|新建|添加)[^"'，,]*?["']?([^"'，,\s]{2,20})["']?(?:\s*[，,]|\s+\d+月|$)/
      ];
      
      let title = '新任务';
      for (const p of patterns) {
        const match = message.match(p);
        if (match) {
          title = match[1].trim().replace(/^(?:一个|任务|叫|名为|是)\s*/i, '');
          if (title.length >= 2) break;
        }
      }
      
      const dateMatch = message.match(/(\d{1,2})月(\d{1,2})日/);
      const durationMatch = message.match(/(\d+)[天|日]/);
      
      return {
        tool: 'create_task',
        params: {
          title,
          startDate: dateMatch 
            ? `2026-${dateMatch[1].padStart(2, '0')}-${dateMatch[2].padStart(2, '0')}`
            : new Date().toISOString().split('T')[0],
          duration: durationMatch ? parseInt(durationMatch[1]) : 1
        }
      };
    }
    
    // Level 1: 更新
    if (m.includes('更新') || m.includes('修改') || m.includes('调整')) {
      const idMatch = message.match(/任务["']?(\w+)["']?/) || message.match(/第?\s*(\d+)\s*个/);
      const statusMap: Record<string, string> = {
        '进行中': 'InProgress', '已完成': 'Completed', '未开始': 'NotStarted', '暂停': 'OnHold'
      };
      const statusMatch = message.match(/状态\s*为?\s*(\S+)/);
      
      return {
        tool: 'update_task',
        params: {
          taskId: idMatch ? idMatch[1] : '0',
          updates: { status: statusMatch ? (statusMap[statusMatch[1]] || statusMatch[1]) : 'InProgress' }
        }
      };
    }
    
    // Level 2: 依赖分析
    if (m.includes('依赖') || m.includes('循环') || m.includes('关系')) {
      return { tool: 'analyze_dependencies', params: {} };
    }
    
    // Level 2: 自动排期
    if (m.includes('排期') || m.includes('调度') || m.includes('安排') || m.includes('计算时间')) {
      const dateMatch = message.match(/从\s*(\d{4}-\d{2}-\d{2})/) || message.match(/(\d{4})年(\d{1,2})月/);
      return {
        tool: 'auto_schedule',
        params: { startDate: dateMatch ? `${dateMatch[1]}-${dateMatch[2] || '01'}-01` : undefined }
      };
    }
    
    // Level 2: 风险检查
    if (m.includes('风险') || m.includes('预警') || m.includes('检查') || m.includes('问题')) {
      return { tool: 'check_risks', params: {} };
    }
    
    // Level 3: 保存/加载
    if (m.includes('保存') || m.includes('存档')) {
      return { tool: 'save_project', params: {} };
    }
    
    if (m.includes('加载') || m.includes('读取') || m.includes('打开')) {
      const idMatch = message.match(/项目["']?(\w+)["']?/);
      return { tool: 'load_project', params: { projectId: idMatch?.[1] || context.projectId } };
    }
    
    // Level 3: 查询历史
    if (m.includes('历史') || m.includes('记录') || m.includes('查询') || m.includes('之前')) {
      return { tool: 'query_history', params: { query: message } };
    }
    
    // Level 3: 统计
    if (m.includes('统计') || m.includes('信息') || m.includes('状态')) {
      return { tool: 'get_stats', params: {} };
    }
    
    // 默认：读取
    return { tool: 'read_tasks', params: {} };
  }

  private selectTool(intent: { tool: string }) {
    const tool = this.tools.find(t => t.name === intent.tool);
    if (!tool) throw new Error(`Unknown tool: ${intent.tool}`);
    return tool;
  }
  
  /**
   * Level 3: 获取上下文管理器
   */
  getContextManager(): ContextManager {
    return this.contextManager;
  }
  
  /**
   * Level 3: 获取对话统计
   */
  getStats() {
    return this.contextManager.getStats();
  }
  
  /**
   * Level 3: 导出完整状态
   */
  exportState(context: GanttContext): string {
    return this.contextManager.exportFullState(context);
  }
}
