/**
 * Level 10: 完全自主执行引擎
 * Agent 自主分解任务、跟踪进度、应对风险、协调团队
 */

import { Task, GanttContext } from '@/types';
import { db } from '@/db';
import { adaptiveEngine } from './AdaptiveAdjustmentEngine';
import { predictiveEngine } from './PredictiveAnalysisEngine';
import { globalMessageBus, CollaborationManager } from './MultiAgentSystem';
import {
  ProjectManagerAgent,
  DeveloperAgent,
  TesterAgent,
  ResourceSchedulerAgent,
  RiskMonitorAgent
} from './SpecializedAgents';

// 自主执行配置
interface AutonomousConfig {
  enableAutoDecomposition: boolean;    // 自动任务分解
  enableAutoProgressTracking: boolean; // 自动进度跟踪
  enableAutoRiskResponse: boolean;     // 自动风险应对
  enableAutoCoordination: boolean;     // 自动团队协作
  checkIntervalMinutes: number;        // 检查间隔（分钟）
  riskThreshold: number;               // 风险阈值
}

// 执行日志
export interface ExecutionLog {
  id: string;
  timestamp: Date;
  type: 'decomposition' | 'tracking' | 'risk' | 'coordination' | 'decision' | 'system';
  description: string;
  taskId?: string;
  action: string;
  result: 'success' | 'warning' | 'error';
  details: any;
}

// 自主任务分解结果
interface DecomposedTask {
  originalTask: Task;
  subtasks: Task[];
  estimatedTotalDays: number;
  dependencies: string[];
}

export class AutonomousExecutionEngine {
  private config: AutonomousConfig;
  private logs: ExecutionLog[] = [];
  private collabManager: CollaborationManager;
  private isRunning = false;
  private checkTimer: ReturnType<typeof setInterval> | null = null;
  
  constructor(config: Partial<AutonomousConfig> = {}) {
    this.config = {
      enableAutoDecomposition: true,
      enableAutoProgressTracking: true,
      enableAutoRiskResponse: true,
      enableAutoCoordination: true,
      checkIntervalMinutes: 30,
      riskThreshold: 0.6,
      ...config
    };
    
    // 初始化协作管理器
    const bus = globalMessageBus;
    this.collabManager = new CollaborationManager(bus);
    this.initializeAgents();
  }
  
  private initializeAgents() {
    const bus = globalMessageBus;
    
    const pmAgent = new ProjectManagerAgent('pm_auto', bus);
    const devMCAL = new DeveloperAgent('dev_auto_mcal', 'MCAL开发Agent', bus, ['C', 'MCAL']);
    const devAlgo = new DeveloperAgent('dev_auto_algo', '算法开发Agent', bus, ['C', '算法']);
    const testAgent = new TesterAgent('test_auto', '测试Agent', bus);
    const resourceAgent = new ResourceSchedulerAgent('res_auto', bus);
    const riskAgent = new RiskMonitorAgent('risk_auto', bus);
    
    [pmAgent, devMCAL, devAlgo, testAgent, resourceAgent, riskAgent].forEach(a => {
      this.collabManager.registerAgent(a);
    });
  }
  
  // ========== 启动/停止自主执行 ==========
  
  start(projectId: string) {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.log('system', '自主执行引擎已启动', 'success', { projectId });
    
    // 立即执行一次全面检查
    this.executeFullCycle(projectId);
    
    // 设置定时检查
    this.checkTimer = setInterval(() => {
      this.executeFullCycle(projectId);
    }, this.config.checkIntervalMinutes * 60 * 1000);
  }
  
  stop() {
    this.isRunning = false;
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
    this.log('system', '自主执行引擎已停止', 'success', {});
  }
  
  // ========== 核心执行循环 ==========
  
  private async executeFullCycle(projectId: string) {
    if (!this.isRunning) return;
    
    console.log('🤖 Level 10: 执行自主管理周期...');
    
    try {
      // 1. 加载项目数据
      const context = await this.loadProjectContext(projectId);
      
      // 2. 自动任务分解
      if (this.config.enableAutoDecomposition) {
        await this.autoDecomposeTasks(context);
      }
      
      // 3. 自动进度跟踪
      if (this.config.enableAutoProgressTracking) {
        await this.autoTrackProgress(context);
      }
      
      // 4. 自动风险应对
      if (this.config.enableAutoRiskResponse) {
        await this.autoRespondToRisks(context);
      }
      
      // 5. 自动团队协调
      if (this.config.enableAutoCoordination) {
        await this.autoCoordinateTeam(context);
      }
      
      this.log('coordination', '自主管理周期完成', 'success', {
        taskCount: context.tasks.length
      });
      
    } catch (error) {
      this.log('system', '执行周期出错', 'error', { error: String(error) });
    }
  }
  
  // ========== 1. 自动任务分解 ==========
  
  private async autoDecomposeTasks(context: GanttContext) {
    // 找出需要分解的大任务（工期>20天且没有子任务）
    const largeTasks = context.tasks.filter(t => {
      if (!t.startDateTime || !t.dueDateTime) return false;
      const duration = (t.dueDateTime.getTime() - t.startDateTime.getTime()) / (24 * 60 * 60 * 1000);
      return duration > 20 && !t.checklist;
    });
    
    for (const task of largeTasks) {
      const decomposition = await this.decomposeTask(task);
      
      if (decomposition.subtasks.length > 1) {
        this.log('decomposition', `任务 "${task.title}" 已自动分解`, 'success', {
          taskId: task.id,
          subtaskCount: decomposition.subtasks.length
        });
        
        // 在实际应用中，这里会创建子任务
        console.log(`   📋 分解 "${task.title}" 为 ${decomposition.subtasks.length} 个子任务`);
      }
    }
  }
  
  private async decomposeTask(task: Task): Promise<DecomposedTask> {
    const title = task.title.toLowerCase();
    const subtasks: Task[] = [];
    
    // 基于任务类型智能分解
    if (title.includes('esc') || title.includes('算法')) {
      // ESC算法开发分解
      subtasks.push(
        { ...task, id: `${task.id}_1`, title: `${task.title} - 需求分析`, dueDateTime: new Date(task.startDateTime!.getTime() + 3 * 24 * 60 * 60 * 1000) } as Task,
        { ...task, id: `${task.id}_2`, title: `${task.title} - 方案设计`, dueDateTime: new Date(task.startDateTime!.getTime() + 7 * 24 * 60 * 60 * 1000) } as Task,
        { ...task, id: `${task.id}_3`, title: `${task.title} - 代码实现`, dueDateTime: new Date(task.startDateTime!.getTime() + 18 * 24 * 60 * 60 * 1000) } as Task,
        { ...task, id: `${task.id}_4`, title: `${task.title} - 单元测试`, dueDateTime: task.dueDateTime } as Task
      );
    } else if (title.includes('硬件') || title.includes('控制器')) {
      // 硬件开发分解
      subtasks.push(
        { ...task, id: `${task.id}_1`, title: `${task.title} - 原理图设计` } as Task,
        { ...task, id: `${task.id}_2`, title: `${task.title} - PCB布局` } as Task,
        { ...task, id: `${task.id}_3`, title: `${task.title} - 打板验证` } as Task,
        { ...task, id: `${task.id}_4`, title: `${task.title} - 调试优化` } as Task
      );
    }
    
    return {
      originalTask: task,
      subtasks,
      estimatedTotalDays: subtasks.length * 5,
      dependencies: []
    };
  }
  
  // ========== 2. 自动进度跟踪 ==========
  
  private async autoTrackProgress(context: GanttContext) {
    // 预测分析
    const predictions = predictiveEngine.predictProject(context);
    
    // 识别可能延期的任务
    const atRiskTasks = predictions.filter(p => p.onTimeProbability < 60);
    
    for (const prediction of atRiskTasks) {
      const task = context.tasks.find(t => t.id === prediction.taskId);
      if (!task) continue;
      
      // 自动更新风险标记
      if (prediction.predictedDelay > 3) {
        this.log('tracking', `任务 "${task.title}" 预测延期 ${prediction.predictedDelay} 天`, 'warning', {
          taskId: task.id,
          predictedDelay: prediction.predictedDelay,
          probability: prediction.onTimeProbability
        });
      }
    }
  }
  
  // ========== 3. 自动风险应对 ==========
  
  private async autoRespondToRisks(context: GanttContext) {
    // 运行自适应调整检测
    const adaptiveResult = await adaptiveEngine.runAdaptiveCycle(context.tasks, context, {
      autoApply: false
    });
    
    if (adaptiveResult.detected) {
      this.log('risk', `检测到 ${adaptiveResult.delays.length} 个延期`, 'warning', {
        delays: adaptiveResult.delays.map(d => ({
          task: d.taskName,
          days: d.delayDays
        }))
      });
      
      // 自动选择最佳方案
      if (adaptiveResult.plans.length > 0) {
        const bestPlan = adaptiveResult.plans[0];
        
        this.log('decision', `自动推荐方案: ${bestPlan.name}`, 'success', {
          plan: bestPlan.name,
          timeSave: bestPlan.impact.timeSave,
          recommendation: bestPlan.recommendation
        });
        
        // 高风险时自动应用方案
        const hasCritical = adaptiveResult.delays.some(d => d.severity === 'critical');
        if (hasCritical && this.config.enableAutoRiskResponse) {
          console.log(`   ⚡ 检测到严重延期，准备自动应用 "${bestPlan.name}"`);
          // await adaptiveEngine.applyAdjustment(context, bestPlan.type);
        }
      }
    }
  }
  
  // ========== 4. 自动团队协调 ==========
  
  private async autoCoordinateTeam(context: GanttContext) {
    // 运行每日站会
    const standupReport = await this.collabManager.runDailyStandup();
    
    const blockedAgents = standupReport.reports.filter(r => r.blockers !== '无');
    
    if (blockedAgents.length > 0) {
      this.log('coordination', `${blockedAgents.length} 位Agent遇到阻塞，正在协调资源`, 'warning', {
        blockedAgents: blockedAgents.map(a => a.agentName)
      });
      
      // 自动分配资源解决阻塞
      for (const agent of blockedAgents) {
        console.log(`   🔧 协调资源帮助 ${agent.agentName} 解决: ${agent.blockers}`);
      }
    }
    
    // 检查资源负载
    const resourcePrediction = predictiveEngine.predictResourceNeeds(context);
    const shortages = resourcePrediction.filter(r => r.shortage > 0);
    
    if (shortages.length > 0) {
      this.log('coordination', `检测到资源短缺，建议增加人员`, 'warning', {
        shortages: shortages.map(s => ({
          role: s.role,
          need: s.predictedNeed,
          current: s.currentCount
        }))
      });
    }
  }
  
  // ========== 辅助方法 ==========
  
  private async loadProjectContext(projectId: string): Promise<GanttContext> {
    const tasks = await db.getTasksByProject(projectId);
    const buckets = await db.getAllBuckets();
    
    return {
      projectId,
      tasks,
      buckets
    };
  }
  
  private log(
    type: ExecutionLog['type'],
    description: string,
    result: ExecutionLog['result'],
    details: any
  ) {
    const log: ExecutionLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date(),
      type,
      description,
      action: type,
      result,
      details
    };
    
    this.logs.push(log);
    
    // 限制日志数量
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(-100);
    }
    
    // 控制台输出
    const emoji = { success: '✅', warning: '⚠️', error: '❌' }[result];
    console.log(`   ${emoji} [${type}] ${description}`);
  }
  
  // ========== 公共 API ==========
  
  getLogs(type?: ExecutionLog['type'], limit: number = 50): ExecutionLog[] {
    let filtered = this.logs;
    if (type) {
      filtered = filtered.filter(l => l.type === type);
    }
    return filtered.slice(-limit).reverse();
  }
  
  getStatus() {
    return {
      isRunning: this.isRunning,
      config: this.config,
      logCount: this.logs.length,
      lastLog: this.logs[this.logs.length - 1]
    };
  }
  
  updateConfig(newConfig: Partial<AutonomousConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.log('system', '配置已更新', 'success', this.config);
  }
}

// 导出单例
export const autonomousEngine = new AutonomousExecutionEngine();
