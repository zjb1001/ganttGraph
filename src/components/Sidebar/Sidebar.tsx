import { useState, useMemo } from 'react'
import { useAppStore } from '@/store/appStore'
import { STATUS_COLORS, PRIORITY_COLORS } from '@/utils/colors'
import styles from './Sidebar.module.css'

function Section({
  title,
  children,
  defaultOpen = true
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={styles.sidebarSection}>
      <button className={styles.sectionTitleBtn} onClick={() => setOpen((o) => !o)}>
        <span>{title}</span>
        <span className={`${styles.chevron} ${open ? '' : styles.chevronCollapsed}`}>▾</span>
      </button>
      {open && <div className={styles.sectionContent}>{children}</div>}
    </div>
  )
}

export default function Sidebar() {
  const { buckets, tasks, users, labels, currentProjectId } = useAppStore()

  const projectTasks = tasks.filter((t) => t.projectId === currentProjectId)

  // 去重：只保留该项目实际用到的 bucket（按 id 去重）
  const projectBuckets = useMemo(() => {
    const usedIds = new Set(projectTasks.map((t) => t.bucketId))
    const seen = new Set<string>()
    return buckets.filter((b) => {
      if (usedIds.has(b.id) && !seen.has(b.id)) {
        seen.add(b.id)
        return true
      }
      return false
    })
  }, [buckets, projectTasks])

  // 按状态统计任务
  const statusCounts = {
    NotStarted: projectTasks.filter((t) => t.status === 'NotStarted').length,
    InProgress: projectTasks.filter((t) => t.status === 'InProgress').length,
    Completed: projectTasks.filter((t) => t.status === 'Completed').length
  }

  // 按优先级统计任务
  const priorityCounts = {
    Urgent: projectTasks.filter((t) => t.priority === 'Urgent').length,
    Important: projectTasks.filter((t) => t.priority === 'Important').length,
    Normal: projectTasks.filter((t) => t.priority === 'Normal').length,
    Low: projectTasks.filter((t) => t.priority === 'Low').length
  }

  return (
    <aside className={styles.sidebar}>
      <Section title="分组">
        {projectBuckets.map((bucket) => (
          <div key={bucket.id} className={styles.bucketItem}>
            <span
              className={styles.bucketColor}
              style={{ backgroundColor: bucket.color || STATUS_COLORS.NotStarted }}
            />
            <span className={styles.bucketName}>{bucket.name}</span>
            <span className={styles.bucketCount}>
              {projectTasks.filter((t) => t.bucketId === bucket.id).length}
            </span>
          </div>
        ))}
      </Section>

      <Section title="状态">
        <div className={styles.statusItem}>
          <span className={styles.statusDot} style={{ backgroundColor: STATUS_COLORS.NotStarted }} />
          <span className={styles.statusName}>未开始</span>
          <span className={styles.statusCount}>{statusCounts.NotStarted}</span>
        </div>
        <div className={styles.statusItem}>
          <span className={styles.statusDot} style={{ backgroundColor: STATUS_COLORS.InProgress }} />
          <span className={styles.statusName}>进行中</span>
          <span className={styles.statusCount}>{statusCounts.InProgress}</span>
        </div>
        <div className={styles.statusItem}>
          <span className={styles.statusDot} style={{ backgroundColor: STATUS_COLORS.Completed }} />
          <span className={styles.statusName}>已完成</span>
          <span className={styles.statusCount}>{statusCounts.Completed}</span>
        </div>
      </Section>

      <Section title="优先级">
        <div className={styles.priorityItem}>
          <span className={styles.priorityDot} style={{ backgroundColor: PRIORITY_COLORS.Urgent }} />
          <span className={styles.priorityName}>紧急</span>
          <span className={styles.priorityCount}>{priorityCounts.Urgent}</span>
        </div>
        <div className={styles.priorityItem}>
          <span className={styles.priorityDot} style={{ backgroundColor: PRIORITY_COLORS.Important }} />
          <span className={styles.priorityName}>重要</span>
          <span className={styles.priorityCount}>{priorityCounts.Important}</span>
        </div>
        <div className={styles.priorityItem}>
          <span className={styles.priorityDot} style={{ backgroundColor: PRIORITY_COLORS.Normal }} />
          <span className={styles.priorityName}>普通</span>
          <span className={styles.priorityCount}>{priorityCounts.Normal}</span>
        </div>
        <div className={styles.priorityItem}>
          <span className={styles.priorityDot} style={{ backgroundColor: PRIORITY_COLORS.Low }} />
          <span className={styles.priorityName}>低</span>
          <span className={styles.priorityCount}>{priorityCounts.Low}</span>
        </div>
      </Section>

      {labels.length > 0 && (
        <Section title="标签">
          {labels.map((label) => (
            <div key={label.id} className={styles.labelItem}>
              <span className={styles.labelColor} style={{ backgroundColor: label.color }} />
              <span className={styles.labelName}>{label.name}</span>
            </div>
          ))}
        </Section>
      )}

      {users.length > 0 && (
        <Section title="成员">
          {users.map((user) => (
            <div key={user.id} className={styles.userItem}>
              <div className={styles.userAvatar}>{user.name.charAt(0)}</div>
              <span className={styles.userName}>{user.name}</span>
            </div>
          ))}
        </Section>
      )}
    </aside>
  )
}
