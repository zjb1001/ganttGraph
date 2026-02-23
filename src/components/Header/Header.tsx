import { useAppStore } from '@/store/appStore'
import styles from './Header.module.css'

export default function Header() {
  const { currentProjectId, currentView, projects, sidebarCollapsed, setCurrentView, setCurrentProjectId, toggleSidebar } = useAppStore()

  const currentProject = projects.find((p) => p.id === currentProjectId)

  const views = [
    { id: 'gantt' as const, name: '甘特图', icon: '📊' },
    { id: 'board' as const, name: '看板', icon: '📋' },
    { id: 'list' as const, name: '列表', icon: '📝' }
  ]

  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <button
          className={styles.sidebarToggle}
          onClick={toggleSidebar}
          title={sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {sidebarCollapsed ? (
              <>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="9" y1="3" x2="9" y2="21" />
                <polyline points="14 9 17 12 14 15" />
              </>
            ) : (
              <>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="9" y1="3" x2="9" y2="21" />
                <polyline points="16 9 13 12 16 15" />
              </>
            )}
          </svg>
        </button>
        <button
          className={styles.logo}
          onClick={() => setCurrentProjectId(null)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={styles.logoSvg}>
            <rect x="2" y="3" width="6" height="18" rx="1.5" fill="#2563eb" opacity="0.9" />
            <rect x="9" y="7" width="6" height="14" rx="1.5" fill="#3b82f6" opacity="0.7" />
            <rect x="16" y="5" width="6" height="16" rx="1.5" fill="#60a5fa" opacity="0.5" />
          </svg>
          <span className={styles.logoText}>GanttGraph</span>
        </button>
        {currentProject && (
          <>
            <div className={styles.separator} />
            <h1 className={styles.projectName}>{currentProject.name}</h1>
          </>
        )}
      </div>

      <div className={styles.headerCenter}>
        <nav className={styles.viewSwitcher}>
          {views.map((view) => (
            <button
              key={view.id}
              className={`${styles.viewButton} ${currentView === view.id ? styles.active : ''}`}
              onClick={() => setCurrentView(view.id)}
              title={view.name}
            >
              <span className={styles.viewIcon}>{view.icon}</span>
              <span className={styles.viewName}>{view.name}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className={styles.headerRight}>
        <button className={styles.iconButton} title="设置">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
        </button>
      </div>
    </header>
  )
}
