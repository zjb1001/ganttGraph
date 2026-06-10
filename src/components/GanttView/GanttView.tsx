import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useAppStore } from '@/store/appStore'
import { STATUS_COLORS, PRIORITY_COLORS } from '@/utils/colors'
import { getDaysBetween, isToday } from '@/utils/date'
import { Task, Bucket } from '@/types'

import styles from './GanttView.module.css'

// 日期信息接口
interface DateInfo {
  date: Date
  year: number
  month: number
  week: number
  day: number
  isWeekStart: boolean
  isMonthStart: boolean
}

export default function GanttView() {
  const { tasks, buckets, currentProjectId, setSelectedTaskId, addDependency, removeDependency, updateTask, addTask, deleteTask, addBucket, updateBucket, deleteBucket, projects, updateProject, collapsedBucketIds: collapsedBuckets, toggleBucketCollapse, collapseBucketsByType, verticalMarkers, addMarker, deleteMarker, updateMarker } = useAppStore()
  
  const ganttRef = useRef<HTMLDivElement>(null)
  const ganttScrollRef = useRef<HTMLDivElement>(null)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [dragStartTask, setDragStartTask] = useState<string | null>(null)
  // 甘特图内里程碑内联编辑
  const [ganttEditingId, setGanttEditingId] = useState<string | null>(null)
  const [ganttEditingTitle, setGanttEditingTitle] = useState('')
  // 里程碑日期编辑
  const [editingDateId, setEditingDateId] = useState<string | null>(null)
  const [editingDateValue, setEditingDateValue] = useState('')
  // 新增里程碑（按里程碑分组）
  const [addingMilestoneBucketId, setAddingMilestoneBucketId] = useState<string | null>(null)
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('')
  const [newMilestoneDate, setNewMilestoneDate] = useState('')
  // 新增里程碑分组
  const [addingMilestoneGroup, setAddingMilestoneGroup] = useState(false)
  const [newMilestoneGroupName, setNewMilestoneGroupName] = useState('')
  const [newMilestoneGroupColor, setNewMilestoneGroupColor] = useState('#d83b01')
  // 分组名称编辑
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const [editingGroupName, setEditingGroupName] = useState('')
  // 新增任务（按分组）
  const [addingTaskBucketId, setAddingTaskBucketId] = useState<string | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskStartDate, setNewTaskStartDate] = useState('')
  const [newTaskEndDate, setNewTaskEndDate] = useState('')
  // 新增分组
  const [addingGroup, setAddingGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  // 操作面板折叠
  const [hintsCollapsed, setHintsCollapsed] = useState(true)
  const actionPanelRef = useRef<HTMLDivElement>(null)
  // 折叠的分组 (from store)
  // const [collapsedBuckets] is now from store as collapsedBucketIds
  // 时间轴起止日期 —— 从项目记录读取，未设置时回落到当前年份
  const currentProject = useMemo(() => projects.find((p) => p.id === currentProjectId), [projects, currentProjectId])
  const _defaultYear = new Date().getFullYear()
  const [timelineStart, setTimelineStart] = useState(() => currentProject?.ganttStart ?? `${_defaultYear}-01-01`)
  const [timelineEnd, setTimelineEnd] = useState(() => currentProject?.ganttEnd ?? `${_defaultYear}-12-31`)

  // 切换项目时同步时间轴
  const prevProjectIdRef = useRef<string | null>(null)
  useEffect(() => {
    if (currentProjectId === prevProjectIdRef.current) return
    prevProjectIdRef.current = currentProjectId
    const year = new Date().getFullYear()
    setTimelineStart(currentProject?.ganttStart ?? `${year}-01-01`)
    setTimelineEnd(currentProject?.ganttEnd ?? `${year}-12-31`)
  }, [currentProjectId, currentProject])

  // 节流写库：时间轴变更后 800ms 内没有再变动才持久化
  const timelineSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveTimeline = useCallback((start: string, end: string) => {
    if (!currentProjectId) return
    if (timelineSaveTimer.current) clearTimeout(timelineSaveTimer.current)
    timelineSaveTimer.current = setTimeout(() => {
      updateProject(currentProjectId, { ganttStart: start, ganttEnd: end })
    }, 800)
  }, [currentProjectId, updateProject])
  // Vertical marker lines — form UI state only (data from store)
  const [addingMarker, setAddingMarker] = useState(false)
  const [newMarkerDate, setNewMarkerDate] = useState('')
  const [newMarkerLabel, setNewMarkerLabel] = useState('')
  const [newMarkerColor, setNewMarkerColor] = useState('#e00000')
  const [newMarkerThickness, setNewMarkerThickness] = useState(2)
  // Column resize (task name vs progress)
  const [taskListWidth, setTaskListWidth] = useState(360)
  const colResizeRef = useRef<{ startX: number; startWidth: number } | null>(null)
  // 分组拖拽排序
  const [draggingGroupId, setDraggingGroupId] = useState<string | null>(null)
  const [dragOverGroupId, setDragOverGroupId] = useState<string | null>(null)
  const [dragOverPosition, setDragOverPosition] = useState<'above' | 'below'>('below')

  // 任务条拖拽调整时长
  const resizingRef = useRef<{
    taskId: string
    handle: 'left' | 'right'
    startX: number
    origStart: Date
    origEnd: Date
  } | null>(null)
  const resizePreviewRef = useRef<{ taskId: string; start: Date; end: Date } | null>(null)
  const [resizePreview, setResizePreview] = useState<{ taskId: string; start: Date; end: Date } | null>(null)
  const justResizedRef = useRef(false)

  const projectTasks = tasks.filter((t) => t.projectId === currentProjectId)

  // 当前项目的分组（state.buckets 已按项目隔离加载）
  const currentProjectBuckets = useMemo(() =>
    buckets.filter((b) => b.projectId === currentProjectId)
  , [buckets, currentProjectId])

  // 分离里程碑分组和普通任务分组
  const milestoneBuckets = useMemo(() =>
    currentProjectBuckets.filter((b) => b.bucketType === 'milestone').sort((a, b) => a.order - b.order)
  , [currentProjectBuckets])
  const milestoneBucketIds = useMemo(() => new Set(milestoneBuckets.map((b) => b.id)), [milestoneBuckets])

  // 里程碑任务按 bucketId 归属到对应里程碑分组
  const milestoneTasks = useMemo(() => projectTasks.filter((t) => t.taskType === 'milestone'), [projectTasks])
  const regularTasks = useMemo(() => projectTasks.filter((t) => t.taskType !== 'milestone' && !milestoneBucketIds.has(t.bucketId)), [projectTasks, milestoneBucketIds])

  // ── Publish action panel height as CSS variable for AI assistant positioning ──
  useEffect(() => {
    const updatePanelOffset = () => {
      if (actionPanelRef.current) {
        const panelHeight = actionPanelRef.current.offsetHeight
        // 12px = action panel bottom offset, 12px = gap between panel and AI FAB
        const offset = panelHeight + 12 + 12
        document.documentElement.style.setProperty('--action-panel-offset', `${offset}px`)
      }
    }
    // Small delay to allow DOM to settle after expand/collapse
    const timer = setTimeout(updatePanelOffset, 50)
    return () => {
      clearTimeout(timer)
    }
  }, [hintsCollapsed])

  // Reset CSS variable on unmount (when navigating away from Gantt view)
  useEffect(() => {
    return () => {
      document.documentElement.style.setProperty('--action-panel-offset', '16px')
    }
  }, [])

  // ── 孤儿里程碑迁移：如果存在旧的里程碑没有归属到任何里程碑分组，自动创建默认分组并迁移 ──
  const migrationDone = useRef(false)
  useEffect(() => {
    if (migrationDone.current) return
    const orphans = milestoneTasks.filter((t) => !milestoneBucketIds.has(t.bucketId))
    if (orphans.length === 0) return
    migrationDone.current = true
    ;(async () => {
      // 创建默认里程碑分组
      const defaultBucket = await addBucket({
        name: 'Milestones',
        order: 0,
        color: '#d83b01',
        bucketType: 'milestone'
      })
      if (defaultBucket) {
        for (const orphan of orphans) {
          await updateTask(orphan.id, { bucketId: defaultBucket.id })
        }
      }
    })()
  }, [milestoneTasks, milestoneBucketIds, addBucket, updateTask])

  // ── 修复迁移遗留：将 projectId='' 但被本项目任务引用的孤儿分组自动回填 projectId ──
  const orphanFixDone = useRef(false)
  useEffect(() => {
    if (!currentProjectId || orphanFixDone.current) return
    const orphanBuckets = currentProjectBuckets.filter((b) => b.projectId === '')
    if (orphanBuckets.length === 0) return
    orphanFixDone.current = true
    ;(async () => {
      for (const b of orphanBuckets) {
        await updateBucket(b.id, { projectId: currentProjectId })
      }
    })()
  }, [currentProjectBuckets, currentProjectId, updateBucket])

  // 该项目中实际用到的普通 bucket（排除里程碑分组）
  const projectBuckets = useMemo(() => {
    const seen = new Set<string>()
    const result: Bucket[] = []
    for (const b of currentProjectBuckets) {
      if (!seen.has(b.id) && b.bucketType !== 'milestone') {
        seen.add(b.id)
        result.push(b)
      }
    }
    // 兜底：任务引用了不在当前项目分组内的 bucket（可能是迁移遗漏的孤儿）
    const usedIds = new Set(regularTasks.map((t) => t.bucketId))
    for (const id of usedIds) {
      if (!seen.has(id)) {
        // 从全量 buckets 查找真实对象，用真实名字而非硬编码 'Ungrouped'
        const real = buckets.find((b) => b.id === id)
        result.push(real
          ? { ...real, projectId: currentProjectId || '' }
          : { id, projectId: currentProjectId || '', name: 'Ungrouped', order: 999, color: '#a19f9d' }
        )
      }
    }
    return result.sort((a, b) => a.order - b.order)
  }, [currentProjectBuckets, regularTasks, currentProjectId, buckets])

  // 行项目：里程碑分组 + 普通分组标题行 + 任务行
  type RowItem =
    | { kind: 'milestone-group'; bucket: Bucket; tasks: Task[] }
    | { kind: 'milestone'; task: Task; bucketColor: string }
    | { kind: 'add-milestone'; bucketId: string }
    | { kind: 'add-milestone-group' }
    | { kind: 'group'; bucket: Bucket; tasks: Task[] }
    | { kind: 'task'; task: Task }
    | { kind: 'add-task'; bucketId: string }
    | { kind: 'add-group' }

  const rowItems = useMemo((): RowItem[] => {
    const items: RowItem[] = []

    // ── 里程碑分组（多个）──
    for (const bucket of milestoneBuckets) {
      const bTasks = milestoneTasks.filter((t) => t.bucketId === bucket.id)
      items.push({ kind: 'milestone-group', bucket, tasks: bTasks })
      if (!collapsedBuckets.has(bucket.id)) {
        for (const task of bTasks) items.push({ kind: 'milestone', task, bucketColor: bucket.color || '#d83b01' })
        if (addingMilestoneBucketId === bucket.id) items.push({ kind: 'add-milestone', bucketId: bucket.id })
      }
    }

    // ── 新增里程碑分组行 ──
    if (addingMilestoneGroup) items.push({ kind: 'add-milestone-group' })

    // ── 普通任务按 bucket 分组 ──
    for (const bucket of projectBuckets) {
      const bt = regularTasks.filter((t) => t.bucketId === bucket.id)
      items.push({ kind: 'group', bucket, tasks: bt })
      if (!collapsedBuckets.has(bucket.id)) {
        for (const task of bt) items.push({ kind: 'task', task })
        if (addingTaskBucketId === bucket.id) items.push({ kind: 'add-task', bucketId: bucket.id })
      }
    }

    // ── 新增分组行 ──
    if (addingGroup) items.push({ kind: 'add-group' })

    return items
  }, [projectBuckets, regularTasks, milestoneTasks, milestoneBuckets, collapsedBuckets, addingMilestoneBucketId, addingMilestoneGroup, addingTaskBucketId, addingGroup])

  const toggleBucket = (bucketId: string) => {
    toggleBucketCollapse(bucketId)
  }

  const handleCollapseAll = () => {
    collapseBucketsByType('all', true)
  }

  const handleExpandAll = () => {
    collapseBucketsByType('all', false)
  }

  // 获取某任务在 rowItems 中的索引（-1 表示已折叠不可见）
  const getTaskRowIndex = useCallback(
    (taskId: string) => rowItems.findIndex((r) => (r.kind === 'task' || r.kind === 'milestone') && r.task.id === taskId),
    [rowItems]
  )

  // 时间轴根据输入起止日期生成
  const { startDate, dateInfo, weekInfo, monthInfo } = useMemo(() => {
    const parseLocalDate = (str: string) => {
      const parts = str.split('-').map(Number)
      if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
        return new Date(parts[0], parts[1] - 1, parts[2])
      }
      const now = new Date()
      return new Date(now.getFullYear(), 0, 1)
    }
    const startDate = parseLocalDate(timelineStart)
    let endDate = parseLocalDate(timelineEnd)
    // 确保结束日期不早于开始日期（最少显示 7 天）
    if (endDate <= startDate) {
      endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 6)
    }

    // 生成日期信息
    const dateInfo: DateInfo[] = []
    const current = new Date(startDate)

    while (current <= endDate) {
      const dayOfWeek = current.getDay()
      // 周一为周起始（ISO标准）
      const isFirstDayOfWeek = dayOfWeek === 1
      const isFirstDayOfMonth = current.getDate() === 1

      dateInfo.push({
        date: new Date(current),
        year: current.getFullYear(),
        month: current.getMonth(),
        week: 0, // 后面重新计算
        day: current.getDate(),
        isWeekStart: isFirstDayOfWeek,
        isMonthStart: isFirstDayOfMonth
      })

      current.setDate(current.getDate() + 1)
    }

    // Generate week info: use ISO week-of-year numbers
    const weekInfo: { startIndex: number; weekNum: number; dayCount: number }[] = []
    let weekStartIdx = 0

    const getISOWeekNumber = (date: Date): number => {
      const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
      const dayNum = d.getUTCDay() || 7
      d.setUTCDate(d.getUTCDate() + 4 - dayNum)
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
      return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
    }

    let currentWeekNum = getISOWeekNumber(dateInfo[0].date)

    for (let i = 0; i < dateInfo.length; i++) {
      if (dateInfo[i].isWeekStart && i > 0) {
        weekInfo.push({ startIndex: weekStartIdx, weekNum: currentWeekNum, dayCount: i - weekStartIdx })
        currentWeekNum = getISOWeekNumber(dateInfo[i].date)
        weekStartIdx = i
      }
    }
    if (weekStartIdx < dateInfo.length) {
      weekInfo.push({ startIndex: weekStartIdx, weekNum: currentWeekNum, dayCount: dateInfo.length - weekStartIdx })
    }

    // 回填 week 编号
    weekInfo.forEach((w) => {
      for (let i = w.startIndex; i < w.startIndex + w.dayCount; i++) {
        dateInfo[i].week = w.weekNum
      }
    })

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    const monthInfo: { month: number; year: number; name: string; startDayIndex: number; dayCount: number }[] = []
    let mStart = 0
    let mMonth = dateInfo[0].month
    let mYear  = dateInfo[0].year

    for (let i = 1; i < dateInfo.length; i++) {
      if (dateInfo[i].month !== mMonth || dateInfo[i].year !== mYear) {
        monthInfo.push({
          month: mMonth,
          year: mYear,
          name: `${monthNames[mMonth]} ${mYear}`,
          startDayIndex: mStart,
          dayCount: i - mStart
        })
        mStart = i
        mMonth = dateInfo[i].month
        mYear  = dateInfo[i].year
      }
    }
    monthInfo.push({
      month: mMonth,
      year: mYear,
      name: `${monthNames[mMonth]} ${mYear}`,
      startDayIndex: mStart,
      dayCount: dateInfo.length - mStart
    })

    return { startDate, endDate, dateInfo, weekInfo, monthInfo }
  }, [timelineStart, timelineEnd])

  const ZOOM_LEVELS = [1, 2, 3, 4, 5, 7, 10, 14]
  const [zoomIndex, setZoomIndex] = useState(4) // 默认 5px/天
  const weekWidth = ZOOM_LEVELS[zoomIndex] // 每天的宽度（像素）
  const totalWidth = dateInfo.length * weekWidth

  const handleZoomIn = () => setZoomIndex((i) => Math.min(i + 1, ZOOM_LEVELS.length - 1))
  const handleZoomOut = () => setZoomIndex((i) => Math.max(i - 1, 0))

  // 自动从任务中计算时间轴范围（上下各留 7 天 padding）
  const handleAutoFitTimeline = () => {
    const allDates = projectTasks.flatMap((t) => [new Date(t.startDateTime), new Date(t.dueDateTime)])
    if (allDates.length === 0) return
    const minTime = Math.min(...allDates.map((d) => d.getTime()))
    const maxTime = Math.max(...allDates.map((d) => d.getTime()))
    const minDate = new Date(minTime)
    const maxDate = new Date(maxTime)
    minDate.setDate(minDate.getDate() - 7)
    maxDate.setDate(maxDate.getDate() + 7)
    const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const start = fmt(minDate)
    const end = fmt(maxDate)
    setTimelineStart(start)
    setTimelineEnd(end)
    saveTimeline(start, end)
  }
  // 悬浮工具栏拖拽
  const [toolbarPos, setToolbarPos] = useState<{ x: number; y: number }>(() => ({
    x: window.innerWidth - 660,
    y: 12,
  }))
  const toolbarDragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null)

  const handleToolbarMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // 点击按钮/输入框/label 时不触发拖拽
    if ((e.target as HTMLElement).closest('button, input, label, select, span')) return
    e.preventDefault()
    toolbarDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: toolbarPos.x,
      origY: toolbarPos.y,
    }
  }

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!toolbarDragRef.current) return
      const dx = e.clientX - toolbarDragRef.current.startX
      const dy = e.clientY - toolbarDragRef.current.startY
      setToolbarPos({
        x: Math.max(0, toolbarDragRef.current.origX + dx),
        y: Math.max(0, toolbarDragRef.current.origY + dy),
      })
    }
    const onUp = () => { toolbarDragRef.current = null }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  const handleZoomFit = () => {
    // 根据容器宽度自动计算最佳缩放
    const container = document.querySelector(`.${styles.ganttScroll}`)
    if (!container) return
    const availableWidth = container.clientWidth - TASK_LIST_WIDTH
    const idealPxPerDay = availableWidth / dateInfo.length
    // 找最接近的缩放级别
    let best = 0
    for (let i = 0; i < ZOOM_LEVELS.length; i++) {
      if (ZOOM_LEVELS[i] <= idealPxPerDay) best = i
    }
    setZoomIndex(best)
  }

  // 计算元素在时间轴中的 left（相对于 timelineBody 内部，不含任务列宽度）
  const getDateLeft = useCallback((date: Date) => {
    return getDaysBetween(startDate, date) * weekWidth
  }, [startDate, weekWidth])

  // 计算任务条位置（任务条在 timelineBody 内渲染，无需加 180）
  const getTaskPosition = useCallback((task: typeof projectTasks[0]) => {
    return { left: getDateLeft(new Date(task.startDateTime)) }
  }, [getDateLeft])

  // 处理任务名称编辑
  const handleTaskNameClick = (e: React.MouseEvent, task: typeof projectTasks[0]) => {
    e.stopPropagation()
    setEditingTaskId(task.id)
    setEditingTitle(task.title)
  }

  const handleTaskNameSave = async () => {
    if (editingTaskId && editingTitle.trim()) {
      await updateTask(editingTaskId, { title: editingTitle.trim() })
      setEditingTaskId(null)
      setEditingTitle('')
    }
  }

  const handleTaskNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTaskNameSave()
    } else if (e.key === 'Escape') {
      setEditingTaskId(null)
      setEditingTitle('')
    }
  }

  // 处理任务点击
  const handleTaskClick = (e: React.MouseEvent, task: typeof projectTasks[0]) => {
    if (justResizedRef.current) {
      justResizedRef.current = false
      return
    }
    if (e.ctrlKey || e.metaKey) {
      if (dragStartTask && dragStartTask !== task.id) {
        // 弹出输入延迟天数
        const lagInput = prompt('Enter lag days (days to wait after predecessor completes, 0 = no lag):', '0')
        if (lagInput === null) {
          setDragStartTask(null)
          return
        }
        const lagDays = Math.max(0, parseInt(lagInput) || 0)
        addDependency(dragStartTask, task.id, lagDays)
        setDragStartTask(null)
      } else {
        setDragStartTask(task.id)
      }
    } else {
      setSelectedTaskId(task.id)
    }
  }

  const handleTaskDoubleClick = () => {
    // 已迁移到双击依赖连线删除，此处保留空实现
  }

  // 里程碑甘特内联编辑处理
  const handleGanttMilestoneClick = (e: React.MouseEvent, task: typeof projectTasks[0]) => {
    if (e.ctrlKey || e.metaKey) {
      // ctrl+click 仍走依赖逻辑
      handleTaskClick(e, task)
      return
    }
    e.stopPropagation()
    setGanttEditingId(task.id)
    setGanttEditingTitle(task.title)
  }

  const handleGanttMilestoneSave = async () => {
    if (ganttEditingId && ganttEditingTitle.trim()) {
      await updateTask(ganttEditingId, { title: ganttEditingTitle.trim() })
    }
    setGanttEditingId(null)
    setGanttEditingTitle('')
  }

  const handleGanttMilestoneKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleGanttMilestoneSave()
    } else if (e.key === 'Escape') {
      setGanttEditingId(null)
      setGanttEditingTitle('')
    }
  }

  // 里程碑日期编辑处理
  const handleMilestoneDateClick = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation()
    const d = new Date(task.startDateTime)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    setEditingDateId(task.id)
    setEditingDateValue(`${yyyy}-${mm}-${dd}`)
  }

  const handleMilestoneDateSave = async () => {
    if (editingDateId && editingDateValue) {
      const newDate = new Date(editingDateValue)
      if (!isNaN(newDate.getTime())) {
        await updateTask(editingDateId, {
          startDateTime: newDate,
          dueDateTime: newDate
        })
      }
    }
    setEditingDateId(null)
    setEditingDateValue('')
  }

  const handleMilestoneDateKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleMilestoneDateSave()
    } else if (e.key === 'Escape') {
      setEditingDateId(null)
      setEditingDateValue('')
    }
  }

  // 新增里程碑（按分组）
  const handleStartAddMilestone = (e: React.MouseEvent, bucketId: string) => {
    e.stopPropagation()
    const today = new Date()
    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate()).padStart(2, '0')
    setNewMilestoneDate(`${yyyy}-${mm}-${dd}`)
    setNewMilestoneTitle('')
    setAddingMilestoneBucketId(bucketId)
    // 确保分组展开
    useAppStore.getState().setBucketCollapsed(bucketId, false)
  }

  const handleSaveNewMilestone = async () => {
    if (!newMilestoneTitle.trim() || !newMilestoneDate || !currentProjectId || !addingMilestoneBucketId) {
      setAddingMilestoneBucketId(null)
      return
    }
    const date = new Date(newMilestoneDate)
    if (isNaN(date.getTime())) {
      setAddingMilestoneBucketId(null)
      return
    }
    await addTask({
      projectId: currentProjectId,
      bucketId: addingMilestoneBucketId,
      title: newMilestoneTitle.trim(),
      taskType: 'milestone',
      startDateTime: date,
      dueDateTime: date,
      status: 'NotStarted',
      priority: 'Normal',
      assigneeIds: [],
      labelIds: [],
      order: milestoneTasks.filter((t) => t.bucketId === addingMilestoneBucketId).length
    })
    setAddingMilestoneBucketId(null)
    setNewMilestoneTitle('')
    setNewMilestoneDate('')
  }

  const handleNewMilestoneKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveNewMilestone()
    } else if (e.key === 'Escape') {
      setAddingMilestoneBucketId(null)
      setNewMilestoneTitle('')
      setNewMilestoneDate('')
    }
  }

  // ── 新增里程碑分组 ──
  const handleStartAddMilestoneGroup = () => {
    setAddingMilestoneGroup(true)
    setNewMilestoneGroupName('')
    setNewMilestoneGroupColor('#d83b01')
  }

  const handleSaveMilestoneGroup = async () => {
    if (!newMilestoneGroupName.trim()) {
      setAddingMilestoneGroup(false)
      return
    }
    await addBucket({
      name: newMilestoneGroupName.trim(),
      order: milestoneBuckets.length,
      color: newMilestoneGroupColor,
      bucketType: 'milestone'
    })
    setAddingMilestoneGroup(false)
    setNewMilestoneGroupName('')
  }

  const handleMilestoneGroupKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveMilestoneGroup()
    } else if (e.key === 'Escape') {
      setAddingMilestoneGroup(false)
      setNewMilestoneGroupName('')
    }
  }

  // ── 分组名称编辑 ──
  const handleGroupNameClick = (e: React.MouseEvent, bucket: Bucket) => {
    e.stopPropagation()
    setEditingGroupId(bucket.id)
    setEditingGroupName(bucket.name)
  }

  const handleGroupNameSave = async () => {
    if (editingGroupId && editingGroupName.trim()) {
      await updateBucket(editingGroupId, { name: editingGroupName.trim() })
    }
    setEditingGroupId(null)
    setEditingGroupName('')
  }

  const handleGroupNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleGroupNameSave()
    } else if (e.key === 'Escape') {
      setEditingGroupId(null)
      setEditingGroupName('')
    }
  }

  // ── 删除分组 ──
  const handleDeleteGroup = async (e: React.MouseEvent, bucketId: string) => {
    e.stopPropagation()
    const tasksInBucket = regularTasks.filter((t) => t.bucketId === bucketId)
    const msg = tasksInBucket.length > 0
      ? `This group contains ${tasksInBucket.length} task(s). Deleting the group will also delete all tasks. Continue?`
      : 'Are you sure you want to delete this group?'
    if (confirm(msg)) {
      await deleteBucket(bucketId)
    }
  }

  // ── 新增分组 ──
  const handleStartAddGroup = () => {
    setAddingGroup(true)
    setNewGroupName('')
  }

  const handleSaveNewGroup = async () => {
    if (!newGroupName.trim()) {
      setAddingGroup(false)
      return
    }
    await addBucket({
      name: newGroupName.trim(),
      order: projectBuckets.length,
      color: '#0078d4'
    })
    setAddingGroup(false)
    setNewGroupName('')
  }

  const handleNewGroupKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveNewGroup()
    } else if (e.key === 'Escape') {
      setAddingGroup(false)
      setNewGroupName('')
    }
  }

  // ── 新增任务（按分组） ──
  const handleStartAddTask = (e: React.MouseEvent, bucketId: string) => {
    e.stopPropagation()
    e.preventDefault()
    // 确保分组展开
    useAppStore.getState().setBucketCollapsed(bucketId, false)
    const today = new Date()
    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate()).padStart(2, '0')
    setAddingTaskBucketId(bucketId)
    setNewTaskTitle('')
    setNewTaskStartDate(`${yyyy}-${mm}-${dd}`)
    // 默认持续 7 天
    const end = new Date(today)
    end.setDate(end.getDate() + 7)
    const ey = end.getFullYear()
    const em = String(end.getMonth() + 1).padStart(2, '0')
    const ed = String(end.getDate()).padStart(2, '0')
    setNewTaskEndDate(`${ey}-${em}-${ed}`)
  }

  const handleSaveNewTask = async () => {
    if (!newTaskTitle.trim()) {
      alert('Please enter a task name')
      return
    }
    if (!newTaskStartDate || !newTaskEndDate) {
      alert('Please select start and end dates')
      return
    }
    if (!currentProjectId) {
      alert('Please select a project first')
      setAddingTaskBucketId(null)
      return
    }
    if (!addingTaskBucketId) {
      setAddingTaskBucketId(null)
      return
    }
    const sDate = new Date(newTaskStartDate)
    const eDate = new Date(newTaskEndDate)
    if (isNaN(sDate.getTime()) || isNaN(eDate.getTime())) {
      alert('Invalid date format')
      return
    }
    const tasksInBucket = regularTasks.filter((t) => t.bucketId === addingTaskBucketId)
    await addTask({
      projectId: currentProjectId,
      bucketId: addingTaskBucketId,
      title: newTaskTitle.trim(),
      taskType: 'task',
      startDateTime: sDate,
      dueDateTime: eDate,
      status: 'NotStarted',
      priority: 'Normal',
      assigneeIds: [],
      labelIds: [],
      order: tasksInBucket.length
    })
    setAddingTaskBucketId(null)
    setNewTaskTitle('')
    setNewTaskStartDate('')
    setNewTaskEndDate('')
  }

  const handleNewTaskKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveNewTask()
    } else if (e.key === 'Escape') {
      setAddingTaskBucketId(null)
      setNewTaskTitle('')
      setNewTaskStartDate('')
      setNewTaskEndDate('')
    }
  }

  // ── 分组拖拽排序 ──
  const handleGroupDragStart = (e: React.DragEvent, bucketId: string) => {
    e.stopPropagation()
    setDraggingGroupId(bucketId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', bucketId)
  }

  const handleGroupDragOver = (e: React.DragEvent, bucketId: string) => {
    if (!draggingGroupId || draggingGroupId === bucketId) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    // 判断鼠标在目标行的上半/下半
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const midY = rect.top + rect.height / 2
    setDragOverPosition(e.clientY < midY ? 'above' : 'below')
    setDragOverGroupId(bucketId)
  }

  const handleGroupDragLeave = () => {
    setDragOverGroupId(null)
  }

  const handleGroupDrop = async (e: React.DragEvent, targetBucketId: string) => {
    e.preventDefault()
    if (!draggingGroupId || draggingGroupId === targetBucketId) {
      setDraggingGroupId(null)
      setDragOverGroupId(null)
      return
    }
    // 计算新顺序
    const ordered = [...projectBuckets]
    const dragIdx = ordered.findIndex((b) => b.id === draggingGroupId)
    const dropIdx = ordered.findIndex((b) => b.id === targetBucketId)
    if (dragIdx === -1 || dropIdx === -1) return
    // 取出拖拽项
    const [dragged] = ordered.splice(dragIdx, 1)
    // 插入到目标位置
    const insertIdx = dragOverPosition === 'above' ? ordered.findIndex((b) => b.id === targetBucketId) : ordered.findIndex((b) => b.id === targetBucketId) + 1
    ordered.splice(insertIdx, 0, dragged)
    // 按新序号更新所有 bucket 的 order
    for (let i = 0; i < ordered.length; i++) {
      if (ordered[i].order !== i) {
        await updateBucket(ordered[i].id, { order: i })
      }
    }
    setDraggingGroupId(null)
    setDragOverGroupId(null)
  }

  const handleGroupDragEnd = () => {
    setDraggingGroupId(null)
    setDragOverGroupId(null)
  }

  // ── 任务条拖拽调整时长 ──
  const handleResizeMouseDown = useCallback((e: React.MouseEvent, task: Task, handle: 'left' | 'right') => {
    e.stopPropagation()
    e.preventDefault()
    resizingRef.current = {
      taskId: task.id,
      handle,
      startX: e.clientX,
      origStart: new Date(task.startDateTime),
      origEnd: new Date(task.dueDateTime),
    }
    const preview = { taskId: task.id, start: new Date(task.startDateTime), end: new Date(task.dueDateTime) }
    resizePreviewRef.current = preview
    setResizePreview(preview)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingRef.current) return
      const { taskId, handle, startX, origStart, origEnd } = resizingRef.current
      const deltaX = e.clientX - startX
      const deltaDays = Math.round(deltaX / weekWidth)
      let newStart = origStart
      let newEnd = origEnd
      if (handle === 'right') {
        newEnd = new Date(origEnd)
        newEnd.setDate(newEnd.getDate() + deltaDays)
        const minEnd = new Date(origStart)
        minEnd.setDate(minEnd.getDate() + 1)
        if (newEnd < minEnd) newEnd = minEnd
      } else {
        newStart = new Date(origStart)
        newStart.setDate(newStart.getDate() + deltaDays)
        const maxStart = new Date(origEnd)
        maxStart.setDate(maxStart.getDate() - 1)
        if (newStart > maxStart) newStart = maxStart
      }
      const preview = { taskId, start: newStart, end: newEnd }
      resizePreviewRef.current = preview
      setResizePreview({ ...preview })
    }

    const handleMouseUp = async () => {
      if (!resizingRef.current) return
      const preview = resizePreviewRef.current
      resizingRef.current = null
      resizePreviewRef.current = null
      setResizePreview(null)
      if (preview) {
        justResizedRef.current = true
        await updateTask(preview.taskId, { startDateTime: preview.start, dueDateTime: preview.end })
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [weekWidth, updateTask])

  // ── 删除任务 ──
  const handleDeleteTask = async (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this task?')) {
      await deleteTask(taskId)
    }
  }

  // ── Column resize (task name ↔ progress boundary) ──
  const handleColResizeDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    colResizeRef.current = { startX: e.clientX, startWidth: taskListWidth }
    const onMove = (ev: MouseEvent) => {
      if (!colResizeRef.current) return
      const delta = ev.clientX - colResizeRef.current.startX
      setTaskListWidth(Math.max(200, Math.min(600, colResizeRef.current.startWidth + delta)))
    }
    const onUp = () => {
      colResizeRef.current = null
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [taskListWidth])

  // 计算依赖连线坐标 + 约束违反检测
  // SVG 从 (top: HEADER_HEIGHT, left: 0) 开始, Y 无需加偏移
  const TASK_LIST_WIDTH = taskListWidth
  const HEADER_HEIGHT = 44 // 月(24) + 周(20)
  const dependencyLines = useMemo(() => {
    const lines: {
      fromX: number; fromY: number; toX: number; toY: number
      lagDays: number       // 约束延迟天数
      violated: boolean     // 是否违反约束
      delayDays: number     // 违反的天数
      depTaskTitle: string  // 前序任务名
      taskTitle: string     // 当前任务名
      taskId: string        // 当前任务 ID
      depTaskId: string     // 前序任务 ID
    }[] = []
    projectTasks.forEach((task) => {
      if (!task.dependencyTaskIds?.length) return
      task.dependencyTaskIds.forEach((depId) => {
        const depTask = projectTasks.find((t) => t.id === depId)
        if (!depTask) return
        const fromRowIndex = getTaskRowIndex(depTask.id)
        const toRowIndex   = getTaskRowIndex(task.id)
        if (fromRowIndex === -1 || toRowIndex === -1) return
        // fromX = 被依赖任务条的右端（结束日期位置）
        // getDateLeft(dueDate) 已经是右端，无需再加 duration
        const depEnd = depTask.taskType === 'milestone'
          ? getDateLeft(new Date(depTask.startDateTime))
          : getDateLeft(new Date(depTask.startDateTime)) + getDaysBetween(new Date(depTask.startDateTime), new Date(depTask.dueDateTime)) * weekWidth
        const fromX = depEnd + TASK_LIST_WIDTH
        const toX   = getDateLeft(new Date(task.startDateTime)) + TASK_LIST_WIDTH
        // Y: SVG top = HEADER_HEIGHT, 所以 Y 不需要再加 HEADER_HEIGHT
        const fromY = fromRowIndex * 36 + 18
        const toY   = toRowIndex   * 36 + 18

        // 查找 lag 约束
        const dep = (task.dependencies || []).find((d) => (typeof d === 'string' ? d === depId : d.taskId === depId))
        const lagDays = typeof dep === 'string' ? 0 : dep?.lagDays || 0

        // 计算违反情况：前序结束日 + lagDays 应 <= 当前任务开始日
        // 即使 lagDays=0，如果后继任务在前序结束前就开始，也是违反
        const depEndDate = new Date(depTask.dueDateTime)
        const taskStartDate = new Date(task.startDateTime)
        const actualGapDays = getDaysBetween(depEndDate, taskStartDate)
        const violated = actualGapDays < lagDays
        const delayDays = violated ? lagDays - actualGapDays : 0

        lines.push({ fromX, fromY, toX, toY, lagDays, violated, delayDays, depTaskTitle: depTask.title, taskTitle: task.title, taskId: task.id, depTaskId: depId })
      })
    })
    return lines
  }, [projectTasks, getDateLeft, weekWidth, getTaskRowIndex])

  // 获取当前项目名称用于导出文件名
  const projectName = currentProject?.name || 'Gantt Chart'
  const sanitizedProjectName = projectName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')

  // 导出处理函数（懒加载 exportGantt，避免 jspdf/html2canvas 打入主包）
  const handleExportAsPNG = async () => {
    if (!ganttScrollRef.current) return
    const { exportAsImage } = await import('@/utils/exportGantt')
    await exportAsImage(ganttScrollRef.current, `${sanitizedProjectName}_gantt`, 'png', TASK_LIST_WIDTH)
  }

  const handleExportAsJPEG = async () => {
    if (!ganttScrollRef.current) return
    const { exportAsImage } = await import('@/utils/exportGantt')
    await exportAsImage(ganttScrollRef.current, `${sanitizedProjectName}_gantt`, 'jpeg', TASK_LIST_WIDTH)
  }

  const handleExportAsPDF = async () => {
    if (!ganttScrollRef.current) return
    const { exportAsPDF } = await import('@/utils/exportGantt')
    await exportAsPDF(ganttScrollRef.current, `${sanitizedProjectName}_gantt`, TASK_LIST_WIDTH)
  }

  return (
    <>
      <div className={`${styles.ganttView} ${resizePreview ? styles.ganttResizing : ''}`} ref={ganttRef} style={{ '--task-list-width': `${TASK_LIST_WIDTH}px` } as React.CSSProperties}>
      {/* ── 单一滚动容器：同时承载左侧冻结列和右侧时间轴 ── */}
      <div className={styles.ganttScroll} ref={ganttScrollRef}>
        <div className={styles.ganttInner} style={{ width: `${TASK_LIST_WIDTH + totalWidth}px` }}>

          {/* ── 吸顶表头行 ── */}
          <div className={styles.stickyHeader}>
            {/* 左侧冻结角 */}
            <div className={styles.stickyCorner}>
              <div className={styles.headerCell}>Task Name</div>
              <div className={styles.colResizeHandle} onMouseDown={handleColResizeDown} />
              <div className={styles.headerCellNarrow}>Progress</div>
            </div>
            {/* 时间轴表头 */}
            <div className={styles.stickyTimelineHeader} style={{ width: `${totalWidth}px` }}>
              <div className={styles.timelineHeaderMonth}>
                {monthInfo.map((month) => (
                  <div
                    key={`${month.year}-${month.month}`}
                    className={styles.monthCell}
                    style={{ width: `${month.dayCount * weekWidth}px` }}
                  >
                    {month.name}
                  </div>
                ))}
              </div>
              <div className={styles.timelineHeaderWeek}>
                {weekInfo.map((week) => (
                  <div
                    key={week.weekNum}
                    className={styles.weekCell}
                    style={{ width: `${week.dayCount * weekWidth}px` }}
                  >
                    W{week.weekNum}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── 背景网格（绝对定位覆盖数据行区域）── */}
          <div
            className={styles.gridOverlay}
            style={{
              left: `${TASK_LIST_WIDTH}px`,
              width: `${totalWidth}px`,
              height: `${rowItems.length * 36}px`
            }}
          >
            {weekInfo.map((week) => (
              <div
                key={week.weekNum}
                className={styles.gridWeek}
                style={{ left: `${week.startIndex * weekWidth}px`, width: `${week.dayCount * weekWidth}px` }}
              />
            ))}
            {dateInfo.map((info, index) =>
              isToday(info.date) ? (
                <div
                  key="today"
                  className={styles.todayLine}
                  style={{ left: `${index * weekWidth + weekWidth / 2}px` }}
                >
                  <span className={styles.todayLabel}>Today</span>
                </div>
              ) : null
            )}
          </div>

          {/* ── Vertical marker lines (full height, spanning header + data) ── */}
          <div
            className={styles.verticalMarkerLayer}
            style={{
              left: `${TASK_LIST_WIDTH}px`,
              width: `${totalWidth}px`,
              height: `${HEADER_HEIGHT + rowItems.length * 36}px`
            }}
          >
            {/* ── 周背景网格竖线（贯穿全高）── */}
            {weekInfo.map((week) => (
              <div
                key={`wgl-${week.weekNum}-${week.startIndex}`}
                className={styles.weekGridLine}
                style={{ left: `${week.startIndex * weekWidth}px` }}
              />
            ))}
            {verticalMarkers.map((marker) => {
              const mParts = marker.date.split('-').map(Number)
              const markerDate = new Date(mParts[0], mParts[1] - 1, mParts[2])
              const left = getDateLeft(markerDate)
              if (left < 0 || left > totalWidth) return null
              return (
                <div
                  key={marker.id}
                  className={styles.verticalMarker}
                  style={{ left: `${left}px`, '--marker-color': marker.color, '--marker-thickness': `${marker.thickness || 2}px` } as React.CSSProperties}
                >
                  <span className={styles.verticalMarkerLabel} style={{ background: marker.color }}>
                    {marker.label}
                    <button
                      className={styles.verticalMarkerRemove}
                      onClick={() => deleteMarker(marker.id)}
                    >×</button>
                  </span>
                </div>
              )
            })}
          </div>

          {/* ── 数据行：每行同时包含左侧信息格和右侧任务条 ── */}
          {rowItems.map((row) => {
            /* ── 里程碑分组标题行 ── */
            if (row.kind === 'milestone-group') {
              const bucketColor = row.bucket.color || '#d83b01'
              const isDragging = draggingGroupId === row.bucket.id
              const isDragOver = dragOverGroupId === row.bucket.id
              return (
                <div
                  key={`ms-group-${row.bucket.id}`}
                  className={`${styles.dataRow} ${styles.milestoneGroupRow} ${isDragging ? styles.groupDragging : ''} ${isDragOver ? (dragOverPosition === 'above' ? styles.groupDragOverAbove : styles.groupDragOverBelow) : ''}`}
                  onDragOver={(e) => handleGroupDragOver(e, row.bucket.id)}
                  onDragLeave={handleGroupDragLeave}
                  onDrop={(e) => handleGroupDrop(e, row.bucket.id)}
                >
                  <div
                    className={`${styles.frozenCell} ${styles.frozenGroupCell} ${styles.frozenMilestoneGroupCell}`}
                    onClick={() => toggleBucket(row.bucket.id)}
                  >
                    <span
                      className={styles.dragHandle}
                      draggable
                      onDragStart={(e) => handleGroupDragStart(e, row.bucket.id)}
                      onDragEnd={handleGroupDragEnd}
                      onClick={(e) => e.stopPropagation()}
                      title="Drag to reorder"
                    >
                      ⠿
                    </span>
                    <span className={styles.milestoneGroupIcon} style={{ color: bucketColor }}>◆</span>
                    {editingGroupId === row.bucket.id ? (
                      <input
                        type="text"
                        className={styles.groupNameInput}
                        value={editingGroupName}
                        onChange={(e) => setEditingGroupName(e.target.value)}
                        onBlur={handleGroupNameSave}
                        onKeyDown={handleGroupNameKeyDown}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                    ) : (
                      <span
                        className={styles.groupNameEditable}
                        onClick={(e) => handleGroupNameClick(e, row.bucket)}
                        title="Click to rename group"
                      >
                        {row.bucket.name}
                      </span>
                    )}
                    <span className={styles.groupCount}>{row.tasks.length}</span>
                    {/* 颜色选择 */}
                    <input
                      type="color"
                      className={styles.milestoneColorPicker}
                      value={bucketColor}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => updateBucket(row.bucket.id, { color: e.target.value })}
                      title="Change marker color"
                    />
                    <button
                      className={styles.addMilestoneBtn}
                      onClick={(e) => handleStartAddMilestone(e, row.bucket.id)}
                      title="Add milestone"
                    >+</button>
                    <button
                      className={`${styles.groupActionBtn} ${styles.groupDeleteBtn}`}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => handleDeleteGroup(e, row.bucket.id)}
                      title="Delete milestone group"
                    >×</button>
                    <span className={`${styles.groupChevron} ${collapsedBuckets.has(row.bucket.id) ? styles.groupChevronCollapsed : ''}`}>
                      ▾
                    </span>
                  </div>
                  <div className={`${styles.timelineGroupCell} ${styles.timelineMilestoneGroupCell}`} style={{ width: `${totalWidth}px` }}>
                    <span
                      className={styles.timelineGroupLabel}
                      style={{ borderLeftColor: bucketColor }}
                    >
                      {row.bucket.name}
                      {collapsedBuckets.has(row.bucket.id) && (
                        <span className={styles.timelineGroupCollapsed}> · {row.tasks.length} collapsed</span>
                      )}
                    </span>
                    {/* 折叠时在分组行内显示所有里程碑示意（带标签） */}
                    {collapsedBuckets.has(row.bucket.id) && row.tasks.map((ms) => (
                      <div
                        key={ms.id}
                        className={styles.collapsedMilestoneMarker}
                        style={{ left: `${getDateLeft(new Date(ms.startDateTime))}px` }}
                        title={`${ms.title} · ${new Date(ms.startDateTime).toLocaleDateString('en-US')}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedTaskId(ms.id)
                        }}
                      >
                        <div className={styles.milestoneDiamond} style={{ backgroundColor: bucketColor }} />
                        <span className={styles.collapsedMilestoneLabel} style={{ color: bucketColor }}>{ms.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            }

            /* ── 里程碑行 ── */
            if (row.kind === 'milestone') {
              const msColor = row.bucketColor || '#d83b01'
              return (
                <div
                  key={row.task.id}
                  className={`${styles.dataRow} ${styles.milestoneRow} ${dragStartTask === row.task.id ? styles.isDragging : ''}`}
                >
                  <div className={`${styles.frozenCell} ${styles.frozenTaskCell} ${styles.frozenMilestoneCell}`}>
                    <div className={styles.taskName}>
                      <span className={styles.milestoneIndicator} style={{ color: msColor }}>◆</span>
                      {editingTaskId === row.task.id ? (
                        <input
                          type="text"
                          className={styles.taskNameInput}
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onBlur={handleTaskNameSave}
                          onKeyDown={handleTaskNameKeyDown}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                        />
                      ) : (
                        <span
                          className={`${styles.taskNameText} ${styles.milestoneNameText}`}
                          style={{ color: msColor }}
                          onClick={(e) => handleTaskNameClick(e, row.task)}
                        >
                          {row.task.title}
                        </span>
                      )}
                      <button
                        className={styles.taskDeleteBtn}
                        onClick={(e) => handleDeleteTask(e, row.task.id)}
                        title="Delete milestone"
                      >×</button>
                    </div>
                    <div className={styles.milestoneDate}>
                      {editingDateId === row.task.id ? (
                        <input
                          type="date"
                          className={styles.milestoneDateInput}
                          value={editingDateValue}
                          onChange={(e) => setEditingDateValue(e.target.value)}
                          onBlur={handleMilestoneDateSave}
                          onKeyDown={handleMilestoneDateKeyDown}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                        />
                      ) : (
                        <span
                          className={styles.milestoneDateText}
                          onClick={(e) => handleMilestoneDateClick(e, row.task)}
                          title="Click to edit date"
                        >
                          {new Date(row.task.startDateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={`${styles.timelineTaskCell} ${styles.timelineMilestoneCell}`} style={{ width: `${totalWidth}px` }}>
                    <div
                      className={`${styles.milestone} ${dragStartTask === row.task.id ? styles.isDragging : ''}`}
                      style={{ left: `${getTaskPosition(row.task).left}px` }}
                      onClick={(e) => handleGanttMilestoneClick(e, row.task)}
                      onDoubleClick={() => handleTaskDoubleClick()}
                      title={ganttEditingId === row.task.id ? undefined : `${row.task.title} · ${new Date(row.task.startDateTime).toLocaleDateString('en-US')} · Click to edit`}
                    >
                      <div className={`${styles.milestoneDiamond} ${styles.milestoneDiamondLg}`} style={{ backgroundColor: msColor }} />
                      {ganttEditingId === row.task.id ? (
                        <input
                          className={styles.milestoneInlineInput}
                          value={ganttEditingTitle}
                          onChange={(e) => setGanttEditingTitle(e.target.value)}
                          onBlur={handleGanttMilestoneSave}
                          onKeyDown={handleGanttMilestoneKeyDown}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                        />
                      ) : (
                        <span className={styles.milestoneLabel} style={{ color: msColor }}>{row.task.title}</span>
                      )}
                    </div>
                    {/* 里程碑垂直参考线 */}
                    <div
                      className={styles.milestoneRefLine}
                      style={{ left: `${getTaskPosition(row.task).left}px` }}
                    />
                  </div>
                </div>
              )
            }

            /* ── 新增里程碑行 ── */
            if (row.kind === 'add-milestone') {
              return (
                <div key={`add-milestone-${row.bucketId}`} className={`${styles.dataRow} ${styles.milestoneRow}`}>
                  <div className={`${styles.frozenCell} ${styles.frozenTaskCell} ${styles.frozenMilestoneCell}`}>
                    <div className={styles.taskName}>
                      <span className={styles.milestoneIndicator}>◆</span>
                      <input
                        type="text"
                        className={styles.taskNameInput}
                        value={newMilestoneTitle}
                        onChange={(e) => setNewMilestoneTitle(e.target.value)}
                        onKeyDown={handleNewMilestoneKeyDown}
                        placeholder="Milestone name..."
                        autoFocus
                      />
                    </div>
                    <div className={styles.milestoneDate}>
                      <input
                        type="date"
                        className={styles.milestoneDateInput}
                        value={newMilestoneDate}
                        onChange={(e) => setNewMilestoneDate(e.target.value)}
                        onKeyDown={handleNewMilestoneKeyDown}
                      />
                    </div>
                  </div>
                  <div className={`${styles.timelineTaskCell} ${styles.timelineMilestoneCell}`} style={{ width: `${totalWidth}px` }}>
                    <div className={styles.addMilestoneActions}>
                      <button className={styles.addMilestoneSave} onClick={handleSaveNewMilestone}>✓ Save</button>
                      <button className={styles.addMilestoneCancel} onClick={() => { setAddingMilestoneBucketId(null); setNewMilestoneTitle(''); setNewMilestoneDate('') }}>✕ Cancel</button>
                    </div>
                  </div>
                </div>
              )
            }

            /* ── 新增里程碑分组行 ── */
            if (row.kind === 'add-milestone-group') {
              return (
                <div key="add-milestone-group" className={`${styles.dataRow} ${styles.milestoneGroupRow}`}>
                  <div className={`${styles.frozenCell} ${styles.frozenGroupCell} ${styles.frozenMilestoneCell}`}>
                    <div className={styles.milestoneGroupInputRow}>
                      <input
                        type="color"
                        className={styles.milestoneColorPicker}
                        value={newMilestoneGroupColor}
                        onChange={(e) => setNewMilestoneGroupColor(e.target.value)}
                        title="Choose marker color"
                      />
                      <input
                        type="text"
                        className={styles.taskNameInput}
                        value={newMilestoneGroupName}
                        onChange={(e) => setNewMilestoneGroupName(e.target.value)}
                        onKeyDown={handleMilestoneGroupKeyDown}
                        placeholder="Milestone group name..."
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className={`${styles.timelineGroupCell} ${styles.timelineMilestoneGroupCell}`} style={{ width: `${totalWidth}px` }}>
                    <div className={styles.addMilestoneActions}>
                      <button className={styles.addMilestoneSave} onClick={handleSaveMilestoneGroup}>✓ Create Group</button>
                      <button className={styles.addMilestoneCancel} onClick={() => { setAddingMilestoneGroup(false); setNewMilestoneGroupName(''); setNewMilestoneGroupColor('#d83b01') }}>✕ Cancel</button>
                    </div>
                  </div>
                </div>
              )
            }

            /* ── 普通分组标题行 ── */
            if (row.kind === 'group') {
              const isDragging = draggingGroupId === row.bucket.id
              const isDragOver = dragOverGroupId === row.bucket.id
              return (
                <div
                  key={`group-${row.bucket.id}`}
                  className={`${styles.dataRow} ${isDragging ? styles.groupDragging : ''} ${isDragOver ? (dragOverPosition === 'above' ? styles.groupDragOverAbove : styles.groupDragOverBelow) : ''}`}
                  onDragOver={(e) => handleGroupDragOver(e, row.bucket.id)}
                  onDragLeave={handleGroupDragLeave}
                  onDrop={(e) => handleGroupDrop(e, row.bucket.id)}
                >
                  <div
                    className={`${styles.frozenCell} ${styles.frozenGroupCell}`}
                    onClick={() => toggleBucket(row.bucket.id)}
                  >
                    <span
                      className={styles.dragHandle}
                      draggable
                      onDragStart={(e) => handleGroupDragStart(e, row.bucket.id)}
                      onDragEnd={handleGroupDragEnd}
                      onClick={(e) => e.stopPropagation()}
                      title="Drag to reorder"
                    >
                      ⠿
                    </span>
                    <input
                      type="color"
                      className={styles.milestoneColorPicker}
                      value={row.bucket.color || '#a19f9d'}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => updateBucket(row.bucket.id, { color: e.target.value })}
                      title="Change group color"
                    />
                    {editingGroupId === row.bucket.id ? (
                      <input
                        type="text"
                        className={styles.groupNameInput}
                        value={editingGroupName}
                        onChange={(e) => setEditingGroupName(e.target.value)}
                        onBlur={handleGroupNameSave}
                        onKeyDown={handleGroupNameKeyDown}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                    ) : (
                      <span
                        className={styles.groupNameEditable}
                        onClick={(e) => handleGroupNameClick(e, row.bucket)}
                        title="Click to rename group"
                      >
                        {row.bucket.name}
                      </span>
                    )}
                    <span className={styles.groupCount}>{row.tasks.length}</span>
                    <button
                      className={styles.groupActionBtn}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => handleStartAddTask(e, row.bucket.id)}
                      title="Add task"
                    >+</button>
                    <button
                      className={`${styles.groupActionBtn} ${styles.groupDeleteBtn}`}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => handleDeleteGroup(e, row.bucket.id)}
                      title="Delete group"
                    >×</button>
                    <span className={`${styles.groupChevron} ${collapsedBuckets.has(row.bucket.id) ? styles.groupChevronCollapsed : ''}`}>
                      ▾
                    </span>
                  </div>
                  <div className={styles.timelineGroupCell} style={{ width: `${totalWidth}px` }}>
                    <span
                      className={styles.timelineGroupLabel}
                      style={{ borderLeftColor: row.bucket.color || '#a19f9d' }}
                    >
                      {row.bucket.name}
                      {collapsedBuckets.has(row.bucket.id) && (
                        <span className={styles.timelineGroupCollapsed}> · {row.tasks.length} collapsed</span>
                      )}
                    </span>
                  </div>
                </div>
              )
            }

            /* ── 新增任务行 ── */
            if (row.kind === 'add-task') {
              return (
                <div key={`add-task-${row.bucketId}`} className={styles.dataRow}>
                  <div className={`${styles.frozenCell} ${styles.frozenTaskCell}`}>
                    <div className={styles.taskName}>
                      <span className={styles.addTaskIndicator}>+</span>
                      <input
                        type="text"
                        className={styles.taskNameInput}
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        onKeyDown={handleNewTaskKeyDown}
                        placeholder="Task name..."
                        autoFocus
                      />
                    </div>
                    <div className={styles.addTaskDates}>
                      <input
                        type="date"
                        className={styles.addTaskDateInput}
                        value={newTaskStartDate}
                        onChange={(e) => setNewTaskStartDate(e.target.value)}
                        onKeyDown={handleNewTaskKeyDown}
                        title="Start date"
                      />
                    </div>
                  </div>
                  <div className={styles.timelineTaskCell} style={{ width: `${totalWidth}px` }}>
                    <div className={styles.addMilestoneActions}>
                      <input
                        type="date"
                        className={styles.addTaskDateInput}
                        value={newTaskEndDate}
                        onChange={(e) => setNewTaskEndDate(e.target.value)}
                        onKeyDown={handleNewTaskKeyDown}
                        title="End date"
                      />
                      <button className={styles.addMilestoneSave} onClick={handleSaveNewTask}>✓ Save</button>
                      <button className={styles.addMilestoneCancel} onClick={() => { setAddingTaskBucketId(null); setNewTaskTitle(''); }}>✕ Cancel</button>
                    </div>
                  </div>
                </div>
              )
            }

            /* ── 新增分组行 ── */
            if (row.kind === 'add-group') {
              return (
                <div key="add-group" className={styles.dataRow}>
                  <div className={`${styles.frozenCell} ${styles.frozenGroupCell}`}>
                    <span className={styles.groupColor} style={{ backgroundColor: '#0078d4' }} />
                    <input
                      type="text"
                      className={styles.groupNameInput}
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      onKeyDown={handleNewGroupKeyDown}
                      placeholder="Group name..."
                      autoFocus
                    />
                    <button className={styles.addMilestoneSave} onClick={handleSaveNewGroup}>✓</button>
                    <button className={styles.addMilestoneCancel} onClick={() => { setAddingGroup(false); setNewGroupName('') }}>✕</button>
                  </div>
                  <div className={styles.timelineGroupCell} style={{ width: `${totalWidth}px` }} />
                </div>
              )
            }

            /* ── 普通任务行 ── */
            {
              const isPreviewing = resizePreview?.taskId === row.task.id
              const dispStart = isPreviewing ? resizePreview!.start : new Date(row.task.startDateTime)
              const dispEnd   = isPreviewing ? resizePreview!.end   : new Date(row.task.dueDateTime)
              const barLeft  = getDateLeft(dispStart)
              const barWidth = Math.max(getDaysBetween(dispStart, dispEnd) * weekWidth, weekWidth)
              const days  = getDaysBetween(dispStart, dispEnd)
              const weeks = days / 7
              return (
                <div
                  key={row.task.id}
                  className={`${styles.dataRow} ${styles.taskRow} ${dragStartTask === row.task.id ? styles.isDragging : ''}`}
                >
                  <div className={`${styles.frozenCell} ${styles.frozenTaskCell}`}>
                    <div className={styles.taskName}>
                      <span
                        className={styles.priorityIndicator}
                        style={{ backgroundColor: PRIORITY_COLORS[row.task.priority] }}
                      />
                      {editingTaskId === row.task.id ? (
                        <input
                          type="text"
                          className={styles.taskNameInput}
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onBlur={handleTaskNameSave}
                          onKeyDown={handleTaskNameKeyDown}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                        />
                      ) : (
                        <span
                          className={styles.taskNameText}
                          onClick={(e) => handleTaskNameClick(e, row.task)}
                        >
                          {row.task.title}
                        </span>
                      )}
                      <button
                        className={styles.taskDeleteBtn}
                        onClick={(e) => handleDeleteTask(e, row.task.id)}
                        title="Delete task"
                      >×</button>
                    </div>
                    <div className={styles.taskProgress}>
                      <div className={styles.progressBarSmall}>
                        <div
                          className={styles.progressBarFill}
                          style={{ width: `${row.task.completedPercent || 0}%` }}
                        />
                      </div>
                      <span className={styles.progressText}>{row.task.completedPercent || 0}%</span>
                    </div>
                  </div>

                  <div className={styles.timelineTaskCell} style={{ width: `${totalWidth}px` }}>
                    <div
                      className={`${styles.taskBar} ${dragStartTask === row.task.id ? styles.isDragging : ''} ${isPreviewing ? styles.taskBarResizing : ''}`}
                      style={{
                        left: `${barLeft}px`,
                        width: `${barWidth}px`,
                        backgroundColor: row.task.color || '#0078d4'
                      }}
                      onClick={(e) => handleTaskClick(e, row.task)}
                      onDoubleClick={() => handleTaskDoubleClick()}
                      title={`${row.task.title}\n${dispStart.toLocaleDateString('en-US')} - ${dispEnd.toLocaleDateString('en-US')}`}
                    >
                      {(row.task.completedPercent || 0) > 0 && (
                        <div
                          className={styles.taskBarProgress}
                          style={{
                            width: `${row.task.completedPercent}%`,
                            backgroundColor: STATUS_COLORS[row.task.status]
                          }}
                        />
                      )}
                      {/* 左侧拖拽调整手柄 */}
                      <div
                        className={styles.taskBarResizeLeft}
                        onMouseDown={(e) => handleResizeMouseDown(e, row.task, 'left')}
                        title="Drag to adjust start date"
                      />
                      <span className={styles.taskBarLabel}>{row.task.title}</span>
                      {row.task.deadlineConstraint && (() => {
                        const refTask = tasks.find((t) => t.id === row.task.deadlineConstraint!.refTaskId)
                        if (!refTask) return null
                        const c = row.task.deadlineConstraint!
                        return (
                          <span className={styles.taskBarConstraint} title={`${c.type === 'before' ? 'Before' : 'After'} ${refTask.title} by ${c.offsetWeeks} week(s)`}>
                            🔗{c.offsetWeeks}w
                          </span>
                        )
                      })()}
                      <span className={styles.taskBarDuration}>
                        {weeks >= 3 && days % 7 === 0
                          ? `${weeks}w`
                          : days < 21
                          ? `${days}d`
                          : `${weeks.toFixed(1).replace(/\.0$/, '')}w`}
                      </span>
                      {/* 右侧拖拽调整手柄 */}
                      <div
                        className={styles.taskBarResizeRight}
                        onMouseDown={(e) => handleResizeMouseDown(e, row.task, 'right')}
                        title="Drag to adjust end date"
                      />
                    </div>
                  </div>
                </div>
              )
            }
          })}

          {/* ── 依赖连线 SVG（绝对定位，覆盖数据行区域）── */}
          <svg
            className={styles.dependencySvg}
            style={{
              top: `${HEADER_HEIGHT}px`,
              width: `${TASK_LIST_WIDTH + totalWidth}px`,
              height: `${rowItems.length * 36}px`
            }}
          >
            <defs>
              <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#0078d4" />
              </marker>
              <marker id="arrowhead-red" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#e00" />
              </marker>
            </defs>
            {dependencyLines.map((line, index) => {
              const color = line.violated ? '#e00' : '#0078d4'
              // ── 直角折线路径 ──
              // 从前序任务结束 → 水平右移一小段 → 垂直到目标行 → 水平到目标任务起点
              const gap = 8 // 折角间距
              const path = line.fromY === line.toY
                ? `M ${line.fromX} ${line.fromY} L ${line.toX} ${line.toY}`
                : `M ${line.fromX} ${line.fromY} L ${line.fromX + gap} ${line.fromY} L ${line.fromX + gap} ${line.toY} L ${line.toX} ${line.toY}`

              // delay 标签位置：放在折线拐角处
              const labelX = line.fromX + gap + 3
              const labelY = (line.fromY + line.toY) / 2

              return (
                <g key={`dep-${index}`} className={styles.depLineGroup}>
                  {/* 透明加宽点击区域（双击删除依赖） */}
                  <path
                    d={path}
                    stroke="transparent"
                    strokeWidth={12}
                    fill="none"
                    style={{ cursor: 'pointer' }}
                    onDoubleClick={(e) => {
                      e.stopPropagation()
                      if (confirm(`Delete dependency:\n"${line.taskTitle}" depends on "${line.depTaskTitle}"?`)) {
                        removeDependency(line.taskId, line.depTaskId)
                      }
                    }}
                  >
                    <title>Double-click to delete: {line.depTaskTitle} → {line.taskTitle}{line.lagDays > 0 ? ` (delay ${line.lagDays}d)` : ''}</title>
                  </path>
                  {/* 可见连接线 */}
                  <path
                    d={path}
                    stroke={color}
                    strokeWidth={line.violated ? 2 : 1.5}
                    fill="none"
                    markerEnd={line.violated ? 'url(#arrowhead-red)' : 'url(#arrowhead)'}
                    className={styles.depLinePath}
                  />
                  {/* 起点圆圈 — 紧贴被依赖任务条右端 */}
                  <circle cx={line.fromX} cy={line.fromY} r="3" fill={color} />

                  {/* ── delay 标签（lagDays > 0 且满足约束时显示） ── */}
                  {line.lagDays > 0 && !line.violated && (
                    <g>
                      <rect
                        x={labelX - 2}
                        y={labelY - 8}
                        width={42}
                        height={16}
                        rx={3}
                        fill="#0078d4"
                        opacity={0.9}
                      />
                      <text
                        x={labelX + 19}
                        y={labelY + 3}
                        textAnchor="middle"
                        fill="#fff"
                        fontSize="9"
                        fontWeight="bold"
                      >
                        delay {line.lagDays}d
                      </text>
                    </g>
                  )}

                  {/* ── 违反约束时：红色延迟标签（无论 lagDays 是否 > 0） ── */}
                  {line.violated && (
                    <g>
                      {/* 如果有 lag 约束，先显示约束标签 */}
                      {line.lagDays > 0 && (
                        <>
                          <rect
                            x={labelX - 2}
                            y={labelY - 16}
                            width={42}
                            height={14}
                            rx={3}
                            fill="#0078d4"
                            opacity={0.7}
                          />
                          <text
                            x={labelX + 19}
                            y={labelY - 5}
                            textAnchor="middle"
                            fill="#fff"
                            fontSize="8"
                            fontWeight="bold"
                          >
                            delay {line.lagDays}d
                          </text>
                        </>
                      )}
                      {/* 延迟违反标签 — 始终显示 */}
                      <rect
                        x={labelX - 2}
                        y={line.lagDays > 0 ? labelY + 1 : labelY - 8}
                        width={48}
                        height={14}
                        rx={3}
                        fill="#e00"
                      />
                      <text
                        x={labelX + 22}
                        y={line.lagDays > 0 ? labelY + 12 : labelY + 3}
                        textAnchor="middle"
                        fill="#fff"
                        fontSize="8"
                        fontWeight="bold"
                      >
                        ⚠ -{line.delayDays}d
                      </text>
                    </g>
                  )}
                </g>
              )
            })}
          </svg>

        </div>
      </div>

      {/* 缩放控制栏（可拖拽悬浮） */}
      <div
        className={styles.zoomToolbar}
        style={{ left: toolbarPos.x, top: toolbarPos.y }}
        onMouseDown={handleToolbarMouseDown}
      >
        {/* 拖拽手柄 */}
        <div className={styles.toolbarDragHandle} title="拖拽移动工具栏">
          <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
            <circle cx="2" cy="2" r="1.2"/><circle cx="8" cy="2" r="1.2"/>
            <circle cx="2" cy="7" r="1.2"/><circle cx="8" cy="7" r="1.2"/>
            <circle cx="2" cy="12" r="1.2"/><circle cx="8" cy="12" r="1.2"/>
          </svg>
        </div>
        <div className={styles.zoomSeparator}></div>
        {/* 时间轴范围选择 */}
        <label className={styles.dateRangeLabel}>Start</label>
        <input
          type="date"
          className={styles.dateRangeInput}
          value={timelineStart}
          onChange={(e) => { setTimelineStart(e.target.value); saveTimeline(e.target.value, timelineEnd) }}
          title="Timeline start date"
        />
        <label className={styles.dateRangeLabel}>End</label>
        <input
          type="date"
          className={styles.dateRangeInput}
          value={timelineEnd}
          onChange={(e) => { setTimelineEnd(e.target.value); saveTimeline(timelineStart, e.target.value) }}
          title="Timeline end date"
        />
        <button className={styles.autoFitBtn} onClick={handleAutoFitTimeline} title="Auto-fit timeline from tasks">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 21l-4.35-4.35"/><circle cx="11" cy="11" r="8"/><path d="M11 8v6M8 11h6"/></svg>
          Auto Fit
        </button>
        <div className={styles.zoomSeparator}></div>
        <button className={styles.zoomBtn} onClick={handleCollapseAll} title="Collapse all">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16"/><path d="M20 6l-3 3-3-3" fill="currentColor" stroke="none"/></svg>
        </button>
        <button className={styles.zoomBtn} onClick={handleExpandAll} title="Expand all">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16"/><path d="M20 6l-3-3-3 3" fill="currentColor" stroke="none"/></svg>
        </button>
        <div className={styles.zoomSeparator}></div>
        <button className={styles.zoomBtn} onClick={handleZoomOut} disabled={zoomIndex === 0} title="Zoom out">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
        <button className={styles.zoomFitBtn} onClick={handleZoomFit} title="Fit to screen">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <polyline points="15 3 15 9 21 9"/>
            <polyline points="9 21 9 15 3 15"/>
          </svg>
        </button>
        <button className={styles.zoomBtn} onClick={handleZoomIn} disabled={zoomIndex === ZOOM_LEVELS.length - 1} title="Zoom in">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
        <span className={styles.zoomLevel}>{weekWidth}px/d</span>
        <div className={styles.zoomSeparator}></div>
        {/* 导出按钮 */}
        <button className={styles.exportBtn} onClick={handleExportAsPNG} title="Export as PNG">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        </button>
        <button className={styles.exportBtn} onClick={handleExportAsJPEG} title="Export as JPEG">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <path d="M21 15l-5-5-5 5"/>
            <path d="M11 10v9"/>
          </svg>
        </button>
        <button className={styles.exportBtn} onClick={handleExportAsPDF} title="Export as PDF">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <path d="M12 18v-6"/>
            <path d="M9 15l3 3 3-3"/>
          </svg>
        </button>
        <div className={styles.zoomSeparator}></div>
        {/* Vertical marker lines */}
        <div className={styles.markerSection}>
          <button
            className={`${styles.exportBtn} ${verticalMarkers.length > 0 ? styles.markerActive : ''}`}
            onClick={() => setAddingMarker(!addingMarker)}
            title="Add vertical marker line"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="2" x2="12" y2="22"/>
              <path d="M8 6l4-4 4 4"/>
              <line x1="5" y1="22" x2="19" y2="22"/>
            </svg>
          </button>
          {verticalMarkers.length > 0 && (
            <span className={styles.markerBadge}>{verticalMarkers.length}</span>
          )}
          {addingMarker && (
            <div className={styles.markerPopover}>
              <div className={styles.markerPopoverTitle}>Add Marker Line</div>
              <div className={styles.markerPopoverRow}>
                <input
                  type="text"
                  className={styles.markerInput}
                  value={newMarkerLabel}
                  onChange={(e) => setNewMarkerLabel(e.target.value)}
                  placeholder="Label (e.g. SOP)"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (newMarkerLabel.trim() && newMarkerDate && currentProjectId) {
                        addMarker({ projectId: currentProjectId, date: newMarkerDate, label: newMarkerLabel.trim(), color: newMarkerColor, thickness: newMarkerThickness })
                        setNewMarkerLabel('')
                        setNewMarkerDate('')
                        setAddingMarker(false)
                      }
                    } else if (e.key === 'Escape') {
                      setAddingMarker(false)
                    }
                  }}
                  autoFocus
                />
                <input
                  type="date"
                  className={styles.markerDateInput}
                  value={newMarkerDate}
                  onChange={(e) => setNewMarkerDate(e.target.value)}
                />
              </div>
              <div className={styles.markerPopoverRow}>
                <label className={styles.markerFieldLabel}>Color</label>
                <input
                  type="color"
                  className={styles.markerColorInput}
                  value={newMarkerColor}
                  onChange={(e) => setNewMarkerColor(e.target.value)}
                />
                <label className={styles.markerFieldLabel}>Width</label>
                <select
                  className={styles.markerThicknessSelect}
                  value={newMarkerThickness}
                  onChange={(e) => setNewMarkerThickness(Number(e.target.value))}
                >
                  <option value={1}>1px</option>
                  <option value={2}>2px</option>
                  <option value={3}>3px</option>
                  <option value={4}>4px</option>
                  <option value={5}>5px</option>
                </select>
              </div>
              <div className={styles.markerPopoverActions}>
                <button
                  className={styles.markerSaveBtn}
                  onClick={() => {
                    if (newMarkerLabel.trim() && newMarkerDate && currentProjectId) {
                      addMarker({ projectId: currentProjectId, date: newMarkerDate, label: newMarkerLabel.trim(), color: newMarkerColor, thickness: newMarkerThickness })
                      setNewMarkerLabel('')
                      setNewMarkerDate('')
                      setAddingMarker(false)
                    }
                  }}
                >Add</button>
                <button className={styles.markerCancelBtn} onClick={() => setAddingMarker(false)}>Cancel</button>
              </div>
              {verticalMarkers.length > 0 && (
                <div className={styles.markerList}>
                  {verticalMarkers.map((m) => (
                    <div key={m.id} className={styles.markerListItem}>
                      <span className={styles.markerListColor} style={{ backgroundColor: m.color, width: `${m.thickness || 2}px` }} />
                      <span className={styles.markerListLabel}>{m.label}</span>
                      <span className={styles.markerListDate}>{m.date}</span>
                      <button className={styles.markerListRemove} onClick={() => deleteMarker(m.id)}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 操作面板 */}
      <div
        ref={actionPanelRef}
        className={`${styles.actionPanel} ${hintsCollapsed ? styles.actionPanelCollapsed : ''}`}
      >
        <button
          className={styles.actionPanelToggle}
          onClick={() => setHintsCollapsed((v) => !v)}
          title={hintsCollapsed ? 'Expand action panel' : 'Collapse action panel'}
        >
          <span className={`${styles.actionPanelArrow} ${hintsCollapsed ? styles.actionPanelArrowCollapsed : ''}`}>▾</span>
          <span className={styles.actionPanelTitle}>Actions</span>
        </button>
        {!hintsCollapsed && (
          <div className={styles.actionPanelBody}>
            <button className={styles.addGroupFloatBtn} onClick={handleStartAddGroup}>
              + New Group
            </button>
            <button className={styles.addGroupFloatBtn} onClick={handleStartAddMilestoneGroup}>
              + New Milestone Group
            </button>
            <div className={styles.hint}>
              <span className={styles.hintKey}>Click</span> Edit task
            </div>
            <div className={styles.hint}>
              <span className={styles.hintKey}>Ctrl + Click</span> Create dependency (with lag)
            </div>
            <div className={styles.hint}>
              <span className={styles.hintKey}>Double-click line</span> Delete dependency
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  )
}
