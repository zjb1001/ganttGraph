/**
 * Level 8: 预测性分析引擎
 * 基于历史数据预测项目风险、工期、资源需求
 */

import { Task, GanttContext } from '@/types';

// 预测结果类型
export interface PredictionResult {
  taskId: string;
  taskName: string;
  onTimeProbability: number;  // 准时完成概率 0-100
  predictedDelay: number;     // 预计延期天数
  riskFactors: RiskFactor[];  // 风险因素
  confidence: number;         // 预测置信度 0-100
}

export interface RiskFactor {
  type: 'complexity' | 'dependency' | 'resource' | 'history' | 'seasonality';
  severity: 'low' | 'medium' | 'high';
  description: string;
  impact: number;  // 影响程度 0-1
}

export interface ResourcePrediction {
  role: string;
  currentCount: number;
  predictedNeed: number;
  shortage: number;
  period: string;
}

export interface MilestonePrediction {
  milestone: string;
  predictedDate: Date;
  originalDate: Date;
  delayProbability: number;
  confidence: number;
}

// 历史数据点
interface HistoricalDataPoint {
  taskType: string;
  estimatedDays: number;
  actualDays: number;
  complexity: number;
  teamSize: number;
  success: boolean;
  delayDays: number;
  timestamp: Date;
}

export class PredictiveAnalysisEngine {
  private historyData: HistoricalDataPoint[] = [];
  
  // 加载历史数据（模拟）
  constructor() {
    this.initializeMockHistory();
  }
  
  private initializeMockHistory() {
    // 模拟历史项目数据
    this.historyData = [
      // MCAL 开发历史数据
      { taskType: 'MCAL_ADC', estimatedDays: 7, actualDays: 8, complexity: 0.6, teamSize: 1, success: true, delayDays: 1, timestamp: new Date('2025-01-15') },
      { taskType: 'MCAL_PWM', estimatedDays: 10, actualDays: 14, complexity: 0.7, teamSize: 1, success: true, delayDays: 4, timestamp: new Date('2025-02-01') },
      { taskType: 'MCAL_CAN', estimatedDays: 10, actualDays: 12, complexity: 0.8, teamSize: 2, success: true, delayDays: 2, timestamp: new Date('2025-02-20') },
      
      // 算法开发历史数据
      { taskType: 'ALGO_ABS', estimatedDays: 20, actualDays: 28, complexity: 0.8, teamSize: 2, success: true, delayDays: 8, timestamp: new Date('2025-03-01') },
      { taskType: 'ALGO_ESC', estimatedDays: 25, actualDays: 35, complexity: 0.9, teamSize: 3, success: true, delayDays: 10, timestamp: new Date('2025-04-01') },
      { taskType: 'ALGO_TCS', estimatedDays: 20, actualDays: 18, complexity: 0.7, teamSize: 2, success: true, delayDays: -2, timestamp: new Date('2025-04-15') },
      
      // 硬件开发历史数据
      { taskType: 'HW_ESC', estimatedDays: 35, actualDays: 42, complexity: 0.85, teamSize: 4, success: true, delayDays: 7, timestamp: new Date('2025-05-01') },
      { taskType: 'HW_SENSOR', estimatedDays: 20, actualDays: 16, complexity: 0.5, teamSize: 2, success: true, delayDays: -4, timestamp: new Date('2025-05-20') },
      
      // 测试验证历史数据
      { taskType: 'TEST_HIL', estimatedDays: 25, actualDays: 32, complexity: 0.75, teamSize: 3, success: true, delayDays: 7, timestamp: new Date('2025-06-01') },
      { taskType: 'TEST_VEHICLE', estimatedDays: 30, actualDays: 28, complexity: 0.6, teamSize: 5, success: true, delayDays: -2, timestamp: new Date('2025-06-15') },
      
      // 失败案例
      { taskType: 'MCAL_ICU', estimatedDays: 8, actualDays: 20, complexity: 0.9, teamSize: 1, success: false, delayDays: 12, timestamp: new Date('2025-07-01') },
      { taskType: 'ALGO_HDC', estimatedDays: 15, actualDays: 35, complexity: 0.8, teamSize: 1, success: false, delayDays: 20, timestamp: new Date('2025-07-15') },
    ];
  }
  
  // ========== 核心预测功能 ==========
  
  /**
   * 预测单个任务的延期概率
   */
  predictTaskDelay(task: Task): PredictionResult {
    const taskType = this.classifyTaskType(task);
    const historicalData = this.getHistoricalData(taskType);
    
    // 基础概率计算
    let onTimeProbability = this.calculateBaseProbability(historicalData);
    const riskFactors: RiskFactor[] = [];
    
    // 1. 复杂度风险分析
    const complexityRisk = this.analyzeComplexity(task, historicalData);
    if (complexityRisk > 0.3) {
      riskFactors.push({
        type: 'complexity',
        severity: complexityRisk > 0.6 ? 'high' : 'medium',
        description: `任务复杂度较高（${(complexityRisk * 100).toFixed(0)}%），历史类似任务平均延期 ${this.getAverageDelay(historicalData)} 天`,
        impact: complexityRisk
      });
      onTimeProbability -= complexityRisk * 20;
    }
    
    // 2. 依赖风险分析
    const dependencyRisk = this.analyzeDependencyRisk(task);
    if (dependencyRisk > 0) {
      riskFactors.push({
        type: 'dependency',
        severity: dependencyRisk > 0.5 ? 'high' : 'medium',
        description: `存在 ${dependencyRisk} 个关键依赖，任一延迟将影响本任务`,
        impact: dependencyRisk * 0.3
      });
      onTimeProbability -= dependencyRisk * 15;
    }
    
    // 3. 资源风险分析
    const resourceRisk = this.analyzeResourceRisk(task);
    if (resourceRisk > 0.3) {
      riskFactors.push({
        type: 'resource',
        severity: resourceRisk > 0.6 ? 'high' : 'medium',
        description: `资源分配不足，建议增加 ${Math.ceil(resourceRisk * 2)} 名工程师`,
        impact: resourceRisk
      });
      onTimeProbability -= resourceRisk * 25;
    }
    
    // 4. 历史表现分析
    const historyRisk = this.analyzeHistoryPattern(taskType);
    if (historyRisk > 0) {
      riskFactors.push({
        type: 'history',
        severity: historyRisk > 0.5 ? 'high' : 'medium',
        description: `历史数据显示此类任务延期率 ${(historyRisk * 100).toFixed(0)}%`,
        impact: historyRisk
      });
      onTimeProbability -= historyRisk * 10;
    }
    
    // 计算预计延期天数
    const predictedDelay = this.calculatePredictedDelay(
      historicalData, 
      riskFactors.reduce((sum, r) => sum + r.impact, 0)
    );
    
    // 确保概率在合理范围
    onTimeProbability = Math.max(5, Math.min(95, onTimeProbability));
    
    // 计算置信度（基于历史数据量）
    const confidence = Math.min(90, 30 + historicalData.length * 10);
    
    return {
      taskId: task.id,
      taskName: task.title,
      onTimeProbability: Math.round(onTimeProbability),
      predictedDelay: Math.round(predictedDelay),
      riskFactors,
      confidence: Math.round(confidence)
    };
  }
  
  /**
   * 批量预测项目中所有任务
   */
  predictProject(context: GanttContext): PredictionResult[] {
    return context.tasks.map(task => this.predictTaskDelay(task));
  }
  
  /**
   * 预测资源需求
   */
  predictResourceNeeds(context: GanttContext, periodDays: number = 30): ResourcePrediction[] {
    const predictions: ResourcePrediction[] = [];
    
    // 按角色分组任务
    const tasksByRole = this.groupTasksByRole(context.tasks);
    
    for (const [role, tasks] of Object.entries(tasksByRole)) {
      const currentCount = this.getCurrentResourceCount(role);
      const workload = this.calculateWorkload(tasks, periodDays);
      const predictedNeed = Math.ceil(workload / 0.7); // 假设每人70%效率
      
      predictions.push({
        role,
        currentCount,
        predictedNeed,
        shortage: Math.max(0, predictedNeed - currentCount),
        period: `未来 ${periodDays} 天`
      });
    }
    
    return predictions;
  }
  
  /**
   * 预测里程碑达成时间
   */
  predictMilestones(context: GanttContext): MilestonePrediction[] {
    const milestones = context.tasks.filter(t => t.taskType === 'milestone');
    const predictions: MilestonePrediction[] = [];
    
    for (const milestone of milestones) {
      // 找到影响此里程碑的所有前置任务
      const dependentTasks = this.findDependentTasks(milestone, context.tasks);
      
      // 计算每个前置任务的完成时间预测
      let maxDelayProbability = 0;
      let totalPredictedDelay = 0;
      
      for (const task of dependentTasks) {
        const prediction = this.predictTaskDelay(task);
        maxDelayProbability = Math.max(maxDelayProbability, 100 - prediction.onTimeProbability);
        totalPredictedDelay += prediction.predictedDelay;
      }
      
      const avgDelay = dependentTasks.length > 0 ? totalPredictedDelay / dependentTasks.length : 0;
      const originalDate = milestone.dueDateTime || new Date();
      const predictedDate = new Date(originalDate.getTime() + avgDelay * 24 * 60 * 60 * 1000);
      
      predictions.push({
        milestone: milestone.title,
        predictedDate,
        originalDate,
        delayProbability: Math.round(maxDelayProbability),
        confidence: Math.round(60 + dependentTasks.length * 5)
      });
    }
    
    return predictions;
  }
  
  /**
   * 生成项目健康度报告
   */
  generateHealthReport(context: GanttContext) {
    const predictions = this.predictProject(context);
    const resourcePredictions = this.predictResourceNeeds(context);
    const milestonePredictions = this.predictMilestones(context);
    
    // 计算整体指标
    const avgOnTimeProbability = predictions.reduce((sum, p) => sum + p.onTimeProbability, 0) / predictions.length;
    const highRiskTasks = predictions.filter(p => p.onTimeProbability < 50);
    const criticalTasks = predictions.filter(p => p.onTimeProbability < 30);
    
    // 资源短缺
    const resourceShortage = resourcePredictions.filter(r => r.shortage > 0);
    const totalShortage = resourceShortage.reduce((sum, r) => sum + r.shortage, 0);
    
    // 里程碑风险
    const atRiskMilestones = milestonePredictions.filter(m => m.delayProbability > 50);
    
    return {
      overallHealth: this.calculateHealthScore(avgOnTimeProbability, highRiskTasks.length, totalShortage),
      avgOnTimeProbability: Math.round(avgOnTimeProbability),
      totalTasks: predictions.length,
      highRiskCount: highRiskTasks.length,
      criticalCount: criticalTasks.length,
      resourceShortage: {
        count: resourceShortage.length,
        totalPeople: totalShortage,
        details: resourceShortage
      },
      atRiskMilestones: {
        count: atRiskMilestones.length,
        details: atRiskMilestones
      },
      recommendations: this.generateRecommendations(predictions, resourcePredictions, milestonePredictions)
    };
  }
  
  // ========== 辅助方法 ==========
  
  private classifyTaskType(task: Task): string {
    const title = task.title.toLowerCase();
    
    if (title.includes('adc') || title.includes('pwm') || title.includes('icu') || title.includes('can')) {
      return `MCAL_${title.split('配置')[0].toUpperCase()}`;
    }
    if (title.includes('abs') || title.includes('ebd') || title.includes('esc') || title.includes('tcs')) {
      return `ALGO_${title.replace('算法开发', '').toUpperCase()}`;
    }
    if (title.includes('硬件') || title.includes('控制器') || title.includes('传感器')) {
      return 'HW_ESC';
    }
    if (title.includes('测试') || title.includes('hil')) {
      return 'TEST_HIL';
    }
    
    return 'GENERIC';
  }
  
  private getHistoricalData(taskType: string): HistoricalDataPoint[] {
    if (taskType === 'GENERIC') {
      return this.historyData;
    }
    return this.historyData.filter(h => h.taskType.includes(taskType.split('_')[0]));
  }
  
  private calculateBaseProbability(data: HistoricalDataPoint[]): number {
    if (data.length === 0) return 70;
    
    const successCount = data.filter(d => d.success).length;
    return (successCount / data.length) * 100;
  }
  
  private analyzeComplexity(task: Task, historicalData: HistoricalDataPoint[]): number {
    // 基于任务标题和描述分析复杂度
    let complexity = 0.5;
    
    const title = task.title.toLowerCase();
    
    // 关键词复杂度评分
    if (title.includes('esc') || title.includes('算法')) complexity += 0.2;
    if (title.includes('安全') || title.includes('asil')) complexity += 0.15;
    if (title.includes('架构') || title.includes('设计')) complexity += 0.1;
    if (title.includes('hil') || title.includes('测试')) complexity += 0.05;
    
    // 历史数据对比
    if (historicalData.length > 0) {
      const avgComplexity = historicalData.reduce((sum, h) => sum + h.complexity, 0) / historicalData.length;
      complexity = (complexity + avgComplexity) / 2;
    }
    
    return Math.min(1, complexity);
  }
  
  private analyzeDependencyRisk(task: Task): number {
    const dependencies = task.dependencyTaskIds || [];
    const dependencies2 = task.dependencies || [];
    return dependencies.length + dependencies2.length;
  }
  
  private analyzeResourceRisk(task: Task): number {
    // 模拟资源分析
    const assignees = task.assigneeIds?.length || 0;
    
    // 根据工期和复杂度估算所需资源
    const duration = task.dueDateTime && task.startDateTime 
      ? (task.dueDateTime.getTime() - task.startDateTime.getTime()) / (24 * 60 * 60 * 1000)
      : 10;
    
    const recommendedTeam = duration > 20 ? 3 : duration > 10 ? 2 : 1;
    
    return assignees < recommendedTeam ? (recommendedTeam - assignees) * 0.3 : 0;
  }
  
  private analyzeHistoryPattern(taskType: string): number {
    const data = this.getHistoricalData(taskType);
    if (data.length < 2) return 0;
    
    const delayedCount = data.filter(d => d.delayDays > 0).length;
    return delayedCount / data.length;
  }
  
  private getAverageDelay(data: HistoricalDataPoint[]): number {
    if (data.length === 0) return 0;
    const delays = data.filter(d => d.delayDays > 0).map(d => d.delayDays);
    return delays.length > 0 
      ? delays.reduce((sum, d) => sum + d, 0) / delays.length 
      : 0;
  }
  
  private calculatePredictedDelay(historicalData: HistoricalDataPoint[], totalRisk: number): number {
    const avgDelay = this.getAverageDelay(historicalData);
    return avgDelay * (1 + totalRisk);
  }
  
  private groupTasksByRole(tasks: Task[]): Record<string, Task[]> {
    const groups: Record<string, Task[]> = {
      'MCAL工程师': [],
      '算法工程师': [],
      '硬件工程师': [],
      '测试工程师': [],
      '项目经理': []
    };
    
    for (const task of tasks) {
      const title = task.title.toLowerCase();
      
      if (title.includes('adc') || title.includes('pwm') || title.includes('icu') || title.includes('can') || title.includes('mcal')) {
        groups['MCAL工程师'].push(task);
      } else if (title.includes('算法') || title.includes('abs') || title.includes('esc') || title.includes('ebd')) {
        groups['算法工程师'].push(task);
      } else if (title.includes('硬件') || title.includes('控制器') || title.includes('传感器') || title.includes('pcb')) {
        groups['硬件工程师'].push(task);
      } else if (title.includes('测试') || title.includes('hil') || title.includes('验证')) {
        groups['测试工程师'].push(task);
      } else {
        groups['项目经理'].push(task);
      }
    }
    
    return groups;
  }
  
  private getCurrentResourceCount(role: string): number {
    // 模拟当前资源数量
    const counts: Record<string, number> = {
      'MCAL工程师': 2,
      '算法工程师': 3,
      '硬件工程师': 2,
      '测试工程师': 2,
      '项目经理': 1
    };
    return counts[role] || 1;
  }
  
  private calculateWorkload(tasks: Task[], periodDays: number): number {
    const totalDays = tasks.reduce((sum, t) => {
      const duration = t.dueDateTime && t.startDateTime 
        ? (t.dueDateTime.getTime() - t.startDateTime.getTime()) / (24 * 60 * 60 * 1000)
        : 10;
      return sum + duration;
    }, 0);
    return totalDays / periodDays;
  }
  
  private findDependentTasks(milestone: Task, allTasks: Task[]): Task[] {
    // 简化：找到所有在里程碑之前的任务
    return allTasks.filter(t => 
      t.taskType !== 'milestone' && 
      t.dueDateTime && 
      milestone.dueDateTime &&
      t.dueDateTime <= milestone.dueDateTime
    );
  }
  
  private calculateHealthScore(avgProbability: number, highRiskCount: number, resourceShortage: number): {
    score: number;
    status: 'excellent' | 'good' | 'warning' | 'critical';
  } {
    let score = avgProbability;
    score -= highRiskCount * 5;
    score -= resourceShortage * 3;
    score = Math.max(0, Math.min(100, score));
    
    let status: 'excellent' | 'good' | 'warning' | 'critical';
    if (score >= 80) status = 'excellent';
    else if (score >= 60) status = 'good';
    else if (score >= 40) status = 'warning';
    else status = 'critical';
    
    return { score: Math.round(score), status };
  }
  
  private generateRecommendations(
    predictions: PredictionResult[],
    resourcePredictions: ResourcePrediction[],
    milestonePredictions: MilestonePrediction[]
  ): string[] {
    const recommendations: string[] = [];
    
    // 高风险任务建议
    const highRiskTasks = predictions.filter(p => p.onTimeProbability < 50);
    if (highRiskTasks.length > 0) {
      recommendations.push(`重点关注 ${highRiskTasks.length} 个高风险任务，建议提前介入管理`);
    }
    
    // 资源建议
    const shortages = resourcePredictions.filter(r => r.shortage > 0);
    if (shortages.length > 0) {
      recommendations.push(`建议增加 ${shortages.map(s => `${s.shortage}名${s.role}`).join('、')}`);
    }
    
    // 里程碑建议
    const atRiskMilestones = milestonePredictions.filter(m => m.delayProbability > 50);
    if (atRiskMilestones.length > 0) {
      recommendations.push(`${atRiskMilestones.length} 个里程碑有延期风险，建议制定应急预案`);
    }
    
    return recommendations.length > 0 ? recommendations : ['项目整体健康度良好，继续保持当前节奏'];
  }
}

// 导出单例
export const predictiveEngine = new PredictiveAnalysisEngine();
