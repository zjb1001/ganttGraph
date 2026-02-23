import { useEffect, useState } from 'react'
import { useAppStore } from './store/appStore'
import Header from './components/Header/Header'
import Sidebar from './components/Sidebar/Sidebar'
import GanttView from './components/GanttView/GanttView'
import BoardView from './components/BoardView/BoardView'
import ListView from './components/ListView/ListView'
import TaskPanel from './components/TaskPanel/TaskPanel'
import Dashboard from './components/Dashboard/Dashboard'
import { initializeSampleData } from './db'
import styles from './App.module.css'

function App() {
  const [isInitialized, setIsInitialized] = useState(false)
  const {
    currentProjectId,
    currentView,
    sidebarCollapsed,
    loadProjects,
    loadBuckets,
    loadUsers,
    loadLabels,
    loadTasks,
    projects,
    setCurrentProjectId
  } = useAppStore()

  // 初始化数据加载
  useEffect(() => {
    const initData = async () => {
      try {
        await initializeSampleData()
        await loadProjects()
        await loadBuckets()
        await loadUsers()
        await loadLabels()
        setIsInitialized(true)
      } catch (error) {
        console.error('数据初始化失败:', error)
        setIsInitialized(true) // 即使失败也继续，避免卡在加载状态
      }
    }
    initData()
  }, [loadProjects, loadBuckets, loadUsers, loadLabels])

  // 当项目切换时加载任务
  useEffect(() => {
    if (currentProjectId) {
      loadTasks(currentProjectId)
    }
  }, [currentProjectId, loadTasks])

  // 加载中显示
  if (!isInitialized) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>加载中...</p>
      </div>
    )
  }

  // 如果没有项目或没有选择项目，显示 Dashboard
  if (projects.length === 0 || !currentProjectId) {
    return <Dashboard />
  }

  return (
    <div className={styles.app}>
      <Header />
      <div className={styles.main}>
        <div className={`${styles.sidebarWrapper} ${sidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
          <Sidebar />
        </div>
        <div className={styles.content}>
          {currentView === 'gantt' && <GanttView />}
          {currentView === 'board' && <BoardView />}
          {currentView === 'list' && <ListView />}
        </div>
      </div>
      <TaskPanel />
    </div>
  )
}

export default App
