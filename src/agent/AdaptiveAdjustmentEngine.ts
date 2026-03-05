/**
 * Level 6: 实时自适应调整系统
 * 延期检测 → 影响分析 → 方案推荐 → 自动调整
 */

import { Task, GanttContext } from '@/types';
import { TaskPlanner } from './TaskPlanner';

// 延期检测结果
export interface DelayDetection {
  taskId: string;
  taskName: string;
  expectedProgress: number;    // 预期进度
  actualProgress: number;      // 实际进度
  delayDays: number;           // 延期天数
  severity: 'low' | 'medium' | 'high' | 'critical';
  reason?: string;
}

// 影响分析结果
export interface ImpactAnalysis {
  affectedTasks: AffectedTask[];     // 受影响任务
  criticalPathImpact: boolean;       // 是否影响关键路径
  totalDelayDays: number;            // 总延期天数
  milestoneImpact: MilestoneImpact[]; // 里程碑影响
}

export interface AffectedTask {
  taskId: string;
  taskName: string;
  originalEndDate: Date;
  newEndDate: Date;
  delayDays: number;
}

export interface MilestoneImpact {
  milestone: string;
  originalDate: Date;
  newDate: Date;
  delayDays: number;
}

// 调整方案
export interface AdjustmentPlan {
  planId: string;
  name: string;
  description: string;
  type: 'crash' | 'fast-track' | 'resource-reallocate' | 'scope-reduce' | 'accept';
  impact: {
    cost: number;        // 成本影响 (+20%表示增加20%)
    quality: number;     // 质量影响
    risk: number;        // 风险增加
    timeSave: number;    // 节省天数
  };
  actions: AdjustmentAction[];
  recommendation: string;
}

export interface AdjustmentAction {
  type: 'add-resource' | 'parallel' | 'reduce-scope' | 'extend-deadline' | 'overtime';
  target: string;
  description: string;
  effort: string;
}

// 自动调整结果
export interface AutoAdjustmentResult {
  success: boolean;
  appliedPlan?: AdjustmentPlan;
  changes: TaskChange[];
  message: string;
}

export interface TaskChange {
  taskId: string;
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

/**
 * 实时自适应调整引擎
 */
export class AdaptiveAdjustmentEngine {
  private planner = new TaskPlanner();
  
  // 延期阈值配置
  private readonly DELAY_THRESHOLDS = {
    low: 1,      // 1天内
    medium: 3,   // 3天内
    high: 7,     // 一周内
    critical: 14 // 两周以上
  };
  
  /**
   * 步骤1: 延期检测
   * 扫描所有任务，识别延期风险
   */
  detectDelays(tasks: Task[]): DelayDetection[] {
    const delays: DelayDetection[] = [];
    const now = new Date();
    
    tasks.forEach(task => {
      if (task.status === 'Completed') return;
      if (!task.startDateTime || !task.dueDateTime) return;
      
      const startDate = new Date(task.startDateTime);
      const dueDate = new Date(task.dueDateTime);
      const totalDuration = (dueDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000);
      const elapsedDays = (now.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000);
      
      // 计算预期进度
      const expectedProgress = Math.min(100, Math.max(0, (elapsedDays / totalDuration) * 100));
      const actualProgress = task.completedPercent || 0;
      
      // 检测延期
      if (actualProgress < expectedProgress - 10) { // 落后10%以上
        const delayRatio = (expectedProgress - actualProgress) / 100;
        const delayDays = Math.ceil(delayRatio * totalDuration);
        
        let severity: DelayDetection['severity'] = 'low';
        if (delayDays >= this.DELAY_THRESHOLDS.critical) severity = 'critical';
        else if (delayDays >= this.DELAY_THRESHOLDS.high) severity = 'high';
        else if (delayDays >= this.DELAY_THRESHOLDS.medium) severity = 'medium';
        
        delays.push({
          taskId: task.id,
          taskName: task.title,
          expectedProgress,
          actualProgress,
          delayDays,
          severity,
          reason: this.inferDelayReason(task, delayDays)
        });
      }
    });
    
    return delays.sort((a, b) => b.delayDays - a.delayDays);
  }
  
    /**
   * 步骤2: 影响分析
   * 分析延期对后续任务和里程碑的影响
   */
  analyzeImpact(
    delays: DelayDetection[],
    tasks: Task[],
    milestones?: { name: string; date: Date; taskIds: string[] }[]
  ): ImpactAnalysis {
    const affectedTasks: AffectedTask[] = [];
    const milestoneImpact: MilestoneImpact[] = [];
    
    // 构建任务映射
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    
    // 分析每个延期任务的传播影响
    delays.forEach(delay => {
      const delayedTask = taskMap.get(delay.taskId);
      if (!delayedTask) return;
      
      // 找到所有依赖此任务的后继任务
      const successorTasks = tasks.filter(t => 
        t.dependencies?.includes(delay.taskId)
      );
      
      successorTasks.forEach(successor => {
        if (!successor.dueDateTime) return;
        
        const originalEnd = new Date(successor.dueDateTime);
        const newEnd = new Date(originalEnd.getTime() + delay.delayDays * 24 * 60 * 60 * 1000);
        
        affectedTasks.push({
          taskId: successor.id,
          taskName: successor.title,
          originalEndDate: originalEnd,
          newEndDate: newEnd,
          delayDays: delay.delayDays
        });
      });
    });
    
    // 分析里程碑影响
    if (milestones) {
      milestones.forEach(milestone => {
        const maxDelay = affectedTasks
          .filter(at => milestone.taskIds.includes(at.taskId))
          .reduce((max, at) => Math.max(max, at.delayDays), 0);
        
        if (maxDelay > 0) {
          milestoneImpact.push({
            milestone: milestone.name,
            originalDate: milestone.date,
            newDate: new Date(milestone.date.getTime() + maxDelay * 24 * 60 * 60 * 1000),
            delayDays: maxDelay
          });
        }
      });
    }
    
    // 检查关键路径影响
    const criticalPath = this.identifyCriticalPath(tasks);
    const criticalPathImpact = delays.some(d => criticalPath.includes(d.taskId));
    
    return {
      affectedTasks,
      criticalPathImpact,
      totalDelayDays: Math.max(...delays.map(d => d.delayDays), 0),
      milestoneImpact
    };
  }
  
  /**
   * 步骤3: 生成调整方案
   * 基于延期情况推荐多种调整策略
   */
  generateAdjustmentPlans(
    delays: DelayDetection[],
    impact: ImpactAnalysis,
    tasks: Task[]
  ): AdjustmentPlan[] {
    const plans: AdjustmentPlan[] = [];
    const maxDelay = Math.max(...delays.map(d => d.delayDays));
    
    // 方案1: 赶工 (Crash) - 增加资源
    if (maxDelay <= 7) {
      plans.push({
        planId: `plan-crash-${Date.now()}`,
        name: '赶工方案',
        description: '增加人力资源，加班赶工',
        type: 'crash',
        impact: {
          cost: 30,      // 成本+30%
          quality: -5,   // 质量-5%
          risk: 10,      // 风险+10%
          timeSave: maxDelay
        },
        actions: delays.map(d => ({
          type: 'add-resource',
          target: d.taskId,
          description: `为"${d.taskName}"增加1名开发人员`,
          effort: '预计节省' + d.delayDays + '天'
        })),
        recommendation: '适合短期延期，成本可控'
      });
    }
    
    // 方案2: 快速跟进 (Fast Track) - 并行执行
    if (!impact.criticalPathImpact) {
      plans.push({
        planId: `plan-fast-${Date.now()}`,
        name: '快速跟进方案',
        description: '将部分串行任务改为并行执行',
        type: 'fast-track',
        impact: {
          cost: 10,
          quality: -10,
          risk: 25,
          timeSave: Math.floor(maxDelay * 0.6)
        },
        actions: [{
          type: 'parallel',
          target: 'project',
          description: '识别可并行任务，调整依赖关系',
          effort: '重新规划任务依赖'
        }],
        recommendation: '适合非关键路径延期，有一定风险'
      });
    }
    
    // 方案3: 资源重分配
    plans.push({
      planId: `plan-resource-${Date.now()}`,
      name: '资源重分配方案',
      description: '从非关键任务调配资源到延期任务',
      type: 'resource-reallocate',
      impact: {
        cost: 5,
        quality: 0,
        risk: 15,
        timeSave: Math.floor(maxDelay * 0.4)
      },
      actions: [{
        type: 'add-resource',
        target: delays[0].taskId,
        description: `将其他任务资源调配到"${delays[0].taskName}"`,
        effort: '影响非关键任务进度'
      }],
      recommendation: '平衡方案，对整体影响较小'
    });
    
    // 方案4: 范围削减
    if (maxDelay >= 7) {
      plans.push({
        planId: `plan-scope-${Date.now()}`,
        name: '范围削减方案',
        description: '削减非核心功能，保核心交付',
        type: 'scope-reduce',
        impact: {
          cost: -20,     // 节省成本
          quality: -15,
          risk: 5,
          timeSave: maxDelay
        },
        actions: [{
          type: 'reduce-scope',
          target: 'project',
          description: '识别可推迟到下一版本的功能',
          effort: '与产品方确认范围变更'
        }],
        recommendation: '适合长期延期，确保核心功能按时交付'
      });
    }
    
    // 方案5: 接受延期
    plans.push({
      planId: `plan-accept-${Date.now()}`,
      name: '接受延期方案',
      description: '调整项目计划，接受延期',
      type: 'accept',
      impact: {
        cost: 0,
        quality: 0,
        risk: 0,
        timeSave: 0
      },
      actions: [{
        type: 'extend-deadline',
        target: 'project',
        description: `调整项目截止日期延后${maxDelay}天`,
        effort: '与 stakeholders 沟通确认'
      }],
      recommendation: '当其他方案都不可行时的保底方案'
    });
    
    return plans.sort((a, b) => b.impact.timeSave - a.impact.timeSave);
  }
  
  /**
   * 步骤4: 执行自动调整
   * 应用选定的调整方案
   */
  applyAdjustment(
    plan: AdjustmentPlan,
    tasks: Task[],
    context: GanttContext
  ): AutoAdjustmentResult {
    const changes: TaskChange[] = [];
    
    try {
      switch (plan.type) {
        case 'crash':
        case 'resource-reallocate':
          // 资源调整 - 更新任务工期
          plan.actions.forEach(action => {
            if (action.type === 'add-resource' && action.target !== 'project') {
              const task = tasks.find(t => t.id === action.target);
              if (task && task.dueDateTime && task.startDateTime) {
                const oldDuration = (new Date(task.dueDateTime).getTime() - new Date(task.startDateTime).getTime()) / (24 * 60 * 60 * 1000);
                const newDuration = Math.max(1, oldDuration * 0.7); // 减少30%工期
                
                changes.push({
                  taskId: task.id,
                  field: 'dueDateTime',
                  oldValue: task.dueDateTime,
                  newValue: new Date(new Date(task.startDateTime).getTime() + newDuration * 24 * 60 * 60 * 1000)
                });
                
                task.dueDateTime = new Date(new Date(task.startDateTime).getTime() + newDuration * 24 * 60 * 60 * 1000);
              }
            }
          });
          break;
          
        case 'accept':
          // 接受延期 - 调整里程碑
          plan.actions.forEach(action => {
            if (action.type === 'extend-deadline') {
              // 所有任务日期后移
              tasks.forEach(task => {
                if (task.startDateTime) {
                  const oldStart = new Date(task.startDateTime);
                  const newStart = new Date(oldStart.getTime() + 7 * 24 * 60 * 60 * 1000);
                  
                  changes.push({
                    taskId: task.id,
                    field: 'startDateTime',
                    oldValue: oldStart,
                    newValue: newStart
                  });
                  
                  task.startDateTime = newStart;
                  
                  if (task.dueDateTime) {
                    const oldDue = new Date(task.dueDateTime);
                    const newDue = new Date(oldDue.getTime() + 7 * 24 * 60 * 60 * 1000);
                    task.dueDateTime = newDue;
                  }
                }
              });
            }
          });
          break;
          
        default:
          // 其他方案需要手动确认
          return {
            success: false,
            message: `方案 "${plan.name}" 需要手动确认后执行`,
            changes: []
          };
      }
      
      // 重新排期
      const scheduleResult = this.planner.plan(tasks, new Date());
      
      return {
        success: true,
        appliedPlan: plan,
        changes,
        message: `已应用方案: ${plan.name}，共调整${changes.length}个任务`
      };
      
    } catch (error) {
      return {
        success: false,
        message: `调整失败: ${error instanceof Error ? error.message : String(error)}`,
        changes: []
      };
    }
  }
  
  /**
   * 完整自适应流程
   * 检测 → 分析 → 推荐 → 执行(或等待确认)
   */
  async runAdaptiveCycle(
    tasks: Task[],
    context: GanttContext,
    options: {
      autoApply?: boolean;           // 是否自动应用
      severityThreshold?: string;    // 自动处理的严重级别
      milestones?: { name: string; date: Date; taskIds: string[] }[];
    } = {}
  ): Promise<{
    detected: boolean;
    delays: DelayDetection[];
    impact: ImpactAnalysis;
    plans: AdjustmentPlan[];
    applied?: AutoAdjustmentResult;
    recommendation: string;
  }> {
    // 1. 检测延期
    const delays = this.detectDelays(tasks);
    
    if (delays.length === 0) {
      return {
        detected: false,
        delays: [],
        impact: {
          affectedTasks: [],
          criticalPathImpact: false,
          totalDelayDays: 0,
          milestoneImpact: []
        },
        plans: [],
        recommendation: '项目进度正常，无需调整'
      };
    }
    
    // 2. 影响分析
    const impact = this.analyzeImpact(delays, tasks, options.milestones);
    
    // 3. 生成方案
    const plans = this.generateAdjustmentPlans(delays, impact, tasks);
    
    // 4. 判断是否自动应用
    let applied: AutoAdjustmentResult | undefined;
    let recommendation: string;
    
    const criticalDelays = delays.filter(d => d.severity === 'critical');
    const shouldAutoApply = options.autoApply && criticalDelays.length > 0;
    
    if (shouldAutoApply && plans.length > 0) {
      // 自动应用最优方案
      applied = this.applyAdjustment(plans[0], tasks, context);
      recommendation = applied.success 
        ? `已自动应用"${plans[0].name}"，节省${plans[0].impact.timeSave}天`
        : `请手动选择调整方案: ${plans[0].name}`;
    } else {
      recommendation = `检测到${delays.length}个延期，建议采用"${plans[0]?.name || '默认方案'}"`;
    }
    
    return {
      detected: true,
      delays,
      impact,
      plans,
      applied,
      recommendation
    };
  }
  
  // ========== 辅助方法 ==========
  
  private inferDelayReason(task: Task, delayDays: number): string {
    const reasons = [
      '需求变更频繁',
      '技术难点未预期',
      '资源不足',
      '依赖方交付延迟',
      '人员变动'
    ];
    
    // 简单启发式
    if (task.title.includes('需求') || task.title.includes('设计')) {
      return '需求变更频繁';
    }
    if (task.title.includes('开发') || task.title.includes('实现')) {
      return delayDays > 7 ? '技术难点未预期' : '资源不足';
    }
    
    return reasons[Math.floor(Math.random() * reasons.length)];
  }
  
  private identifyCriticalPath(tasks: Task[]): string[] {
    // 简化版：返回所有任务ID
    return tasks.map(t => t.id);
  }
}

// 导出单例
export const adaptiveEngine = new AdaptiveAdjustmentEngine();
