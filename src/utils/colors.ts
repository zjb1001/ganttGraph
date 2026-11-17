/**
 * 颜色常量和工具
 * 统一色板：所有颜色均为中高明度饱和色，白字对比度 ≥ 4.5:1，
 * 可直接作为任务条底色；浅底场景用 inkColor()/tint() 派生。
 */

export interface PaletteColor {
  name: string
  hex: string
}

// 主色板（任务 / 分组 / 里程碑共用，保证全局配色协调）
export const PALETTE: readonly PaletteColor[] = [
  { name: 'Blue', hex: '#2563eb' },
  { name: 'Indigo', hex: '#4f46e5' },
  { name: 'Violet', hex: '#7c3aed' },
  { name: 'Teal', hex: '#0f766e' },
  { name: 'Cyan', hex: '#0e7490' },
  { name: 'Green', hex: '#15803d' },
  { name: 'Amber', hex: '#b45309' },
  { name: 'Orange', hex: '#c2410c' },
  { name: 'Rose', hex: '#be123c' },
  { name: 'Slate', hex: '#64748b' },
] as const

// 任务默认颜色
export const DEFAULT_TASK_COLOR = '#2563eb'
// 里程碑分组默认颜色
export const DEFAULT_MILESTONE_COLOR = '#c2410c'

// 里程碑标签字号范围（px）
export const MILESTONE_FONT_MIN = 10
export const MILESTONE_FONT_MAX = 18
export const MILESTONE_FONT_DEFAULT = 12

// 任务预设颜色（供用户选择）
export const TASK_COLORS = PALETTE.map((c) => c.hex)

// 分组颜色
export const BUCKET_COLORS = TASK_COLORS

// 任务优先级颜色
export const PRIORITY_COLORS = {
  Urgent: '#dc2626',
  Important: '#d97706',
  Normal: '#2563eb',
  Low: '#94a3b8'
} as const

// 任务状态颜色
export const STATUS_COLORS = {
  NotStarted: '#94a3b8',
  InProgress: '#2563eb',
  Completed: '#16a34a'
} as const

// 标签颜色
export const LABEL_COLORS = [
  ...TASK_COLORS,
  '#a16207', // 棕
  '#db2777', // 粉
  '#65a30d', // 草绿
  '#0284c7', // 天蓝
  '#9333ea'  // 紫红
] as const

// 甘特图 SVG 等无法使用 CSS 变量处的颜色
export const GANTT_COLORS = {
  dependency: '#64748b',
  dependencyViolated: '#dc2626',
  lagBadge: '#475569',
} as const

// 主题颜色
export const THEME_COLORS = {
  primary: '#2563eb',
  background: '#f8fafc',
  surface: '#ffffff',
  border: '#e2e8f0',
  text: '#1e293b',
  textSecondary: '#64748b',
  textTertiary: '#94a3b8'
} as const

/**
 * 旧版（Fluent 风格）色板 → 新色板映射。
 * 历史数据里存的旧颜色在渲染时自动换成协调的新色，不改动数据库。
 */
const LEGACY_COLOR_MAP: Record<string, string> = {
  '#0078d4': '#2563eb',
  '#107c10': '#15803d',
  '#d83b01': '#c2410c',
  '#e81123': '#be123c',
  '#d13438': '#be123c',
  '#5c2d91': '#7c3aed',
  '#8764b8': '#4f46e5',
  '#008272': '#0f766e',
  '#a19f9d': '#64748b',
  '#ffb900': '#b45309',
  '#f2c811': '#b45309',
  '#ff8c00': '#c2410c',
}

const HEX_RE = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i

function parseHex(hex: string): [number, number, number] | null {
  const m = HEX_RE.exec(hex.trim())
  if (!m) return null
  let h = m[1]
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

function toHex([r, g, b]: [number, number, number]): string {
  return '#' + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')
}

/** 把存储的颜色解析为最终显示色：空值用兜底色，旧色板颜色映射到新色板 */
export function resolveColor(color: string | undefined | null, fallback: string = DEFAULT_TASK_COLOR): string {
  if (!color || !parseHex(color)) return fallback
  const key = color.toLowerCase()
  return LEGACY_COLOR_MAP[key] || key
}

/** WCAG 相对亮度 */
export function relativeLuminance(hex: string): number {
  const rgb = parseHex(hex)
  if (!rgb) return 0
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG 对比度 */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/** 半透明色（浅底背景用），返回 rgba() —— 不用 color-mix 以兼容 html2canvas 导出 */
export function tint(hex: string, alpha: number): string {
  const rgb = parseHex(hex) || [100, 116, 139]
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`
}

/**
 * 白底上可读的"墨水色"：在保持色相的前提下逐步加深，直到对白底对比度 ≥ minRatio。
 * 用于里程碑标签、分组名等彩色文字，避免黄色/浅色分组文字看不清。
 */
export function inkColor(hex: string, minRatio = 4.5): string {
  let rgb = parseHex(hex)
  if (!rgb) return THEME_COLORS.text
  for (let i = 0; i < 20 && contrastRatio(toHex(rgb), '#ffffff') < minRatio; i++) {
    rgb = rgb.map((v) => v * 0.88) as [number, number, number]
  }
  return toHex(rgb)
}

/** 彩色背景上的文字颜色：白字或深色字，取对比度更高者 */
export function getContrastColor(backgroundColor: string): string {
  const dark = THEME_COLORS.text
  return contrastRatio(backgroundColor, '#ffffff') >= contrastRatio(backgroundColor, dark) ? '#ffffff' : dark
}

/** 新建分组时按顺序轮换色板，避免所有分组同色 */
export function nextPaletteColor(index: number): string {
  return PALETTE[((index % PALETTE.length) + PALETTE.length) % PALETTE.length].hex
}
