/**
 * Agent 自我迭代优化清单
 * 基于代码分析和测试反馈的持续改进
 */

export interface OptimizationItem {
  id: string;
  category: 'code-quality' | 'performance' | 'test-coverage' | 'architecture' | 'documentation';
  priority: 'high' | 'medium' | 'low';
  issue: string;
  solution: string;
  status: 'todo' | 'in-progress' | 'done';
  files?: string[];
}

/**
 * 自我分析发现的问题和改进项
 */
export const SelfOptimizationList: OptimizationItem[] = [
  // ========== 代码质量优化 ==========
  {
    id: 'OPT-001',
    category: 'code-quality',
    priority: 'high',
    issue: '类型定义不完整，多处使用 any 类型',
    solution: '完善 TypeScript 类型定义，消除 any',
    status: 'todo',
    files: ['SimpleGanttAgent.ts', 'TaskPlanner.ts']
  },
  {
    id: 'OPT-002',
    category: 'code-quality',
    priority: 'high',
    issue: '错误处理不完善，部分异常未捕获',
    solution: '添加统一的错误处理和日志记录',
    status: 'todo',
    files: ['SimpleGanttAgent.ts', 'ContextManager.ts']
  },
  {
    id: 'OPT-003',
    category: 'code-quality',
    priority: 'medium',
    issue: '字符串解析硬编码，难以维护',
    solution: '提取解析规则到配置文件',
    status: 'todo',
    files: ['SimpleGanttAgent.ts']
  },
  
  // ========== 性能优化 ==========
  {
    id: 'OPT-004',
    category: 'performance',
    priority: 'medium',
    issue: '长对话时内存占用持续增长',
    solution: '实现对话历史自动压缩和归档',
    status: 'todo',
    files: ['ContextManager.ts']
  },
  {
    id: 'OPT-005',
    category: 'performance',
    priority: 'medium',
    issue: '依赖分析算法 O(n²) 复杂度',
    solution: '优化为拓扑排序 O(n+e)',
    status: 'done',
    files: ['TaskPlanner.ts']
  },
  
  // ========== 测试覆盖 ==========
  {
    id: 'OPT-006',
    category: 'test-coverage',
    priority: 'high',
    issue: '缺少边界条件测试',
    solution: '添加边界测试：空项目、循环依赖、超长工期',
    status: 'in-progress',
    files: ['agent.iteration.test.ts']
  },
  {
    id: 'OPT-007',
    category: 'test-coverage',
    priority: 'medium',
    issue: '异常流程测试不足',
    solution: '添加错误场景测试：非法输入、存储失败',
    status: 'todo',
    files: ['agent.iteration.test.ts']
  },
  
  // ========== 架构优化 ==========
  {
    id: 'OPT-008',
    category: 'architecture',
    priority: 'medium',
    issue: '工具逻辑和Agent耦合',
    solution: '工具插件化，支持动态注册',
    status: 'todo',
    files: ['SimpleGanttAgent.ts']
  },
  {
    id: 'OPT-009',
    category: 'architecture',
    priority: 'low',
    issue: '模板硬编码，无法热更新',
    solution: '模板外部化，支持JSON配置',
    status: 'todo',
    files: ['GoalDrivenPlanner.ts']
  },
  
  // ========== 功能增强 ==========
  {
    id: 'OPT-010',
    category: 'code-quality',
    priority: 'medium',
    issue: '意图识别基于正则，扩展性差',
    solution: '实现基于关键词权重+语义的识别',
    status: 'in-progress',
    files: ['SimpleGanttAgent.ts']
  },
  {
    id: 'OPT-011',
    category: 'code-quality',
    priority: 'low',
    issue: '缺少项目导出功能',
    solution: '支持导出为 MS Project / Excel / PDF',
    status: 'todo',
    files: ['SimpleGanttAgent.ts']
  }
];

/**
 * 自我分析器
 */
export class SelfAnalyzer {
  private optimizations = SelfOptimizationList;
  
  /**
   * 分析当前代码质量
   */
  analyzeCodeQuality(): {
    totalIssues: number;
    byCategory: Record<string, number>;
    byPriority: Record<string, number>;
    completionRate: number;
  } {
    const total = this.optimizations.length;
    const done = this.optimizations.filter(o => o.status === 'done').length;
    
    const byCategory: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    
    this.optimizations.forEach(o => {
      byCategory[o.category] = (byCategory[o.category] || 0) + 1;
      byPriority[o.priority] = (byPriority[o.priority] || 0) + 1;
    });
    
    return {
      totalIssues: total,
      byCategory,
      byPriority,
      completionRate: done / total
    };
  }
  
  /**
   * 获取待办优化项
   */
  getPendingOptimizations(): OptimizationItem[] {
    return this.optimizations
      .filter(o => o.status !== 'done')
      .sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
  }
  
  /**
   * 生成优化报告
   */
  generateReport(): string {
    const analysis = this.analyzeCodeQuality();
    const pending = this.getPendingOptimizations();
    
    const lines: string[] = [];
    lines.push('╔══════════════════════════════════════════════════════════════╗');
    lines.push('║           Agent 自我迭代优化报告                             ║');
    lines.push('╚══════════════════════════════════════════════════════════════╝');
    lines.push('');
    
    lines.push('📊 整体状态:');
    lines.push(`   总优化项: ${analysis.totalIssues}`);
    lines.push(`   已完成: ${Math.round(analysis.completionRate * 100)}%`);
    lines.push(`   待办: ${pending.length}`);
    lines.push('');
    
    lines.push('📋 按类别分布:');
    Object.entries(analysis.byCategory).forEach(([cat, count]) => {
      lines.push(`   ${cat}: ${count}项`);
    });
    lines.push('');
    
    lines.push('🔴 高优先级待办:');
    pending
      .filter(o => o.priority === 'high')
      .forEach((o, i) => {
        lines.push(`   ${i + 1}. [${o.id}] ${o.issue}`);
        lines.push(`      → ${o.solution}`);
      });
    
    lines.push('');
    lines.push('═══════════════════════════════════════════════════════════════');
    
    return lines.join('\n');
  }
  
  /**
   * 标记优化完成
   */
  markComplete(id: string): void {
    const item = this.optimizations.find(o => o.id === id);
    if (item) {
      item.status = 'done';
    }
  }
  
  /**
   * 添加新的优化项
   */
  addOptimization(item: Omit<OptimizationItem, 'id'>): void {
    const id = `OPT-${String(this.optimizations.length + 1).padStart(3, '0')}`;
    this.optimizations.push({ ...item, id });
  }
}

// 导出单例
export const selfAnalyzer = new SelfAnalyzer();
