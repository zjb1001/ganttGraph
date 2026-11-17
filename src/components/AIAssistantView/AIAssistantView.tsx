/**
 * Unified AI Assistant View
 * Single-page layout: chat messages area + unified bottom toolbar with all buttons & natural language input
 */

import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { sendChatMessage, checkAgentHealth, type AgentResponse, type AgentAction } from '@/utils/agentApi';
import { executeAgentActions } from '@/utils/agentTools';
import { parseLocalDate } from '@/utils/date';
import {
  decomposeProject,
  analyzeProjectRisks,
  predictSchedule,
  chatWithAI,
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

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  actions?: string[];
  timestamp: Date;
  pendingActions?: AgentAction[];
}

export default function AIAssistantView() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isServiceAvailable, setIsServiceAvailable] = useState<boolean | null>(null);
  const [pendingResponse, setPendingResponse] = useState<AgentResponse | null>(null);
  const [collabManager, setCollabManager] = useState<CollaborationManager | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { tasks, buckets, currentProjectId, projects, addTask, addBucket } = useAppStore();

  useEffect(() => { checkAgentHealth().then(setIsServiceAvailable); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    const bus = globalMessageBus;
    const manager = new CollaborationManager(bus);
    const pmAgent = new ProjectManagerAgent('pm_001', bus);
    const devMCAL = new DeveloperAgent('dev_mcal', 'MCAL Engineer', bus, ['C', 'MCAL', 'ADC', 'PWM']);
    const devAlgo = new DeveloperAgent('dev_algo', 'Algorithm Engineer', bus, ['C', 'MATLAB', 'Control']);
    const testAgent = new TesterAgent('test_001', 'Test Engineer', bus);
    const resourceAgent = new ResourceSchedulerAgent('res_001', bus);
    const riskAgent = new RiskMonitorAgent('risk_001', bus);
    [pmAgent, devMCAL, devAlgo, testAgent, resourceAgent, riskAgent].forEach(a => {
      manager.registerAgent(a);
      (a as any).updateState({ status: 'idle', currentTasks: [], workload: 0 });
    });
    setCollabManager(manager);
  }, []);

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

  const addAssistantMessage = (content: string, extra?: Partial<ChatMessage>) => {
    setMessages(prev => [...prev, { role: 'assistant', content, timestamp: new Date(), ...extra }]);
  };

  const addSystemMessage = (content: string) => {
    setMessages(prev => [...prev, { role: 'system', content, timestamp: new Date() }]);
  };

  // ---- Chat: natural language ----
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
      let response: AgentResponse;
      try {
        response = await sendChatMessage({
          message: userMessage,
          context: {
            currentProject: projectName ?? undefined,
            currentProjectId: currentProjectId ?? undefined,
            buckets: buckets.map(b => ({ id: b.id, name: b.name, color: b.color, bucketType: b.bucketType })),
            tasks: getTasksContext(), taskCount: tasks.length, bucketCount: buckets.length
          }
        });
        if (!response.success && response.message.includes('无法连接')) throw new Error('v1 unavailable');
      } catch {
        const v2Response = await chatWithAI(userMessage, { tasks, buckets, currentProject: projectName ?? undefined });
        response = {
          success: v2Response.success, message: v2Response.message, actions: v2Response.actions,
          needs_clarification: false, clarification_questions: [],
          requiresConfirmation: v2Response.actions?.some(a => a.requiresConfirmation)
        };
      }
      if (!response.success) { addAssistantMessage(response.message); setIsProcessing(false); return; }
      const needsConfirmation = response.requiresConfirmation && (response.actions?.length ?? 0) > 0;
      if (needsConfirmation) {
        setPendingResponse(response);
        let confirmationText = response.message + '\n\nAbout to execute the following actions:';
        if (response.actions) confirmationText += '\n' + response.actions.map(a => `⚠️ ${a.description}`).join('\n');
        addAssistantMessage(confirmationText, { pendingActions: response.actions });
        setIsProcessing(false);
        return;
      }
      const actionResults = await handleExecuteActions(response);
      addAssistantMessage(response.message, { actions: actionResults.length > 0 ? actionResults : undefined });
      if (response.needs_clarification && response.clarification_questions?.length > 0) {
        setTimeout(() => {
          addAssistantMessage('Please answer the following questions so I can help you better:\n' + response.clarification_questions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n'));
        }, 500);
      }
    } catch (error) {
      addAssistantMessage(`Sorry, an error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      addAssistantMessage(`Execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally { setIsProcessing(false); setPendingResponse(null); }
  };

  const handleCancelAction = () => { setPendingResponse(null); addAssistantMessage('Action cancelled'); };

  // ---- Action buttons ---- 
  const handleDecompose = async () => {
    if (!inputValue.trim()) { addSystemMessage('⚠️ Please describe project requirements in the input box first, then click "Smart Decompose"'); return; }
    const description = inputValue.trim();
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', content: `🧩 Smart Decompose: ${description}`, timestamp: new Date() }]);
    setIsProcessing(true);
    try {
      const response = await decomposeProject(description);
      if (response.success && response.tasks) {
        if (currentProjectId) {
          const phaseBuckets = new Map<string, string>();
          for (const task of response.tasks) {
            if (!phaseBuckets.has(task.phase)) {
              const existingBucket = buckets.find(b => b.name === task.phase && b.projectId === currentProjectId);
              if (existingBucket) { phaseBuckets.set(task.phase, existingBucket.id); }
              else { const newBucket = await addBucket({ name: task.phase, order: phaseBuckets.size, projectId: currentProjectId }); phaseBuckets.set(task.phase, newBucket.id); }
            }
            await addTask({
              title: task.title, startDateTime: parseLocalDate(task.start_date), dueDateTime: parseLocalDate(task.end_date),
              priority: task.priority === 'Urgent' ? 'Urgent' : task.priority === 'Important' ? 'Important' : task.priority === 'Low' ? 'Low' : 'Normal',
              status: 'NotStarted', bucketId: phaseBuckets.get(task.phase) || buckets[0]?.id || '',
              projectId: currentProjectId, order: 0, taskType: 'task', assigneeIds: [], labelIds: [],
            });
          }
        }
        addAssistantMessage(
          `✅ ${response.message}\n\n📊 Result: ${response.phases?.length || 0} phases, ${response.tasks.length} tasks, duration ${response.estimated_duration_days} days, confidence ${Math.round(response.confidence * 100)}%`
        );
      } else { addAssistantMessage(`❌ ${response.message || 'Decomposition failed'}`); }
    } catch (err) { addAssistantMessage(`❌ ${err instanceof Error ? err.message : 'Request failed, please check if the AI service is running'}`); }
    finally { setIsProcessing(false); }
  };

  const handleAnalyzeRisks = async () => {
    if (tasks.length === 0) { addSystemMessage('⚠️ No tasks to analyze in the current project'); return; }
    addSystemMessage('⚠️ Analyzing project risks...');
    setIsProcessing(true);
    try {
      const response = await analyzeProjectRisks(tasks);
      if (response.success) {
        addAssistantMessage(
          `⚠️ ${response.message}\n\n🔴 Critical: ${response.risk_summary?.critical || 0}  🟠 High: ${response.risk_summary?.high || 0}  📊 Total risks: ${response.risks?.length || 0}`
        );
      } else { addAssistantMessage(`❌ ${response.message || 'Analysis failed'}`); }
    } catch (err) { addAssistantMessage(`❌ ${err instanceof Error ? err.message : 'Request failed'}`); }
    finally { setIsProcessing(false); }
  };

  const handlePredict = async () => {
    if (tasks.length === 0) { addSystemMessage('⚠️ No tasks to predict in the current project'); return; }
    addSystemMessage('🔮 Predicting schedule...');
    setIsProcessing(true);
    try {
      const response = await predictSchedule(tasks);
      if (response.success && response.prediction) {
        addAssistantMessage(
          `🔮 Schedule Prediction\n\n📅 Expected completion: ${response.prediction.predicted_end_date}\n📊 Confidence: ${Math.round(response.prediction.confidence * 100)}%\n⚠️ Delay probability: ${Math.round(response.prediction.delay_probability * 100)}%`
        );
      } else { addAssistantMessage(`❌ ${response.message || 'Prediction failed'}`); }
    } catch (err) { addAssistantMessage(`❌ ${err instanceof Error ? err.message : 'Request failed'}`); }
    finally { setIsProcessing(false); }
  };

  const handleDailyStandup = async () => {
    if (!collabManager) { addSystemMessage('⚠️ Multi-agent system not initialized'); return; }
    addSystemMessage('📅 Running daily standup...');
    setIsProcessing(true);
    try {
      const report = await collabManager.runDailyStandup();
      addAssistantMessage(`📅 Daily Standup Report\n\n${report.summary}`);
    } catch (err) { addAssistantMessage(`❌ Standup failed: ${err instanceof Error ? err.message : 'Unknown error'}`); }
    finally { setIsProcessing(false); }
  };

  const handleRiskScan = async () => {
    if (!currentProjectId || tasks.length === 0) { addSystemMessage('⚠️ No tasks to scan in the current project'); return; }
    addSystemMessage('🛡️ Scanning for delay risks...');
    setIsProcessing(true);
    try {
      const context = {
        projectId: currentProjectId,
        tasks: tasks.map(t => ({ ...t, status: t.status || 'NotStarted', completedPercent: t.completedPercent || 0 })),
        buckets: []
      };
      const result = await adaptiveEngine.runAdaptiveCycle(context.tasks, context, { autoApply: false });
      if (result.detected && result.delays.length > 0) {
        const delayInfo = result.delays.map((d: any) => `  🚨 ${d.taskName}: delayed ${d.delayDays} days (${d.severity})`).join('\n');
        const planInfo = result.plans.length > 0
          ? '\n\n💡 Recommended plans:\n' + result.plans.map((p: any) => `  • ${p.name}: save ${p.impact.timeSave} days (cost +${p.impact.cost}%, risk +${p.impact.risk}%)`).join('\n')
          : '';
        addAssistantMessage(`🛡️ Delay Risk Scan Complete\n\n${delayInfo}${planInfo}\n\nSuggestion: ${result.recommendation}`);
      } else { addAssistantMessage('✅ Delay risk scan complete. Project is on track, no delay risks detected.'); }
    } catch (err) { addAssistantMessage(`❌ Risk scan failed: ${err instanceof Error ? err.message : 'Unknown error'}`); }
    finally { setIsProcessing(false); }
  };

  const quickCommands = [
    { label: 'Add Task', text: 'Add a task called "API Development", starting next Monday, lasting 5 days' },
    { label: 'Update Progress', text: 'Set API Development progress to 50%' },
    { label: 'Add Milestone', text: 'Create a milestone called "Project Release" on March 15' },
    { label: 'Add Group', text: 'Create a milestone group called "Release Plan"' },
    { label: 'Delay Tasks', text: 'Delay all tasks in the Development group by 2 weeks' },
  ];

  const renderContent = (content: string) =>
    content.split('\n').map((line, i, arr) => (
      <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
    ));

  return (
    <div className={styles.aiView}>
      {/* Chat messages area */}
      <div className={styles.chatMessages}>
        {messages.length === 0 && (
          <div className={styles.chatWelcome}>
            <div className={styles.chatWelcomeTitle}>
              ✨ AI Assistant
              {isServiceAvailable === false && <span style={{ color: '#ef4444', fontSize: 12, marginLeft: 8 }}>(Service Offline)</span>}
            </div>
            <div className={styles.chatWelcomeSubtitle}>Enter natural language commands below, or click feature buttons for quick actions</div>
            <div className={styles.welcomeFeatures}>
              <div className={styles.welcomeFeature}>
                <span className={styles.welcomeFeatureIcon}>💬</span>
                <div><div className={styles.welcomeFeatureTitle}>Natural Language Chat</div><div className={styles.welcomeFeatureDesc}>Describe what you want to do</div></div>
              </div>
              <div className={styles.welcomeFeature}>
                <span className={styles.welcomeFeatureIcon}>🧩</span>
                <div><div className={styles.welcomeFeatureTitle}>Smart Decompose</div><div className={styles.welcomeFeatureDesc}>Enter requirements then click</div></div>
              </div>
              <div className={styles.welcomeFeature}>
                <span className={styles.welcomeFeatureIcon}>⚠️</span>
                <div><div className={styles.welcomeFeatureTitle}>Risk Analysis</div><div className={styles.welcomeFeatureDesc}>One-click project risk analysis</div></div>
              </div>
              <div className={styles.welcomeFeature}>
                <span className={styles.welcomeFeatureIcon}>🔮</span>
                <div><div className={styles.welcomeFeatureTitle}>Schedule Prediction</div><div className={styles.welcomeFeatureDesc}>Predict project completion date</div></div>
              </div>
            </div>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`${styles.chatMessage} ${msg.role === 'user' ? styles.chatMessageUser : msg.role === 'system' ? styles.chatMessageSystem : styles.chatMessageAssistant}`}>
            {msg.role === 'assistant' && <div className={styles.chatAvatar} title="AI Assistant">🤖</div>}
            {msg.role === 'system' && <div className={styles.chatAvatar} title="System">⚙️</div>}
            <div className={styles.chatBubble}>
              <div>{renderContent(msg.content)}</div>
              {msg.pendingActions && (
                <div className={styles.chatConfirmBtns}>
                  <button className={styles.confirmBtn} onClick={handleConfirmAction}>✅ Confirm</button>
                  <button className={styles.cancelBtn} onClick={handleCancelAction}>❌ Cancel</button>
                </div>
              )}
              {msg.actions && (
                <div className={styles.chatActionResults}>
                  {msg.actions.map((action, i) => (<div key={i} className={styles.chatActionItem}>{action}</div>))}
                </div>
              )}
              <div className={styles.chatTime}>{msg.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
            {msg.role === 'user' && <div className={styles.chatAvatar} title="You">👤</div>}
          </div>
        ))}
        {isProcessing && (
          <div className={`${styles.chatMessage} ${styles.chatMessageAssistant}`}>
            <div className={styles.chatAvatar}>🤖</div>
            <div className={styles.chatBubble}>
              <div className={styles.chatTyping}><span /><span /><span /></div>
              Processing...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Unified bottom toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarActions}>
          <div className={styles.toolbarGroup}>
            <span className={styles.toolbarGroupLabel}>AI Features</span>
            <button className={`${styles.toolbarBtn} ${styles.toolbarBtnPrimary}`} onClick={handleDecompose} disabled={isProcessing} title="Enter requirements in the input box then click">🧩 Decompose</button>
            <button className={styles.toolbarBtn} onClick={handleAnalyzeRisks} disabled={isProcessing || tasks.length === 0} title="Analyze current project risks">⚠️ Risk Analysis</button>
            <button className={styles.toolbarBtn} onClick={handlePredict} disabled={isProcessing || tasks.length === 0} title="Predict project schedule">🔮 Predict</button>
          </div>
          <div className={styles.toolbarDivider} />
          <div className={styles.toolbarGroup}>
            <span className={styles.toolbarGroupLabel}>Multi-Agent</span>
            <button className={styles.toolbarBtn} onClick={handleDailyStandup} disabled={isProcessing} title="Run daily standup">📅 Standup</button>
            <button className={styles.toolbarBtn} onClick={handleRiskScan} disabled={isProcessing || tasks.length === 0} title="Scan for delay risks">🛡️ Risk Scan</button>
          </div>
        </div>
        <div className={styles.toolbarQuickCmds}>
          {quickCommands.map((cmd, i) => (
            <button key={i} className={styles.quickCmdChip} onClick={() => setInputValue(cmd.text)} disabled={isProcessing} title={cmd.text}>{cmd.label}</button>
          ))}
        </div>
        <div className={styles.toolbarInput}>
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
            placeholder="Enter natural language command, e.g.: Add a task called 'Requirements Review'... (Shift+Enter for new line)"
            disabled={isProcessing}
            rows={2}
          />
          <button onClick={handleSendMessage} disabled={isProcessing || !inputValue.trim()} className={styles.sendBtn}>Send</button>
        </div>
      </div>
    </div>
  );
}
