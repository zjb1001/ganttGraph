import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { Task, Project, Bucket, User, Label, ViewType, TimeUnit, Dependency } from '@/types'
import { db } from '@/db'

interface AppStore {
  // ============================================
  // UI 状态
  // ============================================
  currentProjectId: string | null
  currentView: ViewType
  selectedTaskId: string | null
  timeUnit: TimeUnit
  sidebarCollapsed: boolean
  collapsedBucketIds: Set<string>

  setCurrentProjectId: (projectId: string | null) => void
  setCurrentView: (view: ViewType) => void
  setSelectedTaskId: (taskId: string | null) => void
  setTimeUnit: (unit: TimeUnit) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleBucketCollapse: (bucketId: string) => void
  setBucketCollapsed: (bucketId: string, collapsed: boolean) => void
  collapseBucketsByType: (bucketType: 'task' | 'milestone' | 'all', collapsed: boolean) => void

  // ============================================
  // 数据状态
  // ============================================
  projects: Project[]
  tasks: Task[]
  buckets: Bucket[]
  users: User[]
  labels: Label[]

  // 加载数据
  loadProjects: () => Promise<void>
  loadTasks: (projectId: string) => Promise<void>
  loadBuckets: () => Promise<void>
  loadUsers: () => Promise<void>
  loadLabels: () => Promise<void>

  // ============================================
  // 任务操作
  // ============================================
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>
  deleteTask: (taskId: string) => Promise<void>
  moveTask: (taskId: string, newStartDate: Date, newDueDate: Date) => Promise<void>
  addDependency: (taskId: string, dependsOnTaskId: string, lagDays?: number) => Promise<void>
  removeDependency: (taskId: string, dependsOnTaskId: string) => Promise<void>
  updateDependencyLag: (taskId: string, dependsOnTaskId: string, lagDays: number) => Promise<void>

  // ============================================
  // 项目操作
  // ============================================
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateProject: (projectId: string, updates: Partial<Project>) => Promise<void>
  deleteProject: (projectId: string) => Promise<void>

  // ============================================
  // 分组操作
  // ============================================
  addBucket: (bucket: Omit<Bucket, 'id'>) => Promise<Bucket>
  updateBucket: (bucketId: string, updates: Partial<Bucket>) => Promise<void>
  deleteBucket: (bucketId: string) => Promise<void>
}

export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (set, get) => ({
        // ============================================
        // 初始状态
        // ============================================
        currentProjectId: null,
        currentView: 'gantt',
        selectedTaskId: null,
        timeUnit: 'week',
        sidebarCollapsed: false,
        collapsedBucketIds: new Set<string>(),

        projects: [],
        tasks: [],
        buckets: [],
        users: [],
        labels: [],

        // ============================================
        // UI 状态更新
        // ============================================
        setCurrentProjectId: (projectId) => set({ currentProjectId: projectId }),

        setCurrentView: (view) => set({ currentView: view }),

        setSelectedTaskId: (taskId) => set({ selectedTaskId: taskId }),

        setTimeUnit: (unit) => set({ timeUnit: unit }),

        toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

        setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

        toggleBucketCollapse: (bucketId) => set((state) => {
          const next = new Set(state.collapsedBucketIds)
          if (next.has(bucketId)) {
            next.delete(bucketId)
          } else {
            next.add(bucketId)
          }
          return { collapsedBucketIds: next }
        }),

        setBucketCollapsed: (bucketId, collapsed) => set((state) => {
          const next = new Set(state.collapsedBucketIds)
          if (collapsed) {
            next.add(bucketId)
          } else {
            next.delete(bucketId)
          }
          return { collapsedBucketIds: next }
        }),

        collapseBucketsByType: (bucketType, collapsed) => set((state) => {
          const next = new Set(state.collapsedBucketIds)
          const targetBuckets = bucketType === 'all'
            ? state.buckets
            : state.buckets.filter(b => b.bucketType === bucketType)
          for (const b of targetBuckets) {
            if (collapsed) {
              next.add(b.id)
            } else {
              next.delete(b.id)
            }
          }
          return { collapsedBucketIds: next }
        }),

        // ============================================
        // 加载数据
        // ============================================
        loadProjects: async () => {
          const projects = await db.getAllProjects()
          set({ projects })
          // 注意：不再自动选择第一个项目
          // 让用户在 Dashboard 中手动选择，persist 会记住上次选择
        },

        loadTasks: async (projectId) => {
          const tasks = await db.getTasksByProject(projectId)
          set({ tasks })
        },

        loadBuckets: async () => {
          const buckets = await db.getAllBuckets()
          set({ buckets })
        },

        loadUsers: async () => {
          const users = await db.getAllUsers()
          set({ users })
        },

        loadLabels: async () => {
          const labels = await db.getAllLabels()
          set({ labels })
        },

        // ============================================
        // 任务操作
        // ============================================
        addTask: async (taskData) => {
          const task: Task = {
            ...taskData,
            id: crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date()
          }
          await db.addTask(task)

          // 更新本地状态
          set((state) => ({
            tasks: [...state.tasks, task]
          }))
        },

        updateTask: async (taskId, updates) => {
          await db.updateTask(taskId, updates)

          // 更新本地状态
          set((state) => ({
            tasks: state.tasks.map((task) =>
              task.id === taskId ? { ...task, ...updates, updatedAt: new Date() } : task
            )
          }))

          // 级联更新：如果修改了日期，自动调整引用此任务的截止日期约束
          if (updates.startDateTime || updates.dueDateTime) {
            const state = get()
            const updatedTask = state.tasks.find((t) => t.id === taskId)
            if (!updatedTask) return

            const constrainedTasks = state.tasks.filter(
              (t) => t.deadlineConstraint?.refTaskId === taskId
            )

            for (const ct of constrainedTasks) {
              const c = ct.deadlineConstraint!
              const refDate = new Date(
                updatedTask.taskType === 'milestone'
                  ? updatedTask.startDateTime
                  : updatedTask.dueDateTime
              )
              const offsetDays = c.offsetWeeks * 7 * (c.type === 'before' ? -1 : 1)
              const newDue = new Date(refDate)
              newDue.setDate(newDue.getDate() + offsetDays)

              // 保持任务持续时间
              const oldStart = new Date(ct.startDateTime)
              const oldDue = new Date(ct.dueDateTime)
              const duration = Math.max(1, Math.round((oldDue.getTime() - oldStart.getTime()) / (1000 * 60 * 60 * 24)))
              const newStart = new Date(newDue)
              newStart.setDate(newStart.getDate() - duration)

              await db.updateTask(ct.id, { dueDateTime: newDue, startDateTime: newStart })
              set((state) => ({
                tasks: state.tasks.map((t) =>
                  t.id === ct.id ? { ...t, dueDateTime: newDue, startDateTime: newStart, updatedAt: new Date() } : t
                )
              }))
            }
          }
        },

        deleteTask: async (taskId) => {
          await db.deleteTask(taskId)

          // 更新本地状态
          set((state) => ({
            tasks: state.tasks.filter((task) => task.id !== taskId)
          }))
        },

        moveTask: async (taskId, newStartDate, newDueDate) => {
          await get().updateTask(taskId, {
            startDateTime: newStartDate,
            dueDateTime: newDueDate
          })
        },

        addDependency: async (taskId, dependsOnTaskId, lagDays = 0) => {
          const state = get()
          const task = state.tasks.find((t) => t.id === taskId)
          const dependsOnTask = state.tasks.find((t) => t.id === dependsOnTaskId)

          if (!task || !dependsOnTask) return

          // 更新当前任务的依赖列表（兼容旧字段 + 新结构）
          const dependencyTaskIds = task.dependencyTaskIds || []
          const dependencies: Dependency[] = task.dependencies || []
          if (!dependencyTaskIds.includes(dependsOnTaskId)) {
            dependencyTaskIds.push(dependsOnTaskId)
            dependencies.push({ taskId: dependsOnTaskId, lagDays })
            await get().updateTask(taskId, { dependencyTaskIds, dependencies })

            // 更新被依赖任务的反向依赖列表
            const dependentTaskIds = dependsOnTask.dependentTaskIds || []
            if (!dependentTaskIds.includes(taskId)) {
              dependentTaskIds.push(taskId)
              await get().updateTask(dependsOnTaskId, { dependentTaskIds })
            }
          }
        },

        removeDependency: async (taskId, dependsOnTaskId) => {
          const state = get()
          const task = state.tasks.find((t) => t.id === taskId)
          const dependsOnTask = state.tasks.find((t) => t.id === dependsOnTaskId)

          if (!task || !dependsOnTask) return

          // 更新当前任务的依赖列表
          const dependencyTaskIds = (task.dependencyTaskIds || []).filter((id) => id !== dependsOnTaskId)
          const dependencies = (task.dependencies || []).filter((d) => d.taskId !== dependsOnTaskId)
          await get().updateTask(taskId, { dependencyTaskIds, dependencies })

          // 更新被依赖任务的反向依赖列表
          const dependentTaskIds = (dependsOnTask.dependentTaskIds || []).filter((id) => id !== taskId)
          await get().updateTask(dependsOnTaskId, { dependentTaskIds })
        },

        updateDependencyLag: async (taskId, dependsOnTaskId, lagDays) => {
          const state = get()
          const task = state.tasks.find((t) => t.id === taskId)
          if (!task) return

          const dependencies = (task.dependencies || []).map((d) =>
            d.taskId === dependsOnTaskId ? { ...d, lagDays } : d
          )
          await get().updateTask(taskId, { dependencies })
        },

        // ============================================
        // 项目操作
        // ============================================
        addProject: async (projectData) => {
          const project: Project = {
            ...projectData,
            id: crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date()
          }
          await db.addProject(project)

          // 更新本地状态
          set((state) => ({
            projects: [...state.projects, project]
          }))
        },

        updateProject: async (projectId, updates) => {
          await db.updateProject(projectId, { ...updates, updatedAt: new Date() })
          set((state) => ({
            projects: state.projects.map((p) =>
              p.id === projectId ? { ...p, ...updates, updatedAt: new Date() } : p
            )
          }))
        },

        deleteProject: async (projectId) => {
          await db.deleteProject(projectId)
          set((state) => ({
            projects: state.projects.filter((p) => p.id !== projectId),
            currentProjectId: state.currentProjectId === projectId ? null : state.currentProjectId
          }))
        },

        // ============================================
        // 分组操作
        // ============================================
        addBucket: async (bucketData) => {
          const bucket: Bucket = {
            ...bucketData,
            id: crypto.randomUUID()
          }
          await db.addBucket(bucket)

          // 更新本地状态
          set((state) => ({
            buckets: [...state.buckets, bucket]
          }))
          return bucket
        },

        updateBucket: async (bucketId, updates) => {
          await db.updateBucket(bucketId, updates)

          set((state) => ({
            buckets: state.buckets.map((b) =>
              b.id === bucketId ? { ...b, ...updates } : b
            )
          }))
        },

        deleteBucket: async (bucketId) => {
          await db.deleteBucket(bucketId)

          set((state) => ({
            buckets: state.buckets.filter((b) => b.id !== bucketId),
            tasks: state.tasks.filter((t) => t.bucketId !== bucketId)
          }))
        }
      }),
      {
        name: 'gantt-graph-storage',
        partialize: (state) => ({
          currentProjectId: state.currentProjectId,
          currentView: state.currentView,
          timeUnit: state.timeUnit,
          sidebarCollapsed: state.sidebarCollapsed
          // 不同步数据，每次重新加载
        })
      }
    )
  )
)
