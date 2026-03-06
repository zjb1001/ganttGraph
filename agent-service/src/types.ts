/**
 * 严格的类型定义
 * 消除 any，提升代码健壮性
 */

import { Task, GanttContext, AgentAction } from '@/types';

// ========== 工具相关类型 ==========

export interface ToolParams {
  [key: string]: string | number | boolean | string[] | undefined;
}

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export type ToolExecute = (
  params: ToolParams,
  context: GanttContext
) => Promise<ToolResult>;

export interface Tool {
  name: string;
  description: string;
  execute: ToolExecute;
}

// ========== 意图识别类型 ==========

export type IntentType = 
  | 'create_task'
  | 'read_tasks'
  | 'update_task'
  | 'analyze_dependencies'
  | 'auto_schedule'
  | 'check_risks'
  | 'save_project'
  | 'load_project'
  | 'query_history'
  | 'get_stats'
  | 'assess_risks'
  | 'optimize_resources'
  | 'get_suggestions'
  | 'quick_risk_check';

export interface Intent {
  tool: IntentType;
  params: ToolParams;
  confidence: number;
}

// ========== 意图识别规则类型 ==========

export interface IntentRule {
  type: IntentType;
  keywords: string[];
  patterns: RegExp[];
  weight: number;
}

// ========== 错误类型 ==========

export class AgentError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AgentError';
  }
}

export enum ErrorCode {
  TOOL_NOT_FOUND = 'TOOL_NOT_FOUND',
  INVALID_PARAMS = 'INVALID_PARAMS',
  TASK_NOT_FOUND = 'TASK_NOT_FOUND',
  CIRCULAR_DEPENDENCY = 'CIRCULAR_DEPENDENCY',
  STORAGE_ERROR = 'STORAGE_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// ========== 日志类型 ==========

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
}

// ========== 性能监控类型 ==========

export interface PerformanceMetrics {
  toolName: string;
  duration: number;
  success: boolean;
  timestamp: number;
}

// ========== 项目模板类型 ==========

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  tasks: TemplateTask[];
  defaultDependencies: Array<{ from: number; to: number }>;
}

export interface TemplateTask {
  title: string;
  duration: number;
  description: string;
  category: string;
}

// ========== 会话类型 ==========

export interface ConversationTurn {
  id: string;
  timestamp: number;
  role: 'user' | 'agent';
  content: string;
  action?: AgentAction;
  intent?: Intent;
  performance?: PerformanceMetrics;
}

// ========== 导出所有类型 ==========

export * from './SelfOptimizer';
