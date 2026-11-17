/**
 * 甘特图任务上下拖拽的纯函数逻辑（无 React 依赖，便于单测）
 */
import type { Task, Bucket } from '@/types'

/** 拖放落点：目标分组 + 插在哪个任务之前（null = 追加到末尾） */
export interface TaskDropTarget {
  bucketId: string
  beforeTaskId: string | null
}

export interface TaskMoveUpdate {
  id: string
  changes: Partial<Pick<Task, 'bucketId' | 'order' | 'color'>>
}

/** 分组内任务按 order 排序；order 相同时保持原数组顺序（稳定排序） */
export function sortTasksInBucket<T extends Pick<Task, 'order'>>(tasks: T[]): T[] {
  return tasks
    .map((t, i) => ({ t, i }))
    .sort((a, b) => (a.t.order ?? 0) - (b.t.order ?? 0) || a.i - b.i)
    .map((x) => x.t)
}

/**
 * 计算把 draggedId 移动到 target 后需要写库的变更。
 * - 目标分组按新顺序重排为 0..n-1
 * - 跨分组时源分组也重新编号，消除空洞
 * - 任务颜色若沿用源分组颜色（未自定义），则跟随目标分组颜色
 * 只返回实际发生变化的任务；返回空数组表示无需操作。
 */
export function planTaskMove(
  allTasks: Task[],
  buckets: Bucket[],
  draggedId: string,
  target: TaskDropTarget
): TaskMoveUpdate[] {
  const dragged = allTasks.find((t) => t.id === draggedId)
  if (!dragged || target.beforeTaskId === draggedId) return []

  const sourceBucketId = dragged.bucketId
  const crossBucket = sourceBucketId !== target.bucketId

  const targetList = sortTasksInBucket(
    allTasks.filter((t) => t.bucketId === target.bucketId && t.id !== draggedId)
  )
  let insertIdx = target.beforeTaskId
    ? targetList.findIndex((t) => t.id === target.beforeTaskId)
    : targetList.length
  if (insertIdx < 0) insertIdx = targetList.length
  targetList.splice(insertIdx, 0, dragged)

  const updates = new Map<string, TaskMoveUpdate['changes']>()
  const put = (id: string, changes: TaskMoveUpdate['changes']) => {
    updates.set(id, { ...(updates.get(id) || {}), ...changes })
  }

  // 若原分组内顺序未变且未跨组，直接返回空（避免无意义写库）
  if (!crossBucket) {
    const before = sortTasksInBucket(allTasks.filter((t) => t.bucketId === sourceBucketId)).map((t) => t.id)
    const after = targetList.map((t) => t.id)
    if (before.join('|') === after.join('|')) return []
  }

  targetList.forEach((t, i) => {
    if (t.order !== i) put(t.id, { order: i })
  })

  if (crossBucket) {
    put(dragged.id, { bucketId: target.bucketId, order: targetList.indexOf(dragged) })
    const srcBucket = buckets.find((b) => b.id === sourceBucketId)
    const dstBucket = buckets.find((b) => b.id === target.bucketId)
    if (dstBucket?.color && (!dragged.color || dragged.color === srcBucket?.color)) {
      put(dragged.id, { color: dstBucket.color })
    }
    const sourceList = sortTasksInBucket(
      allTasks.filter((t) => t.bucketId === sourceBucketId && t.id !== draggedId)
    )
    sourceList.forEach((t, i) => {
      if (t.order !== i) put(t.id, { order: i })
    })
  }

  return [...updates.entries()].map(([id, changes]) => ({ id, changes }))
}

/**
 * 把"悬停在某任务行的上/下半部分"换算成落点。
 * orderedIds 为目标分组当前显示顺序（含被拖拽任务也无妨）。
 */
export function dropTargetFromTaskRow(
  orderedIds: string[],
  bucketId: string,
  hoverTaskId: string,
  position: 'above' | 'below',
  draggedId: string
): TaskDropTarget {
  if (position === 'above') return { bucketId, beforeTaskId: hoverTaskId }
  const rest = orderedIds.filter((id) => id !== draggedId)
  const idx = rest.indexOf(hoverTaskId)
  return { bucketId, beforeTaskId: idx >= 0 && idx + 1 < rest.length ? rest[idx + 1] : null }
}

/** 同类型分组之间的重排：返回 [{id, order}] 中实际变化的项 */
export function planBucketReorder(
  ordered: Bucket[],
  draggedId: string,
  targetId: string,
  position: 'above' | 'below'
): { id: string; order: number }[] {
  const list = [...ordered]
  const from = list.findIndex((b) => b.id === draggedId)
  if (from === -1 || !list.some((b) => b.id === targetId) || draggedId === targetId) return []
  const [moved] = list.splice(from, 1)
  const ti = list.findIndex((b) => b.id === targetId)
  list.splice(position === 'above' ? ti : ti + 1, 0, moved)
  return list.flatMap((b, i) => (b.order !== i ? [{ id: b.id, order: i }] : []))
}
