/**
 * Gantt Agent - Level 1 + Level 2 完整实现
 * 基于 learn-claude-code 思想
 */

import { Task, GanttContext, AgentAction } from '@/types';
import { TaskPlanner } from './TaskPlanner';

interface Tool {
  name: string;
  description: string;
  execute: (params: any, context: GanttContext) => Promise<any>;
}

export class GanttAgent {
  private planner = new TaskPlanner();
  
  // 6个工具：3个基础 + 3个规划
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
        Object.assign(task, params.updates);
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
    }
  ];

  async process(userMessage: string, context: GanttContext): Promise<AgentAction> {
    const intent = await this.understandIntent(userMessage);
    const tool = this.selectTool(intent);
    
    try {
      const result = await tool.execute(intent.params, context);
      return { success: true, message: `已执行 ${tool.name}`, data: result };
    } catch (error: any) {
      return { success: false, message: `执行失败: ${error.message}`, data: null };
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
    
    // 默认：读取
    return { tool: 'read_tasks', params: {} };
  }

  private selectTool(intent: { tool: string }) {
    const tool = this.tools.find(t => t.name === intent.tool);
    if (!tool) throw new Error(`Unknown tool: ${intent.tool}`);
    return tool;
  }
}
