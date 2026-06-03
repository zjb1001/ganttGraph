/**
 * 甘特图 Agent 增强组件
 * 在甘特图上显示 Level 6-7 的 Agent 分析结果
 */

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { adaptiveEngine } from '@/agent/AdaptiveAdjustmentEngine';
import { globalMessageBus, CollaborationManager } from '@/agent/MultiAgentSystem';
import {
  ProjectManagerAgent,
  DeveloperAgent,
  TesterAgent,
  ResourceSchedulerAgent,
  RiskMonitorAgent
} from '@/agent/SpecializedAgents';
import styles from './GanttAgentOverlay.module.css';

interface TaskRisk {
  taskId: string;
  taskName: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  delayDays: number;
  message: string;
}

interface AgentInsight {
  type: 'risk' | 'suggestion' | 'optimization';
  message: string;
  taskId?: string;
  priority: 'low' | 'medium' | 'high';
}

export function useGanttAgent() {
  const { tasks, currentProjectId } = useAppStore();
  const [risks, setRisks] = useState<TaskRisk[]>([]);
  const [insights, setInsights] = useState<AgentInsight[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<Date | null>(null);
  const [collabManager, setCollabManager] = useState<CollaborationManager | null>(null);

  // 初始化 Agent 系统
  useEffect(() => {
    const bus = globalMessageBus;
    const manager = new CollaborationManager(bus);
    
    // 创建专业 Agent（用于甘特图分析）
    const pmAgent = new ProjectManagerAgent('pm_gantt', bus);
    const devAgent = new DeveloperAgent('dev_gantt', 'Dev Consultant', bus);
    const testAgent = new TesterAgent('test_gantt', 'Test Consultant', bus);
    const resourceAgent = new ResourceSchedulerAgent('res_gantt', bus);
    const riskAgent = new RiskMonitorAgent('risk_gantt', bus);
    
    [pmAgent, devAgent, testAgent, resourceAgent, riskAgent].forEach(a => {
      manager.registerAgent(a);
    });
    
    setCollabManager(manager);
  }, []);

  // 分析甘特图风险
  const analyzeRisks = async () => {
    if (!currentProjectId || tasks.length === 0) return;
    
    setIsAnalyzing(true);
    
    const context = {
      projectId: currentProjectId,
      tasks: tasks.map(t => ({
        ...t,
        status: t.status || 'NotStarted',
        completedPercent: t.completedPercent || 0
      })),
      buckets: []
    };
    
    try {
      // Level 6: 运行自适应检测
      const result = await adaptiveEngine.runAdaptiveCycle(context.tasks, context, {
        autoApply: false
      });
      
      const newRisks: TaskRisk[] = [];
      const newInsights: AgentInsight[] = [];
      
      if (result.detected) {
        // 延期风险
        result.delays.forEach(d => {
          newRisks.push({
            taskId: d.taskId,
            taskName: d.taskName,
            riskLevel: d.severity as TaskRisk['riskLevel'],
            delayDays: d.delayDays,
            message: `Expected delay of ${d.delayDays} days`
          });
        });
        
        // 生成 Agent 洞察
        newInsights.push({
          type: 'risk',
          message: `Detected ${result.delays.length} delay risk(s)`,
          priority: 'high'
        });
        
        // 推荐方案
        if (result.plans.length > 0) {
          const bestPlan = result.plans[0];
          newInsights.push({
            type: 'suggestion',
            message: `Suggestion: ${bestPlan.name} (save ${bestPlan.impact.timeSave} days)`,
            priority: 'medium'
          });
        }
      } else {
        newInsights.push({
          type: 'optimization',
          message: 'Project on track, no delay risks detected',
          priority: 'low'
        });
      }
      
      setRisks(newRisks);
      setInsights(newInsights);
      setLastAnalysis(new Date());
      
    } catch (error) {
      console.error('Agent 分析失败:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 自动分析（当任务变化时）
  useEffect(() => {
    const timer = setTimeout(() => {
      analyzeRisks();
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [tasks, currentProjectId]);

  // 获取任务风险
  const getTaskRisk = (taskId: string): TaskRisk | undefined => {
    return risks.find(r => r.taskId === taskId);
  };

  // 应用调整方案
  const applyAdjustment = async (planType: string) => {
    if (!currentProjectId) return;
    
    // 这里可以实现应用调整方案的逻辑
    // 暂时返回空结果
    return { applied: true, planType };
  };

  return {
    risks,
    insights,
    isAnalyzing,
    lastAnalysis,
    analyzeRisks,
    getTaskRisk,
    applyAdjustment,
    collabManager
  };
}

// 风险标记组件
export function TaskRiskBadge({ risk }: { risk?: TaskRisk }) {
  if (!risk) return null;
  
  const colors = {
    low: '#22c55e',
    medium: '#f59e0b',
    high: '#ef4444',
    critical: '#dc2626'
  };
  
  const icons = {
    low: '⚠️',
    medium: '⚠️',
    high: '🚨',
    critical: '🔥'
  };
  
  return (
    <div 
      className={styles.riskBadge}
      style={{ backgroundColor: colors[risk.riskLevel] }}
      title={risk.message}
    >
      {icons[risk.riskLevel]} {risk.delayDays}d
    </div>
  );
}

// Agent 洞察面板
export function AgentInsightPanel() {
  const { insights, isAnalyzing, lastAnalysis, analyzeRisks } = useGanttAgent();
  const [isOpen, setIsOpen] = useState(true);
  
  if (!isOpen) {
    return (
      <button 
        className={styles.insightToggle}
        onClick={() => setIsOpen(true)}
      >
        🤖 Agent
        {insights.some(i => i.priority === 'high') && <span className={styles.alertDot} />}
      </button>
    );
  }
  
  return (
    <div className={styles.insightPanel}>
      <div className={styles.panelHeader}>
        <span>🤖 Agent Insights</span>
        <div className={styles.headerActions}>
          {isAnalyzing && <span className={styles.analyzing}>Analyzing...</span>}
          <button onClick={() => analyzeRisks()} title="Re-analyze">🔄</button>
          <button onClick={() => setIsOpen(false)}>×</button>
        </div>
      </div>
      
      <div className={styles.insightList}>
        {insights.length === 0 ? (
          <div className={styles.emptyInsight}>
            No insights yet, click refresh to start analysis
          </div>
        ) : (
          insights.map((insight, i) => (
            <div 
              key={i} 
              className={`${styles.insightItem} ${styles[insight.type]} ${styles[insight.priority]}`}
            >
              <span className={styles.insightIcon}>
                {insight.type === 'risk' && '⚠️'}
                {insight.type === 'suggestion' && '💡'}
                {insight.type === 'optimization' && '✅'}
              </span>
              <span className={styles.insightText}>{insight.message}</span>
            </div>
          ))
        )}
      </div>
      
      {lastAnalysis && (
        <div className={styles.lastUpdate}>
          Last updated: {lastAnalysis.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}

// Agent 工具栏
export function GanttAgentToolbar() {
  const { risks, isAnalyzing, analyzeRisks, applyAdjustment } = useGanttAgent();
  const [showAdjustments, setShowAdjustments] = useState(false);
  
  const hasRisks = risks.length > 0;
  
  return (
    <div className={styles.agentToolbar}>
      <div className={styles.toolbarSection}>
        <button 
          className={`${styles.toolbarBtn} ${hasRisks ? styles.hasRisk : ''}`}
          onClick={analyzeRisks}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? '⏳' : '🔍'} Risk Scan
          {hasRisks && <span className={styles.badge}>{risks.length}</span>}
        </button>
        
        <button 
          className={styles.toolbarBtn}
          onClick={() => setShowAdjustments(!showAdjustments)}
          disabled={!hasRisks}
        >
          🛠️ Adjustments
        </button>
      </div>
      
      {showAdjustments && hasRisks && (
        <div className={styles.adjustmentMenu}>
          <div className={styles.menuTitle}>Choose adjustment strategy:</div>
          <button onClick={() => applyAdjustment('crash')}>
            ⚡ Crashing (add resources)
          </button>
          <button onClick={() => applyAdjustment('fast-track')}>
            🔥 Fast Tracking (parallel)
          </button>
          <button onClick={() => applyAdjustment('resource-reallocate')}>
            🔄 Resource Reallocation
          </button>
          <button onClick={() => applyAdjustment('scope-reduce')}>
            ✂️ Scope Reduction
          </button>
        </div>
      )}
    </div>
  );
}

export { PredictivePanel } from './PredictivePanel';
export { BrakingPanel } from './BrakingPanel';
