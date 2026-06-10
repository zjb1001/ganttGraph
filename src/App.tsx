import { useEffect, useState } from 'react'
import { useAppStore } from './store/appStore'
import Header from './components/Header/Header'
import Sidebar from './components/Sidebar/Sidebar'
import GanttView from './components/GanttView/GanttView'
import BoardView from './components/BoardView/BoardView'
import ListView from './components/ListView/ListView'
import TaskPanel from './components/TaskPanel/TaskPanel'
import Dashboard from './components/Dashboard/Dashboard'
import { AIAssistantView } from './components/AIAssistantView'
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
    loadMarkers,
    projects
  } = useAppStore()

  // 初始化数据加载
  useEffect(() => {
    const initData = async () => {
      try {
        await initializeSampleData()
        await loadProjects()
        await loadUsers()
        await loadLabels()
        setIsInitialized(true)
      } catch (error) {
        console.error('Data initialization failed:', error)
        setIsInitialized(true)
      }
    }
    initData()
  }, [loadProjects, loadUsers, loadLabels])

  // 当项目切换时加载任务和分组（保证各项目数据完全隔离）
  useEffect(() => {
    if (currentProjectId) {
      loadTasks(currentProjectId)
      loadMarkers(currentProjectId)
      loadBuckets(currentProjectId)
    }
  }, [currentProjectId, loadTasks, loadMarkers, loadBuckets])

  // 加载中显示
  if (!isInitialized) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading...</p>
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
          {currentView === 'ai' && <AIAssistantView />}
        </div>
      </div>
      <TaskPanel />
    </div>
  )
}

export default App
