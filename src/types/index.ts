// ============================================
// 核心数据模型定义
// ============================================

export type TaskStatus = 'NotStarted' | 'InProgress' | 'Completed'
export type TaskPriority = 'Urgent' | 'Important' | 'Normal' | 'Low'
export type TimeUnit = 'day' | 'week' | 'month' | 'quarter' | 'year'

// 任务类型
export type TaskType = 'task' | 'milestone' | 'summary'

// 用户/负责人
export interface User {
  id: string
  name: string
  email?: string
  avatar?: string
}

// 标签/分类
export interface Label {
  id: string
  name: string
  color: string
  icon?: string
}

// 子任务清单项
export interface ChecklistItem {
  id: string
  title: string
  isCompleted: boolean
}

// 依赖关系（带延迟约束）
export interface Dependency {
  taskId: string   // 被依赖的任务 ID
  lagDays: number  // 延迟天数约束（前序任务完成后需等待的天数）
}

// 相对截止日期约束
export interface DeadlineConstraint {
  refTaskId: string       // 参考节点（里程碑/任务）ID
  offsetWeeks: number     // 偏移周数（负数=之前，正数=之后）
  type: 'before' | 'after' // 在参考节点之前还是之后
}

// 分组/看板
export interface Bucket {
  id: string
  name: string
  order: number
  color?: string
  bucketType?: 'task' | 'milestone'  // 分组类型：普通任务分组 或 里程碑分组
}

// 项目/工作空间
export interface Project {
  id: string
  name: string
  description?: string
  createdAt: Date
  updatedAt: Date
  bucketIds: string[]
}

// 任务对象 (核心)
export interface Task {
  id: string
  projectId: string
  bucketId: string

  // 基本信息
  title: string
  description?: string

  // 任务类型
  taskType: TaskType

  // 时间信息
  startDateTime: Date
  dueDateTime: Date

  // 状态和优先级
  status: TaskStatus
  priority: TaskPriority
  completedPercent?: number

  // 分配和标签
  assigneeIds: string[]
  labelIds: string[]

  // 子任务
  checklist?: ChecklistItem[]

  // 排序
  order: number

  // 依赖关系 (可选)
  dependencyTaskIds?: string[] // 依赖的任务 ID 列表（兼容旧数据）
  dependentTaskIds?: string[] // 被依赖的任务 ID 列表（反向引用）
  dependencies?: Dependency[] // 带延迟约束的依赖列表

  // 相对截止日期约束
  deadlineConstraint?: DeadlineConstraint

  // 元数据
  createdAt: Date
  updatedAt: Date
}

// 视图类型
export type ViewType = 'gantt' | 'board' | 'list'

// 应用状态
export interface AppState {
  currentProjectId: string | null
  currentView: ViewType
  selectedTaskId: string | null
  timeUnit: TimeUnit
}
