/**
 * 智能增强模块 - Level 4
 * 风险评估、资源优化、智能建议
 */

import { Task, GanttContext } from '@/types';
import { DependencyAnalyzer, ScheduleEngine } from './TaskPlanner';

// 风险评估结果
export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number; // 0-100
  delayRisks: DelayRisk[];
  resourceRisks: ResourceRisk[];
  qualityRisks: QualityRisk[];
  mitigation: MitigationAction[];
}

export interface DelayRisk {
  taskId: string;
  taskName: string;
  probability: number; // 0-1
  impact: 'low' | 'medium' | 'high';
  daysAtRisk: number;
  reason: string;
}

export interface ResourceRisk {
  timeWindow: string;
  concurrentTasks: number;
  resourceDemand: number;
  capacity: number;
  conflictType: 'overload' | 'overlap' | 'bottleneck';
}

export interface QualityRisk {
  taskId: string;
  issue: string;
  severity: 'low' | 'medium' | 'high';
}

export interface MitigationAction {
  type: 'schedule' | 'resource' | 'scope' | 'quality';
  description: string;
  priority: number;
  expectedImpact: string;
}

// 资源分析
export interface ResourceAnalysis {
  timeline: ResourceAllocation[];
  bottlenecks: string[];
  idlePeriods: string[];
  recommendations: ResourceRecommendation[];
}

export interface ResourceAllocation {
  date: string;
  activeTasks: number;
  totalEffort: number;
  utilization: number;
}

export interface ResourceRecommendation {
  type: 'add_resource' | 'reschedule' | 'parallel' | 'reduce_scope';
  description: string;
  affectedTasks: string[];
  expectedBenefit: string;
}

// 优化建议
export interface OptimizationSuggestion {
  category: 'schedule' | 'resource' | 'dependency' | 'quality';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  currentState: string;
  proposedChange: string;
  expectedImprovement: string;
}

/**
 * 风险评估引擎
 */
export class RiskEngine {
  private analyzer = new DependencyAnalyzer();
  private scheduler = new ScheduleEngine();
  
  /**
   * 全面风险评估
   */
  assessRisks(tasks: Task[], context?: GanttContext): RiskAssessment {
    const delayRisks = this.assessDelayRisks(tasks);
    const resourceRisks = this.assessResourceRisks(tasks);
    const qualityRisks = this.assessQualityRisks(tasks);
    
    // 计算整体风险分数
    const totalRiskScore = this.calculateOverallRisk(
      delayRisks, 
      resourceRisks, 
      qualityRisks
    );
    
    // 生成缓解措施
    const mitigation = this.generateMitigationActions(
      delayRisks,
      resourceRisks,
      qualityRisks
    );
    
    return {
      overallRisk: this.scoreToLevel(totalRiskScore),
      riskScore: totalRiskScore,
      delayRisks,
      resourceRisks,
      qualityRisks,
      mitigation
    };
  }
  
  /**
   * 延期风险评估
   */
  private assessDelayRisks(tasks: Task[]): DelayRisk[] {
    const risks: DelayRisk[] = [];
    const now = new Date();
    
    tasks.forEach(task => {
      if (task.status === 'Completed') return;
      
      const dueDate = task.dueDateTime ? new Date(task.dueDateTime) : null;
      const startDate = task.startDate ? new Date(task.startDate) : null;
      
      if (!dueDate || !startDate) return;
      
      const totalDays = Math.max(1, (dueDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
      const remainingDays = Math.max(0, (dueDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      const progress = task.completedPercent || 0;
      
      // 预计进度 vs 实际进度
      const expectedProgress = Math.min(100, Math.max(0, 100 - (remainingDays / totalDays) * 100));
      const progressGap = expectedProgress - progress;
      
      // 风险概率计算
      let probability = 0;
      let impact: 'low' | 'medium' | 'high' = 'low';
      
      if (remainingDays < 1 && progress < 100) {
        probability = 0.9;
        impact = 'high';
      } else if (progressGap > 30) {
        probability = 0.7;
        impact = 'high';
      } else if (progressGap > 15) {
        probability = 0.5;
        impact = 'medium';
      } else if (remainingDays < 3 && progress < 80) {
        probability = 0.6;
        impact = 'medium';
      }
      
      if (probability > 0) {
        risks.push({
          taskId: task.id,
          taskName: task.title,
          probability,
          impact,
          daysAtRisk: Math.ceil(totalDays * (100 - progress) / 100 - remainingDays),
          reason: this.getDelayReason(progress, expectedProgress, remainingDays)
        });
      }
    });
    
    return risks.sort((a, b) => b.probability - a.probability);
  }
  
  /**
   * 资源冲突评估
   */
  private assessResourceRisks(tasks: Task[]): ResourceRisk[] {
    const risks: ResourceRisk[] = [];
    const allocation = this.calculateResourceAllocation(tasks);
    
    // 检测超负荷时段
    allocation.forEach(day => {
      if (day.utilization > 100) {
        risks.push({
          timeWindow: day.date,
          concurrentTasks: day.activeTasks,
          resourceDemand: day.totalEffort,
          capacity: 100,
          conflictType: 'overload'
        });
      } else if (day.utilization > 80) {
        risks.push({
          timeWindow: day.date,
          concurrentTasks: day.activeTasks,
          resourceDemand: day.totalEffort,
          capacity: 100,
          conflictType: 'bottleneck'
        });
      }
    });
    
    return risks;
  }
  
  /**
   * 质量风险评估
   */
  private assessQualityRisks(tasks: Task[]): QualityRisk[] {
    const risks: QualityRisk[] = [];
    
    tasks.forEach(task => {
      // 检查工期过短的任务
      if (task.startDate && task.dueDateTime) {
        const duration = (new Date(task.dueDateTime).getTime() - new Date(task.startDate).getTime()) / (24 * 60 * 60 * 1000);
        if (duration < 0.5) {
          risks.push({
            taskId: task.id,
            issue: '工期过短，可能存在质量问题',
            severity: 'medium'
          });
        }
      }
      
      // 检查过度延期的任务
      if (task.status === 'InProgress' && task.completedPercent === 0) {
        const startDate = task.startDate ? new Date(task.startDate) : null;
        if (startDate) {
          const daysSinceStart = (Date.now() - startDate.getTime()) / (24 * 60 * 60 * 1000);
          if (daysSinceStart > 7) {
            risks.push({
              taskId: task.id,
              issue: '长期无进展，可能存在阻塞问题',
              severity: 'high'
            });
          }
        }
      }
    });
    
    return risks;
  }
  
  /**
   * 计算资源分配
   */
  private calculateResourceAllocation(tasks: Task[]): ResourceAllocation[] {
    const allocation: ResourceAllocation[] = [];
    const dateMap = new Map<string, { tasks: Task[]; effort: number }>();
    
    // 按天统计
    tasks.forEach(task => {
      if (!task.startDate || !task.dueDateTime) return;
      
      let current = new Date(task.startDate);
      const end = new Date(task.dueDateTime);
      
      while (current <= end) {
        const dateKey = current.toISOString().split('T')[0];
        
        if (!dateMap.has(dateKey)) {
          dateMap.set(dateKey, { tasks: [], effort: 0 });
        }
        
        const day = dateMap.get(dateKey)!;
        day.tasks.push(task);
        day.effort += 10; // 假设每个任务每天消耗10单位资源
        
        current.setDate(current.getDate() + 1);
      }
    });
    
    // 转换为数组
    dateMap.forEach((data, date) => {
      allocation.push({
        date,
        activeTasks: data.tasks.length,
        totalEffort: data.effort,
        utilization: data.effort // 假设容量为100
      });
    });
    
    return allocation.sort((a, b) => a.date.localeCompare(b.date));
  }
  
  /**
   * 生成缓解措施
   */
  private generateMitigationActions(
    delayRisks: DelayRisk[],
    resourceRisks: ResourceRisk[],
    qualityRisks: QualityRisk[]
  ): MitigationAction[] {
    const actions: MitigationAction[] = [];
    
    // 针对延期风险的措施
    delayRisks.slice(0, 3).forEach((risk, index) => {
      if (risk.probability > 0.7) {
        actions.push({
          type: 'schedule',
          description: `为「${risk.taskName}」增加缓冲时间或并行处理`,
          priority: index + 1,
          expectedImpact: `降低延期概率至 ${(risk.probability * 0.5).toFixed(1)}`
        });
      }
    });
    
    // 针对资源冲突的措施
    if (resourceRisks.length > 0) {
      actions.push({
        type: 'resource',
        description: '重新分配资源，避免高峰期集中',
        priority: actions.length + 1,
        expectedImpact: '减少资源冲突'
      });
    }
    
    return actions;
  }
  
  private getDelayReason(progress: number, expected: number, remaining: number): string {
    if (progress === 0 && remaining < 3) return '任务尚未开始但即将到期';
    if (progress < expected - 20) return '进度严重落后预期';
    if (remaining < 1) return '时间即将耗尽';
    return '进度存在风险';
  }
  
  private calculateOverallRisk(
    delays: DelayRisk[],
    resources: ResourceRisk[],
    quality: QualityRisk[]
  ): number {
    const delayScore = delays.reduce((sum, d) => sum + d.probability * 30, 0);
    const resourceScore = resources.length * 15;
    const qualityScore = quality.reduce((sum, q) => sum + (q.severity === 'high' ? 20 : 10), 0);
    
    return Math.min(100, delayScore + resourceScore + qualityScore);
  }
  
  private scoreToLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score < 30) return 'low';
    if (score < 50) return 'medium';
    if (score < 75) return 'high';
    return 'critical';
  }
}

/**
 * 资源优化器
 */
export class ResourceOptimizer {
  /**
   * 分析资源分配
   */
  analyze(tasks: Task[]): ResourceAnalysis {
    const timeline = this.buildTimeline(tasks);
    const bottlenecks = this.findBottlenecks(timeline);
    const idlePeriods = this.findIdlePeriods(timeline);
    const recommendations = this.generateRecommendations(tasks, timeline, bottlenecks);
    
    return {
      timeline,
      bottlenecks,
      idlePeriods,
      recommendations
    };
  }
  
  private buildTimeline(tasks: Task[]): ResourceAllocation[] {
    // 简化实现
    return [];
  }
  
  private findBottlenecks(timeline: ResourceAllocation[]): string[] {
    return timeline
      .filter(t => t.utilization > 90)
      .map(t => t.date);
  }
  
  private findIdlePeriods(timeline: ResourceAllocation[]): string[] {
    return timeline
      .filter(t => t.utilization < 20)
      .map(t => t.date);
  }
  
  private generateRecommendations(
    tasks: Task[],
    timeline: ResourceAllocation[],
    bottlenecks: string[]
  ): ResourceRecommendation[] {
    const recommendations: ResourceRecommendation[] = [];
    
    if (bottlenecks.length > 0) {
      recommendations.push({
        type: 'reschedule',
        description: '将部分任务从高峰期移至低谷期',
        affectedTasks: tasks.slice(0, 3).map(t => t.id),
        expectedBenefit: '降低资源峰值负载'
      });
    }
    
    return recommendations;
  }
}

/**
 * 智能建议生成器
 */
export class SuggestionEngine {
  private riskEngine = new RiskEngine();
  private resourceOptimizer = new ResourceOptimizer();
  
  /**
   * 生成优化建议
   */
  generateSuggestions(tasks: Task[], context?: GanttContext): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    
    // 1. 进度优化建议
    suggestions.push(...this.generateScheduleSuggestions(tasks));
    
    // 2. 资源优化建议
    suggestions.push(...this.generateResourceSuggestions(tasks));
    
    // 3. 依赖优化建议
    suggestions.push(...this.generateDependencySuggestions(tasks));
    
    return suggestions.sort((a, b) => {
      const priorityMap = { high: 3, medium: 2, low: 1 };
      return priorityMap[b.priority] - priorityMap[a.priority];
    });
  }
  
  private generateScheduleSuggestions(tasks: Task[]): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    
    // 检查是否有并行优化的空间
    const sequentialTasks = tasks.filter(t => 
      !t.dependencies || t.dependencies.length === 0
    );
    
    if (sequentialTasks.length >= 2) {
      suggestions.push({
        category: 'schedule',
        priority: 'medium',
        title: '并行执行任务',
        description: '检测到多个无依赖任务可以并行执行',
        currentState: '任务串行执行',
        proposedChange: '同时启动无依赖任务',
        expectedImprovement: '缩短总工期约30%'
      });
    }
    
    return suggestions;
  }
  
  private generateResourceSuggestions(tasks: Task[]): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    const analysis = this.resourceOptimizer.analyze(tasks);
    
    if (analysis.bottlenecks.length > 0) {
      suggestions.push({
        category: 'resource',
        priority: 'high',
        title: '资源瓶颈优化',
        description: `检测到 ${analysis.bottlenecks.length} 个资源瓶颈时段`,
        currentState: '资源分配不均',
        proposedChange: '调整任务时间，平衡资源负载',
        expectedImprovement: '消除资源冲突，提高执行效率'
      });
    }
    
    return suggestions;
  }
  
  private generateDependencySuggestions(tasks: Task[]): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    
    // 检查冗余依赖
    const analyzer = new DependencyAnalyzer();
    const graph = analyzer.buildDependencyGraph(tasks);
    
    // 检查长依赖链
    let maxChainLength = 0;
    tasks.forEach(task => {
      const predecessors = analyzer.getAllPredecessors(task.id, tasks);
      maxChainLength = Math.max(maxChainLength, predecessors.length);
    });
    
    if (maxChainLength > 5) {
      suggestions.push({
        category: 'dependency',
        priority: 'medium',
        title: '简化依赖链',
        description: '检测到过长的依赖链，可能存在优化空间',
        currentState: `最长依赖链包含${maxChainLength}个任务`,
        proposedChange: '审查依赖关系，移除不必要的依赖',
        expectedImprovement: '缩短关键路径，加快项目进度'
      });
    }
    
    return suggestions;
  }
}

/**
 * 智能增强主类
 */
export class IntelligenceEnhancer {
  private riskEngine = new RiskEngine();
  private resourceOptimizer = new ResourceOptimizer();
  private suggestionEngine = new SuggestionEngine();
  
  /**
   * 全面智能分析
   */
  analyze(tasks: Task[], context?: GanttContext): {
    risk: ReturnType<RiskEngine['assessRisks']>;
    resource: ReturnType<ResourceOptimizer['analyze']>;
    suggestions: OptimizationSuggestion[];
  } {
    return {
      risk: this.riskEngine.assessRisks(tasks, context),
      resource: this.resourceOptimizer.analyze(tasks),
      suggestions: this.suggestionEngine.generateSuggestions(tasks, context)
    };
  }
  
  /**
   * 快速风险评估
   */
  quickRiskCheck(tasks: Task[]): { hasRisk: boolean; level: string; topRisks: string[] } {
    const assessment = this.riskEngine.assessRisks(tasks);
    
    return {
      hasRisk: assessment.overallRisk !== 'low',
      level: assessment.overallRisk,
      topRisks: assessment.delayRisks.slice(0, 3).map(r => r.taskName)
    };
  }
}
