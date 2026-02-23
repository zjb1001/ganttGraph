/**
 * 颜色常量和工具
 * Modern Design System
 */

// 任务优先级颜色
export const PRIORITY_COLORS = {
  Urgent: '#ef4444',
  Important: '#f59e0b',
  Normal: '#2563eb',
  Low: '#94a3b8'
} as const

// 任务状态颜色
export const STATUS_COLORS = {
  NotStarted: '#94a3b8',
  InProgress: '#2563eb',
  Completed: '#16a34a'
} as const

// 分组颜色 (类似 Planner 的 Bucket 颜色)
export const BUCKET_COLORS = [
  '#a19f9d', // 灰色
  '#0078d4', // 蓝色
  '#107c10', // 绿色
  '#d83b01', // 橙色
  '#5c2d91', // 紫色
  '#008272', // 青色
  '#e81123', // 红色
  '#ffb900', // 黄色
  '#f2c811', // 金色
  '#8764b8'  // 紫罗兰
] as const

// 标签颜色
export const LABEL_COLORS = [
  '#ff8c00', // 橙色
  '#0078d4', // 蓝色
  '#107c10', // 绿色
  '#d13438', // 红色
  '#5c2d91', // 紫色
  '#008272', // 青色
  '#e81123', // 深红
  '#ffb900', // 黄色
  '#8b4726', // 棕色
  '#737373', // 深灰
  '#ff4c4c', // 浅红
  '#4c5fff', // 靛蓝
  '#00d27a', // 浅绿
  '#ff8fab', // 粉色
  '#c239b3'  // 玫红
] as const

// 主题颜色
export const THEME_COLORS = {
  primary: '#0078d4',
  background: '#f3f2f1',
  surface: '#ffffff',
  border: '#e1dfdd',
  text: '#323130',
  textSecondary: '#605e5c',
  textTertiary: '#a19f9d'
} as const

/**
 * 根据颜色获取对比色 (用于文字颜色)
 */
export function getContrastColor(backgroundColor: string): string {
  const hex = backgroundColor.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)

  // 计算亮度
  const brightness = (r * 299 + g * 587 + b * 114) / 1000

  return brightness > 128 ? '#000000' : '#ffffff'
}
