/**
 * Gantt Agent - 简化版核心实现
 * 基于 learn-claude-code 思想
 * 阶段1: MVP (3个核心能力)
 */

import { Task, GanttContext, AgentAction } from '@/types';

// 核心工具接口
interface Tool {
  name: string;
  description: string;
  execute: (params: any, context: GanttContext) => Promise<any>;
}

// 简化版 Agent
export class GanttAgent {
  // 只保留3个核心工具
  private tools: Tool[] = [
    {
      name: 'read_tasks',
      description: '读取当前项目的所有任务',
      execute: async (_, context) => {
        return context.tasks;
      }
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
        const task = context.tasks.find(t => t.id === params.taskId);
        if (!task) throw new Error('Task not found');
        Object.assign(task, params.updates);
        return task;
      }
    }
  ];

  /**
   * 核心 Agent Loop
   * 观察 → 思考 → 行动
   */
  async process(userMessage: string, context: GanttContext): Promise<AgentAction> {
    // Step 1: 观察 - 理解用户意图
    const intent = await this.understandIntent(userMessage);
    
    // Step 2: 思考 - 选择工具
    const tool = this.selectTool(intent);
    
    // Step 3: 行动 - 执行
    try {
      const result = await tool.execute(intent.params, context);
      return {
        success: true,
        message: `已执行 ${tool.name}`,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        message: `执行失败: ${error.message}`,
        data: null
      };
    }
  }

  /**
   * 理解意图 - 简化版，基于关键词匹配
   * 后续迭代可升级为 LLM 意图识别
   */
  private async understandIntent(message: string): Promise<{
    tool: string;
    params: any;
  }> {
    const lowerMsg = message.toLowerCase();
    
    // 创建任务意图
    if (lowerMsg.includes('创建') || lowerMsg.includes('新建') || lowerMsg.includes('添加')) {
      const titleMatch = message.match(/[叫|名为]?["']?([^"'，,]+)["']?/);
      const dateMatch = message.match(/(\d{1,2})月(\d{1,2})日/);
      const durationMatch = message.match(/(\d+)[天|日]/);
      
      return {
        tool: 'create_task',
        params: {
          title: titleMatch ? titleMatch[1].trim() : '新任务',
          startDate: dateMatch 
            ? `2026-${dateMatch[1].padStart(2, '0')}-${dateMatch[2].padStart(2, '0')}`
            : new Date().toISOString(),
          duration: durationMatch ? parseInt(durationMatch[1]) : 1
        }
      };
    }
    
    // 更新任务意图
    if (lowerMsg.includes('更新') || lowerMsg.includes('修改') || lowerMsg.includes('调整')) {
      return {
        tool: 'update_task',
        params: {
          // 简化处理，实际需要更复杂的解析
          taskId: 'extract_from_message',
          updates: { status: 'InProgress' }
        }
      };
    }
    
    // 默认：读取任务
    return {
      tool: 'read_tasks',
      params: {}
    };
  }

  /**
   * 选择工具
   */
  private selectTool(intent: { tool: string }): Tool {
    const tool = this.tools.find(t => t.name === intent.tool);
    if (!tool) throw new Error(`Unknown tool: ${intent.tool}`);
    return tool;
  }
}

// 使用示例
export async function demo() {
  const agent = new GanttAgent();
  const context: GanttContext = {
    projectId: 'demo',
    tasks: [],
    buckets: []
  };
  
  // 测试创建任务
  const result = await agent.process(
    '创建一个任务叫设计评审，3月10日开始，持续3天',
    context
  );
  
  console.log(result);
}
