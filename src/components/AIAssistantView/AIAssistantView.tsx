/**
 * Unified AI Assistant View
 * Single-page layout: chat messages area + unified bottom toolbar with all buttons & natural language input
 */

import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { sendChatMessage, checkAgentHealth, type AgentResponse, type AgentAction } from '@/utils/agentApi';
import { executeAgentActions } from '@/utils/agentTools';
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
        let confirmationText = response.message + '\n\n即将执行以下操作：';
        if (response.actions) confirmationText += '\n' + response.actions.map(a => `⚠️ ${a.description}`).join('\n');
        addAssistantMessage(confirmationText, { pendingActions: response.actions });
        setIsProcessing(false);
        return;
      }
      const actionResults = await handleExecuteActions(response);
      addAssistantMessage(response.message, { actions: actionResults.length > 0 ? actionResults : undefined });
      if (response.needs_clarification && response.clarification_questions?.length > 0) {
        setTimeout(() => {
          addAssistantMessage('请回答以下问题以便我更好地帮助你：\n' + response.clarification_questions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n'));
        }, 500);
      }
    } catch (error) {
      addAssistantMessage(`抱歉，发生了错误：${error instanceof Error ? error.message : '未知错误'}`);
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
      addAssistantMessage(`执行失败：${error instanceof Error ? error.message : '未知错误'}`);
    } finally { setIsProcessing(false); setPendingResponse(null); }
  };

  const handleCancelAction = () => { setPendingResponse(null); addAssistantMessage('已取消操作'); };

  // ---- Action buttons ---- 
  const handleDecompose = async () => {
    if (!inputValue.trim()) { addSystemMessage('⚠️ 请先在输入框中描述项目需求，再点击「智能分解」'); return; }
    const description = inputValue.trim();
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', content: `🧩 智能分解: ${description}`, timestamp: new Date() }]);
    setIsProcessing(true);
    try {
      const response = await decomposeProject(description);
      if (response.success && response.tasks) {
        if (currentProjectId) {
          const phaseBuckets = new Map<string, string>();
          for (const task of response.tasks) {
            if (!phaseBuckets.has(task.phase)) {
              const existingBucket = buckets.find(b => b.name === task.phase);
              if (existingBucket) { phaseBuckets.set(task.phase, existingBucket.id); }
              else { const newBucket = await addBucket({ name: task.phase, order: phaseBuckets.size }); phaseBuckets.set(task.phase, newBucket.id); }
            }
            await addTask({
              title: task.title, startDateTime: new Date(task.start_date), dueDateTime: new Date(task.end_date),
              priority: task.priority === 'Urgent' ? 'Urgent' : task.priority === 'Important' ? 'Important' : task.priority === 'Low' ? 'Low' : 'Normal',
              status: 'NotStarted', bucketId: phaseBuckets.get(task.phase) || buckets[0]?.id || '',
              projectId: currentProjectId, order: 0, taskType: 'task', assigneeIds: [], labelIds: [],
            });
          }
        }
        addAssistantMessage(
          `✅ ${response.message}\n\n📊 分解结果: ${response.phases?.length || 0} 个阶段, ${response.tasks.length} 个任务, 工期 ${response.estimated_duration_days} 天, 置信度 ${Math.round(response.confidence * 100)}%`
        );
      } else { addAssistantMessage(`❌ ${response.message || '分解失败'}`); }
    } catch (err) { addAssistantMessage(`❌ ${err instanceof Error ? err.message : '请求失败，请检查AI服务是否运行'}`); }
    finally { setIsProcessing(false); }
  };

  const handleAnalyzeRisks = async () => {
    if (tasks.length === 0) { addSystemMessage('⚠️ 当前项目没有任务可分析'); return; }
    addSystemMessage('⚠️ 正在分析项目风险...');
    setIsProcessing(true);
    try {
      const response = await analyzeProjectRisks(tasks);
      if (response.success) {
        addAssistantMessage(
          `⚠️ ${response.message}\n\n🔴 严重: ${response.risk_summary?.critical || 0}  🟠 高风险: ${response.risk_summary?.high || 0}  📊 总风险数: ${response.risks?.length || 0}`
        );
      } else { addAssistantMessage(`❌ ${response.message || '分析失败'}`); }
    } catch (err) { addAssistantMessage(`❌ ${err instanceof Error ? err.message : '请求失败'}`); }
    finally { setIsProcessing(false); }
  };

  const handlePredict = async () => {
    if (tasks.length === 0) { addSystemMessage('⚠️ 当前项目没有任务可预测'); return; }
    addSystemMessage('🔮 正在预测进度...');
    setIsProcessing(true);
    try {
      const response = await predictSchedule(tasks);
      if (response.success && response.prediction) {
        addAssistantMessage(
          `🔮 进度预测结果\n\n📅 预计完成: ${response.prediction.predicted_end_date}\n📊 置信度: ${Math.round(response.prediction.confidence * 100)}%\n⚠️ 延期概率: ${Math.round(response.prediction.delay_probability * 100)}%`
        );
      } else { addAssistantMessage(`❌ ${response.message || '预测失败'}`); }
    } catch (err) { addAssistantMessage(`❌ ${err instanceof Error ? err.message : '请求失败'}`); }
    finally { setIsProcessing(false); }
  };

  const handleDailyStandup = async () => {
    if (!collabManager) { addSystemMessage('⚠️ 多Agent系统未初始化'); return; }
    addSystemMessage('📅 正在执行每日站会...');
    setIsProcessing(true);
    try {
      const report = await collabManager.runDailyStandup();
      addAssistantMessage(`📅 每日站会报告\n\n${report.summary}`);
    } catch (err) { addAssistantMessage(`❌ 站会执行失败: ${err instanceof Error ? err.message : '未知错误'}`); }
    finally { setIsProcessing(false); }
  };

  const handleRiskScan = async () => {
    if (!currentProjectId || tasks.length === 0) { addSystemMessage('⚠️ 当前项目没有任务可扫描'); return; }
    addSystemMessage('🛡️ 正在扫描延期风险...');
    setIsProcessing(true);
    try {
      const context = {
        projectId: currentProjectId,
        tasks: tasks.map(t => ({ ...t, status: t.status || 'NotStarted', completedPercent: t.completedPercent || 0 })),
        buckets: []
      };
      const result = await adaptiveEngine.runAdaptiveCycle(context.tasks, context, { autoApply: false });
      if (result.detected && result.delays.length > 0) {
        const delayInfo = result.delays.map((d: any) => `  🚨 ${d.taskName}: 延期 ${d.delayDays} 天 (${d.severity})`).join('\n');
        const planInfo = result.plans.length > 0
          ? '\n\n💡 推荐方案:\n' + result.plans.map((p: any) => `  • ${p.name}: 节省 ${p.impact.timeSave} 天 (成本 +${p.impact.cost}%, 风险 +${p.impact.risk}%)`).join('\n')
          : '';
        addAssistantMessage(`🛡️ 延期风险扫描完成\n\n${delayInfo}${planInfo}\n\n建议: ${result.recommendation}`);
      } else { addAssistantMessage('✅ 延期风险扫描完成，项目按计划进行，暂无延期风险。'); }
    } catch (err) { addAssistantMessage(`❌ 风险扫描失败: ${err instanceof Error ? err.message : '未知错误'}`); }
    finally { setIsProcessing(false); }
  };

  const quickCommands = [
    { label: '添加任务', text: '添加一个任务叫「API开发」，下周一开始，持续5天' },
    { label: '改进度', text: '把API开发进度改成50%' },
    { label: '建里程碑', text: '创建一个里程碑叫「项目发布」在3月15日' },
    { label: '建分组', text: '创建里程碑分组叫「发布计划」' },
    { label: '推迟任务', text: '将开发分组中的任务全部推迟2周' },
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
              ✨ AI 助手
              {isServiceAvailable === false && <span style={{ color: '#ef4444', fontSize: 12, marginLeft: 8 }}>（服务离线）</span>}
            </div>
            <div className={styles.chatWelcomeSubtitle}>在下方输入自然语言指令，或点击功能按钮快速操作</div>
            <div className={styles.welcomeFeatures}>
              <div className={styles.welcomeFeature}>
                <span className={styles.welcomeFeatureIcon}>💬</span>
                <div><div className={styles.welcomeFeatureTitle}>自然语言对话</div><div className={styles.welcomeFeatureDesc}>直接描述你想做的事</div></div>
              </div>
              <div className={styles.welcomeFeature}>
                <span className={styles.welcomeFeatureIcon}>🧩</span>
                <div><div className={styles.welcomeFeatureTitle}>智能分解</div><div className={styles.welcomeFeatureDesc}>输入需求后点击按钮</div></div>
              </div>
              <div className={styles.welcomeFeature}>
                <span className={styles.welcomeFeatureIcon}>⚠️</span>
                <div><div className={styles.welcomeFeatureTitle}>风险分析</div><div className={styles.welcomeFeatureDesc}>一键分析项目风险</div></div>
              </div>
              <div className={styles.welcomeFeature}>
                <span className={styles.welcomeFeatureIcon}>🔮</span>
                <div><div className={styles.welcomeFeatureTitle}>进度预测</div><div className={styles.welcomeFeatureDesc}>预测项目完成日期</div></div>
              </div>
            </div>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`${styles.chatMessage} ${msg.role === 'user' ? styles.chatMessageUser : msg.role === 'system' ? styles.chatMessageSystem : styles.chatMessageAssistant}`}>
            {msg.role === 'assistant' && <div className={styles.chatAvatar} title="AI 助手">🤖</div>}
            {msg.role === 'system' && <div className={styles.chatAvatar} title="系统">⚙️</div>}
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
                  {msg.actions.map((action, i) => (<div key={i} className={styles.chatActionItem}>{action}</div>))}
                </div>
              )}
              <div className={styles.chatTime}>{msg.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
            {msg.role === 'user' && <div className={styles.chatAvatar} title="你">👤</div>}
          </div>
        ))}
        {isProcessing && (
          <div className={`${styles.chatMessage} ${styles.chatMessageAssistant}`}>
            <div className={styles.chatAvatar}>🤖</div>
            <div className={styles.chatBubble}>
              <div className={styles.chatTyping}><span /><span /><span /></div>
              正在处理...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Unified bottom toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarActions}>
          <div className={styles.toolbarGroup}>
            <span className={styles.toolbarGroupLabel}>AI 功能</span>
            <button className={`${styles.toolbarBtn} ${styles.toolbarBtnPrimary}`} onClick={handleDecompose} disabled={isProcessing} title="在输入框输入需求后点击">🧩 智能分解</button>
            <button className={styles.toolbarBtn} onClick={handleAnalyzeRisks} disabled={isProcessing || tasks.length === 0} title="分析当前项目风险">⚠️ 风险分析</button>
            <button className={styles.toolbarBtn} onClick={handlePredict} disabled={isProcessing || tasks.length === 0} title="预测项目进度">🔮 进度预测</button>
          </div>
          <div className={styles.toolbarDivider} />
          <div className={styles.toolbarGroup}>
            <span className={styles.toolbarGroupLabel}>多Agent</span>
            <button className={styles.toolbarBtn} onClick={handleDailyStandup} disabled={isProcessing} title="执行每日站会">📅 站会</button>
            <button className={styles.toolbarBtn} onClick={handleRiskScan} disabled={isProcessing || tasks.length === 0} title="扫描延期风险">🛡️ 风险扫描</button>
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
            placeholder="输入自然语言指令，如：添加一个任务叫「需求评审」... (Shift+Enter 换行)"
            disabled={isProcessing}
            rows={2}
          />
          <button onClick={handleSendMessage} disabled={isProcessing || !inputValue.trim()} className={styles.sendBtn}>发送</button>
        </div>
      </div>
    </div>
  );
}
