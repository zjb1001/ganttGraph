/**
 * Agent 迭代测试用例
 * 用于验证每个迭代级别
 */

import { GanttAgent } from './SimpleGanttAgent';
import { GanttContext } from '@/types';

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
    test('应该能创建任务', async () => {
      const result = await agent.process(
        '创建一个任务叫设计评审，3月10日开始，持续3天',
        context
      );
      
      expect(result.success).toBe(true);
      expect(context.tasks).toHaveLength(1);
      expect(context.tasks[0].title).toBe('设计评审');
    });
    
    test('应该能读取任务列表', async () => {
      // 先创建一个任务
      await agent.process('创建任务A', context);
      
      const result = await agent.process('查看所有任务', context);
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });
    
    test('应该能更新任务', async () => {
      // 创建并更新
      await agent.process('创建任务B', context);
      const taskId = context.tasks[0].id;
      
      const result = await agent.process(
        `更新任务${taskId}状态为进行中`,
        context
      );
      
      expect(result.success).toBe(true);
      expect(context.tasks[0].status).toBe('InProgress');
    });
  });
  
  // ========== Level 2: 任务规划测试 (待实现) ==========
  describe('Level 2: 任务规划 (TODO)', () => {
    test.todo('应该能识别任务依赖');
    test.todo('应该能自动排期');
    test.todo('应该能计算关键路径');
  });
  
  // ========== Level 3: 上下文管理测试 (待实现) ==========
  describe('Level 3: 上下文管理 (TODO)', () => {
    test.todo('应该能处理10轮以上对话');
    test.todo('应该能保存项目状态');
    test.todo('应该能恢复项目状态');
  });
  
  // ========== Level 4: 智能增强测试 (待实现) ==========
  describe('Level 4: 智能增强 (TODO)', () => {
    test.todo('应该能识别延期风险');
    test.todo('应该能检测资源冲突');
    test.todo('应该能给出优化建议');
  });
});

// 手动测试脚本
export async function runManualTests() {
  console.log('🧪 运行 Agent 手动测试\n');
  
  const agent = new GanttAgent();
  const context: GanttContext = {
    projectId: 'demo',
    tasks: [],
    buckets: []
  };
  
  // Test 1: 创建任务
  console.log('Test 1: 创建任务');
  const result1 = await agent.process(
    '创建一个任务叫设计评审，3月10日开始，持续3天',
    context
  );
  console.log('结果:', result1.success ? '✅ 通过' : '❌ 失败');
  console.log('任务:', context.tasks[0]);
  
  // Test 2: 读取任务
  console.log('\nTest 2: 读取任务');
  const result2 = await agent.process('查看所有任务', context);
  console.log('结果:', result2.success ? '✅ 通过' : '❌ 失败');
  
  // Test 3: 边界情况
  console.log('\nTest 3: 模糊指令');
  const result3 = await agent.process('帮我看看有哪些任务', context);
  console.log('结果:', result3.success ? '✅ 通过' : '❌ 失败');
  
  console.log('\n📊 测试完成');
  console.log(`当前任务数: ${context.tasks.length}`);
}

// 如果直接运行此文件
if (typeof window === 'undefined') {
  runManualTests();
}
