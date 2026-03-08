import { useEffect } from 'react'
import { useAppStore } from '@/store/appStore'
import { Task, TaskStatus, TaskPriority, TaskType, DeadlineConstraint } from '@/types'
import { formatDate, formatDateTime, getDaysBetween } from '@/utils/date'
import { STATUS_COLORS, TASK_COLORS, DEFAULT_TASK_COLOR } from '@/utils/colors'
import styles from './TaskPanel.module.css'

export default function TaskPanel() {
  const { selectedTaskId, tasks, buckets, labels, users, updateTask, updateDependencyLag, setSelectedTaskId } =
    useAppStore()

  const task = tasks.find((t) => t.id === selectedTaskId)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedTaskId(null)
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [setSelectedTaskId])

  if (!task) return null

  const handleUpdate = async (field: keyof Task, value: any) => {
    await updateTask(task.id, { [field]: value })
  }

  const bucket = buckets.find((b) => b.id === task.bucketId)
  const taskLabels = labels.filter((l) => task.labelIds.includes(l.id))
  const assignees = users.filter((u) => task.assigneeIds.includes(u.id))

  // 获取依赖的任务
  const dependencyTasks = tasks.filter((t) =>
    task.dependencyTaskIds?.includes(t.id)
  )
  // 获取依赖此任务的任务
  const dependentTasks = tasks.filter((t) =>
    t.dependencyTaskIds?.includes(task.id)
  )

  // 所有可作为参考节点的任务/里程碑（排除自己）
  const refCandidates = tasks.filter((t) => t.id !== task.id && t.projectId === task.projectId)
  const milestoneCandidates = refCandidates.filter((t) => t.taskType === 'milestone')
  const taskCandidates = refCandidates.filter((t) => t.taskType !== 'milestone')

  const constraint = task.deadlineConstraint
  const constraintRef = constraint ? tasks.find((t) => t.id === constraint.refTaskId) : null

  // 设置截止日期约束
  const handleSetConstraint = (refTaskId: string, offsetWeeks: number, type: 'before' | 'after') => {
    const newConstraint: DeadlineConstraint = { refTaskId, offsetWeeks, type }
    handleUpdate('deadlineConstraint', newConstraint)

    // 自动计算截止日期
    const refTask = tasks.find((t) => t.id === refTaskId)
    if (refTask) {
      const refDate = new Date(refTask.taskType === 'milestone' ? refTask.startDateTime : refTask.dueDateTime)
      const offsetDays = offsetWeeks * 7 * (type === 'before' ? -1 : 1)
      const newDue = new Date(refDate)
      newDue.setDate(newDue.getDate() + offsetDays)
      handleUpdate('dueDateTime', newDue)

      // 如果截止日期早于开始日期，也调整开始日期
      const currentStart = new Date(task.startDateTime)
      const duration = getDaysBetween(currentStart, new Date(task.dueDateTime))
      if (newDue < currentStart) {
        const newStart = new Date(newDue)
        newStart.setDate(newStart.getDate() - Math.max(duration, 1))
        handleUpdate('startDateTime', newStart)
      }
    }
  }

  const handleClearConstraint = () => {
    handleUpdate('deadlineConstraint', undefined)
  }

  const statusOptions: { value: TaskStatus; label: string }[] = [
    { value: 'NotStarted', label: '未开始' },
    { value: 'InProgress', label: '进行中' },
    { value: 'Completed', label: '已完成' }
  ]

  const priorityOptions: { value: TaskPriority; label: string }[] = [
    { value: 'Urgent', label: '紧急' },
    { value: 'Important', label: '重要' },
    { value: 'Normal', label: '普通' },
    { value: 'Low', label: '低' }
  ]

  const taskTypeOptions: { value: TaskType; label: string; icon: string }[] = [
    { value: 'task', label: '普通任务', icon: '📋' },
    { value: 'milestone', label: '里程碑', icon: '🏁' },
    { value: 'summary', label: '汇总任务', icon: '📊' }
  ]

  return (
    <div className={styles.panelOverlay} onClick={() => setSelectedTaskId(null)}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.panelHeader}>
          <input
            className={styles.titleInput}
            value={task.title}
            onChange={(e) => handleUpdate('title', e.target.value)}
            placeholder="任务名称"
          />
          <button
            className={styles.closeButton}
            onClick={() => setSelectedTaskId(null)}
          >
            ×
          </button>
        </div>

        <div className={styles.panelContent}>
          <div className={styles.section}>
            <label className={styles.label}>任务类型</label>
            <div className={styles.taskTypeOptions}>
              {taskTypeOptions.map((option) => (
                <button
                  key={option.value}
                  className={`${styles.taskTypeOption} ${task.taskType === option.value ? styles.isActive : ''}`}
                  onClick={() => handleUpdate('taskType', option.value)}
                >
                  <span className={styles.taskTypeIcon}>{option.icon}</span>
                  <span className={styles.taskTypeLabel}>{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.section}>
            <label className={styles.label}>描述</label>
            <textarea
              className={styles.textarea}
              value={task.description || ''}
              onChange={(e) => handleUpdate('description', e.target.value)}
              placeholder="添加任务描述..."
              rows={3}
            />
          </div>

          <div className={styles.row}>
            <div className={styles.section}>
              <label className={styles.label}>状态</label>
              <select
                className={styles.select}
                value={task.status}
                onChange={(e) => handleUpdate('status', e.target.value as TaskStatus)}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.section}>
              <label className={styles.label}>优先级</label>
              <select
                className={styles.select}
                value={task.priority}
                onChange={(e) => handleUpdate('priority', e.target.value as TaskPriority)}
              >
                {priorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.section}>
            <label className={styles.label}>任务颜色</label>
            <div className={styles.colorPicker}>
              {TASK_COLORS.map((color) => (
                <button
                  key={color}
                  className={`${styles.colorOption} ${(task.color || bucket?.color || DEFAULT_TASK_COLOR) === color ? styles.isActive : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleUpdate('color', color)}
                  title={color}
                />
              ))}
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.section}>
              <label className={styles.label}>开始日期</label>
              <input
                type="date"
                className={styles.dateInput}
                value={formatDate(new Date(task.startDateTime))}
                onChange={(e) =>
                  handleUpdate('startDateTime', new Date(e.target.value))
                }
              />
            </div>

            <div className={styles.section}>
              <label className={styles.label}>截止日期</label>
              <input
                type="date"
                className={styles.dateInput}
                value={formatDate(new Date(task.dueDateTime))}
                onChange={(e) =>
                  handleUpdate('dueDateTime', new Date(e.target.value))
                }
              />
            </div>
          </div>

          {task.taskType !== 'milestone' && (() => {
            const durationDays = getDaysBetween(new Date(task.startDateTime), new Date(task.dueDateTime))
            const durationWeeks = durationDays / 7
            return (
              <div className={styles.section}>
                <label className={styles.label}>
                  持续时间: {durationWeeks >= 1 ? `${durationWeeks.toFixed(1).replace(/\.0$/, '')} 周` : `${durationDays} 天`}
                </label>
                <div className={styles.durationRow}>
                  <input
                    type="number"
                    className={styles.durationInput}
                    min="0.5"
                    step="0.5"
                    value={parseFloat(durationWeeks.toFixed(1))}
                    onChange={(e) => {
                      const weeks = parseFloat(e.target.value)
                      if (isNaN(weeks) || weeks <= 0) return
                      const days = Math.round(weeks * 7)
                      const due = new Date(task.dueDateTime)
                      const newStart = new Date(due)
                      newStart.setDate(newStart.getDate() - days)
                      handleUpdate('startDateTime', newStart)
                    }}
                  />
                  <span className={styles.durationUnit}>周</span>
                  <span className={styles.durationHint}>（修改后自动调整开始日期）</span>
                </div>
              </div>
            )
          })()}

          <div className={styles.section}>
            <label className={styles.label}>进度: {task.completedPercent || 0}%</label>
            <input
              type="range"
              className={styles.range}
              min="0"
              max="100"
              value={task.completedPercent || 0}
              onChange={(e) => handleUpdate('completedPercent', parseInt(e.target.value))}
            />
          </div>

          {/* 相对截止日期约束 */}
          {task.taskType !== 'milestone' && (
            <div className={styles.section}>
              <label className={styles.label}>截止日期约束</label>
              {constraint && constraintRef ? (
                <div className={styles.constraintDisplay}>
                  <div className={styles.constraintInfo}>
                    <span className={styles.constraintIcon}>{constraintRef.taskType === 'milestone' ? '◆' : '📋'}</span>
                    <span className={styles.constraintText}>
                      在 <strong>{constraintRef.title}</strong> {constraint.type === 'before' ? '之前' : '之后'} <strong>{constraint.offsetWeeks}周</strong> 完成
                    </span>
                  </div>
                  <div className={styles.constraintActions}>
                    <select
                      className={styles.constraintSelect}
                      value={constraint.type}
                      onChange={(e) => handleSetConstraint(constraint.refTaskId, constraint.offsetWeeks, e.target.value as 'before' | 'after')}
                    >
                      <option value="before">之前</option>
                      <option value="after">之后</option>
                    </select>
                    <input
                      type="number"
                      className={styles.constraintWeekInput}
                      min="0"
                      value={constraint.offsetWeeks}
                      onChange={(e) => handleSetConstraint(constraint.refTaskId, Math.max(0, parseInt(e.target.value) || 0), constraint.type)}
                    />
                    <span style={{ fontSize: '11px', color: '#666' }}>周</span>
                    <button className={styles.constraintRemoveBtn} onClick={handleClearConstraint} title="移除约束">✕</button>
                  </div>
                </div>
              ) : (
                <div className={styles.constraintSetup}>
                  <div className={styles.constraintSetupLabel}>选择参考节点：</div>
                  {milestoneCandidates.length > 0 && (
                    <div className={styles.constraintGroup}>
                      <div className={styles.constraintGroupTitle}>◆ 里程碑</div>
                      {milestoneCandidates.map((ms) => (
                        <button
                          key={ms.id}
                          className={styles.constraintRefBtn}
                          onClick={() => handleSetConstraint(ms.id, 2, 'before')}
                          title={`设置为在"${ms.title}"之前2周完成`}
                        >
                          <span className={styles.constraintRefIcon}>◆</span>
                          {ms.title}
                          <span className={styles.constraintRefDate}>
                            {new Date(ms.startDateTime).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  {taskCandidates.length > 0 && (
                    <div className={styles.constraintGroup}>
                      <div className={styles.constraintGroupTitle}>📋 任务</div>
                      {taskCandidates.slice(0, 10).map((t) => (
                        <button
                          key={t.id}
                          className={styles.constraintRefBtn}
                          onClick={() => handleSetConstraint(t.id, 1, 'before')}
                          title={`设置为在"${t.title}"之前1周完成`}
                        >
                          {t.title}
                          <span className={styles.constraintRefDate}>
                            {new Date(t.dueDateTime).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  {refCandidates.length === 0 && (
                    <div style={{ fontSize: '12px', color: '#999', fontStyle: 'italic' }}>暂无可用的参考节点</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 依赖关系 */}
          {(dependencyTasks.length > 0 || dependentTasks.length > 0) && (
            <div className={styles.section}>
              <label className={styles.label}>依赖关系</label>
              {dependencyTasks.length > 0 && (
                <div className={styles.dependencyList}>
                  <div className={styles.dependencyLabel}>依赖于：</div>
                  {dependencyTasks.map((depTask) => {
                    const dep = (task.dependencies || []).find((d) =>
                      typeof d === 'string' ? d === depTask.id : d.taskId === depTask.id
                    )
                    const lagDays = typeof dep === 'string' ? 0 : dep?.lagDays || 0
                    // 检查约束违反
                    const depEndDate = new Date(depTask.dueDateTime)
                    const taskStartDate = new Date(task.startDateTime)
                    const actualGap = getDaysBetween(depEndDate, taskStartDate)
                    const violated = actualGap < lagDays
                    const delayDays = violated ? lagDays - actualGap : 0
                    return (
                      <div key={depTask.id} className={styles.dependencyItem} style={violated ? { border: '1px solid #e00', background: '#fff0f0' } : undefined}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span>📎 {depTask.title}</span>
                          {violated ? (
                            <span style={{ fontSize: '11px', color: '#e00', fontWeight: 'bold' }}>
                              ⚠ 延迟{delayDays}天{lagDays > 0 ? ` (约束+${lagDays}天)` : ''}
                            </span>
                          ) : lagDays > 0 ? (
                            <span style={{ fontSize: '11px', color: '#0078d4', fontWeight: 'bold' }}>
                              (约束: +{lagDays}天 ✓)
                            </span>
                          ) : null}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <label style={{ fontSize: '11px', color: '#888' }}>延迟天数:</label>
                          <input
                            type="number"
                            min="0"
                            style={{ width: '50px', fontSize: '11px', padding: '1px 4px' }}
                            value={lagDays}
                            onChange={(e) => updateDependencyLag(task.id, depTask.id, Math.max(0, parseInt(e.target.value) || 0))}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              {dependentTasks.length > 0 && (
                <div className={styles.dependencyList}>
                  <div className={styles.dependencyLabel}>被依赖于：</div>
                  {dependentTasks.map((depTask) => (
                    <div key={depTask.id} className={styles.dependencyItem}>
                      👉 {depTask.title}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {bucket && (
            <div className={styles.section}>
              <label className={styles.label}>分组</label>
              <div className={styles.bucketBadge}>
                <span
                  className={styles.bucketColor}
                  style={{ backgroundColor: bucket.color || STATUS_COLORS.NotStarted }}
                />
                {bucket.name}
              </div>
            </div>
          )}

          {taskLabels.length > 0 && (
            <div className={styles.section}>
              <label className={styles.label}>标签</label>
              <div className={styles.labels}>
                {taskLabels.map((label) => (
                  <span key={label.id} className={styles.labelBadge}>
                    {label.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {assignees.length > 0 && (
            <div className={styles.section}>
              <label className={styles.label}>负责人</label>
              <div className={styles.assignees}>
                {assignees.map((user) => (
                  <div key={user.id} className={styles.assignee}>
                    <div className={styles.assigneeAvatar}>
                      {user.name.charAt(0)}
                    </div>
                    <span className={styles.assigneeName}>{user.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={styles.section}>
            <label className={styles.label}>元信息</label>
            <div className={styles.meta}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>创建时间</span>
                <span className={styles.metaValue}>
                  {formatDateTime(new Date(task.createdAt))}
                </span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>更新时间</span>
                <span className={styles.metaValue}>
                  {formatDateTime(new Date(task.updatedAt))}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.panelFooter}>
          <button
            className={styles.deleteButton}
            onClick={() => {
              if (confirm('确定要删除这个任务吗？')) {
                useAppStore.getState().deleteTask(task.id)
                setSelectedTaskId(null)
              }
            }}
          >
            删除任务
          </button>
        </div>
      </div>
    </div>
  )
}
