/**
 * 甘特图 → Excel 导出插件
 *
 * 生成两张工作表：
 *  - Gantt：左侧任务信息 + 右侧按周（时间跨度过长时按月）的单元格甘特条
 *           分组行可在 Excel 中折叠（大纲），冻结表头/信息列，打印横向适配一页宽
 *  - Tasks：平铺明细表（含依赖、描述），带自动筛选，便于二次分析
 *
 * 纯浏览器生成 .xlsx，无需后端；exceljs 体积较大，调用方应动态 import 本模块。
 */
import ExcelJS from 'exceljs'
import type { Task, Bucket, VerticalMarker } from '@/types'
import { resolveColor, DEFAULT_MILESTONE_COLOR, getContrastColor } from './colors'
import { sortTasksInBucket } from './ganttDnd'
import { calendarDaysBetween } from './date'

export interface GanttExportInput {
  projectName: string
  tasks: Task[]
  buckets: Bucket[]
  markers?: VerticalMarker[]
  timelineStart: Date
  timelineEnd: Date
  /** 用于测试注入；默认取当前时间 */
  today?: Date
}

type Unit = 'week' | 'month'

interface TimeColumn {
  start: Date // 含
  end: Date // 含
  label: string
  group: string // 上一级表头（月 / 年）
}

// ── 样式常量（与应用主题一致的中性色） ──
const C = {
  text: 'FF1E293B',
  textMuted: 'FF64748B',
  border: 'FFE2E8F0',
  borderStrong: 'FFCBD5E1',
  headerBg: 'FFF8FAFC',
  today: 'FFDC2626',
  todayBg: 'FFFEF2F2',
  white: 'FFFFFFFF',
}
const FONT = 'Microsoft YaHei'
const INFO_COLS = [
  { key: 'no', header: '#', width: 5 },
  { key: 'title', header: 'Task', width: 34 },
  { key: 'start', header: 'Start', width: 11 },
  { key: 'end', header: 'End', width: 11 },
  { key: 'days', header: 'Days', width: 6 },
  { key: 'progress', header: 'Progress', width: 9 },
  { key: 'status', header: 'Status', width: 11 },
] as const
const HEADER_ROWS = 4 // 标题行、说明行、时间轴上级表头、时间轴表头
const MAX_WEEK_COLUMNS = 160

const argb = (hex: string) => 'FF' + hex.replace('#', '').toUpperCase()

/** 与白色按比例混合，生成浅色（未完成部分的甘特条） */
function lighten(hex: string, amount: number): string {
  const h = hex.replace('#', '')
  const mix = (i: number) => {
    const v = parseInt(h.slice(i, i + 2), 16)
    return Math.round(v + (255 - v) * amount).toString(16).padStart(2, '0')
  }
  return '#' + mix(0) + mix(2) + mix(4)
}

/**
 * exceljs 把 Date 按 UTC 序列化，东八区本地零点会变成前一天。
 * 这里转成"同一日历日的 UTC 零点"，Excel 中显示的日期才与界面一致。
 */
const excelDate = (d: Date) => new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const addDays = (d: Date, n: number) => {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function isoWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** 生成时间轴列：默认按周（周一开始），超过上限自动改为按月 */
export function buildTimeColumns(from: Date, to: Date): { unit: Unit; columns: TimeColumn[] } {
  const start = startOfDay(from)
  const end = startOfDay(to < from ? from : to)
  const weeks: TimeColumn[] = []
  // 回退到所在周的周一
  let cur = addDays(start, -((start.getDay() + 6) % 7))
  while (cur <= end) {
    const wEnd = addDays(cur, 6)
    // 以周四所在月份归属，避免跨月周被归到上个月
    const thursday = addDays(cur, 3)
    weeks.push({
      start: cur,
      end: wEnd,
      label: `W${isoWeek(cur)}`,
      group: `${MONTHS[thursday.getMonth()]} ${thursday.getFullYear()}`,
    })
    cur = addDays(cur, 7)
  }
  if (weeks.length <= MAX_WEEK_COLUMNS) return { unit: 'week', columns: weeks }

  const months: TimeColumn[] = []
  let m = new Date(start.getFullYear(), start.getMonth(), 1)
  while (m <= end) {
    const mEnd = new Date(m.getFullYear(), m.getMonth() + 1, 0)
    months.push({ start: m, end: mEnd, label: MONTHS[m.getMonth()], group: String(m.getFullYear()) })
    m = new Date(m.getFullYear(), m.getMonth() + 1, 1)
  }
  return { unit: 'month', columns: months }
}

const overlaps = (aStart: Date, aEnd: Date, col: TimeColumn) => aStart <= col.end && aEnd >= col.start

const STATUS_LABEL: Record<Task['status'], string> = {
  NotStarted: 'Not started',
  InProgress: 'In progress',
  Completed: 'Completed',
}

/** 按甘特图显示顺序整理：里程碑分组在前，其后普通分组；组内按 order */
function orderedGroups(tasks: Task[], buckets: Bucket[]) {
  const msBuckets = buckets.filter((b) => b.bucketType === 'milestone').sort((a, b) => a.order - b.order)
  const taskBuckets = buckets.filter((b) => b.bucketType !== 'milestone').sort((a, b) => a.order - b.order)
  const known = new Set(buckets.map((b) => b.id))
  const groups = [...msBuckets, ...taskBuckets].map((bucket) => ({
    bucket,
    tasks: sortTasksInBucket(
      tasks.filter((t) =>
        t.bucketId === bucket.id &&
        (bucket.bucketType === 'milestone' ? t.taskType === 'milestone' : t.taskType !== 'milestone'))
    ),
  }))
  // 兜底：引用了不存在分组的任务，导出时不能丢
  const orphans = tasks.filter((t) => !known.has(t.bucketId))
  if (orphans.length) {
    groups.push({
      bucket: { id: '__ungrouped__', projectId: '', name: 'Ungrouped', order: 999, color: '#64748b' },
      tasks: sortTasksInBucket(orphans),
    })
  }
  return groups
}

/**
 * A4 横向可打印宽度约 10.9in（左右边距各 0.3in）≈ 1046px@96dpi；
 * Excel 列宽 1 字符 ≈ 7px + 5px 内边距。返回能放下全部列的缩放百分比（10–100）。
 */
export function printScaleForWidth(totalCharWidth: number): number {
  const px = totalCharWidth * 7 + 5 * (INFO_COLS.length + 1)
  return Math.max(10, Math.min(100, Math.floor((1046 / px) * 100)))
}

const thin = (color = C.border): Partial<ExcelJS.Border> => ({ style: 'thin', color: { argb: color } })

export function buildGanttWorkbook(input: GanttExportInput): ExcelJS.Workbook {
  const { projectName, tasks, buckets, timelineStart, timelineEnd } = input
  const today = startOfDay(input.today ?? new Date())
  const { unit, columns } = buildTimeColumns(timelineStart, timelineEnd)
  const groups = orderedGroups(tasks, buckets)
  const taskById = new Map(tasks.map((t) => [t.id, t]))

  const wb = new ExcelJS.Workbook()
  wb.creator = 'Gantt Graph'
  wb.created = new Date()

  // ════════════════════════ Sheet 1: Gantt ════════════════════════
  const ws = wb.addWorksheet('Gantt', {
    views: [{ state: 'frozen', xSplit: INFO_COLS.length, ySplit: HEADER_ROWS, showGridLines: false, zoomScale: 90 }],
    properties: { defaultRowHeight: 20, outlineLevelRow: 1 },
    // 注意：不能用 fitToPage —— exceljs 会把 <pageSetUpPr> 写在 <outlinePr> 之前（违反 OOXML 顺序），
    // 与下方的大纲设置同时存在时 Excel 拒绝打开文件。改为按列宽计算缩放比例实现"一页宽"。
    pageSetup: {
      orientation: 'landscape',
      paperSize: 9, // A4
      printTitlesRow: `${HEADER_ROWS - 1}:${HEADER_ROWS}`,
      margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 },
    },
    headerFooter: { oddFooter: `&L${projectName}&RPage &P / &N` },
  })
  ws.properties.outlineProperties = { summaryBelow: false, summaryRight: false }

  const firstTimeCol = INFO_COLS.length + 1
  const lastCol = INFO_COLS.length + columns.length
  const timeColWidth = unit === 'week' ? 4.2 : 6
  INFO_COLS.forEach((c, i) => { ws.getColumn(i + 1).width = c.width })
  columns.forEach((_, i) => { ws.getColumn(firstTimeCol + i).width = timeColWidth })
  ws.pageSetup.scale = printScaleForWidth(
    INFO_COLS.reduce((sum, c) => sum + c.width, 0) + columns.length * timeColWidth
  )

  // 行 1：项目标题
  const titleRow = ws.getRow(1)
  titleRow.height = 28
  ws.mergeCells(1, 1, 1, Math.max(INFO_COLS.length, Math.min(lastCol, INFO_COLS.length + 12)))
  titleRow.getCell(1).value = projectName
  titleRow.getCell(1).font = { name: FONT, size: 15, bold: true, color: { argb: C.text } }
  titleRow.getCell(1).alignment = { vertical: 'middle' }

  // 行 2：说明
  const fmtDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  ws.mergeCells(2, 1, 2, INFO_COLS.length)
  const metaCell = ws.getRow(2).getCell(1)
  // 标记线（SOP 等）：在说明行列出图例；对应列表头用标记色加粗、左边线加粗。
  // 注意：不使用单元格批注 —— exceljs 生成的批注(VML)与数据条扩展同时存在时 Excel 无法打开文件。
  const markerCols = new Map<number, VerticalMarker>()
  for (const m of input.markers ?? []) {
    const [y, mo, d] = m.date.split('-').map(Number)
    const md = new Date(y, mo - 1, d)
    const idx = columns.findIndex((col) => md >= col.start && md <= col.end)
    if (idx >= 0) markerCols.set(idx, m)
  }
  const legend = [...markerCols.values()].map((m) => `▌${m.label} ${m.date}`).join('   ')
  metaCell.value = `Timeline ${fmtDay(timelineStart)} → ${fmtDay(timelineEnd)}  ·  ${tasks.length} items  ·  Exported ${fmtDay(new Date())}` +
    (legend ? `   ·   Markers: ${legend}` : '')
  metaCell.font = { name: FONT, size: 9, color: { argb: C.textMuted } }
  ws.getRow(2).height = 18

  // 行 3/4：信息列表头（纵向合并）+ 时间轴两级表头
  const groupRow = ws.getRow(HEADER_ROWS - 1)
  const headRow = ws.getRow(HEADER_ROWS)
  groupRow.height = 18
  headRow.height = 20
  const headerStyle = (cell: ExcelJS.Cell, align: ExcelJS.Alignment['horizontal'] = 'center') => {
    cell.font = { name: FONT, size: 9, bold: true, color: { argb: C.textMuted } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.headerBg } }
    cell.alignment = { vertical: 'middle', horizontal: align }
    cell.border = { bottom: thin(C.borderStrong), right: thin() }
  }
  INFO_COLS.forEach((c, i) => {
    ws.mergeCells(HEADER_ROWS - 1, i + 1, HEADER_ROWS, i + 1)
    const cell = groupRow.getCell(i + 1)
    cell.value = c.header
    headerStyle(cell, c.key === 'title' ? 'left' : 'center')
  })
  // 上级表头：相邻同名合并
  let spanStart = 0
  for (let i = 1; i <= columns.length; i++) {
    if (i === columns.length || columns[i].group !== columns[spanStart].group) {
      const c1 = firstTimeCol + spanStart
      const c2 = firstTimeCol + i - 1
      if (c2 > c1) ws.mergeCells(HEADER_ROWS - 1, c1, HEADER_ROWS - 1, c2)
      const cell = groupRow.getCell(c1)
      // 窄跨度放不下完整文字时缩写
      const span = c2 - c1 + 1
      cell.value = span >= 3 || unit === 'month' ? columns[spanStart].group : columns[spanStart].group.slice(0, 3)
      headerStyle(cell)
      cell.font = { name: FONT, size: 9, bold: true, color: { argb: C.text } }
      cell.border = { bottom: thin(), left: thin(C.borderStrong) }
      spanStart = i
    }
  }
  const todayCol = columns.findIndex((col) => today >= col.start && today <= col.end)
  columns.forEach((col, i) => {
    const cell = headRow.getCell(firstTimeCol + i)
    cell.value = col.label
    headerStyle(cell)
    cell.font = { name: FONT, size: 8, color: { argb: C.textMuted } }
    if (i === todayCol) {
      cell.font = { name: FONT, size: 8, bold: true, color: { argb: C.today } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.todayBg } }
    }
    const marker = markerCols.get(i)
    if (marker) {
      cell.font = { name: FONT, size: 8, bold: true, color: { argb: argb(resolveColor(marker.color, '#dc2626')) } }
      cell.border = { ...cell.border, left: { style: 'medium', color: { argb: argb(resolveColor(marker.color, '#dc2626')) } } }
    }
  })

  // 数据行
  let rowNo = HEADER_ROWS
  let seq = 0
  const paintTimeCell = (cell: ExcelJS.Cell, i: number) => {
    const marker = markerCols.get(i)
    cell.border = {
      bottom: thin(),
      left: marker ? { style: 'medium', color: { argb: argb(resolveColor(marker.color, '#dc2626')) } } : thin('FFF1F5F9'),
    }
    if (i === todayCol) cell.border.right = { style: 'thin', color: { argb: 'FFFCA5A5' } }
  }

  for (const { bucket, tasks: gTasks } of groups) {
    const isMs = bucket.bucketType === 'milestone'
    const gColor = resolveColor(bucket.color, isMs ? DEFAULT_MILESTONE_COLOR : '#64748b')

    // 分组标题行
    rowNo++
    const gr = ws.getRow(rowNo)
    gr.height = 22
    const gTitle = gr.getCell(2)
    gTitle.value = `${isMs ? '◆ ' : ''}${bucket.name}  (${gTasks.length})`
    gTitle.font = { name: FONT, size: 10, bold: true, color: { argb: C.text } }
    for (let c = 1; c <= lastCol; c++) {
      const cell = gr.getCell(c)
      cell.alignment = { vertical: 'middle' }
      cell.border = { top: thin(C.borderStrong), bottom: thin() }
    }
    gr.getCell(1).border = { ...gr.getCell(1).border, left: { style: 'thick', color: { argb: argb(gColor) } } }
    // 折叠时也能看出分组时间范围：在分组行上用细线标出总跨度
    if (gTasks.length && !isMs) {
      const gStart = new Date(Math.min(...gTasks.map((t) => +new Date(t.startDateTime))))
      const gEnd = new Date(Math.max(...gTasks.map((t) => +new Date(t.dueDateTime))))
      columns.forEach((col, i) => {
        if (overlaps(gStart, gEnd, col)) {
          gr.getCell(firstTimeCol + i).border = {
            top: thin(C.borderStrong),
            bottom: { style: 'medium', color: { argb: argb(gColor) } },
          }
        }
      })
    }

    for (const t of gTasks) {
      rowNo++
      seq++
      const r = ws.getRow(rowNo)
      r.outlineLevel = 1
      r.height = 20
      const s = startOfDay(new Date(t.startDateTime))
      const e = startOfDay(new Date(t.dueDateTime))
      const isMilestone = t.taskType === 'milestone'
      const days = isMilestone ? 0 : calendarDaysBetween(s, e)
      const pct = Math.max(0, Math.min(100, t.completedPercent ?? (t.status === 'Completed' ? 100 : 0)))
      const color = resolveColor(t.color || bucket.color, isMilestone ? gColor : undefined)

      const vals: Record<string, ExcelJS.CellValue> = {
        no: seq,
        title: isMilestone ? `◆ ${t.title}` : t.title,
        start: excelDate(s),
        end: isMilestone ? null : excelDate(e),
        days: isMilestone ? null : days,
        progress: isMilestone ? null : pct / 100,
        status: STATUS_LABEL[t.status] ?? t.status,
      }
      INFO_COLS.forEach((c, i) => {
        const cell = r.getCell(i + 1)
        cell.value = vals[c.key]
        cell.font = { name: FONT, size: 9, color: { argb: c.key === 'no' ? C.textMuted : C.text } }
        cell.alignment = { vertical: 'middle', horizontal: c.key === 'title' ? 'left' : 'center', indent: c.key === 'title' ? 1 : 0 }
        cell.border = { bottom: thin() }
      })
      r.getCell(3).numFmt = 'yyyy-mm-dd'
      r.getCell(4).numFmt = 'yyyy-mm-dd'
      r.getCell(6).numFmt = '0%'
      if (isMilestone) r.getCell(2).font = { name: FONT, size: 9, bold: true, color: { argb: C.text } }
      if (t.status === 'Completed') r.getCell(7).font = { name: FONT, size: 9, color: { argb: 'FF15803D' } }
      INFO_COLS.forEach((_, i) => { if (i === INFO_COLS.length - 1) r.getCell(i + 1).border = { bottom: thin(), right: thin(C.borderStrong) } })

      // 进度分界：开始日 + 时长 × 进度，之前实色、之后浅色
      const doneUntil = addDays(s, Math.round(days * pct / 100))
      const solid = argb(color)
      const light = argb(lighten(color, 0.62))
      columns.forEach((col, i) => {
        const cell = r.getCell(firstTimeCol + i)
        paintTimeCell(cell, i)
        if (isMilestone) {
          if (s >= col.start && s <= col.end) {
            cell.value = '◆'
            // 微软雅黑里 ◆ 字形很小，时间轴菱形用 Arial 渲染更醒目
            cell.font = { name: 'Arial', size: 13, color: { argb: argb(gColor) } }
            cell.alignment = { horizontal: 'center', vertical: 'middle' }
          }
          return
        }
        if (!overlaps(s, e, col)) return
        const done = pct >= 100 || (pct > 0 && col.start < doneUntil)
        const fillArgb = done ? solid : light
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillArgb } }
        // 条内相邻格之间用同色边线，避免被网格线切成一节一节；标记线列保留其粗边线
        cell.border = {
          ...cell.border,
          top: { style: 'thin', color: { argb: C.white } },
          bottom: { style: 'thin', color: { argb: C.white } },
          left: markerCols.has(i) ? cell.border?.left : { style: 'thin', color: { argb: fillArgb } },
          right: i === todayCol ? cell.border?.right : { style: 'thin', color: { argb: fillArgb } },
        }
      })
      // 甘特条起始格写上时长，方便打印后阅读
      const firstBarCol = columns.findIndex((col) => !isMilestone && overlaps(s, e, col))
      if (firstBarCol >= 0 && days > 0) {
        const cell = r.getCell(firstTimeCol + firstBarCol)
        const fill = cell.fill as ExcelJS.FillPattern
        const bg = fill?.fgColor?.argb === solid ? color : lighten(color, 0.62)
        cell.value = days >= 14 ? `${Math.round(days / 7 * 10) / 10}w` : `${days}d`
        cell.font = { name: FONT, size: 7, bold: true, color: { argb: argb(getContrastColor(bg)) } }
        cell.alignment = { horizontal: 'left', vertical: 'middle', shrinkToFit: true }
      }
    }
  }

  // 进度列数据条
  if (rowNo > HEADER_ROWS) {
    ws.addConditionalFormatting({
      ref: `F${HEADER_ROWS + 1}:F${rowNo}`,
      rules: [{
        type: 'dataBar',
        priority: 1,
        minLength: 0,
        maxLength: 100,
        cfvo: [{ type: 'num', value: 0 }, { type: 'num', value: 1 }],
        color: { argb: 'FF93C5FD' },
        gradient: false,
      } as unknown as ExcelJS.ConditionalFormattingRule],
    })
  }

  // ════════════════════════ Sheet 2: Tasks ════════════════════════
  const ts = wb.addWorksheet('Tasks', {
    views: [{ state: 'frozen', ySplit: 1, showGridLines: false }],
  })
  ts.columns = [
    { header: '#', key: 'no', width: 6 },
    { header: 'Group', key: 'group', width: 18 },
    { header: 'Type', key: 'type', width: 12 },
    { header: 'Task', key: 'title', width: 36 },
    { header: 'Start', key: 'start', width: 12, style: { numFmt: 'yyyy-mm-dd' } },
    { header: 'End', key: 'end', width: 12, style: { numFmt: 'yyyy-mm-dd' } },
    { header: 'Days', key: 'days', width: 9 },
    { header: 'Progress', key: 'progress', width: 12, style: { numFmt: '0%' } },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Priority', key: 'priority', width: 12 },
    { header: 'Depends on', key: 'deps', width: 34 },
    { header: 'Description', key: 'desc', width: 48 },
  ]
  let n = 0
  for (const { bucket, tasks: gTasks } of groups) {
    for (const t of gTasks) {
      n++
      const s = startOfDay(new Date(t.startDateTime))
      const e = startOfDay(new Date(t.dueDateTime))
      const isMilestone = t.taskType === 'milestone'
      const deps = (t.dependencyTaskIds ?? []).map((id) => {
        const dep = (t.dependencies ?? []).find((d) => (typeof d === 'string' ? d === id : d.taskId === id))
        const lag = dep && typeof dep !== 'string' ? dep.lagDays : 0
        const title = taskById.get(id)?.title ?? id
        return lag ? `${title} (+${lag}d)` : title
      })
      ts.addRow({
        no: n,
        group: bucket.name,
        type: isMilestone ? 'Milestone' : 'Task',
        title: t.title,
        start: excelDate(s),
        end: excelDate(e),
        days: isMilestone ? 0 : calendarDaysBetween(s, e),
        progress: (t.completedPercent ?? (t.status === 'Completed' ? 100 : 0)) / 100,
        status: STATUS_LABEL[t.status] ?? t.status,
        priority: t.priority,
        deps: deps.join(', '),
        desc: t.description ?? '',
      })
    }
  }
  ts.eachRow((row, idx) => {
    row.height = idx === 1 ? 22 : 18
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = idx === 1
        ? { name: FONT, size: 9, bold: true, color: { argb: C.textMuted } }
        : { name: FONT, size: 9, color: { argb: C.text } }
      cell.border = { bottom: thin(idx === 1 ? C.borderStrong : C.border) }
      cell.alignment = { vertical: 'middle', wrapText: false }
      if (idx === 1) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.headerBg } }
    })
  })
  if (n > 0) ts.autoFilter = { from: { row: 1, column: 1 }, to: { row: n + 1, column: ts.columns.length } }

  return wb
}

/** 生成并触发浏览器下载 */
export async function exportGanttToExcel(input: GanttExportInput, fileName: string): Promise<void> {
  const wb = buildGanttWorkbook(input)
  const buf = await wb.xlsx.writeBuffer()
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
