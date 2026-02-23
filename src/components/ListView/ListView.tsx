import { useAppStore } from '@/store/appStore'
import { STATUS_COLORS, PRIORITY_COLORS } from '@/utils/colors'
import { formatDate } from '@/utils/date'
import styles from './ListView.module.css'

export default function ListView() {
  const { tasks, currentProjectId, setSelectedTaskId } = useAppStore()

  const projectTasks = tasks.filter((t) => t.projectId === currentProjectId)

  const statusNames: Record<string, string> = {
    NotStarted: '未开始',
    InProgress: '进行中',
    Completed: '已完成'
  }

  const priorityNames: Record<string, string> = {
    Urgent: '紧急',
    Important: '重要',
    Normal: '普通',
    Low: '低'
  }

  return (
    <div className={styles.listView}>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thTitle}>任务名称</th>
              <th className={styles.thStatus}>状态</th>
              <th className={styles.thPriority}>优先级</th>
              <th className={styles.thDates}>开始日期</th>
              <th className={styles.thDates}>截止日期</th>
              <th className={styles.thProgress}>进度</th>
            </tr>
          </thead>
          <tbody>
            {projectTasks.map((task) => (
              <tr
                key={task.id}
                className={styles.tableRow}
                onClick={() => setSelectedTaskId(task.id)}
              >
                <td className={styles.tdTitle}>
                  <div className={styles.taskTitle}>{task.title}</div>
                  {task.description && (
                    <div className={styles.taskDescription}>{task.description}</div>
                  )}
                </td>
                <td className={styles.tdStatus}>
                  <div className={styles.statusBadge}>
                    <span
                      className={styles.statusDot}
                      style={{ backgroundColor: STATUS_COLORS[task.status] }}
                    />
                    {statusNames[task.status]}
                  </div>
                </td>
                <td className={styles.tdPriority}>
                  <div className={styles.priorityBadge}>
                    <span
                      className={styles.priorityDot}
                      style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
                    />
                    {priorityNames[task.priority]}
                  </div>
                </td>
                <td className={styles.tdDates}>
                  {formatDate(new Date(task.startDateTime))}
                </td>
                <td className={styles.tdDates}>
                  {formatDate(new Date(task.dueDateTime))}
                </td>
                <td className={styles.tdProgress}>
                  <div className={styles.progressContainer}>
                    <div
                      className={styles.progressBar}
                      style={{ width: `${task.completedPercent || 0}%` }}
                    />
                    <span className={styles.progressText}>{task.completedPercent || 0}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
