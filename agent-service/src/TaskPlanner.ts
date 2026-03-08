/**
 * 甘特图 Agent - Level 2 扩展
 * 任务规划功能：依赖分析、自动排期、关键路径
 */

import { Task, GanttContext } from '@/types';

export interface TaskDependency {
  taskId: string;
  dependsOn: string[];  // 依赖的任务ID列表
}

export interface ScheduleResult {
  scheduledTasks: Task[];
  criticalPath: string[];  // 关键路径上的任务ID
  totalDuration: number;   // 总工期（天）
  risks: RiskItem[];       // 风险项
}

export interface RiskItem {
  taskId: string;
  riskType: 'delay' | 'resource' | 'dependency';
  severity: 'low' | 'medium' | 'high';
  message: string;
}

/**
 * 任务依赖分析器
 */
export class DependencyAnalyzer {
  getDependencyId(dep: NonNullable<Task['dependencies']>[number]): string {
    return typeof dep === 'string' ? dep : dep.taskId;
  }

  /**
   * 构建依赖图
   */
  buildDependencyGraph(tasks: Task[]): Map<string, Set<string>> {
    const graph = new Map<string, Set<string>>();
    
    // 初始化所有任务节点
    tasks.forEach(task => {
      graph.set(task.id, new Set());
    });
    
    // 添加依赖边
    tasks.forEach(task => {
      if (task.dependencies) {
        task.dependencies.forEach(dep => {
          const depId = this.getDependencyId(dep);
          // 检查依赖任务是否存在
          if (graph.has(depId)) {
            graph.get(task.id)!.add(depId);
          }
        });
      }
    });
    
    return graph;
  }
  
  /**
   * 检测循环依赖
   */
  detectCircularDependency(tasks: Task[]): string[][] {
    const graph = this.buildDependencyGraph(tasks);
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    const dfs = (node: string, path: string[]) => {
      if (recursionStack.has(node)) {
        // 发现循环
        const cycleStart = path.indexOf(node);
        cycles.push([...path.slice(cycleStart), node]);
        return;
      }
      
      if (visited.has(node)) return;
      
      visited.add(node);
      recursionStack.add(node);
      path.push(node);
      
      const dependencies = graph.get(node) || new Set();
      dependencies.forEach(dep => {
        dfs(dep, [...path]);
      });
      
      recursionStack.delete(node);
    };
    
    tasks.forEach(task => {
      if (!visited.has(task.id)) {
        dfs(task.id, []);
      }
    });
    
    return cycles;
  }
  
  /**
   * 获取任务的直接依赖
   */
  getDirectDependencies(taskId: string, tasks: Task[]): Task[] {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.dependencies) return [];
    
    return task.dependencies
      .map(dep => tasks.find(t => t.id === this.getDependencyId(dep)))
      .filter((t): t is Task => t !== undefined);
  }
  
  /**
   * 获取所有前置任务（递归）
   */
  getAllPredecessors(taskId: string, tasks: Task[]): Task[] {
    const predecessors: Task[] = [];
    const visited = new Set<string>();
    
    const collect = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);
      
      const deps = this.getDirectDependencies(id, tasks);
      deps.forEach(dep => {
        predecessors.push(dep);
        collect(dep.id);
      });
    };
    
    collect(taskId);
    return predecessors;
  }
}

/**
 * 自动排期引擎
 */
export class ScheduleEngine {
  private analyzer = new DependencyAnalyzer();
  
  /**
   * 拓扑排序（Kahn算法）
   */
  topologicalSort(tasks: Task[]): Task[] {
    const graph = this.analyzer.buildDependencyGraph(tasks);
    const inDegree = new Map<string, number>();
    
    // 计算入度
    tasks.forEach(task => {
      inDegree.set(task.id, graph.get(task.id)!.size);
    });
    
    const queue: string[] = [];
    const result: Task[] = [];
    
    // 找到所有入度为0的节点
    tasks.forEach(task => {
      if (inDegree.get(task.id) === 0) {
        queue.push(task.id);
      }
    });
    
    while (queue.length > 0) {
      const taskId = queue.shift()!;
      const task = tasks.find(t => t.id === taskId)!;
      result.push(task);
      
      // 更新依赖此任务的其他任务的入度
      tasks.forEach(t => {
        if (t.dependencies?.includes(taskId)) {
          const newDegree = inDegree.get(t.id)! - 1;
          inDegree.set(t.id, newDegree);
          if (newDegree === 0) {
            queue.push(t.id);
          }
        }
      });
    }
    
    return result;
  }
  
  /**
   * 自动排期
   */
  autoSchedule(tasks: Task[], projectStartDate: Date): ScheduleResult {
    const sortedTasks = this.topologicalSort(tasks);
    const scheduledTasks: Task[] = [];
    const taskEndDates = new Map<string, Date>();
    const risks: RiskItem[] = [];
    
    sortedTasks.forEach(task => {
      const newTask = { ...task };
      
      // 计算最早开始时间（基于依赖）
      let earliestStart = new Date(projectStartDate);
      
      if (task.dependencies && task.dependencies.length > 0) {
        const depEndDates = task.dependencies
          .map(dep => taskEndDates.get(this.analyzer.getDependencyId(dep)))
          .filter((d): d is Date => d !== undefined);
        
        if (depEndDates.length > 0) {
          const maxDepEnd = new Date(Math.max(...depEndDates.map(d => d.getTime())));
          earliestStart = new Date(maxDepEnd.getTime() + 24 * 60 * 60 * 1000); // 次日
        }
      }
      
      // 如果任务已有开始日期，取较晚者
      if (task.startDate) {
        const taskStart = new Date(task.startDate);
        if (taskStart > earliestStart) {
          earliestStart = taskStart;
        }
      }
      
      newTask.startDate = earliestStart;
      
      // 计算结束日期
      const duration = this.calculateDuration(task);
      const endDate = new Date(earliestStart.getTime() + duration * 24 * 60 * 60 * 1000);
      newTask.dueDateTime = endDate;
      
      taskEndDates.set(task.id, endDate);
      scheduledTasks.push(newTask);
      
      // 检查延期风险
      if (task.dueDateTime && endDate > new Date(task.dueDateTime)) {
        risks.push({
          taskId: task.id,
          riskType: 'delay',
          severity: 'high',
          message: `任务延期风险：计划完成时间 ${endDate.toISOString().split('T')[0]} 超过原定截止时间`
        });
      }
    });
    
    // 计算关键路径
    const criticalPath = this.calculateCriticalPath(scheduledTasks);
    
    // 计算总工期
    const totalDuration = this.calculateTotalDuration(scheduledTasks, projectStartDate);
    
    return {
      scheduledTasks,
      criticalPath,
      totalDuration,
      risks
    };
  }
  
  /**
   * 计算任务工期（天）
   */
  private calculateDuration(task: Task): number {
    if (task.startDate && task.dueDateTime) {
      const start = new Date(task.startDate).getTime();
      const end = new Date(task.dueDateTime).getTime();
      return Math.max(1, Math.ceil((end - start) / (24 * 60 * 60 * 1000)));
    }
    return 1; // 默认1天
  }
  
  /**
   * 计算关键路径
   */
  private calculateCriticalPath(tasks: Task[]): string[] {
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const earliestStart = new Map<string, number>();
    const earliestFinish = new Map<string, number>();
    
    // 前向遍历：计算最早开始和完成时间
    tasks.forEach(task => {
      let es = 0;
      
      if (task.dependencies) {
        task.dependencies.forEach(dep => {
          const depId = this.analyzer.getDependencyId(dep);
          const depFinish = earliestFinish.get(depId) || 0;
          es = Math.max(es, depFinish);
        });
      }
      
      const duration = this.calculateDuration(task);
      const ef = es + duration;
      
      earliestStart.set(task.id, es);
      earliestFinish.set(task.id, ef);
    });
    
    // 找出总工期最长的路径（简化版）
    const path: string[] = [];
    let currentTask = tasks.reduce((max, task) => 
      (earliestFinish.get(task.id) || 0) > (earliestFinish.get(max.id) || 0) ? task : max
    );
    
    // 回溯关键路径
    const visited = new Set<string>();
    while (currentTask && !visited.has(currentTask.id)) {
      path.unshift(currentTask.id);
      visited.add(currentTask.id);
      
      // 找到前置任务中完成时间最晚的
      if (currentTask.dependencies && currentTask.dependencies.length > 0) {
        currentTask = currentTask.dependencies
          .map(dep => taskMap.get(this.analyzer.getDependencyId(dep)))
          .filter((t): t is Task => t !== undefined)
          .reduce((max, task) => 
            (earliestFinish.get(task.id) || 0) > (earliestFinish.get(max?.id) || 0) ? task : max
          , currentTask);
      } else {
        break;
      }
    }
    
    return path;
  }
  
  /**
   * 计算总工期
   */
  private calculateTotalDuration(tasks: Task[], projectStart: Date): number {
    if (tasks.length === 0) return 0;
    
    const lastTask = tasks.reduce((latest, task) => {
      const taskEnd = task.dueDateTime ? new Date(task.dueDateTime).getTime() : 0;
      const latestEnd = latest.dueDateTime ? new Date(latest.dueDateTime).getTime() : 0;
      return taskEnd > latestEnd ? task : latest;
    });
    
    const projectStartTime = projectStart.getTime();
    const projectEndTime = lastTask.dueDateTime ? new Date(lastTask.dueDateTime).getTime() : projectStartTime;
    
    return Math.ceil((projectEndTime - projectStartTime) / (24 * 60 * 60 * 1000));
  }
}

/**
 * 风险预警器
 */
export class RiskMonitor {
  /**
   * 检查延期风险
   */
  checkDelayRisks(tasks: Task[]): RiskItem[] {
    const risks: RiskItem[] = [];
    const now = new Date();
    
    tasks.forEach(task => {
      if (task.status === 'Completed') return;
      
      const dueDate = task.dueDateTime ? new Date(task.dueDateTime) : null;
      if (!dueDate) return;
      
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      const progress = task.completedPercent || 0;
      
      // 简单判断：剩余时间少于工期的一半，且进度落后
      const duration = this.getTaskDuration(task);
      const expectedProgress = Math.max(0, 100 - (daysUntilDue / duration) * 100);
      
      if (daysUntilDue < 3 && progress < 80) {
        risks.push({
          taskId: task.id,
          riskType: 'delay',
          severity: daysUntilDue < 1 ? 'high' : 'medium',
          message: `任务即将到期（${daysUntilDue}天），当前进度${progress}%`
        });
      } else if (progress < expectedProgress - 20) {
        risks.push({
          taskId: task.id,
          riskType: 'delay',
          severity: 'medium',
          message: `任务进度落后：当前${progress}%，预期${Math.round(expectedProgress)}%`
        });
      }
    });
    
    return risks;
  }
  
  /**
   * 检查资源冲突（简化版）
   */
  checkResourceConflicts(tasks: Task[]): RiskItem[] {
    const risks: RiskItem[] = [];
    
    // 按时间窗口分组检查
    const timeWindows = this.groupTasksByTimeWindow(tasks);
    
    timeWindows.forEach((windowTasks, windowKey) => {
      if (windowTasks.length > 5) { // 假设同一时间段最多5个任务
        risks.push({
          taskId: windowTasks[0].id,
          riskType: 'resource',
          severity: 'medium',
          message: `${windowKey}时间段任务过多（${windowTasks.length}个），可能存在资源冲突`
        });
      }
    });
    
    return risks;
  }
  
  private getTaskDuration(task: Task): number {
    if (task.startDate && task.dueDateTime) {
      return Math.max(1, Math.ceil(
        (new Date(task.dueDateTime).getTime() - new Date(task.startDate).getTime()) / 
        (24 * 60 * 60 * 1000)
      ));
    }
    return 7; // 默认1周
  }
  
  private groupTasksByTimeWindow(tasks: Task[]): Map<string, Task[]> {
    const windows = new Map<string, Task[]>();
    
    tasks.forEach(task => {
      if (!task.startDate) return;
      
      const start = new Date(task.startDate);
      const weekKey = `${start.getFullYear()}-W${this.getWeekNumber(start)}`;
      
      if (!windows.has(weekKey)) {
        windows.set(weekKey, []);
      }
      windows.get(weekKey)!.push(task);
    });
    
    return windows;
  }
  
  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }
}

// 导出组合使用类
export class TaskPlanner {
  analyzer = new DependencyAnalyzer();
  scheduler = new ScheduleEngine();
  monitor = new RiskMonitor();
  
  /**
   * 完整的任务规划流程
   */
  plan(tasks: Task[], projectStartDate: Date) {
    // 1. 检查依赖
    const cycles = this.analyzer.detectCircularDependency(tasks);
    if (cycles.length > 0) {
      throw new Error(`发现循环依赖: ${cycles.map(c => c.join(' -> ')).join(', ')}`);
    }
    
    // 2. 自动排期
    const schedule = this.scheduler.autoSchedule(tasks, projectStartDate);
    
    // 3. 风险检查
    const delayRisks = this.monitor.checkDelayRisks(schedule.scheduledTasks);
    const resourceRisks = this.monitor.checkResourceConflicts(schedule.scheduledTasks);
    
    return {
      ...schedule,
      risks: [...schedule.risks, ...delayRisks, ...resourceRisks]
    };
  }
}
