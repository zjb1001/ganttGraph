import { useAppStore } from '@/store/appStore'
import { STATUS_COLORS } from '@/utils/colors'
import styles from './BoardView.module.css'

export default function BoardView() {
  const { tasks, currentProjectId, setSelectedTaskId } = useAppStore()

  const projectTasks = tasks.filter((t) => t.projectId === currentProjectId)

  const statusOrder = ['NotStarted', 'InProgress', 'Completed']
  const statusNames: Record<string, string> = {
    NotStarted: '未开始',
    InProgress: '进行中',
    Completed: '已完成'
  }

  return (
    <div className={styles.boardView}>
      <div className={styles.boardColumns}>
        {statusOrder.map((status) => (
          <div key={status} className={styles.boardColumn}>
            <div className={styles.columnHeader}>
              <span
                className={styles.statusDot}
                style={{ backgroundColor: STATUS_COLORS[status as keyof typeof STATUS_COLORS] }}
              />
              <h3 className={styles.columnTitle}>{statusNames[status]}</h3>
              <span className={styles.taskCount}>
                {projectTasks.filter((t) => t.status === status).length}
              </span>
            </div>
            <div className={styles.columnTasks}>
              {projectTasks
                .filter((t) => t.status === status)
                .map((task) => (
                  <div
                    key={task.id}
                    className={styles.taskCard}
                    onClick={() => setSelectedTaskId(task.id)}
                  >
                    <h4 className={styles.taskTitle}>{task.title}</h4>
                    {task.description && (
                      <p className={styles.taskDescription}>{task.description}</p>
                    )}
                    <div className={styles.taskMeta}>
                      <div className={styles.taskDates}>
                        {new Date(task.startDateTime).toLocaleDateString('zh-CN')} - {new Date(task.dueDateTime).toLocaleDateString('zh-CN')}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
