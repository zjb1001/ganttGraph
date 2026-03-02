/**
 * AI Assistant Chat Component
 * Provides a floating chat interface for natural language task management
 */

import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { sendChatMessage, checkAgentHealth, type AgentResponse, type AgentAction } from '@/utils/agentApi';
import { executeAgentActions } from '@/utils/agentTools';
import './AIAssistant.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  actions?: string[];
  timestamp: Date;
  pendingActions?: AgentAction[];  // Legacy actions waiting for confirmation
}

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
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
    const project = projects.find(p => p.id === currentProjectId);
    return project?.name || null;
  };

  const getTasksContext = () => {
    const formatDate = (d: Date | string | undefined) => {
      if (!d) return undefined;
      const date = d instanceof Date ? d : new Date(d);
      if (isNaN(date.getTime())) return undefined;
      return date.toISOString().split('T')[0]; // YYYY-MM-DD
    };

    return tasks.map(t => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      taskType: t.taskType,
      startDate: formatDate(t.startDateTime),
      dueDate: formatDate(t.dueDateTime),
      progress: t.completedPercent ?? 0,
      bucketId: t.bucketId
    }));
  };

  const handleExecuteActions = async (response: AgentResponse) => {
    const actionResults: string[] = [];

    // Legacy format: AgentAction[]
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

    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }]);

    setIsProcessing(true);

    try {
      const projectName = getCurrentProjectName();
      const response: AgentResponse = await sendChatMessage({
        message: userMessage,
        context: {
          currentProject: projectName ?? undefined,
          currentProjectId: currentProjectId ?? undefined,
          buckets: buckets.map(b => ({ id: b.id, name: b.name, color: b.color, bucketType: b.bucketType })),
          tasks: getTasksContext(),
          taskCount: tasks.length,
          bucketCount: buckets.length
        }
      });

      // If the response failed (LLM error, parse error, etc.), show message without executing
      if (!response.success) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: response.message,
          timestamp: new Date()
        }]);
        setIsProcessing(false);
        return;
      }

      // Check if confirmation is required
      const needsConfirmation = response.requiresConfirmation && (response.actions?.length ?? 0) > 0;

      if (needsConfirmation) {
        setPendingResponse(response);

        // Build confirmation message
        let confirmationText = response.message + '\n\n即将执行以下操作：';
        if (response.actions) {
          confirmationText += '\n' + response.actions.map(a => `⚠️ ${a.description}`).join('\n');
        }

        setMessages(prev => [...prev, {
          role: 'assistant',
          content: confirmationText,
          pendingActions: response.actions,
          timestamp: new Date()
        }]);
        setIsProcessing(false);
        return;
      }

      // Execute actions
      const actionResults = await handleExecuteActions(response);

      // Add assistant response
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.message,
        actions: actionResults.length > 0 ? actionResults : undefined,
        timestamp: new Date()
      }]);

      // Handle clarification
      if (response.needs_clarification && response.clarification_questions?.length > 0) {
        setTimeout(() => {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: '请回答以下问题以便我更好地帮助你：\n' +
              response.clarification_questions.map((q, i) => `${i + 1}. ${q}`).join('\n'),
            timestamp: new Date()
          }]);
        }, 500);
      }

    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `抱歉，发生了错误：${error instanceof Error ? error.message : '未知错误'}`,
        timestamp: new Date()
      }]);
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
        if (lastMsg) {
          lastMsg.actions = actionResults;
          delete lastMsg.pendingActions;
        }
        return newMessages;
      });

    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `执行失败：${error instanceof Error ? error.message : '未知错误'}`,
        timestamp: new Date()
      }]);
    } finally {
      setIsProcessing(false);
      setPendingResponse(null);
    }
  };

  const handleCancelAction = () => {
    setPendingResponse(null);
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: '已取消操作',
      timestamp: new Date()
    }]);
  };

  const toggleOpen = () => setIsOpen(!isOpen);

  const exampleCommands = [
    { icon: '📋', text: '添加一个任务叫「API开发」，下周一开始，持续5天' },
    { icon: '📊', text: '把API开发进度改成50%' },
    { icon: '🎯', text: '创建一个里程碑叫「项目发布」在3月15日' },
    { icon: '📁', text: '创建里程碑分组叫「发布计划」' },
    { icon: '🔄', text: '将开发分组中的任务全部推迟2周' },
  ];

  const handleExampleClick = (text: string) => {
    setInputValue(text);
  };

  /** Render message content with line breaks */
  const renderContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, i) => (
      <span key={i}>
        {line}
        {i < lines.length - 1 && <br />}
      </span>
    ));
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button className="ai-assistant-fab" onClick={toggleOpen} title="AI助手">
          <span className="ai-icon">🤖</span>
          <div className="ai-status-indicator" style={{ background: isServiceAvailable === false ? '#ef4444' : '#4ade80' }}></div>
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="ai-assistant-panel">
          {/* Header */}
          <div className="ai-header">
            <h3>AI 助手</h3>
            <button className="ai-close-btn" onClick={toggleOpen}>×</button>
          </div>

          {/* Messages */}
          <div className="ai-messages">
            {/* Welcome section */}
            {messages.length === 0 && (
              <div className="ai-welcome">
                <div className="ai-welcome-title">👋 你好！我是 AI 助手</div>
                <div className="ai-welcome-subtitle">用自然语言告诉我你想做什么，试试下面的示例：</div>
                <div className="ai-examples">
                  {exampleCommands.map((cmd, i) => (
                    <button
                      key={i}
                      className="ai-example-item"
                      onClick={() => handleExampleClick(cmd.text)}
                    >
                      <span className="ai-example-icon">{cmd.icon}</span>
                      <span className="ai-example-text">{cmd.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className={`ai-message ai-message-${msg.role}`}>
                {msg.role === 'assistant' && msg.pendingActions ? (
                  <>
                    <div className="ai-message-content">{renderContent(msg.content)}</div>
                    {msg.pendingActions && (
                      <div className="ai-message-actions">
                        <div className="ai-action-buttons">
                          <button className="ai-confirm-btn" onClick={handleConfirmAction}>
                            ✅ 确认执行
                          </button>
                          <button className="ai-cancel-btn" onClick={handleCancelAction}>
                            ❌ 取消
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="ai-message-content">{renderContent(msg.content)}</div>
                )}

                {msg.actions && (
                  <div className="ai-action-results">
                    {msg.actions.map((action, i) => (
                      <div key={i} className="ai-action-result-item">{action}</div>
                    ))}
                  </div>
                )}

                <div className="ai-message-time">
                  {msg.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}

            {isProcessing && (
              <div className="ai-message ai-message-assistant">
                <div className="ai-message-content">
                  <div className="ai-typing-indicator">
                    <span></span><span></span><span></span>
                  </div>
                  正在思考...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="ai-input-area">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="输入你的指令... (Shift+Enter 换行)"
              disabled={isProcessing}
              rows={3}
            />
            <button
              onClick={handleSendMessage}
              disabled={isProcessing || !inputValue.trim()}
              className="ai-send-btn"
            >
              发送
            </button>
          </div>
        </div>
      )}
    </>
  );
}
