/**
 * Unified AI Assistant View
 * Consolidates Chat, Actions, Multi-Agent Dashboard into a single view
 */

import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { sendChatMessage, checkAgentHealth, type AgentResponse, type AgentAction } from '@/utils/agentApi';
import { executeAgentActions } from '@/utils/agentTools';
import {
  decomposeProject,
  analyzeProjectRisks,
  predictSchedule,
  type DecomposeResponse,
  type RiskAnalysisResponse,
  type SchedulePredictionResponse
} from '@/utils/enhancedAgentApi';
import { globalMessageBus, CollaborationManager } from '@/agent/MultiAgentSystem';
import {
  ProjectManagerAgent,
  DeveloperAgent,
  TesterAgent,
  ResourceSchedulerAgent,
  RiskMonitorAgent
} from '@/agent/SpecializedAgents';
import { adaptiveEngine } from '@/agent/AdaptiveAdjustmentEngine';
import styles from './AIAssistantView.module.css';

type TabId = 'chat' | 'actions' | 'multiagent';

// ===================== Shared Types =====================

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  actions?: string[];
  timestamp: Date;
  pendingActions?: AgentAction[];
}

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

interface AgentMsg {
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

// ===================== Main Component =====================

export default function AIAssistantView() {
  const [activeTab, setActiveTab] = useState<TabId>('chat');

  const tabs: { id: TabId; icon: string; label: string }[] = [
    { id: 'chat', icon: '💬', label: '智能对话' },
    { id: 'actions', icon: '🧩', label: '智能分解' },
    { id: 'multiagent', icon: '🤝', label: '多Agent协作' },
  ];

  return (
    <div className={styles.aiView}>
      <div className={styles.tabNav}>
        <div className={styles.tabNavHeader}>
          <h2>🤖 AI 助手</h2>
        </div>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tabBtn} ${activeTab === tab.id ? styles.active : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className={styles.tabIcon}>{tab.icon}</span>
            <span className={styles.tabLabel}>{tab.label}</span>
          </button>
        ))}
      </div>
      <div className={styles.tabContent}>
        {activeTab === 'chat' && <ChatTab />}
        {activeTab === 'actions' && <ActionsTab />}
        {activeTab === 'multiagent' && <MultiAgentTab />}
      </div>
    </div>
  );
}

// ===================== Chat Tab =====================

function ChatTab() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isServiceAvailable, setIsServiceAvailable] = useState<boolean | null>(null);
  const [pendingResponse, setPendingResponse] = useState<AgentResponse | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { tasks, buckets, currentProjectId, projects } = useAppStore();

  useEffect(() => {
    checkAgentHealth().then(setIsServiceAvailable);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getCurrentProjectName = () => {
    if (!currentProjectId) return null;
    return projects.find(p => p.id === currentProjectId)?.name || null;
  };

  const getTasksContext = () => {
    const formatDate = (d: Date | string | undefined) => {
      if (!d) return undefined;
      const date = d instanceof Date ? d : new Date(d);
      if (isNaN(date.getTime())) return undefined;
      return date.toISOString().split('T')[0];
    };
    return tasks.map(t => ({
      id: t.id, title: t.title, status: t.status, priority: t.priority,
      taskType: t.taskType, startDate: formatDate(t.startDateTime),
      dueDate: formatDate(t.dueDateTime), progress: t.completedPercent ?? 0, bucketId: t.bucketId
    }));
  };

  const handleExecuteActions = async (response: AgentResponse) => {
    const actionResults: string[] = [];
    if (response.actions && response.actions.length > 0) {
      const results = await executeAgentActions(response.actions);
      actionResults.push(...results);
    }
    return actionResults;
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return;
    const userMessage = inputValue.trim();
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp: new Date() }]);
    setIsProcessing(true);
    try {
      const projectName = getCurrentProjectName();
      const response: AgentResponse = await sendChatMessage({
        message: userMessage,
        context: {
          currentProject: projectName ?? undefined,
          currentProjectId: currentProjectId ?? undefined,
          buckets: buckets.map(b => ({ id: b.id, name: b.name, color: b.color, bucketType: b.bucketType })),
          tasks: getTasksContext(), taskCount: tasks.length, bucketCount: buckets.length
        }
      });
      if (!response.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: response.message, timestamp: new Date() }]);
        setIsProcessing(false);
        return;
      }
      const needsConfirmation = response.requiresConfirmation && (response.actions?.length ?? 0) > 0;
      if (needsConfirmation) {
        setPendingResponse(response);
        let confirmationText = response.message + '\n\n即将执行以下操作：';
        if (response.actions) {
          confirmationText += '\n' + response.actions.map(a => `⚠️ ${a.description}`).join('\n');
        }
        setMessages(prev => [...prev, { role: 'assistant', content: confirmationText, pendingActions: response.actions, timestamp: new Date() }]);
        setIsProcessing(false);
        return;
      }
      const actionResults = await handleExecuteActions(response);
      setMessages(prev => [...prev, {
        role: 'assistant', content: response.message,
        actions: actionResults.length > 0 ? actionResults : undefined, timestamp: new Date()
      }]);
      if (response.needs_clarification && response.clarification_questions?.length > 0) {
        setTimeout(() => {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: '请回答以下问题以便我更好地帮助你：\n' + response.clarification_questions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n'),
            timestamp: new Date()
          }]);
        }, 500);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: `抱歉，发生了错误：${error instanceof Error ? error.message : '未知错误'}`, timestamp: new Date() }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!pendingResponse) return;
    setIsProcessing(true);
    try {
      const actionResults = await handleExecuteActions(pendingResponse);
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMsg = newMessages[newMessages.length - 1];
        if (lastMsg) { lastMsg.actions = actionResults; delete lastMsg.pendingActions; }
        return newMessages;
      });
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: `执行失败：${error instanceof Error ? error.message : '未知错误'}`, timestamp: new Date() }]);
    } finally {
      setIsProcessing(false);
      setPendingResponse(null);
    }
  };

  const handleCancelAction = () => {
    setPendingResponse(null);
    setMessages(prev => [...prev, { role: 'assistant', content: '已取消操作', timestamp: new Date() }]);
  };

  const exampleCommands = [
    { icon: '📋', text: '添加一个任务叫「API开发」，下周一开始，持续5天' },
    { icon: '📊', text: '把API开发进度改成50%' },
    { icon: '🎯', text: '创建一个里程碑叫「项目发布」在3月15日' },
    { icon: '📁', text: '创建里程碑分组叫「发布计划」' },
    { icon: '🔄', text: '将开发分组中的任务全部推迟2周' },
  ];

  const renderContent = (content: string) =>
    content.split('\n').map((line, i, arr) => (
      <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
    ));

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatMessages}>
        {messages.length === 0 && (
          <div className={styles.chatWelcome}>
            <div className={styles.chatWelcomeTitle}>
              👋 你好！我是 AI 助手
              {isServiceAvailable === false && <span style={{ color: '#ef4444', fontSize: 12, marginLeft: 8 }}>（服务离线）</span>}
            </div>
            <div className={styles.chatWelcomeSubtitle}>用自然语言告诉我你想做什么，试试下面的示例：</div>
            <div className={styles.chatExamples}>
              {exampleCommands.map((cmd, i) => (
                <button key={i} className={styles.chatExampleItem} onClick={() => setInputValue(cmd.text)}>
                  <span>{cmd.icon}</span>
                  <span>{cmd.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`${styles.chatMessage} ${msg.role === 'user' ? styles.chatMessageUser : styles.chatMessageAssistant}`}>
            <div className={styles.chatBubble}>
              <div>{renderContent(msg.content)}</div>
              {msg.pendingActions && (
                <div className={styles.chatConfirmBtns}>
                  <button className={styles.confirmBtn} onClick={handleConfirmAction}>✅ 确认执行</button>
                  <button className={styles.cancelBtn} onClick={handleCancelAction}>❌ 取消</button>
                </div>
              )}
              {msg.actions && (
                <div className={styles.chatActionResults}>
                  {msg.actions.map((action, i) => (
                    <div key={i} className={styles.chatActionItem}>{action}</div>
                  ))}
                </div>
              )}
              <div className={styles.chatTime}>{msg.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className={`${styles.chatMessage} ${styles.chatMessageAssistant}`}>
            <div className={styles.chatBubble}>
              <div className={styles.chatTyping}><span /><span /><span /></div>
              正在思考...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className={styles.chatInputArea}>
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
          placeholder="输入你的指令... (Shift+Enter 换行)"
          disabled={isProcessing}
          rows={3}
        />
        <button onClick={handleSendMessage} disabled={isProcessing || !inputValue.trim()} className={styles.chatSendBtn}>
          发送
        </button>
      </div>
    </div>
  );
}

// ===================== Actions Tab =====================

function ActionsTab() {
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [decomposeResult, setDecomposeResult] = useState<DecomposeResponse | null>(null);
  const [riskResult, setRiskResult] = useState<RiskAnalysisResponse | null>(null);
  const [predictResult, setPredictResult] = useState<SchedulePredictionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<'decompose' | 'risk' | 'predict' | null>(null);

  const { tasks, currentProjectId, addTask, addBucket, buckets } = useAppStore();

  const clearResults = () => {
    setDecomposeResult(null);
    setRiskResult(null);
    setPredictResult(null);
    setError(null);
  };

  const handleDecompose = async () => {
    if (!inputValue.trim()) { setError('请输入项目需求'); return; }
    setIsProcessing(true);
    clearResults();
    setActiveAction('decompose');
    try {
      const response = await decomposeProject(inputValue);
      if (response.success && response.tasks) {
        setDecomposeResult(response);
        if (currentProjectId) {
          const phaseBuckets = new Map<string, string>();
          for (const task of response.tasks) {
            if (!phaseBuckets.has(task.phase)) {
              const existingBucket = buckets.find(b => b.name === task.phase);
              if (existingBucket) {
                phaseBuckets.set(task.phase, existingBucket.id);
              } else {
                const newBucket = await addBucket({ name: task.phase, order: phaseBuckets.size });
                phaseBuckets.set(task.phase, newBucket.id);
              }
            }
            await addTask({
              title: task.title, startDateTime: new Date(task.start_date), dueDateTime: new Date(task.end_date),
              priority: task.priority === 'Urgent' ? 'Urgent' : task.priority === 'Important' ? 'Important' : task.priority === 'Low' ? 'Low' : 'Normal',
              status: 'NotStarted', bucketId: phaseBuckets.get(task.phase) || buckets[0]?.id || '',
              projectId: currentProjectId, order: 0, taskType: 'task', assigneeIds: [], labelIds: [],
            });
          }
        }
      } else {
        setError(response.message || '分解失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '请求失败，请检查AI服务是否运行');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAnalyzeRisks = async () => {
    if (tasks.length === 0) { setError('当前项目没有任务可分析'); return; }
    setIsProcessing(true);
    clearResults();
    setActiveAction('risk');
    try {
      const response = await analyzeProjectRisks(tasks);
      if (response.success) { setRiskResult(response); } else { setError(response.message || '分析失败'); }
    } catch (err) {
      setError(err instanceof Error ? err.message : '请求失败');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePredict = async () => {
    if (tasks.length === 0) { setError('当前项目没有任务可预测'); return; }
    setIsProcessing(true);
    clearResults();
    setActiveAction('predict');
    try {
      const response = await predictSchedule(tasks);
      if (response.success) { setPredictResult(response); } else { setError(response.message || '预测失败'); }
    } catch (err) {
      setError(err instanceof Error ? err.message : '请求失败');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={styles.actionsContainer}>
      <div className={styles.actionsHeader}>
        <span>🧩</span>
        <h3>AI 智能分解与分析</h3>
        <span className={styles.modelBadge}>智谱 GLM-4</span>
      </div>
      <textarea
        className={styles.actionsTextarea}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="输入项目需求，AI将自动分解为任务计划...&#10;例如：开发一套完整的整车电子制动系统，包含ABS、EBD、ESC功能，ASIL-D安全等级，18个月完成"
        rows={4}
        disabled={isProcessing}
      />
      <div className={styles.actionsBtnGroup}>
        <button className={`${styles.actionBtn} ${styles.actionBtnPrimary}`} onClick={handleDecompose} disabled={isProcessing}>
          {isProcessing && activeAction === 'decompose' ? '⏳ 处理中...' : '🧩 智能分解'}
        </button>
        <button className={`${styles.actionBtn} ${styles.actionBtnSecondary}`} onClick={handleAnalyzeRisks} disabled={isProcessing || tasks.length === 0}>
          {isProcessing && activeAction === 'risk' ? '⏳ 分析中...' : '⚠️ 风险分析'}
        </button>
        <button className={`${styles.actionBtn} ${styles.actionBtnSecondary}`} onClick={handlePredict} disabled={isProcessing || tasks.length === 0}>
          {isProcessing && activeAction === 'predict' ? '⏳ 预测中...' : '🔮 进度预测'}
        </button>
      </div>

      {error && <div className={styles.actionError}>❌ {error}</div>}

      {decomposeResult && activeAction === 'decompose' && (
        <div className={styles.actionResult}>
          <div className={styles.actionResultHeader}>✅ {decomposeResult.message}</div>
          {decomposeResult.tasks && decomposeResult.tasks.length > 0 && (
            <div className={styles.actionStats}>
              <div className={styles.actionStat}>
                <span className={styles.actionStatValue}>{decomposeResult.phases?.length || 0}</span>
                <span className={styles.actionStatLabel}>阶段</span>
              </div>
              <div className={styles.actionStat}>
                <span className={styles.actionStatValue}>{decomposeResult.tasks.length}</span>
                <span className={styles.actionStatLabel}>任务</span>
              </div>
              <div className={styles.actionStat}>
                <span className={styles.actionStatValue}>{decomposeResult.estimated_duration_days}</span>
                <span className={styles.actionStatLabel}>工期(天)</span>
              </div>
              <div className={styles.actionStat}>
                <span className={styles.actionStatValue}>{Math.round(decomposeResult.confidence * 100)}%</span>
                <span className={styles.actionStatLabel}>置信度</span>
              </div>
            </div>
          )}
        </div>
      )}

      {riskResult && activeAction === 'risk' && (
        <div className={styles.actionResult}>
          <div className={styles.actionResultHeader}>⚠️ {riskResult.message}</div>
          <div className={styles.actionStats}>
            <div className={styles.actionStat}>
              <span className={styles.actionStatValue} style={{ color: '#c62828' }}>{riskResult.risk_summary?.critical || 0}</span>
              <span className={styles.actionStatLabel}>严重</span>
            </div>
            <div className={styles.actionStat}>
              <span className={styles.actionStatValue} style={{ color: '#ef6c00' }}>{riskResult.risk_summary?.high || 0}</span>
              <span className={styles.actionStatLabel}>高风险</span>
            </div>
            <div className={styles.actionStat}>
              <span className={styles.actionStatValue}>{riskResult.risks?.length || 0}</span>
              <span className={styles.actionStatLabel}>总风险数</span>
            </div>
          </div>
        </div>
      )}

      {predictResult && predictResult.prediction && activeAction === 'predict' && (
        <div className={styles.actionResult}>
          <div className={styles.actionResultHeader}>🔮 进度预测结果</div>
          <div className={styles.actionStats}>
            <div className={styles.actionStat}>
              <span className={styles.actionStatValue}>{predictResult.prediction.predicted_end_date}</span>
              <span className={styles.actionStatLabel}>预计完成</span>
            </div>
            <div className={styles.actionStat}>
              <span className={styles.actionStatValue}>{Math.round(predictResult.prediction.confidence * 100)}%</span>
              <span className={styles.actionStatLabel}>置信度</span>
            </div>
            <div className={styles.actionStat}>
              <span className={styles.actionStatValue} style={{ color: '#ef6c00' }}>{Math.round(predictResult.prediction.delay_probability * 100)}%</span>
              <span className={styles.actionStatLabel}>延期概率</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===================== Multi-Agent Tab =====================

function MultiAgentTab() {
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [messages, setMessages] = useState<AgentMsg[]>([]);
  const [delays, setDelays] = useState<DelayAlert[]>([]);
  const [plans, setPlans] = useState<AdjustmentPlan[]>([]);
  const [collabManager, setCollabManager] = useState<CollaborationManager | null>(null);
  const [subTab, setSubTab] = useState<'overview' | 'messages' | 'delays' | 'team'>('overview');
  const [isMonitoring, setIsMonitoring] = useState(false);

  const { tasks, currentProjectId } = useAppStore();

  const initMultiAgentSystem = () => {
    const bus = globalMessageBus;
    const manager = new CollaborationManager(bus);
    const pmAgent = new ProjectManagerAgent('pm_001', bus);
    const devMCAL = new DeveloperAgent('dev_mcal', 'MCAL工程师', bus, ['C', 'MCAL', 'ADC', 'PWM']);
    const devAlgo = new DeveloperAgent('dev_algo', '算法工程师', bus, ['C', 'MATLAB', '控制算法']);
    const testAgent = new TesterAgent('test_001', '测试工程师', bus);
    const resourceAgent = new ResourceSchedulerAgent('res_001', bus);
    const riskAgent = new RiskMonitorAgent('risk_001', bus);
    [pmAgent, devMCAL, devAlgo, testAgent, resourceAgent, riskAgent].forEach(a => {
      manager.registerAgent(a);
      (a as any).updateState({ status: 'idle', currentTasks: [], workload: 0 });
    });
    setCollabManager(manager);
    updateAgentStates(manager);
    const unsubscribe = bus.subscribe('*', (message) => {
      setMessages(prev => [{
        id: `${Date.now()}_${Math.random()}`, from: message.from, to: message.to || 'broadcast',
        type: message.type, content: JSON.stringify(message.payload).slice(0, 100),
        timestamp: new Date(message.timestamp), priority: message.priority
      }, ...prev].slice(0, 50));
    });
    return () => unsubscribe();
  };

  const updateAgentStates = (manager: CollaborationManager) => {
    const states = manager.getAllAgentStates().map(s => ({
      id: s.id, name: s.name, role: s.role, status: s.status, workload: s.workload,
      currentTasks: s.currentTasks, capabilities: s.capabilities, lastActive: new Date(s.lastActive)
    }));
    setAgents(states);
  };

  const runRiskMonitoring = async () => {
    if (!currentProjectId || tasks.length === 0) return;
    setIsMonitoring(true);
    const context = {
      projectId: currentProjectId,
      tasks: tasks.map(t => ({ ...t, status: t.status || 'NotStarted', completedPercent: t.completedPercent || 0 })),
      buckets: []
    };
    const result = await adaptiveEngine.runAdaptiveCycle(context.tasks, context, { autoApply: false });
    if (result.detected) {
      setDelays(result.delays.map(d => ({
        taskId: d.taskId, taskName: d.taskName, delayDays: d.delayDays,
        severity: d.severity as 'low' | 'medium' | 'high', recommendation: result.recommendation
      })));
      setPlans(result.plans.map((p: any, i: number) => ({
        id: `plan_${i}`, name: p.name, type: p.type, timeSave: p.impact.timeSave,
        cost: p.impact.cost, risk: p.impact.risk, description: p.recommendation, selected: i === 0
      })));
    }
    setIsMonitoring(false);
  };

  const applyPlan = (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;
    setPlans(prev => prev.map(p => ({ ...p, selected: p.id === planId })));
    setTimeout(() => { setDelays([]); alert(`已应用方案: ${plan.name}\n节省工期: ${plan.timeSave}天`); }, 1000);
  };

  const runDailyStandup = async () => {
    if (!collabManager) return;
    const report = await collabManager.runDailyStandup();
    setMessages(prev => [{
      id: `standup_${Date.now()}`, from: 'system', to: 'all', type: 'daily-standup',
      content: `每日站会: ${report.summary}`, timestamp: new Date(), priority: 'medium'
    }, ...prev]);
    updateAgentStates(collabManager);
  };

  useEffect(() => {
    const cleanup = initMultiAgentSystem();
    return cleanup;
  }, []);

  useEffect(() => {
    if (!collabManager) return;
    const interval = setInterval(() => updateAgentStates(collabManager), 5000);
    return () => clearInterval(interval);
  }, [collabManager]);

  const getRoleIcon = (role: string) => {
    const icons: Record<string, string> = { 'project-manager': '👔', 'developer': '💻', 'tester': '🔍', 'resource-scheduler': '📊', 'risk-monitor': '⚠️' };
    return icons[role] || '🤖';
  };
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = { 'idle': '#9ca3af', 'working': '#22c55e', 'blocked': '#ef4444', 'offline': '#6b7280' };
    return colors[status] || '#9ca3af';
  };
  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = { 'low': '#22c55e', 'medium': '#f59e0b', 'high': '#ef4444', 'urgent': '#dc2626' };
    return colors[priority] || '#9ca3af';
  };

  return (
    <div className={styles.multiAgentContainer}>
      <div className={styles.multiAgentHeader}>
        <h3>🤝 多Agent协作系统</h3>
        <div className={styles.multiAgentHeaderActions}>
          <button className={styles.multiAgentHeaderBtn} onClick={runDailyStandup}>📅 站会</button>
          <button className={styles.multiAgentHeaderBtn} onClick={runRiskMonitoring} disabled={isMonitoring}>
            {isMonitoring ? '⏳ 扫描中...' : '⚠️ 风险扫描'}
          </button>
        </div>
      </div>

      <div className={styles.multiAgentTabs}>
        {[
          { id: 'overview' as const, label: '📊 概览' },
          { id: 'team' as const, label: '👥 团队' },
          { id: 'delays' as const, label: `🚨 延期${delays.length > 0 ? ` (${delays.length})` : ''}` },
          { id: 'messages' as const, label: '💬 消息' },
        ].map(t => (
          <button key={t.id} className={`${styles.multiAgentTabBtn} ${subTab === t.id ? styles.active : ''}`} onClick={() => setSubTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className={styles.multiAgentContent}>
        {subTab === 'overview' && (
          <>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}><div className={styles.statCardValue}>{agents.length}</div><div className={styles.statCardLabel}>Agent数量</div></div>
              <div className={styles.statCard}><div className={styles.statCardValue}>{agents.filter(a => a.status === 'working').length}</div><div className={styles.statCardLabel}>工作中</div></div>
              <div className={styles.statCard}><div className={styles.statCardValue}>{delays.length}</div><div className={styles.statCardLabel}>延期风险</div></div>
              <div className={styles.statCard}><div className={styles.statCardValue}>{messages.length}</div><div className={styles.statCardLabel}>消息数</div></div>
            </div>
            {delays.length > 0 && (
              <div className={styles.alertSection}>
                <h4>🚨 检测到延期风险</h4>
                {delays.map(d => (
                  <div key={d.taskId} className={`${styles.alertItem} ${styles[d.severity]}`}>
                    <div className={styles.alertTitle}>{d.taskName}</div>
                    <div className={styles.alertDetail}>延期 {d.delayDays} 天 | 严重程度: {d.severity}</div>
                    <div className={styles.alertAction}>{d.recommendation}</div>
                  </div>
                ))}
              </div>
            )}
            {plans.length > 0 && (
              <div className={styles.plansSection}>
                <h4>💡 推荐调整方案</h4>
                {plans.map(plan => (
                  <div key={plan.id} className={`${styles.planItem} ${plan.selected ? styles.selected : ''}`} onClick={() => applyPlan(plan.id)}>
                    <div className={styles.planHeader}>
                      <span className={styles.planName}>{plan.name}</span>
                      {plan.selected && <span className={styles.planBadge}>✓ 已选</span>}
                    </div>
                    <div className={styles.planStats}>
                      <span>⏱️ 节省 {plan.timeSave}天</span>
                      <span>💰 成本 {plan.cost > 0 ? '+' : ''}{plan.cost}%</span>
                      <span>⚠️ 风险 +{plan.risk}%</span>
                    </div>
                    <div className={styles.planDesc}>{plan.description}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {subTab === 'team' && agents.map(agent => (
          <div key={agent.id} className={styles.agentCard}>
            <div className={styles.agentCardHeader}>
              <span className={styles.agentCardIcon}>{getRoleIcon(agent.role)}</span>
              <div className={styles.agentCardInfo}>
                <div className={styles.agentCardName}>{agent.name}</div>
                <div className={styles.agentCardRole}>{agent.role}</div>
              </div>
              <div className={styles.agentCardStatus} style={{ backgroundColor: getStatusColor(agent.status) }}>{agent.status}</div>
            </div>
            <div className={styles.workloadBar}>
              <div className={styles.workloadFill} style={{ width: `${agent.workload}%`, backgroundColor: agent.workload > 80 ? '#ef4444' : agent.workload > 50 ? '#f59e0b' : '#22c55e' }} />
            </div>
            <div className={styles.capabilityTags}>
              {agent.capabilities.slice(0, 3).map((cap, i) => (
                <span key={i} className={styles.capabilityTag}>{cap}</span>
              ))}
            </div>
          </div>
        ))}

        {subTab === 'delays' && (
          delays.length === 0 ? (
            <div className={styles.emptyState}><div className={styles.emptyIcon}>✅</div><div className={styles.emptyText}>暂无延期风险</div><div className={styles.emptySub}>项目按计划进行</div></div>
          ) : (
            <>
              {delays.map(d => (
                <div key={d.taskId} className={`${styles.delayCard} ${styles[d.severity]}`}>
                  <div className={styles.delayHeader}><span>🚨</span><span className={styles.delayName}>{d.taskName}</span></div>
                  <div className={styles.delayDetails}>
                    <div className={styles.delayStat}><span className={styles.delayStatLabel}>延期天数</span><span className={styles.delayStatValue}>{d.delayDays}天</span></div>
                    <div className={styles.delayStat}><span className={styles.delayStatLabel}>严重程度</span><span className={styles.delayStatValue}>{d.severity}</span></div>
                  </div>
                  <div className={styles.delayRecommendation}><strong>建议:</strong> {d.recommendation}</div>
                </div>
              ))}
              {plans.length > 0 && plans.map(plan => (
                <div key={plan.id} className={`${styles.planItem} ${plan.selected ? styles.selected : ''}`} onClick={() => applyPlan(plan.id)}>
                  <div className={styles.planHeader}><span className={styles.planName}>{plan.name}</span></div>
                  <div className={styles.planStats}>节省{plan.timeSave}天 | 成本{plan.cost}% | 风险+{plan.risk}%</div>
                </div>
              ))}
            </>
          )
        )}

        {subTab === 'messages' && (
          messages.length === 0 ? (
            <div className={styles.emptyState}><div className={styles.emptyIcon}>💬</div><div className={styles.emptyText}>暂无消息</div></div>
          ) : (
            messages.map(msg => (
              <div key={msg.id} className={styles.messageItem}>
                <div className={styles.messageHeader}>
                  <span className={styles.messageFrom}>{msg.from}</span>
                  <span className={styles.messageArrow}>→</span>
                  <span className={styles.messageTo}>{msg.to}</span>
                  <span className={styles.messagePriority} style={{ backgroundColor: getPriorityColor(msg.priority) }}>{msg.priority}</span>
                </div>
                <div className={styles.messageType}>{msg.type}</div>
                <div className={styles.messageContent}>{msg.content}</div>
                <div className={styles.messageTime}>{msg.timestamp.toLocaleTimeString()}</div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
}
