/**
 * Level 8-10: 预测分析与自主执行面板
 * 集成到甘特图的预测性分析和自主执行控制
 */

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { predictiveEngine, PredictionResult } from '@/agent/PredictiveAnalysisEngine';
import { autonomousEngine, ExecutionLog } from '@/agent/AutonomousExecutionEngine';
import styles from './PredictivePanel.module.css';

export function PredictivePanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'prediction' | 'autonomous' | 'logs'>('prediction');
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [isPredicting, setIsPredicting] = useState(false);
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const { tasks, currentProjectId } = useAppStore();

  // 运行预测分析
  const runPrediction = async () => {
    if (!currentProjectId) return;
    
    setIsPredicting(true);
    
    const context = {
      projectId: currentProjectId,
      tasks,
      buckets: []
    };
    
    const results = predictiveEngine.predictProject(context);
    setPredictions(results);
    
    setIsPredicting(false);
  };

  // 启动/停止自主执行
  const toggleAutonomous = () => {
    if (!currentProjectId) return;
    
    if (isAutoRunning) {
      autonomousEngine.stop();
      setIsAutoRunning(false);
    } else {
      autonomousEngine.start(currentProjectId);
      setIsAutoRunning(true);
    }
  };

  // 刷新日志
  const refreshLogs = () => {
    const newLogs = autonomousEngine.getLogs(undefined, 20);
    setLogs(newLogs);
  };

  // 定期刷新日志
  useEffect(() => {
    if (!isOpen) return;
    
    const interval = setInterval(() => {
      if (activeTab === 'logs' || isAutoRunning) {
        refreshLogs();
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isOpen, activeTab, isAutoRunning]);

  // 初始预测
  useEffect(() => {
    if (isOpen && predictions.length === 0) {
      runPrediction();
    }
  }, [isOpen]);

  const getRiskColor = (probability: number) => {
    if (probability >= 80) return '#22c55e';
    if (probability >= 60) return '#f59e0b';
    if (probability >= 40) return '#f97316';
    return '#ef4444';
  };

  const getRiskLabel = (probability: number) => {
    if (probability >= 80) return '低风险';
    if (probability >= 60) return '中风险';
    if (probability >= 40) return '高风险';
    return '极高风险';
  };

  if (!isOpen) {
    return (
      <button 
        className={styles.predictiveToggle}
        onClick={() => setIsOpen(true)}
      >
        🔮 预测
        {predictions.some(p => p.onTimeProbability < 50) && <span className={styles.alertBadge} />}
      </button>
    );
  }

  return (
    <div className={styles.predictivePanel}>
      <div className={styles.panelHeader}>
        <span>🔮 Level 8-10: 预测与自主执行</span>
        <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>×</button>
      </div>

      <div className={styles.tabs}>
        <button 
          className={activeTab === 'prediction' ? styles.active : ''}
          onClick={() => setActiveTab('prediction')}
        >
          📊 风险预测
        </button>
        <button 
          className={activeTab === 'autonomous' ? styles.active : ''}
          onClick={() => setActiveTab('autonomous')}
        >
          🤖 自主执行
        </button>
        <button 
          className={activeTab === 'logs' ? styles.active : ''}
          onClick={() => { setActiveTab('logs'); refreshLogs(); }}
        >
          📝 执行日志
        </button>
      </div>

      <div className={styles.panelContent}>
        {activeTab === 'prediction' && (
          <div className={styles.predictionTab}>
            <div className={styles.actionBar}>
              <button 
                className={styles.actionBtn}
                onClick={runPrediction}
                disabled={isPredicting}
              >
                {isPredicting ? '⏳ 分析中...' : '🔄 重新预测'}
              </button>
            </div>

            {predictions.length > 0 && (
              <>
                <div className={styles.summaryCards}>
                  <div className={styles.summaryCard}>
                    <div className={styles.summaryValue}>
                      {Math.round(predictions.reduce((s, p) => s + p.onTimeProbability, 0) / predictions.length)}%
                    </div>
                    <div className={styles.summaryLabel}>平均准时率</div>
                  </div>
                  <div className={styles.summaryCard}>
                    <div className={styles.summaryValue}>
                      {predictions.filter(p => p.onTimeProbability < 50).length}
                    </div>
                    <div className={styles.summaryLabel}>高风险任务</div>
                  </div>
                </div>

                <div className={styles.predictionList}>
                  {predictions
                    .sort((a, b) => a.onTimeProbability - b.onTimeProbability)
                    .slice(0, 10)
                    .map(p => (
                      <div 
                        key={p.taskId} 
                        className={styles.predictionItem}
                        style={{ borderLeftColor: getRiskColor(p.onTimeProbability) }}
                      >
                        <div className={styles.predictionHeader}>
                          <span className={styles.taskName}>{p.taskName}</span>
                          <span 
                            className={styles.riskBadge}
                            style={{ backgroundColor: getRiskColor(p.onTimeProbability) }}
                          >
                            {getRiskLabel(p.onTimeProbability)}
                          </span>
                        </div>
                        <div className={styles.predictionDetails}>
                          <div className={styles.probabilityBar}>
                            <div 
                              className={styles.probabilityFill}
                              style={{ 
                                width: `${p.onTimeProbability}%`,
                                backgroundColor: getRiskColor(p.onTimeProbability)
                              }}
                            />
                          </div>
                          <div className={styles.predictionStats}>
                            <span>准时概率: {p.onTimeProbability}%</span>
                            <span>预计延期: {p.predictedDelay}天</span>
                            <span>置信度: {p.confidence}%</span>
                          </div>
                        </div>
                        {p.riskFactors.length > 0 && (
                          <div className={styles.riskFactors}>
                            {p.riskFactors.map((rf, i) => (
                              <span 
                                key={i} 
                                className={styles.riskFactor}
                                title={rf.description}
                              >
                                {rf.type === 'complexity' && '🔧'}
                                {rf.type === 'dependency' && '🔗'}
                                {rf.type === 'resource' && '👥'}
                                {rf.type === 'history' && '📈'}
                                {rf.severity}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'autonomous' && (
          <div className={styles.autonomousTab}>
            <div className={styles.autoStatus}>
              <div className={styles.statusIndicator}>
                <span className={isAutoRunning ? styles.running : styles.stopped}>
                  {isAutoRunning ? '🟢 运行中' : '⭕ 已停止'}
                </span>
              </div>
              
              <button 
                className={`${styles.toggleBtn} ${isAutoRunning ? styles.stop : styles.start}`}
                onClick={toggleAutonomous}
              >
                {isAutoRunning ? '⏹️ 停止自主执行' : '▶️ 启动自主执行'}
              </button>
            </div>

            <div className={styles.autoFeatures}>
              <h4>🤖 Level 10: 自主管理功能</h4>
              <ul>
                <li>✅ 自动任务分解（大任务智能拆分）</li>
                <li>✅ 自动进度跟踪（实时预测延期）</li>
                <li>✅ 自动风险应对（检测并推荐方案）</li>
                <li>✅ 自动团队协调（Agent协作）</li>
              </ul>
              
              <div className={styles.autoConfig}>
                <div className={styles.configItem}>
                  <span>检查间隔:</span>
                  <span>30 分钟</span>
                </div>
                <div className={styles.configItem}>
                  <span>风险阈值:</span>
                  <span>60%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className={styles.logsTab}>
            <div className={styles.logActions}>
              <button className={styles.actionBtn} onClick={refreshLogs}>
                🔄 刷新
              </button>
            </div>
            
            <div className={styles.logList}>
              {logs.length === 0 ? (
                <div className={styles.emptyLogs}>暂无执行日志</div>
              ) : (
                logs.map(log => (
                  <div 
                    key={log.id} 
                    className={`${styles.logItem} ${styles[log.result]}`}
                  >
                    <div className={styles.logTime}>
                      {log.timestamp.toLocaleTimeString()}
                    </div>
                    <div className={styles.logType}>
                      {log.type === 'decomposition' && '📋'}
                      {log.type === 'tracking' && '📊'}
                      {log.type === 'risk' && '⚠️'}
                      {log.type === 'coordination' && '🤝'}
                      {log.type === 'decision' && '💡'}
                      {log.type === 'system' && '⚙️'}
                    </div>
                    <div className={styles.logContent}>
                      {log.description}
                    </div>                  
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
