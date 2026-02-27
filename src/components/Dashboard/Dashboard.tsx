import { useState, useEffect } from 'react'
import { useAppStore } from '@/store/appStore'
import { Task } from '@/types'
import { db } from '@/db'
import { formatDateTime } from '@/utils/date'
import styles from './Dashboard.module.css'

export default function Dashboard() {
  const { projects, buckets, addProject, updateProject, deleteProject, setCurrentProjectId, loadProjects, loadBuckets } = useAppStore()

  // 直接从 IndexedDB 加载所有任务，确保 Dashboard 显示所有项目的准确统计
  const [allTasks, setAllTasks] = useState<Task[]>([])

  useEffect(() => {
    const loadAllData = async () => {
      const tasks = await db.tasks.toArray()
      setAllTasks(tasks)
      // 同时刷新项目和分组数据
      await loadProjects()
      await loadBuckets()
    }
    loadAllData()
  }, [loadProjects, loadBuckets])

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [editingDesc, setEditingDesc] = useState('')
  const [addingProject, setAddingProject] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')

  const handleStartEdit = (e: React.MouseEvent, projectId: string, name: string, desc: string) => {
    e.stopPropagation()
    setEditingId(projectId)
    setEditingName(name)
    setEditingDesc(desc || '')
  }

  const handleSaveEdit = async () => {
    if (!editingId || !editingName.trim()) {
      setEditingId(null)
      return
    }
    await updateProject(editingId, { name: editingName.trim(), description: editingDesc.trim() || undefined })
    setEditingId(null)
  }

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSaveEdit()
    } else if (e.key === 'Escape') {
      setEditingId(null)
    }
  }

  const handleAddProject = async () => {
    if (!newName.trim()) {
      setAddingProject(false)
      return
    }
    await addProject({
      name: newName.trim(),
      description: newDesc.trim() || undefined,
      bucketIds: []
    })
    setAddingProject(false)
    setNewName('')
    setNewDesc('')
  }

  const handleAddKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAddProject()
    } else if (e.key === 'Escape') {
      setAddingProject(false)
      setNewName('')
      setNewDesc('')
    }
  }

  // 从 DB 刷新所有任务数据
  const refreshAllTasks = async () => {
    const tasks = await db.tasks.toArray()
    setAllTasks(tasks)
  }

  const handleDelete = async (e: React.MouseEvent, projectId: string, projectName: string) => {
    e.stopPropagation()
    if (confirm(`确定要删除项目"${projectName}"吗？此操作不可恢复。`)) {
      await deleteProject(projectId)
      await refreshAllTasks()
    }
  }

  // 统计每个项目的任务数（使用从 DB 直接加载的所有任务）
  const getProjectStats = (projectId: string) => {
    const projectTasks = allTasks.filter((t) => t.projectId === projectId)
    const projectBuckets = buckets.filter((b) => 
      projectTasks.some((t) => t.bucketId === b.id)
    )
    const completed = projectTasks.filter((t) => t.status === 'Completed').length
    const total = projectTasks.length
    const milestones = projectTasks.filter((t) => t.taskType === 'milestone').length
    return { total, completed, milestones, bucketCount: projectBuckets.length }
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.dashboardInner}>
        {/* 顶部标题 */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1 className={styles.title}>
              <span className={styles.titleIcon}>📊</span>
              Gantt Graph
            </h1>
            <p className={styles.subtitle}>项目管理 & 甘特图可视化</p>
          </div>
          <button
            className={styles.addProjectBtn}
            onClick={() => { setAddingProject(true); setNewName(''); setNewDesc('') }}
          >
            + 新建项目
          </button>
        </div>

        {/* 项目网格 */}
        <div className={styles.projectGrid}>
          {projects.map((project) => {
            const stats = getProjectStats(project.id)
            const progress = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

            if (editingId === project.id) {
              return (
                <div key={project.id} className={`${styles.projectCard} ${styles.projectCardEditing}`}>
                  <input
                    className={styles.editNameInput}
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={handleEditKeyDown}
                    placeholder="项目名称"
                    autoFocus
                  />
                  <textarea
                    className={styles.editDescInput}
                    value={editingDesc}
                    onChange={(e) => setEditingDesc(e.target.value)}
                    onKeyDown={handleEditKeyDown}
                    placeholder="项目描述（可选）"
                    rows={2}
                  />
                  <div className={styles.editActions}>
                    <button className={styles.editSaveBtn} onClick={handleSaveEdit}>✓ 保存</button>
                    <button className={styles.editCancelBtn} onClick={() => setEditingId(null)}>✕ 取消</button>
                  </div>
                </div>
              )
            }

            return (
              <div
                key={project.id}
                className={styles.projectCard}
                onClick={() => setCurrentProjectId(project.id)}
              >
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>{project.name}</h3>
                  <div className={styles.cardActions}>
                    <button
                      className={styles.cardEditBtn}
                      onClick={(e) => handleStartEdit(e, project.id, project.name, project.description || '')}
                      title="编辑项目"
                    >✎</button>
                    <button
                      className={styles.cardDeleteBtn}
                      onClick={(e) => handleDelete(e, project.id, project.name)}
                      title="删除项目"
                    >×</button>
                  </div>
                </div>
                {project.description && (
                  <p className={styles.cardDesc}>{project.description}</p>
                )}
                <div className={styles.cardStats}>
                  <div className={styles.statItem}>
                    <span className={styles.statValue}>{stats.total}</span>
                    <span className={styles.statLabel}>任务</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statValue}>{stats.milestones}</span>
                    <span className={styles.statLabel}>里程碑</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statValue}>{progress}%</span>
                    <span className={styles.statLabel}>完成度</span>
                  </div>
                </div>
                {stats.total > 0 && (
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                  </div>
                )}
                <div className={styles.cardFooter}>
                  <span className={styles.cardDate}>
                    更新于 {formatDateTime(new Date(project.updatedAt))}
                  </span>
                </div>
              </div>
            )
          })}

          {/* 新建项目卡片 */}
          {addingProject ? (
            <div className={`${styles.projectCard} ${styles.projectCardEditing}`}>
              <input
                className={styles.editNameInput}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={handleAddKeyDown}
                placeholder="项目名称"
                autoFocus
              />
              <textarea
                className={styles.editDescInput}
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                onKeyDown={handleAddKeyDown}
                placeholder="项目描述（可选）"
                rows={2}
              />
              <div className={styles.editActions}>
                <button className={styles.editSaveBtn} onClick={handleAddProject}>✓ 创建</button>
                <button className={styles.editCancelBtn} onClick={() => { setAddingProject(false); setNewName(''); setNewDesc('') }}>✕ 取消</button>
              </div>
            </div>
          ) : (
            <button
              className={styles.addCard}
              onClick={() => { setAddingProject(true); setNewName(''); setNewDesc('') }}
            >
              <span className={styles.addCardIcon}>+</span>
              <span className={styles.addCardText}>新建项目</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
