import Dexie, { Table } from 'dexie'
import { Task, Project, Bucket, User, Label } from '@/types'

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
}

// 导出数据库单例
export const db = new GanttDatabase()

// ============================================
// 初始化示例数据
// ============================================

export async function initializeSampleData() {
  const projectCount = await db.projects.count()

  if (projectCount === 0) {
    // 创建示例项目
    const projectId = crypto.randomUUID()
    const bucket1Id = crypto.randomUUID()
    const bucket2Id = crypto.randomUUID()
    const bucket3Id = crypto.randomUUID()

    // 创建示例用户
    const user1: User = {
      id: crypto.randomUUID(),
      name: '张三',
      email: 'zhangsan@example.com'
    }

    const user2: User = {
      id: crypto.randomUUID(),
      name: '李四',
      email: 'lisi@example.com'
    }

    // 创建示例标签
    const label1: Label = {
      id: crypto.randomUUID(),
      name: '前端开发',
      color: '#0078d4'
    }

    const label2: Label = {
      id: crypto.randomUUID(),
      name: '后端开发',
      color: '#107c10'
    }

    const label3: Label = {
      id: crypto.randomUUID(),
      name: '设计',
      color: '#d83b01'
    }

    // 创建示例分组
    const buckets: Bucket[] = [
      { id: bucket1Id, name: '未开始', order: 1, color: '#a19f9d' },
      { id: bucket2Id, name: '进行中', order: 2, color: '#0078d4' },
      { id: bucket3Id, name: '已完成', order: 3, color: '#107c10' }
    ]

    // 创建示例项目
    const project: Project = {
      id: projectId,
      name: '网站改版项目',
      description: '公司官网的全面改版升级',
      createdAt: new Date(),
      updatedAt: new Date(),
      bucketIds: [bucket1Id, bucket2Id, bucket3Id]
    }

    // 创建示例任务
    const today = new Date()

    // 用于存储任务 ID 以便设置依赖关系
    const taskIds: { [key: string]: string } = {}

    const tasks: Task[] = [
      {
        id: crypto.randomUUID(),
        projectId,
        bucketId: bucket3Id,
        title: '需求分析',
        description: '收集和分析产品需求',
        taskType: 'task',
        startDateTime: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
        dueDateTime: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000),
        status: 'Completed',
        priority: 'Important',
        completedPercent: 100,
        assigneeIds: [user1.id],
        labelIds: [],
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: crypto.randomUUID(),
        projectId,
        bucketId: bucket2Id,
        title: 'UI 设计',
        description: '完成页面原型和视觉设计',
        taskType: 'task',
        startDateTime: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
        dueDateTime: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000),
        status: 'InProgress',
        priority: 'Important',
        completedPercent: 60,
        assigneeIds: [user2.id],
        labelIds: [label3.id],
        order: 2,
        dependencyTaskIds: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: crypto.randomUUID(),
        projectId,
        bucketId: bucket2Id,
        title: '前端开发',
        description: '实现响应式前端界面',
        taskType: 'task',
        startDateTime: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000),
        dueDateTime: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000),
        status: 'InProgress',
        priority: 'Urgent',
        completedPercent: 20,
        assigneeIds: [user1.id],
        labelIds: [label1.id],
        order: 3,
        dependencyTaskIds: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: crypto.randomUUID(),
        projectId,
        bucketId: bucket1Id,
        title: '后端 API 开发',
        description: '设计和实现 RESTful API',
        taskType: 'task',
        startDateTime: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000),
        dueDateTime: new Date(today.getTime() + 18 * 24 * 60 * 60 * 1000),
        status: 'NotStarted',
        priority: 'Important',
        completedPercent: 0,
        assigneeIds: [user2.id],
        labelIds: [label2.id],
        order: 4,
        dependencyTaskIds: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: crypto.randomUUID(),
        projectId,
        bucketId: bucket1Id,
        title: '设计评审里程碑',
        description: 'UI 设计完成评审',
        taskType: 'milestone',
        startDateTime: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000),
        dueDateTime: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000),
        status: 'NotStarted',
        priority: 'Important',
        completedPercent: 0,
        assigneeIds: [user2.id],
        labelIds: [label3.id],
        order: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: crypto.randomUUID(),
        projectId,
        bucketId: bucket1Id,
        title: '测试与部署',
        description: '完成功能测试并部署上线',
        taskType: 'task',
        startDateTime: new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000),
        dueDateTime: new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000),
        status: 'NotStarted',
        priority: 'Normal',
        completedPercent: 0,
        assigneeIds: [user1.id, user2.id],
        labelIds: [],
        order: 6,
        dependencyTaskIds: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: crypto.randomUUID(),
        projectId,
        bucketId: bucket1Id,
        title: '项目上线',
        description: '正式上线发布',
        taskType: 'milestone',
        startDateTime: new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000),
        dueDateTime: new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000),
        status: 'NotStarted',
        priority: 'Urgent',
        completedPercent: 0,
        assigneeIds: [],
        labelIds: [],
        order: 7,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    // 保存任务 ID 用于设置依赖关系
    tasks.forEach((t, i) => {
      taskIds[`task${i}`] = t.id
    })

    // 设置依赖关系：前端开发依赖 UI 设计
    const task2Index = 1 // UI 设计
    const task3Index = 2 // 前端开发
    tasks[task3Index].dependencyTaskIds = [taskIds[`task${task2Index}`]]

    // 设置依赖关系：测试与部署依赖前端开发和后端开发
    const task5Index = 5 // 测试与部署
    tasks[task5Index].dependencyTaskIds = [
      taskIds[`task${2}`], // 前端开发
      taskIds[`task${3}`]  // 后端开发
    ]

    // 设置反向依赖引用
    tasks.forEach((task) => {
      if (task.dependencyTaskIds) {
        task.dependencyTaskIds.forEach((depId) => {
          const depTask = tasks.find((t) => t.id === depId)
          if (depTask) {
            if (!depTask.dependentTaskIds) {
              depTask.dependentTaskIds = []
            }
            depTask.dependentTaskIds.push(task.id)
          }
        })
      }
    })

    // 批量插入数据
    await db.users.bulkPut([user1, user2])
    await db.labels.bulkPut([label1, label2, label3])
    await db.buckets.bulkPut(buckets)
    await db.projects.add(project)
    await db.tasks.bulkPut(tasks)

    console.log('示例数据已初始化')
  }
}
