/**
 * Agent Action Executor
 * Executes agent actions on the Zustand store
 */

import { useAppStore } from '@/store/appStore';
import type { Task, Bucket, TaskStatus, TaskPriority, TaskType } from '@/types';
import { AgentAction } from './agentApi';

/**
 * Calculate Levenshtein similarity between two strings
 * Returns a value between 0 and 1, where 1 is exact match
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;

  // Levenshtein distance
  const matrix: number[][] = [];
  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  const distance = matrix[s2.length][s1.length];
  const maxLen = Math.max(s1.length, s2.length);
  return 1 - distance / maxLen;
}

/**
 * Find tasks by title with similarity scoring
 * Returns tasks sorted by similarity (descending)
 */
function findTasksByTitle(tasks: Task[], title: string, threshold = 0.4): Array<{ task: Task; similarity: number }> {
  const results: Array<{ task: Task; similarity: number }> = [];

  for (const task of tasks) {
    const similarity = calculateSimilarity(title, task.title);
    if (similarity >= threshold) {
      results.push({ task, similarity });
    }
  }

  // Sort by similarity descending
  results.sort((a, b) => b.similarity - a.similarity);
  return results;
}

/**
 * Find the best matching task by title
 * Returns null if there are multiple similar tasks (above 0.7 similarity)
 * or if no good match is found
 */
function findBestTaskByTitle(tasks: Task[], title: string): { task: Task | undefined; candidates: Task[] } {
  const matches = findTasksByTitle(tasks, title, 0.4);

  if (matches.length === 0) {
    return { task: undefined, candidates: [] };
  }

  // Check if we have a clear winner (similarity > 0.8)
  if (matches[0].similarity > 0.8) {
    // Check if there are other close matches (within 0.1 similarity)
    const closeMatches = matches.filter(m => matches[0].similarity - m.similarity < 0.1);
    if (closeMatches.length === 1) {
      return { task: matches[0].task, candidates: [] };
    }
  }

  // Multiple similar tasks found - return candidates
  return {
    task: undefined,
    candidates: matches.slice(0, 5).map(m => m.task) // Max 5 candidates
  };
}

/**
 * Parse date string to Date object
 */
function parseDate(dateStr: string): Date {
  return new Date(dateStr);
}

/**
 * Parse priority string to TaskPriority
 */
function parsePriority(priority?: string): TaskPriority {
  switch (priority?.toLowerCase()) {
    case 'urgent': return 'Urgent';
    case 'important': return 'Important';
    case 'low': return 'Low';
    default: return 'Normal';
  }
}

/**
 * Parse status string to TaskStatus
 */
function parseStatus(status?: string): TaskStatus {
  switch (status?.toLowerCase()) {
    case 'notstarted': return 'NotStarted';
    case 'inprogress': return 'InProgress';
    case 'completed': return 'Completed';
    default: return 'NotStarted';
  }
}

/**
 * Find bucket by ID or name (fuzzy match)
 * Priority: exact name match > starts with > contains > contains reverse
 */
function findBucket(buckets: Bucket[], bucketIdOrName: string): Bucket | undefined {
  if (!bucketIdOrName) return undefined;

  // First try exact ID match
  const byId = buckets.find(b => b.id === bucketIdOrName);
  if (byId) return byId;

  const normalizedName = bucketIdOrName.toLowerCase().trim();

  // Try exact name match
  const exactMatch = buckets.find(b => b.name && b.name.toLowerCase() === normalizedName);
  if (exactMatch) return exactMatch;

  // Try starts with match (e.g., "后端" matches "后端开发")
  const startsWithMatch = buckets.find(b => b.name && b.name.toLowerCase().startsWith(normalizedName));
  if (startsWithMatch) return startsWithMatch;

  // Try contains match (e.g., "后端开发" matches "后端")
  const containsMatch = buckets.find(b => b.name && normalizedName.includes(b.name.toLowerCase()));
  if (containsMatch) return containsMatch;

  // Try reverse contains match as last resort (e.g., "开发" matching "后端开发")
  return buckets.find(b => b.name && b.name.toLowerCase().includes(normalizedName));
}

/**
 * Execute a single agent action
 */
export async function executeAgentAction(action: AgentAction): Promise<string> {
  const store = useAppStore.getState();
  const { tasks, buckets, currentProjectId } = store;

  try {
    switch (action.type) {
      case 'add_task': {
        const { title, startDate, dueDate, bucketId, priority, status, description, color } = action.params;

        // Find or use specified bucket (supports name or ID)
        let targetBucketId = bucketId;
        if (bucketId) {
          // Try to find bucket by name first (AI might send name instead of ID)
          const foundBucket = findBucket(buckets, bucketId);
          if (foundBucket) {
            targetBucketId = foundBucket.id;
          }
        }
        if (!targetBucketId && buckets.length > 0) {
          // Use first bucket if not specified
          targetBucketId = buckets[0].id;
        }

        if (!currentProjectId) {
          return '错误：请先选择一个项目';
        }

        await store.addTask({
          projectId: currentProjectId,
          bucketId: targetBucketId || '',
          title,
          description,
          taskType: 'task' as TaskType,
          startDateTime: parseDate(startDate),
          dueDateTime: parseDate(dueDate),
          status: parseStatus(status),
          priority: parsePriority(priority),
          color: color || undefined, // 支持自定义颜色
          assigneeIds: [],
          labelIds: [],
          order: tasks.length + 1,
        });

        return `✅ 已创建任务: ${title}`;
      }

      case 'add_milestone': {
        const { title, date, bucketId, description } = action.params;

        // Find or use specified bucket (supports name or ID)
        let targetBucketId = bucketId;
        if (bucketId) {
          // Try to find bucket by name first (AI might send name instead of ID)
          const foundBucket = findBucket(buckets, bucketId);
          if (foundBucket) {
            targetBucketId = foundBucket.id;
          }
        }
        if (!targetBucketId && buckets.length > 0) {
          // Find or create milestone bucket
          const milestoneBucket = buckets.find(b => b.bucketType === 'milestone');
          targetBucketId = milestoneBucket?.id || buckets[0].id;
        }

        if (!currentProjectId) {
          return '错误：请先选择一个项目';
        }

        const milestoneDate = parseDate(date);

        await store.addTask({
          projectId: currentProjectId,
          bucketId: targetBucketId || '',
          title,
          description,
          taskType: 'milestone',
          startDateTime: milestoneDate,
          dueDateTime: milestoneDate,
          status: 'NotStarted',
          priority: 'Important',
          assigneeIds: [],
          labelIds: [],
          order: tasks.length + 1,
        });

        return `✅ 已创建里程碑: ${title}`;
      }

      case 'update_task': {
        const { taskId, title, startDate, dueDate, progress, priority, status, color, shiftWeeks, shiftDays } = action.params;

        // Find task by ID (supports full ID or short 8-char prefix)
        let task = tasks.find(t => t.id === taskId || t.id.startsWith(taskId || ''));
        if (!task && title) {
          const result = findBestTaskByTitle(tasks, title);
          if (result.candidates.length > 0) {
            // Multiple candidates found
            return `❓ 找到多个相似任务，请明确:\n${result.candidates.map((t, i) => `${i + 1}. ${t.title}`).join('\n')}`;
          }
          task = result.task;
        }

        if (!task) {
          return `❌ 未找到任务: ${taskId || title}`;
        }

        const updates: Partial<Task> = {};

        if (title !== undefined) updates.title = title;

        // Handle shiftWeeks/shiftDays - shift both start and end date
        if (shiftWeeks !== undefined || shiftDays !== undefined) {
          const daysToShift = (shiftWeeks || 0) * 7 + (shiftDays || 0);
          const startDate = new Date(task.startDateTime);
          const endDate = new Date(task.dueDateTime);
          startDate.setDate(startDate.getDate() + daysToShift);
          endDate.setDate(endDate.getDate() + daysToShift);
          updates.startDateTime = startDate;
          updates.dueDateTime = endDate;
        }

        if (startDate !== undefined) updates.startDateTime = parseDate(startDate);
        if (dueDate !== undefined) updates.dueDateTime = parseDate(dueDate);
        if (progress !== undefined) updates.completedPercent = progress;
        if (priority !== undefined) updates.priority = parsePriority(priority);
        if (status !== undefined) updates.status = parseStatus(status);
        if (color !== undefined) updates.color = color;

        await store.updateTask(task.id, updates);

        return `✅ 已更新任务: ${task.title}`;
      }

      case 'delete_task': {
        const { taskId, taskTitle } = action.params;

        // Find task by ID (supports full ID or short 8-char prefix) or title
        let task = tasks.find(t => t.id === taskId || t.id.startsWith(taskId || ''));
        if (!task && taskTitle) {
          const result = findBestTaskByTitle(tasks, taskTitle);
          if (result.candidates.length > 0) {
            return `❓ 找到多个相似任务，请明确:\n${result.candidates.map((t, i) => `${i + 1}. ${t.title}`).join('\n')}`;
          }
          task = result.task;
        }

        if (!task) {
          return `❌ 未找到任务: ${taskId || taskTitle}`;
        }

        await store.deleteTask(task.id);

        return `✅ 已删除任务: ${task.title}`;
      }

      case 'add_bucket': {
        const { name, color, bucketType } = action.params;

        await store.addBucket({
          name,
          color: color || '#0078d4',
          bucketType: bucketType === 'milestone' ? 'milestone' : 'task',
          order: buckets.length + 1,
        });

        const typeText = bucketType === 'milestone' ? '里程碑分组' : '分组';
        return `✅ 已创建${typeText}: ${name}`;
      }

      case 'update_bucket': {
        const { bucketId, name, color } = action.params;

        const bucket = findBucket(buckets, bucketId);
        if (!bucket) {
          return `❌ 未找到分组: ${bucketId}`;
        }

        // Only include defined fields to avoid overwriting with undefined
        const updates: Partial<Bucket> = {};
        if (name !== undefined) updates.name = name;
        if (color !== undefined) updates.color = color;

        await store.updateBucket(bucket.id, updates);

        return `✅ 已更新分组: ${name || bucket.name}`;
      }

      case 'delete_bucket': {
        const { bucketId, bucketName } = action.params;

        // Try bucketId first, then bucketName
        const identifier = bucketId || bucketName;
        if (!identifier) {
          return `❌ 请提供分组名称`;
        }

        const bucket = findBucket(buckets, identifier);
        if (!bucket) {
          return `❌ 未找到分组: ${identifier}`;
        }

        await store.deleteBucket(bucket.id);

        return `✅ 已删除分组: ${bucket.name}`;
      }

      case 'add_dependency': {
        const { taskId, dependsOnTaskId } = action.params;

        // Find tasks (supports full ID or short 8-char prefix)
        let task = tasks.find(t => t.id === taskId || t.id.startsWith(taskId || ''));
        let dependsOnTask = tasks.find(t => t.id === dependsOnTaskId || t.id.startsWith(dependsOnTaskId || ''));

        // Try to find by title if ID doesn't work
        if (!task) {
          const result = findBestTaskByTitle(tasks, taskId);
          task = result.task || (result.candidates.length === 1 ? result.candidates[0] : undefined);
        }
        if (!dependsOnTask) {
          const result = findBestTaskByTitle(tasks, dependsOnTaskId);
          dependsOnTask = result.task || (result.candidates.length === 1 ? result.candidates[0] : undefined);
        }

        if (!task || !dependsOnTask) {
          return `❌ 未找到任务: ${!task ? taskId : dependsOnTaskId}`;
        }

        await store.addDependency(task.id, dependsOnTask.id);

        return `✅ 已添加依赖: ${task.title} → ${dependsOnTask.title}`;
      }

      case 'remove_dependency': {
        const { taskId, dependsOnTaskId } = action.params;

        // Find tasks (supports full ID or short 8-char prefix)
        let task = tasks.find(t => t.id === taskId || t.id.startsWith(taskId || ''));
        let dependsOnTask = tasks.find(t => t.id === dependsOnTaskId || t.id.startsWith(dependsOnTaskId || ''));

        if (!task) {
          const result = findBestTaskByTitle(tasks, taskId);
          task = result.task || (result.candidates.length === 1 ? result.candidates[0] : undefined);
        }
        if (!dependsOnTask) {
          const result = findBestTaskByTitle(tasks, dependsOnTaskId);
          dependsOnTask = result.task || (result.candidates.length === 1 ? result.candidates[0] : undefined);
        }

        if (!task || !dependsOnTask) {
          return `❌ 未找到任务`;
        }

        await store.removeDependency(task.id, dependsOnTask.id);

        return `✅ 已移除依赖: ${task.title} → ${dependsOnTask.title}`;
      }

      case 'set_progress': {
        const { taskId, progress } = action.params;

        // Find task by ID (supports full ID or short 8-char prefix)
        let task = tasks.find(t => t.id === taskId || t.id.startsWith(taskId || ''));
        if (!task) {
          const result = findBestTaskByTitle(tasks, taskId);
          if (result.candidates.length > 0) {
            return `❓ 找到多个相似任务，请明确:\n${result.candidates.map((t, i) => `${i + 1}. ${t.title}`).join('\n')}`;
          }
          task = result.task;
        }

        if (!task) {
          return `❌ 未找到任务: ${taskId}`;
        }

        await store.updateTask(task.id, { completedPercent: progress });

        return `✅ 已更新进度: ${task.title} → ${progress}%`;
      }

      case 'collapse_bucket': {
        const { bucketId, bucketType, collapsed } = action.params;
        const shouldCollapse = collapsed !== false; // default true

        if (bucketType) {
          // Collapse/expand by type: 'milestone', 'task', or 'all'
          store.collapseBucketsByType(bucketType === 'all' ? 'all' : bucketType, shouldCollapse);
          const typeLabel = bucketType === 'milestone' ? '里程碑' : bucketType === 'task' ? '任务' : '所有';
          return shouldCollapse ? `✅ 已折叠${typeLabel}分组` : `✅ 已展开${typeLabel}分组`;
        }

        if (bucketId) {
          const bucket = findBucket(buckets, bucketId);
          if (!bucket) {
            return `❌ 未找到分组: ${bucketId}`;
          }
          store.setBucketCollapsed(bucket.id, shouldCollapse);
          return shouldCollapse ? `✅ 已折叠分组: ${bucket.name}` : `✅ 已展开分组: ${bucket.name}`;
        }

        return `❌ 请提供分组名称或类型`;
      }

      case 'expand_bucket': {
        // Reuse collapse logic with collapsed=false
        return executeAgentAction({
          ...action,
          type: 'collapse_bucket',
          params: { ...action.params, collapsed: false }
        });
      }

      case 'query': {
        const { queryType } = action.params;

        switch (queryType) {
          case 'summary': {
            const inProgressTasks = tasks.filter(t => t.status === 'InProgress');
            const notStartedTasks = tasks.filter(t => t.status === 'NotStarted');
            const completedTasks = tasks.filter(t => t.status === 'Completed');
            const milestones = tasks.filter(t => t.taskType === 'milestone');

            return `📊 项目概览:\n` +
                   `• 总任务数: ${tasks.length}\n` +
                   `• 未开始: ${notStartedTasks.length}\n` +
                   `• 进行中: ${inProgressTasks.length}\n` +
                   `• 已完成: ${completedTasks.length}\n` +
                   `• 里程碑: ${milestones.length}`;
          }

          case 'tasks':
            return `📋 任务列表:\n${tasks.map(t => `- ${t.title} (${t.status})`).join('\n')}`;

          case 'milestones': {
            const milestoneList = tasks.filter(t => t.taskType === 'milestone');
            return `🎯 里程碑:\n${milestoneList.map(t => `- ${t.title} (${t.startDateTime.toLocaleDateString()})`).join('\n')}`;
          }

          case 'buckets':
            return `📁 分组:\n${buckets.map(b => `- ${b.name}`).join('\n')}`;

          default:
            return '❓ 未知查询类型';
        }
      }

      default:
        return `⚠️ 未知操作: ${action.type}`;
    }
  } catch (error) {
    console.error('Error executing agent action:', error);
    return `❌ 执行失败: ${error instanceof Error ? error.message : String(error)}`;
  }
}

/**
 * Execute multiple agent actions
 */
export async function executeAgentActions(actions: AgentAction[]): Promise<string[]> {
  const results: string[] = [];

  for (const action of actions) {
    const result = await executeAgentAction(action);
    results.push(result);
  }

  return results;
}
