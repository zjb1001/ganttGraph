/**
 * Multi-Agent Collaboration Dashboard
 * 展示 Level 7 多智能体协作系统状态
 */

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { globalMessageBus, CollaborationManager } from '@/agent/MultiAgentSystem';
import {
  ProjectManagerAgent,
  DeveloperAgent,
  TesterAgent,
  ResourceSchedulerAgent,
  RiskMonitorAgent
} from '@/agent/SpecializedAgents';
import { adaptiveEngine } from '@/agent/AdaptiveAdjustmentEngine';
import './MultiAgentDashboard.css';

interface AgentStatus {
  id: string;
  name: string;
  role: string;
  status: 'idle' | 'working' | 'blocked' | 'offline';
  workload: number;
  currentTasks: string[];
  capabilities: string[];
  lastActive: Date;
}

interface AgentMessage {
  id: string;
  from: string;
  to: string;
  type: string;
  content: string;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface DelayAlert {
  taskId: string;
  taskName: string;
  delayDays: number;
  severity: 'low' | 'medium' | 'high';
  recommendation: string;
}

interface AdjustmentPlan {
  id: string;
  name: string;
  type: string;
  timeSave: number;
  cost: number;
  risk: number;
  description: string;
  selected: boolean;
}

export function MultiAgentDashboard() {
  const [isOpen, setIsOpen] = useState(false);
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [delays, setDelays] = useState<DelayAlert[]>([]);
  const [plans, setPlans] = useState<AdjustmentPlan[]>([]);
  const [collabManager, setCollabManager] = useState<CollaborationManager | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'messages' | 'delays' | 'team'>('overview');
  const [isMonitoring, setIsMonitoring] = useState(false);
  
  const { tasks, currentProjectId } = useAppStore();

  // 初始化多Agent系统
  const initMultiAgentSystem = () => {
    const bus = globalMessageBus;
    const manager = new CollaborationManager(bus);
    
    // 创建专业Agent
    const pmAgent = new ProjectManagerAgent('pm_001', bus);
    const devMCAL = new DeveloperAgent('dev_mcal', 'MCAL工程师', bus, ['C', 'MCAL', 'ADC', 'PWM']);
    const devAlgo = new DeveloperAgent('dev_algo', '算法工程师', bus, ['C', 'MATLAB', '控制算法']);
    const testAgent = new TesterAgent('test_001', '测试工程师', bus);
    const resourceAgent = new ResourceSchedulerAgent('res_001', bus);
    const riskAgent = new RiskMonitorAgent('risk_001', bus);
    
    // 注册Agent
    [pmAgent, devMCAL, devAlgo, testAgent, resourceAgent, riskAgent].forEach(a => {
      manager.registerAgent(a);
      (a as any).updateState({
        status: 'idle',
        currentTasks: [],
        workload: 0
      });
    });
    
    setCollabManager(manager);
    updateAgentStates(manager);
    
    // 监听消息
    const unsubscribe = bus.subscribe('*', (message) => {
      setMessages(prev => [{
        id: `${Date.now()}_${Math.random()}`,
        from: message.from,
        to: message.to || 'broadcast',
        type: message.type,
        content: JSON.stringify(message.payload).slice(0, 100),
        timestamp: new Date(message.timestamp),
        priority: message.priority
      }, ...prev].slice(0, 50));
    });
    
    return () => unsubscribe();
  };

  // 更新Agent状态
  const updateAgentStates = (manager: CollaborationManager) => {
    const states = manager.getAllAgentStates().map(s => ({
      id: s.id,
      name: s.name,
      role: s.role,
      status: s.status,
      workload: s.workload,
      currentTasks: s.currentTasks,
      capabilities: s.capabilities,
      lastActive: new Date(s.lastActive)
    }));
    setAgents(states);
  };

  // 运行风险监控
  const runRiskMonitoring = async () => {
    if (!currentProjectId || tasks.length === 0) return;
    
    setIsMonitoring(true);
    
    const context = {
      projectId: currentProjectId,
      tasks: tasks.map(t => ({
        ...t,
        status: t.status || 'NotStarted',
        completedPercent: t.completedPercent || 0
      })),
      buckets: []
    };
    
    // 运行自适应检测
    const result = await adaptiveEngine.runAdaptiveCycle(context.tasks, context, {
      autoApply: false
    });
    
    if (result.detected) {
      const alerts: DelayAlert[] = result.delays.map(d => ({
        taskId: d.taskId,
        taskName: d.taskName,
        delayDays: d.delayDays,
        severity: d.severity as 'low' | 'medium' | 'high',
        recommendation: result.recommendation
      }));
      setDelays(alerts);
      
      const adjustmentPlans = result.plans.map((p, i) => ({
        id: `plan_${i}`,
        name: p.name,
        type: p.type,
        timeSave: p.impact.timeSave,
        cost: p.impact.cost,
        risk: p.impact.risk,
        description: p.recommendation,
        selected: i === 0
      }));
      setPlans(adjustmentPlans);
    }
    
    setIsMonitoring(false);
  };

  // 应用调整方案
  const applyPlan = async (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;
    
    setPlans(prev => prev.map(p => ({
      ...p,
      selected: p.id === planId
    })));
    
    // 模拟应用方案
    setTimeout(() => {
      setDelays([]);
      alert(`已应用方案: ${plan.name}\n节省工期: ${plan.timeSave}天`);
    }, 1000);
  };

  // 每日站会
  const runDailyStandup = async () => {
    if (!collabManager) return;
    
    const report = await collabManager.runDailyStandup();
    
    // 添加站会消息
    const summaryMsg: AgentMessage = {
      id: `standup_${Date.now()}`,
      from: 'system',
      to: 'all',
      type: 'daily-standup',
      content: `每日站会: ${report.summary}`,
      timestamp: new Date(),
      priority: 'medium'
    };
    setMessages(prev => [summaryMsg, ...prev]);
    
    updateAgentStates(collabManager);
  };

  useEffect(() => {
    if (isOpen && !collabManager) {
      const cleanup = initMultiAgentSystem();
      return cleanup;
    }
  }, [isOpen]);

  // 定期更新Agent状态
  useEffect(() => {
    if (!isOpen || !collabManager) return;
    
    const interval = setInterval(() => {
      updateAgentStates(collabManager);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isOpen, collabManager]);

  const getRoleIcon = (role: string) => {
    const icons: Record<string, string> = {
      'project-manager': '👔',
      'developer': '💻',
      'tester': '🔍',
      'resource-scheduler': '📊',
      'risk-monitor': '⚠️'
    };
    return icons[role] || '🤖';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'idle': '#9ca3af',
      'working': '#22c55e',
      'blocked': '#ef4444',
      'offline': '#6b7280'
    };
    return colors[status] || '#9ca3af';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'low': '#22c55e',
      'medium': '#f59e0b',
      'high': '#ef4444',
      'urgent': '#dc2626'
    };
    return colors[priority] || '#9ca3af';
  };

  if (!isOpen) {
    return (
      <button 
        className="multi-agent-fab"
        onClick={() => setIsOpen(true)}
        title="多Agent协作"
      >
        <span className="multi-agent-icon">🤝</span>
        {delays.length > 0 && (
          <span className="multi-agent-badge">{delays.length}</span>
        )}
      </button>
    );
  }

  return (
    <div className="multi-agent-panel">
      {/* Header */}
      <div className="multi-agent-header">
        <h3>🤝 多Agent协作系统</h3>
        <div className="multi-agent-actions">
          <button 
            className="multi-agent-btn"
            onClick={runDailyStandup}
            title="每日站会"
          >
            📅 站会
          </button>
          <button 
            className="multi-agent-btn"
            onClick={runRiskMonitoring}
            disabled={isMonitoring}
            title="风险监控"
          >
            {isMonitoring ? '⏳ 扫描中...' : '⚠️ 扫描'}
          </button>
          <button className="multi-agent-close" onClick={() => setIsOpen(false)}>
            ×
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="multi-agent-tabs">
        <button 
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          📊 概览
        </button>
        <button 
          className={activeTab === 'team' ? 'active' : ''}
          onClick={() => setActiveTab('team')}
        >
          👥 团队
        </button>
        <button 
          className={activeTab === 'delays' ? 'active' : ''}
          onClick={() => setActiveTab('delays')}
        >
          🚨 延期 {delays.length > 0 && `(${delays.length})`}
        </button>
        <button 
          className={activeTab === 'messages' ? 'active' : ''}
          onClick={() => setActiveTab('messages')}
        >
          💬 消息
        </button>
      </div>

      {/* Content */}
      <div className="multi-agent-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{agents.length}</div>
                <div className="stat-label">Agent数量</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{agents.filter(a => a.status === 'working').length}</div>
                <div className="stat-label">工作中</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{delays.length}</div>
                <div className="stat-label">延期风险</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{messages.length}</div>
                <div className="stat-label">消息数</div>
              </div>
            </div>

            {delays.length > 0 && (
              <div className="alert-section">
                <h4>🚨 检测到延期风险</h4>
                {delays.map(d => (
                  <div key={d.taskId} className={`alert-item ${d.severity}`}>
                    <div className="alert-title">{d.taskName}</div>
                    <div className="alert-detail">
                      延期 {d.delayDays} 天 | 严重程度: {d.severity}
                    </div>
                    <div className="alert-action">{d.recommendation}</div>
                  </div>
                ))}
              </div>
            )}

            {plans.length > 0 && (
              <div className="plans-section">
                <h4>💡 推荐调整方案</h4>
                {plans.map(plan => (
                  <div 
                    key={plan.id} 
                    className={`plan-item ${plan.selected ? 'selected' : ''}`}
                    onClick={() => applyPlan(plan.id)}
                  >
                    <div className="plan-header">
                      <span className="plan-name">{plan.name}</span>
                      {plan.selected && <span className="plan-badge">✓ 已选</span>}
                    </div>
                    <div className="plan-stats">
                      <span>⏱️ 节省 {plan.timeSave}天</span>
                      <span>💰 成本 {plan.cost > 0 ? '+' : ''}{plan.cost}%</span>
                      <span>⚠️ 风险 +{plan.risk}%</span>
                    </div>
                    <div className="plan-desc">{plan.description}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'team' && (
          <div className="team-tab">
            {agents.map(agent => (
              <div key={agent.id} className="agent-card">
                <div className="agent-header">
                  <span className="agent-icon">{getRoleIcon(agent.role)}</span>
                  <div className="agent-info">
                    <div className="agent-name">{agent.name}</div>
                    <div className="agent-role">{agent.role}</div>
                  </div>
                  <div 
                    className="agent-status"
                    style={{ backgroundColor: getStatusColor(agent.status) }}
                  >
                    {agent.status}
                  </div>
                </div>
                <div className="agent-workload">
                  <div className="workload-label">工作负载</div>
                  <div className="workload-bar">
                    <div 
                      className="workload-fill"
                      style={{ 
                        width: `${agent.workload}%`,
                        backgroundColor: agent.workload > 80 ? '#ef4444' : agent.workload > 50 ? '#f59e0b' : '#22c55e'
                      }}
                    />
                  </div>
                  <div className="workload-value">{agent.workload}%</div>
                </div>
                {agent.currentTasks.length > 0 && (
                  <div className="agent-tasks">
                    <div className="tasks-label">当前任务:</div>
                    <div className="tasks-list">
                      {agent.currentTasks.map((task, i) => (
                        <span key={i} className="task-tag">{task}</span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="agent-capabilities">
                  {agent.capabilities.slice(0, 3).map((cap, i) => (
                    <span key={i} className="capability-tag">{cap}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'delays' && (
          <div className="delays-tab">
            {delays.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">✅</div>
                <div className="empty-text">暂无延期风险</div>
                <div className="empty-sub">项目按计划进行</div>
              </div>
            ) : (
              <>
                {delays.map(d => (
                  <div key={d.taskId} className={`delay-card ${d.severity}`}>
                    <div className="delay-header">
                      <span className="delay-icon">🚨</span>
                      <span className="delay-name">{d.taskName}</span>
                    </div>
                    <div className="delay-details">
                      <div className="delay-stat">
                        <span className="stat-label">延期天数</span>
                        <span className="stat-value">{d.delayDays}天</span>
                      </div>
                      <div className="delay-stat">
                        <span className="stat-label">严重程度</span>
                        <span className="stat-value">{d.severity}</span>
                      </div>
                    </div>
                    <div className="delay-recommendation">
                      <strong>建议:</strong> {d.recommendation}
                    </div>
                  </div>
                ))}

                {plans.length > 0 && (
                  <div className="adjustment-section">
                    <h4>🛠️ 调整方案</h4>
                    {plans.map(plan => (
                      <button
                        key={plan.id}
                        className={`adjustment-btn ${plan.selected ? 'selected' : ''}`}
                        onClick={() => applyPlan(plan.id)}
                      >
                        <div className="btn-name">{plan.name}</div>
                        <div className="btn-stats">
                          节省{plan.timeSave}天 | 成本{plan.cost}% | 风险+{plan.risk}%
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="messages-tab">
            {messages.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">💬</div>
                <div className="empty-text">暂无消息</div>
              </div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className="message-item">
                  <div className="message-header">
                    <span className="message-from">{msg.from}</span>
                    <span className="message-arrow">→</span>
                    <span className="message-to">{msg.to}</span>
                    <span 
                      className="message-priority"
                      style={{ backgroundColor: getPriorityColor(msg.priority) }}
                    >
                      {msg.priority}
                    </span>
                  </div>
                  <div className="message-type">{msg.type}</div>
                  <div className="message-content">{msg.content}</div>
                  <div className="message-time">
                    {msg.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
