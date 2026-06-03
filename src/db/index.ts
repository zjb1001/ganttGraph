import Dexie, { Table } from 'dexie'
import { Task, Project, Bucket, User, Label, VerticalMarker } from '@/types'

/**
 * GanttGraph 本地数据库
 * 使用 IndexedDB 进行本地持久化存储
 */
export class GanttDatabase extends Dexie {
  tasks!: Table<Task>
  projects!: Table<Project>
  buckets!: Table<Bucket>
  users!: Table<User>
  labels!: Table<Label>
  verticalMarkers!: Table<VerticalMarker>

  constructor() {
    super('GanttGraphDB')

    // 定义数据库表结构和索引
    this.version(1).stores({
      tasks: 'id, projectId, bucketId, startDateTime, dueDateTime, status, priority, order',
      projects: 'id, createdAt, updatedAt',
      buckets: 'id, order',
      users: 'id',
      labels: 'id'
    })

    this.version(2).stores({
      tasks: 'id, projectId, bucketId, startDateTime, dueDateTime, status, priority, order',
      projects: 'id, createdAt, updatedAt',
      buckets: 'id, order',
      users: 'id',
      labels: 'id',
      verticalMarkers: 'id, projectId'
    })

    // v3: 给 buckets 增加 projectId，修复不同项目分组相互耦合的问题
    this.version(3).stores({
      tasks: 'id, projectId, bucketId, startDateTime, dueDateTime, status, priority, order',
      projects: 'id, createdAt, updatedAt',
      buckets: 'id, projectId, order',
      users: 'id',
      labels: 'id',
      verticalMarkers: 'id, projectId'
    }).upgrade(async (tx) => {
      // 回填 projectId：根据引用该 bucket 的任务推断其所属项目
      const tasks = await tx.table('tasks').toArray()
      const bucketToProject = new Map<string, string>()
      for (const t of tasks) {
        if (t.bucketId && t.projectId && !bucketToProject.has(t.bucketId)) {
          bucketToProject.set(t.bucketId, t.projectId)
        }
      }
      await tx.table('buckets').toCollection().modify((bucket: Bucket) => {
        // 无任务引用的孤儿 bucket 保持空 projectId（自然从所有项目隐藏）
        bucket.projectId = bucketToProject.get(bucket.id) || ''
      })
    })
  }

  // ============================================
  // 任务操作
  // ============================================

  async getTasksByProject(projectId: string): Promise<Task[]> {
    return await this.tasks
      .where('projectId')
      .equals(projectId)
      .sortBy('order')
  }

  async getTasksByBucket(bucketId: string): Promise<Task[]> {
    return await this.tasks
      .where('bucketId')
      .equals(bucketId)
      .sortBy('order')
  }

  async addTask(task: Task): Promise<string> {
    return await this.tasks.add(task)
  }

  async updateTask(taskId: string, updates: Partial<Task>): Promise<number> {
    return await this.tasks.update(taskId, {
      ...updates,
      updatedAt: new Date()
    })
  }

  async deleteTask(taskId: string): Promise<void> {
    await this.tasks.delete(taskId)
  }

  // ============================================
  // 项目操作
  // ============================================

  async getAllProjects(): Promise<Project[]> {
    return await this.projects.toArray()
  }

  async getProject(projectId: string): Promise<Project | undefined> {
    return await this.projects.get(projectId)
  }

  async addProject(project: Project): Promise<string> {
    return await this.projects.add(project)
  }

  async updateProject(projectId: string, updates: Partial<Project>): Promise<number> {
    return await this.projects.update(projectId, {
      ...updates,
      updatedAt: new Date()
    })
  }

  async deleteProject(projectId: string): Promise<void> {
    // 删除项目时级联删除相关任务
    await this.tasks.where('projectId').equals(projectId).delete()
    await this.projects.delete(projectId)
  }

  // ============================================
  // 分组操作
  // ============================================

  async getAllBuckets(): Promise<Bucket[]> {
    return await this.buckets.orderBy('order').toArray()
  }

  async getBucketsByProject(projectId: string): Promise<Bucket[]> {
    return await this.buckets.where('projectId').equals(projectId).sortBy('order')
  }

  async addBucket(bucket: Bucket): Promise<string> {
    return await this.buckets.add(bucket)
  }

  async updateBucket(bucketId: string, updates: Partial<Bucket>): Promise<number> {
    return await this.buckets.update(bucketId, updates)
  }

  async deleteBucket(bucketId: string): Promise<void> {
    // 删除分组时级联删除相关任务
    await this.tasks.where('bucketId').equals(bucketId).delete()
    await this.buckets.delete(bucketId)
  }

  // ============================================
  // 用户和标签操作
  // ============================================

  async getAllUsers(): Promise<User[]> {
    return await this.users.toArray()
  }

  async upsertUser(user: User): Promise<string> {
    await this.users.put(user)
    return user.id
  }

  async getAllLabels(): Promise<Label[]> {
    return await this.labels.toArray()
  }

  async upsertLabel(label: Label): Promise<string> {
    await this.labels.put(label)
    return label.id
  }

  // ============================================
  // 垂直标记线操作
  // ============================================

  async getMarkersByProject(projectId: string): Promise<VerticalMarker[]> {
    return await this.verticalMarkers.where('projectId').equals(projectId).toArray()
  }

  async addMarker(marker: VerticalMarker): Promise<string> {
    return await this.verticalMarkers.add(marker)
  }

  async updateMarker(markerId: string, updates: Partial<VerticalMarker>): Promise<number> {
    return await this.verticalMarkers.update(markerId, updates)
  }

  async deleteMarker(markerId: string): Promise<void> {
    await this.verticalMarkers.delete(markerId)
  }
}

// 导出数据库单例
export const db = new GanttDatabase()

// ============================================
// 初始化示例数据
// ============================================

export async function initializeSampleData() {
  const projectCount = await db.projects.count()

  if (projectCount === 0) {
    // 导入整车项目初始化
    const { initializeVehicleProject } = await import('./vehicleProject')
    await initializeVehicleProject()
    console.log('✅ 整车项目已创建为默认项目')
  }
}
