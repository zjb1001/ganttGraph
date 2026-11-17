import { describe, it, expect } from 'vitest'
import ExcelJS from 'exceljs'
import { buildGanttWorkbook, buildTimeColumns } from '../utils/exportExcel'
import type { Task, Bucket } from '../types'

const mk = (id: string, bucketId: string, order: number, s: Date, e: Date, extra: Partial<Task> = {}): Task => ({
  id, projectId: 'p', bucketId, title: id, taskType: 'task', startDateTime: s, dueDateTime: e,
  status: 'NotStarted', priority: 'Normal', assigneeIds: [], labelIds: [], order,
  createdAt: new Date(), updatedAt: new Date(), ...extra,
})

const buckets: Bucket[] = [
  { id: 'ms', projectId: 'p', name: 'Gates', order: 0, color: '#c2410c', bucketType: 'milestone' },
  { id: 'g1', projectId: 'p', name: 'Design', order: 0, color: '#2563eb' },
  { id: 'g2', projectId: 'p', name: 'Build', order: 1, color: '#0078d4' }, // legacy color
]
const tasks: Task[] = [
  mk('gate1', 'ms', 0, new Date(2026, 1, 4), new Date(2026, 1, 4), { taskType: 'milestone', title: 'G1' }),
  mk('b', 'g1', 1, new Date(2026, 0, 12), new Date(2026, 0, 26), { title: 'Second' }),
  mk('a', 'g1', 0, new Date(2026, 0, 5), new Date(2026, 0, 19), { title: 'First', completedPercent: 50 }),
  mk('c', 'g2', 0, new Date(2026, 1, 2), new Date(2026, 1, 9), {
    title: 'Third', dependencyTaskIds: ['a'], dependencies: [{ taskId: 'a', lagDays: 2 }],
  }),
]

const input = {
  projectName: 'Demo',
  tasks,
  buckets,
  timelineStart: new Date(2026, 0, 1),
  timelineEnd: new Date(2026, 2, 31),
  today: new Date(2026, 0, 14),
}

/** 写成 xlsx 再读回，确认文件本身合法 */
async function roundTrip(wb: ExcelJS.Workbook) {
  const buf = await wb.xlsx.writeBuffer()
  const back = new ExcelJS.Workbook()
  await back.xlsx.load(buf as ArrayBuffer)
  return back
}

describe('buildTimeColumns', () => {
  it('uses Monday-based weeks covering the range', () => {
    const { unit, columns } = buildTimeColumns(new Date(2026, 0, 1), new Date(2026, 0, 31))
    expect(unit).toBe('week')
    expect(columns[0].start.getDay()).toBe(1) // Monday
    expect(columns[0].start <= new Date(2026, 0, 1)).toBe(true)
    expect(columns[columns.length - 1].end >= new Date(2026, 0, 31)).toBe(true)
  })
  it('switches to months for very long ranges', () => {
    const { unit, columns } = buildTimeColumns(new Date(2026, 0, 1), new Date(2031, 11, 31))
    expect(unit).toBe('month')
    expect(columns).toHaveLength(72)
  })
})

describe('buildGanttWorkbook', () => {
  it('produces a valid workbook with Gantt and Tasks sheets', async () => {
    const wb = await roundTrip(buildGanttWorkbook(input))
    expect(wb.worksheets.map((w) => w.name)).toEqual(['Gantt', 'Tasks'])
  })

  it('orders rows like the Gantt view: milestone groups first, then groups by order, tasks by order', async () => {
    const ws = (await roundTrip(buildGanttWorkbook(input))).getWorksheet('Gantt')!
    const titles: string[] = []
    ws.eachRow((row, i) => { if (i > 4) titles.push(String(row.getCell(2).value)) })
    expect(titles).toEqual(['◆ Gates  (1)', '◆ G1', 'Design  (2)', 'First', 'Second', 'Build  (1)', 'Third'])
  })

  it('writes dates that read back as the same calendar day (no timezone shift)', async () => {
    const ws = (await roundTrip(buildGanttWorkbook(input))).getWorksheet('Gantt')!
    const first = ws.getRow(8) // 'First'
    expect(first.getCell(2).value).toBe('First')
    const start = first.getCell(3).value as Date
    expect([start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()]).toEqual([2026, 0, 5])
    expect(first.getCell(5).value).toBe(14)
    expect(first.getCell(6).value).toBe(0.5)
  })

  it('task rows are collapsible outline level 1 under group rows', async () => {
    const ws = (await roundTrip(buildGanttWorkbook(input))).getWorksheet('Gantt')!
    expect(ws.getRow(7).outlineLevel ?? 0).toBe(0) // group 'Design'
    expect(ws.getRow(8).outlineLevel).toBe(1)
  })

  it('paints bar cells with the task color; done part solid, remaining part lighter', async () => {
    const ws = (await roundTrip(buildGanttWorkbook(input))).getWorksheet('Gantt')!
    const row = ws.getRow(8) // First: Jan 5–19, 50% → done until ~Jan 12
    const fills: (string | undefined)[] = []
    for (let c = 8; c < 8 + 6; c++) fills.push((row.getCell(c).fill as ExcelJS.FillPattern | undefined)?.fgColor?.argb)
    // 第 1 周 (Dec 29–Jan 4) 无条；Jan 5 周实色；Jan 12/19 周浅色
    expect(fills[0]).toBeUndefined()
    expect(fills[1]).toBe('FF2563EB')
    expect(fills[2]).not.toBe('FF2563EB')
    expect(fills[2]).toBeDefined()
  })

  it('maps legacy colors and marks milestones with a diamond', async () => {
    const ws = (await roundTrip(buildGanttWorkbook(input))).getWorksheet('Gantt')!
    const third = ws.getRow(11) // row 10 = 'Build' group header
    const filled = Array.from({ length: 14 }, (_, i) => (third.getCell(8 + i).fill as ExcelJS.FillPattern | undefined)?.fgColor?.argb)
      .filter(Boolean)
    expect(filled.length).toBeGreaterThan(0)
    expect(filled).not.toContain('FF0078D4')
    const gateRow = ws.getRow(6)
    const diamonds = Array.from({ length: 14 }, (_, i) => gateRow.getCell(8 + i).value).filter((v) => v === '◆')
    expect(diamonds).toHaveLength(1)
  })

  it('Tasks sheet lists dependencies with lag and has an autofilter', async () => {
    const wb = buildGanttWorkbook(input)
    const ts = wb.getWorksheet('Tasks')!
    expect(ts.autoFilter).toBeTruthy()
    const rows: string[] = []
    ts.eachRow((r, i) => { if (i > 1) rows.push(`${r.getCell('title').value}|${r.getCell('deps').value}`) })
    expect(rows).toContain('Third|First (+2d)')
  })

  // 回归：以下组合会让 exceljs 写出元素顺序错误的 XML，Excel 拒绝打开文件（已用真实 Excel 验证）
  it('avoids exceljs output that Excel refuses to open', () => {
    const wb = buildGanttWorkbook({
      ...input,
      markers: [{ id: 'm', projectId: 'p', date: '2026-02-10', label: 'SOP', color: '#dc2626', thickness: 2 }],
    })
    const ws = wb.getWorksheet('Gantt')!
    // fitToPage(<pageSetUpPr>) 与大纲(<outlinePr>) 同时存在时顺序错误
    expect(ws.pageSetup.fitToPage).toBeFalsy()
    expect(ws.pageSetup.scale).toBeGreaterThanOrEqual(10)
    expect(ws.pageSetup.scale).toBeLessThanOrEqual(100)
    // 批注(VML) 与数据条扩展同时存在时顺序错误
    let notes = 0
    wb.eachSheet((s) => s.eachRow((r) => r.eachCell((c) => { if (c.note) notes++ })))
    expect(notes).toBe(0)
  })

  it('shows marker legend in the meta row', () => {
    const wb = buildGanttWorkbook({
      ...input,
      markers: [{ id: 'm', projectId: 'p', date: '2026-02-10', label: 'SOP', color: '#dc2626', thickness: 2 }],
    })
    expect(String(wb.getWorksheet('Gantt')!.getCell('A2').value)).toContain('SOP 2026-02-10')
  })

  it('keeps tasks whose group no longer exists', async () => {
    const wb = buildGanttWorkbook({ ...input, tasks: [...tasks, mk('lost', 'gone', 0, new Date(2026, 0, 5), new Date(2026, 0, 8))] })
    const titles: string[] = []
    wb.getWorksheet('Gantt')!.eachRow((row, i) => { if (i > 4) titles.push(String(row.getCell(2).value)) })
    expect(titles).toContain('Ungrouped  (1)')
    expect(titles).toContain('lost')
  })
})
