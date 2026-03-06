/**
 * Enhanced AI Service API
 * 增强版AI服务前端集成
 * 
 * 功能：
 * - 智能任务分解
 * - 风险分析
 * - 进度预测
 * - 资源冲突检测
 */

import type { Task, Bucket } from '@/types';

const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000';

// ===============================
// Types
// ===============================

export interface DecomposeRequest {
  goal: string;
  start_date: string;
  deadline?: string;
  team_size: number;
  complexity: 'low' | 'medium' | 'high';
}

export interface DecomposeResponse {
  success: boolean;
  message: string;
  phases: PhaseInfo[];
  tasks: DecomposedTask[];
  milestones: MilestoneInfo[];
  estimated_duration_days: number;
  confidence: number;
}

export interface PhaseInfo {
  name: string;
  description: string;
  order: number;
}

export interface DecomposedTask {
  title: string;
  phase: string;
  duration_days: number;
  priority: string;
  start_date: string;
  end_date: string;
  dependencies?: string[];
  assignee_role?: string;
}

export interface MilestoneInfo {
  title: string;
  date_offset_days: number;
  description?: string;
}

export interface Risk {
  task_id: string;
  task_title: string;
  risk_type: string;
  level: 'none' | 'low' | 'medium' | 'high' | 'critical';
  description: string;
  suggestion: string;
  impact_days: number;
}

export interface RiskAnalysisResponse {
  success: boolean;
  message: string;
  risks: Risk[];
  overall_risk_level: string;
  risk_summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  recommendations: string[];
}

export interface SchedulePrediction {
  predicted_end_date: string;
  confidence: number;
  delay_probability: number;
  estimated_delay_days: number;
  critical_factors: string[];
}

export interface Bottleneck {
  task_id: string;
  task_title: string;
  type: string;
  impact: string;
  severity: string;
}

export interface SchedulePredictionResponse {
  success: boolean;
  message: string;
  prediction: SchedulePrediction;
  critical_path: string[];
  bottlenecks: Bottleneck[];
  suggestions: string[];
}

export interface ResourceConflict {
  type: string;
  resource: string;
  task1: string;
  task2: string;
  overlap_days: number;
  severity: string;
}

export interface ResourceAnalysisResponse {
  success: boolean;
  message: string;
  conflicts: ResourceConflict[];
  resource_utilization: Record<string, number>;
  suggestions: string[];
}

export interface AIChatResponse {
  success: boolean;
  message: string;
  intent: string;
  actions: AgentAction[];
  analysis?: {
    overall_risk?: string;
    risk_count?: number;
    prediction?: SchedulePrediction;
    critical_path?: string[];
    bottlenecks?: Bottleneck[];
    recommendations?: string[];
  };
}

export interface AgentAction {
  type: string;
  params: Record<string, any>;
  description: string;
  requiresConfirmation?: boolean;
}

// ===============================
// API Functions
// ===============================

/**
 * 智能任务分解
 * 将项目目标分解为结构化任务计划
 */
export async function decomposeProject(
  goal: string,
  options: Partial<Omit<DecomposeRequest, 'goal'>> = {}
): Promise<DecomposeResponse> {
  const request: DecomposeRequest = {
    goal,
    start_date: new Date().toISOString().split('T')[0],
    team_size: 3,
    complexity: 'medium',
    ...options
  };

  const response = await fetch(`${AI_SERVICE_URL}/api/v2/decompose`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    throw new Error(`Decomposition failed: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * 分析项目风险
 */
export async function analyzeProjectRisks(
  tasks: Task[],
  options: { 
    currentDate?: string;
    checkDependencies?: boolean;
    checkResources?: boolean;
    checkSchedule?: boolean;
  } = {}
): Promise<RiskAnalysisResponse> {
  const request = {
    tasks: tasks.map(t => ({
      id: t.id,
      title: t.title,
      startDate: t.startDateTime,
      dueDate: t.dueDateTime,
      progress: t.completedPercent || 0,
      status: t.status,
      priority: t.priority,
      dependencies: t.dependencies || [],
      assigneeIds: t.assigneeIds || []
    })),
    current_date: options.currentDate || new Date().toISOString().split('T')[0],
    check_dependencies: options.checkDependencies !== false,
    check_resources: options.checkResources !== false,
    check_schedule: options.checkSchedule !== false
  };

  const response = await fetch(`${AI_SERVICE_URL}/api/v2/analyze-risks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    throw new Error(`Risk analysis failed: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * 预测项目进度
 */
export async function predictSchedule(
  tasks: Task[],
  currentDate?: string
): Promise<SchedulePredictionResponse> {
  const request = {
    tasks: tasks.map(t => ({
      id: t.id,
      title: t.title,
      startDate: t.startDateTime,
      dueDate: t.dueDateTime,
      progress: t.completedPercent || 0,
      status: t.status,
      priority: t.priority,
      dependencies: t.dependencies || []
    })),
    current_date: currentDate || new Date().toISOString().split('T')[0]
  };

  const response = await fetch(`${AI_SERVICE_URL}/api/v2/predict-schedule`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    throw new Error(`Schedule prediction failed: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * 分析资源冲突
 */
export async function analyzeResources(
  tasks: Task[]
): Promise<ResourceAnalysisResponse> {
  const request = {
    tasks: tasks.map(t => ({
      id: t.id,
      title: t.title,
      startDate: t.startDateTime,
      dueDate: t.dueDateTime,
      assigneeIds: t.assigneeIds || [],
    }))
  };

  const response = await fetch(`${AI_SERVICE_URL}/api/v2/analyze-resources`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    throw new Error(`Resource analysis failed: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * 统一对话接口
 * 自然语言交互，自动识别意图
 */
export async function chatWithAI(
  message: string,
  context?: {
    tasks?: Task[];
    buckets?: Bucket[];
    currentProject?: string;
  }
): Promise<AIChatResponse> {
  const request = {
    message,
    context: {
      tasks: context?.tasks?.map(t => ({
        id: t.id,
        title: t.title,
        startDate: t.startDateTime,
        dueDate: t.dueDateTime,
        progress: t.completedPercent || 0,
        status: t.status,
        priority: t.priority
      })),
      buckets: context?.buckets?.map(b => ({
        id: b.id,
        name: b.name,
        bucketType: b.bucketType
      })),
      currentProject: context?.currentProject
    }
  };

  const response = await fetch(`${AI_SERVICE_URL}/api/v2/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    throw new Error(`Chat failed: ${response.statusText}`);
  }

  return await response.json();
}

// ===============================
// Helper Functions
// ===============================

/**
 * 将分解的任务转换为前端任务格式
 */
export function convertDecomposedTasks(
  decomposedTasks: DecomposedTask[],
  projectId: string,
  buckets: Bucket[]
): Array<Partial<Task>> {
  return decomposedTasks.map((task, index) => {
    const bucket = buckets.find(b => b.name === task.phase) || buckets[0];
    
    return {
      projectId,
      bucketId: bucket?.id || '',
      title: task.title,
      description: '',
      taskType: 'task',
      startDateTime: new Date(task.start_date),
      dueDateTime: new Date(task.end_date),
      status: 'NotStarted',
      priority: task.priority as any || 'Normal',
      color: undefined,
      assigneeIds: [],
      labelIds: [],
      order: index + 1
    };
  });
}

/**
 * 获取风险等级颜色
 */
export function getRiskLevelColor(level: string): string {
  switch (level) {
    case 'critical': return '#ff0000';
    case 'high': return '#ff6600';
    case 'medium': return '#ffcc00';
    case 'low': return '#66ccff';
    default: return '#cccccc';
  }
}

/**
 * 获取风险等级文本
 */
export function getRiskLevelText(level: string): string {
  switch (level) {
    case 'critical': return '严重';
    case 'high': return '高';
    case 'medium': return '中';
    case 'low': return '低';
    default: return '无';
  }
}

