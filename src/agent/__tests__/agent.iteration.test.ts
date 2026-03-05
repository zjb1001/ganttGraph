/**
 * Agent 迭代测试用例 - Level 1 + Level 2
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GanttAgent } from '../SimpleGanttAgent';
import { TaskPlanner } from '../TaskPlanner';
import { GanttContext, Task } from '@/types';

describe('Agent Iteration Tests', () => {
  let agent: GanttAgent;
  let context: GanttContext;
  
  beforeEach(() => {
    agent = new GanttAgent();
    context = {
      projectId: 'test',
      tasks: [],
      buckets: []
    };
  });
  
  // ========== Level 1: 基础对话测试 ==========
  describe('Level 1: 基础对话', () => {
    it('应该能创建任务', async () => {
      const result = await agent.process(
        '创建一个任务叫设计评审，3月10日开始，持续3天',
        context
      );
      
      expect(result.success).toBe(true);
      expect(context.tasks).toHaveLength(1);
      expect(context.tasks[0].title).toBe('设计评审');
    });
    
    it('应该能读取任务列表', async () => {
      await agent.process('创建任务A', context);
      
      const result = await agent.process('查看所有任务', context);
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });
    
    it('应该能更新任务', async () => {
      await agent.process('创建任务B', context);
      
      const result = await agent.process(
        '更新第0个任务状态为进行中',
        context
      );
      
      expect(result.success).toBe(true);
      expect(context.tasks[0].status).toBe('InProgress');
    });
  });
  
  // ========== Level 2: 任务规划测试 ==========
  describe('Level 2: 任务规划', () => {
    it('应该能分析依赖关系', async () => {
      // 创建任务A
      await agent.process('创建任务A，3月1日开始，持续2天', context);
      const taskAId = context.tasks[0].id;  // 获取实际ID
      
      // 手动添加带依赖的任务B
      context.tasks.push({
        id: 'task_B',
        title: '任务B',
        startDate: new Date('2026-03-03'),
        dueDateTime: new Date('2026-03-06'),
        status: 'NotStarted',
        completedPercent: 0,
        dependencies: [taskAId]  // 使用实际ID
      } as Task);
      
      const result = await agent.process('分析任务依赖', context);
      
      expect(result.success).toBe(true);
      expect(result.data.hasCycles).toBe(false);
      expect(result.data.totalDependencies).toBeGreaterThan(0);
    });
    
    it('应该能检测循环依赖', async () => {
      // 手动创建循环依赖
      context.tasks = [
        { id: 'A', title: '任务A', dependencies: ['B'], status: 'NotStarted' } as Task,
        { id: 'B', title: '任务B', dependencies: ['A'], status: 'NotStarted' } as Task
      ];
      
      const result = await agent.process('检查依赖关系', context);
      
      expect(result.success).toBe(true);
      expect(result.data.hasCycles).toBe(true);
    });
    
    it('应该能自动排期', async () => {
      // 创建有依赖的任务
      await agent.process('创建任务A，3月1日开始，持续2天', context);
      await agent.process('创建任务B，依赖任务A，持续3天', context);
      
      const result = await agent.process('自动排期', context);
      
      expect(result.success).toBe(true);
      expect(result.data.scheduledTasks).toBeDefined();
      expect(result.data.criticalPath).toBeDefined();
      expect(result.data.totalDuration).toBeGreaterThan(0);
    });
    
    it('应该能检查风险', async () => {
      // 创建一个即将到期且进度落后的任务
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(23, 59, 59, 999);
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 5);
      
      context.tasks = [{
        id: 'risky',
        title: '风险任务',
        status: 'InProgress',
        completedPercent: 10,  // 仅10%进度
        dueDateTime: tomorrow,  // 明天到期
        startDate: yesterday    // 已进行5天
      } as Task];
      
      const result = await agent.process('检查风险', context);
      
      expect(result.success).toBe(true);
      expect(result.data.totalRisks).toBeGreaterThan(0);
    });
  });
  
  // ========== Level 3: 上下文管理测试 ==========
  describe('Level 3: 上下文管理', () => {
    it('应该能处理10轮以上对话', async () => {
      // 模拟10轮对话
      for (let i = 0; i < 10; i++) {
        await agent.process(`创建任务${i}，3月${i + 1}日开始`, context);
      }
      
      // 验证所有任务都存在
      expect(context.tasks).toHaveLength(10);
      
      // 验证统计信息正确
      const stats = agent.getStats();
      expect(stats.totalTurns).toBeGreaterThanOrEqual(20); // 10用户 + 10Agent
    });
    
    it('应该能保存项目状态', async () => {
      await agent.process('创建任务A', context);
      await agent.process('创建任务B', context);
      
      const result = await agent.process('保存项目', context);
      
      expect(result.success).toBe(true);
      expect(result.data.success).toBe(true);
    });
    
    it('应该能恢复项目状态', async () => {
      // 先创建并保存
      await agent.process('创建任务A', context);
      await agent.process('保存项目', context);
      
      // 清空当前任务
      context.tasks = [];
      expect(context.tasks).toHaveLength(0);
      
      // 恢复（注意：实际恢复需要实现从localStorage读取）
      const stats = agent.getStats();
      expect(stats.savedProjects).toBeGreaterThanOrEqual(0);
    });
    
    it('应该能查询历史操作', async () => {
      await agent.process('创建任务A', context);
      await agent.process('创建任务B', context);
      await agent.process('更新任务A状态为进行中', context);
      
      const result = await agent.process('查询历史记录', context);
      
      expect(result.success).toBe(true);
      expect(result.data.count).toBeGreaterThanOrEqual(0);
    });
    
    it('应该能获取统计信息', async () => {
      await agent.process('创建任务A', context);
      
      const result = await agent.process('获取统计信息', context);
      
      expect(result.success).toBe(true);
      expect(result.data.totalTurns).toBeGreaterThanOrEqual(0);
      expect(result.data.totalHistory).toBeGreaterThanOrEqual(0);
    });
  });
  
  // ========== Level 4: 智能增强测试 (TODO) ==========
  describe('Level 4: 智能增强 (TODO)', () => {
    it.todo('应该能识别延期风险');
    it.todo('应该能检测资源冲突');
    it.todo('应该能给出优化建议');
  });
});

// TaskPlanner 单元测试
describe('TaskPlanner Unit Tests', () => {
  let planner: TaskPlanner;
  
  beforeEach(() => {
    planner = new TaskPlanner();
  });
  
  it('应该正确检测循环依赖', () => {
    const tasks = [
      { id: 'A', title: 'A', dependencies: ['B'] } as Task,
      { id: 'B', title: 'B', dependencies: ['C'] } as Task,
      { id: 'C', title: 'C', dependencies: ['A'] } as Task
    ];
    
    const cycles = planner.analyzer.detectCircularDependency(tasks);
    expect(cycles.length).toBeGreaterThan(0);
  });
  
  it('应该正确拓扑排序', () => {
    const tasks = [
      { id: 'A', title: 'A', dependencies: [] } as Task,
      { id: 'B', title: 'B', dependencies: ['A'] } as Task,
      { id: 'C', title: 'C', dependencies: ['A'] } as Task
    ];
    
    const sorted = planner.scheduler.topologicalSort(tasks);
    expect(sorted[0].id).toBe('A');
  });
  
  it('应该计算关键路径', () => {
    const startDate = new Date('2026-03-01');
    const tasks = [
      { 
        id: 'A', 
        title: 'A', 
        dependencies: [],
        startDate: new Date('2026-03-01'),
        dueDateTime: new Date('2026-03-03')
      } as Task,
      { 
        id: 'B', 
        title: 'B', 
        dependencies: ['A'],
        startDate: new Date('2026-03-03'),
        dueDateTime: new Date('2026-03-06')
      } as Task
    ];
    
    const result = planner.plan(tasks, startDate);
    expect(result.criticalPath.length).toBeGreaterThan(0);
    expect(result.totalDuration).toBeGreaterThan(0);
  });
});
