import { describe, it, expect } from 'vitest'
import { planTaskMove, planBucketReorder, dropTargetFromTaskRow, sortTasksInBucket } from '../utils/ganttDnd'
import { calendarDaysBetween, parseLocalDate } from '../utils/date'
import type { Task, Bucket } from '../types'

const mkTask = (id: string, bucketId: string, order: number, extra: Partial<Task> = {}): Task => ({
  id,
  projectId: 'p1',
  bucketId,
  title: id,
  taskType: 'task',
  startDateTime: new Date(2026, 0, 1),
  dueDateTime: new Date(2026, 0, 5),
  status: 'NotStarted',
  priority: 'Normal',
  assigneeIds: [],
  labelIds: [],
  order,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...extra,
})

const buckets: Bucket[] = [
  { id: 'A', projectId: 'p1', name: 'A', order: 0, color: '#aaaaaa' },
  { id: 'B', projectId: 'p1', name: 'B', order: 1, color: '#bbbbbb' },
]

/** 应用更新后，返回某分组的任务 id 顺序 */
const applyAndList = (tasks: Task[], updates: ReturnType<typeof planTaskMove>, bucketId: string) => {
  const byId = new Map(updates.map((u) => [u.id, u.changes]))
  const next = tasks.map((t) => ({ ...t, ...(byId.get(t.id) || {}) }))
  return sortTasksInBucket(next.filter((t) => t.bucketId === bucketId)).map((t) => t.id)
}

describe('sortTasksInBucket', () => {
  it('sorts by order and keeps array order for ties', () => {
    const tasks = [mkTask('x', 'A', 0), mkTask('y', 'A', 0), mkTask('z', 'A', -1)]
    expect(sortTasksInBucket(tasks).map((t) => t.id)).toEqual(['z', 'x', 'y'])
  })
})

describe('planTaskMove', () => {
  const tasks = [mkTask('a1', 'A', 0), mkTask('a2', 'A', 1), mkTask('a3', 'A', 2), mkTask('b1', 'B', 0)]

  it('reorders within the same bucket', () => {
    const ups = planTaskMove(tasks, buckets, 'a3', { bucketId: 'A', beforeTaskId: 'a1' })
    expect(applyAndList(tasks, ups, 'A')).toEqual(['a3', 'a1', 'a2'])
  })

  it('returns no updates when position does not change', () => {
    expect(planTaskMove(tasks, buckets, 'a2', { bucketId: 'A', beforeTaskId: 'a3' })).toEqual([])
    expect(planTaskMove(tasks, buckets, 'a2', { bucketId: 'A', beforeTaskId: 'a2' })).toEqual([])
    expect(planTaskMove(tasks, buckets, 'a3', { bucketId: 'A', beforeTaskId: null })).toEqual([])
  })

  it('moves to another bucket and renumbers both buckets', () => {
    const ups = planTaskMove(tasks, buckets, 'a1', { bucketId: 'B', beforeTaskId: 'b1' })
    expect(applyAndList(tasks, ups, 'B')).toEqual(['a1', 'b1'])
    expect(applyAndList(tasks, ups, 'A')).toEqual(['a2', 'a3'])
    const a2 = ups.find((u) => u.id === 'a2')
    expect(a2?.changes.order).toBe(0)
  })

  it('appends to an empty bucket', () => {
    const ups = planTaskMove(tasks, [...buckets, { id: 'C', projectId: 'p1', name: 'C', order: 2 }], 'a2', {
      bucketId: 'C',
      beforeTaskId: null,
    })
    expect(applyAndList(tasks, ups, 'C')).toEqual(['a2'])
    expect(ups.find((u) => u.id === 'a2')?.changes).toMatchObject({ bucketId: 'C', order: 0 })
  })

  it('adopts target bucket color only when color was inherited', () => {
    const t = [mkTask('i', 'A', 0, { color: '#aaaaaa' }), mkTask('c', 'A', 1, { color: '#ff0000' })]
    const inherited = planTaskMove(t, buckets, 'i', { bucketId: 'B', beforeTaskId: null })
    expect(inherited.find((u) => u.id === 'i')?.changes.color).toBe('#bbbbbb')
    const custom = planTaskMove(t, buckets, 'c', { bucketId: 'B', beforeTaskId: null })
    expect(custom.find((u) => u.id === 'c')?.changes.color).toBeUndefined()
  })

  it('normalizes duplicate orders (e.g. AI-created tasks all with order 0)', () => {
    const t = [mkTask('x', 'A', 0), mkTask('y', 'A', 0), mkTask('z', 'A', 0)]
    const ups = planTaskMove(t, buckets, 'z', { bucketId: 'A', beforeTaskId: 'y' })
    expect(applyAndList(t, ups, 'A')).toEqual(['x', 'z', 'y'])
  })
})

describe('dropTargetFromTaskRow', () => {
  const ids = ['a1', 'a2', 'a3']
  it('above = insert before hovered task', () => {
    expect(dropTargetFromTaskRow(ids, 'A', 'a2', 'above', 'x')).toEqual({ bucketId: 'A', beforeTaskId: 'a2' })
  })
  it('below = insert before next task, skipping the dragged one', () => {
    expect(dropTargetFromTaskRow(ids, 'A', 'a1', 'below', 'a2')).toEqual({ bucketId: 'A', beforeTaskId: 'a3' })
    expect(dropTargetFromTaskRow(ids, 'A', 'a3', 'below', 'x')).toEqual({ bucketId: 'A', beforeTaskId: null })
  })
})

describe('planBucketReorder', () => {
  const list: Bucket[] = [
    { id: 'g1', projectId: 'p1', name: '1', order: 0 },
    { id: 'g2', projectId: 'p1', name: '2', order: 1 },
    { id: 'g3', projectId: 'p1', name: '3', order: 2 },
  ]
  it('moves a bucket below the target', () => {
    expect(planBucketReorder(list, 'g1', 'g3', 'below')).toEqual([
      { id: 'g2', order: 0 },
      { id: 'g3', order: 1 },
      { id: 'g1', order: 2 },
    ])
  })
  it('ignores unknown buckets (e.g. cross-type drops)', () => {
    expect(planBucketReorder(list, 'zz', 'g1', 'above')).toEqual([])
  })
})

describe('calendar date helpers', () => {
  it('calendarDaysBetween ignores time of day', () => {
    // 08:00 (UTC-parsed date in UTC+8) must not shift the bar by one day
    expect(calendarDaysBetween(new Date(2026, 0, 1), new Date(2026, 0, 5, 8))).toBe(4)
    expect(calendarDaysBetween(new Date(2026, 0, 1, 23, 59), new Date(2026, 0, 2, 0, 1))).toBe(1)
  })
  it('calendarDaysBetween is DST-safe across a year', () => {
    expect(calendarDaysBetween(new Date(2026, 0, 1), new Date(2027, 0, 1))).toBe(365)
  })
  it('parseLocalDate parses YYYY-MM-DD as local midnight', () => {
    const d = parseLocalDate('2026-03-09')
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([2026, 2, 9, 0])
  })
})
