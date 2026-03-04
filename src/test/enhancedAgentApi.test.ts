import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Task } from '@/types'

// Mock fetch
(window as any).fetch = vi.fn()

// Import after mock
const {
  decomposeProject,
  analyzeProjectRisks,
  predictSchedule,
  analyzeResources,
  chatWithAI,
  convertDecomposedTasks,
  getRiskLevelColor,
  getRiskLevelText
} = await import('../utils/enhancedAgentApi')

describe('Enhanced Agent API', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe('decomposeProject', () => {
    it('should decompose project goal into tasks', async () => {
      const mockResponse = {
        success: true,
        message: '成功分解项目',
        phases: [{ name: '需求分析', description: '收集需求', order: 1 }],
        tasks: [{
          title: '用户调研',
          phase: '需求分析',
          duration_days: 5,
          priority: 'High',
          start_date: '2025-03-01',
          end_date: '2025-03-05'
        }],
        milestones: [{ title: '需求确认', date_offset_days: 14 }],
        estimated_duration_days: 30,
        confidence: 0.85
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response)

      const result = await decomposeProject('开发电商网站', {
        team_size: 5,
        complexity: 'high'
      })

      expect(result.success).toBe(true)
      expect(result.tasks).toHaveLength(1)
      expect(result.phases[0].name).toBe('需求分析')
    })

    it('should throw error when API fails', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error'
      } as Response)

      await expect(decomposeProject('test')).rejects.toThrow('Decomposition failed')
    })
  })

  describe('analyzeProjectRisks', () => {
    it('should analyze project risks', async () => {
      const mockResponse = {
        success: true,
        message: '发现3个风险',
        risks: [{
          task_id: 'task-1',
          task_title: 'API开发',
          risk_type: '进度延期',
          level: 'high',
          description: '任务延期',
          suggestion: '加快进度',
          impact_days: 3
        }],
        overall_risk_level: 'medium',
        risk_summary: { critical: 0, high: 1, medium: 2, low: 0 },
        recommendations: ['优先完成关键任务']
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response)

      const mockTasks: Task[] = [{
        id: 'task-1',
        title: 'API开发',
        startDateTime: new Date(),
        dueDateTime: new Date(),
        completedPercent: 30,
        status: 'InProgress',
        priority: 'Urgent',
        dependencies: [],
        projectId: 'proj-1',
        bucketId: 'bucket-1',
        taskType: 'task',
        assigneeIds: [],
        labelIds: [],
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }]

      const result = await analyzeProjectRisks(mockTasks)

      expect(result.success).toBe(true)
      expect(result.risks).toHaveLength(1)
      expect(result.overall_risk_level).toBe('medium')
    })
  })

  describe('predictSchedule', () => {
    it('should predict schedule', async () => {
      const mockResponse = {
        success: true,
        message: '预测完成',
        prediction: {
          predicted_end_date: '2025-03-25',
          confidence: 0.75,
          delay_probability: 0.35,
          estimated_delay_days: 5,
          critical_factors: ['存在延期任务']
        },
        critical_path: ['task-1', 'task-2'],
        bottlenecks: [{
          task_id: 'task-1',
          task_title: '数据库设计',
          type: '依赖瓶颈',
          impact: '阻塞3个任务',
          severity: 'high'
        }],
        suggestions: ['加快关键路径任务']
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response)

      const mockTasks: Task[] = []
      const result = await predictSchedule(mockTasks)

      expect(result.success).toBe(true)
      expect(result.critical_path).toContain('task-1')
      expect(result.prediction.confidence).toBe(0.75)
    })
  })

  describe('analyzeResources', () => {
    it('should analyze resource conflicts', async () => {
      const mockResponse = {
        success: true,
        message: '发现2个冲突',
        conflicts: [{
          type: '人员冲突',
          resource: '张三',
          task1: '前端开发',
          task2: 'API开发',
          overlap_days: 5,
          severity: 'high'
        }],
        resource_utilization: { '张三': 85, '李四': 45 },
        suggestions: ['重新分配任务']
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response)

      const mockTasks: Task[] = []
      const result = await analyzeResources(mockTasks)

      expect(result.success).toBe(true)
      expect(result.conflicts).toHaveLength(1)
      expect(result.resource_utilization['张三']).toBe(85)
    })
  })

  describe('chatWithAI', () => {
    it('should handle natural language chat', async () => {
      const mockResponse = {
        success: true,
        message: '分析完成',
        intent: 'risk_analysis',
        actions: [],
        analysis: {
          overall_risk: 'medium',
          risk_count: 3
        }
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response)

      const result = await chatWithAI('分析一下项目风险', {
        tasks: [],
        currentProject: '测试项目'
      })

      expect(result.success).toBe(true)
      expect(result.intent).toBe('risk_analysis')
    })
  })

  describe('Helper Functions', () => {
    describe('getRiskLevelColor', () => {
      it('should return correct colors', () => {
        expect(getRiskLevelColor('critical')).toBe('#ff0000')
        expect(getRiskLevelColor('high')).toBe('#ff6600')
        expect(getRiskLevelColor('medium')).toBe('#ffcc00')
        expect(getRiskLevelColor('low')).toBe('#66ccff')
        expect(getRiskLevelColor('none')).toBe('#cccccc')
      })
    })

    describe('getRiskLevelText', () => {
      it('should return correct text', () => {
        expect(getRiskLevelText('critical')).toBe('严重')
        expect(getRiskLevelText('high')).toBe('高')
        expect(getRiskLevelText('medium')).toBe('中')
        expect(getRiskLevelText('low')).toBe('低')
      })
    })

    describe('convertDecomposedTasks', () => {
      it('should convert decomposed tasks to Task format', () => {
        const decomposed = [{
          title: '用户调研',
          phase: '需求分析',
          duration_days: 5,
          priority: 'High',
          start_date: '2025-03-01',
          end_date: '2025-03-05'
        }]

        const buckets = [{ id: 'bucket-1', name: '需求分析' } as any]
        const result = convertDecomposedTasks(decomposed, 'project-1', buckets)

        expect(result).toHaveLength(1)
        expect(result[0].title).toBe('用户调研')
        expect(result[0].projectId).toBe('project-1')
        expect(result[0].bucketId).toBe('bucket-1')
      })
    })
  })
})
