/**
 * 制动项目专用面板
 * 展示 ASIL-D 安全门控、关键风险、SOP预测等
 */

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { brakingPredictiveEngine, BRAKING_PROJECT_CONFIG } from '@/agent/BrakingProjectEngine';
import { predictiveEngine } from '@/agent/PredictiveAnalysisEngine';
import styles from './BrakingPanel.module.css';

export function BrakingPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'safety' | 'risks' | 'sop'>('overview');
  const [safetyGates, setSafetyGates] = useState<any[]>([]);
  const [brakingRisks, setBrakingRisks] = useState<any[]>([]);
  const [sopPrediction, setSopPrediction] = useState<any>(null);
  const [healthScore, setHealthScore] = useState<any>(null);
  const { tasks, currentProjectId } = useAppStore();

  useEffect(() => {
    if (!isOpen || !currentProjectId) return;
    
    const context = {
      projectId: currentProjectId,
      tasks,
      buckets: []
    };
    
    // 计算制动项目专用分析
    setSafetyGates(brakingPredictiveEngine.checkSafetyGates(context));
    setBrakingRisks(brakingPredictiveEngine.analyzeBrakingRisks(context));
    setSopPrediction(brakingPredictiveEngine.predictSOPDate(context));
    setHealthScore(predictiveEngine.generateHealthReport(context));
  }, [isOpen, tasks, currentProjectId]);

  const getGateStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return '✅';
      case 'in_progress': return '🔄';
      case 'failed': return '🚫';
      default: return '⏳';
    }
  };

  const getRiskSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#ca8a04';
      default: return '#16a34a';
    }
  };

  if (!isOpen) {
    return (
      <button 
        className={styles.brakingToggle}
        onClick={() => setIsOpen(true)}
      >
        🚗 制动
        {brakingRisks.some((r: any) => r.severity === 'critical') && <span className={styles.criticalBadge} />}
      </button>
    );
  }

  return (
    <div className={styles.brakingPanel}>
      <div className={styles.panelHeader}>
        <span>🚗 制动项目专用分析</span>
        <span className={styles.asilBadge}>ASIL-D</span>
        <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>×</button>
      </div>

      <div className={styles.tabs}>
        <button 
          className={activeTab === 'overview' ? styles.active : ''}
          onClick={() => setActiveTab('overview')}
        >
          📊 总览
        </button>
        <button 
          className={activeTab === 'safety' ? styles.active : ''}
          onClick={() => setActiveTab('safety')}
        >
          🛡️ 安全门控
        </button>
        <button 
          className={activeTab === 'risks' ? styles.active : ''}
          onClick={() => setActiveTab('risks')}
        >
          ⚠️ 关键风险
        </button>
        <button 
          className={activeTab === 'sop' ? styles.active : ''}
          onClick={() => setActiveTab('sop')}
        >
          🎯 SOP预测
        </button>
      </div>

      <div className={styles.panelContent}>
        {activeTab === 'overview' && healthScore && (
          <div className={styles.overviewTab}>
            <div className={styles.kpiGrid}>
              <div className={styles.kpiCard}>
                <div className={styles.kpiValue} style={{ color: getRiskSeverityColor(healthScore.overallHealth.status === 'critical' ? 'critical' : 'low') }}>
                  {healthScore.overallHealth.score}
                </div>
                <div className={styles.kpiLabel}>健康评分</div>
                <div className={styles.kpiStatus}>{healthScore.overallHealth.status}</div>
              </div>
              
              <div className={styles.kpiCard}>
                <div className={styles.kpiValue}>{healthScore.avgOnTimeProbability}%</div>
                <div className={styles.kpiLabel}>平均准时率</div>
              </div>
              
              <div className={styles.kpiCard}>
                <div className={styles.kpiValue}>{brakingRisks.filter((r: any) => r.severity === 'critical').length}</div>
                <div className={styles.kpiLabel}>关键风险</div>
              </div>
              
              <div className={styles.kpiCard}>
                <div className={styles.kpiValue}>{safetyGates.filter((g: any) => g.status === 'passed').length}/{safetyGates.length}</div>
                <div className={styles.kpiLabel}>安全门控</div>
              </div>
            </div>

            <div className={styles.kpiRequirements}>
              <h4>📋 ASIL-D 关键性能指标</h4>
              <div className={styles.kpiList}>
                <div className={styles.kpiItem}>
                  <span>制动距离</span>
                  <span>{BRAKING_PROJECT_CONFIG.kpi.brakingDistance}</span>
                </div>
                <div className={styles.kpiItem}>
                  <span>响应时间</span>
                  <span>{BRAKING_PROJECT_CONFIG.kpi.responseTime}</span>
                </div>
                <div className={styles.kpiItem}>
                  <span>可用性</span>
                  <span>{BRAKING_PROJECT_CONFIG.kpi.availability}</span>
                </div>
                <div className={styles.kpiItem}>
                  <span>故障容错</span>
                  <span>{BRAKING_PROJECT_CONFIG.kpi.faultTolerance}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'safety' && (
          <div className={styles.safetyTab}>
            <h4>🛡️ 强制安全门控</h4>
            <div className={styles.gateList}>
              {safetyGates.map((gate, i) => (
                <div 
                  key={i} 
                  className={`${styles.gateItem} ${styles[gate.status]}`}
                >
                  <div className={styles.gateHeader}>
                    <span className={styles.gateIcon}>{getGateStatusIcon(gate.status)}</span>
                    <span className={styles.gateName}>{gate.gate}</span>
                    <span className={styles.gateProgress}>{gate.completion}%</span>
                  </div>
                  <div className={styles.progressBar}>
                    <div 
                      className={styles.progressFill}
                      style={{ 
                        width: `${gate.completion}%`,
                        backgroundColor: gate.status === 'passed' ? '#22c55e' : 
                                        gate.status === 'failed' ? '#ef4444' : '#f59e0b'
                      }}
                    />
                  </div>
                  {gate.blockingTasks.length > 0 && (
                    <div className={styles.blockingTasks}>
                      阻塞任务: {gate.blockingTasks.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'risks' && (
          <div className={styles.risksTab}>
            <h4>⚠️ 制动项目关键风险</h4>
            <div className={styles.riskList}>
              {brakingRisks.map((risk, i) => (
                <div 
                  key={i} 
                  className={styles.riskItem}
                  style={{ borderLeftColor: getRiskSeverityColor(risk.severity) }}
                >
                  <div className={styles.riskHeader}>
                    <span 
                      className={styles.riskSeverity}
                      style={{ backgroundColor: getRiskSeverityColor(risk.severity) }}
                    >
                      {risk.severity.toUpperCase()}
                    </span>
                    <span className={styles.riskType}>{risk.type}</span>
                  </div>
                  <div className={styles.riskDescription}>{risk.description}</div>
                  <div className={styles.riskMitigation}>
                    <strong>缓解措施:</strong> {risk.mitigation}
                  </div>
                </div>
              ))}
            </div>          
          </div>
        )}

        {activeTab === 'sop' && sopPrediction && (
          <div className={styles.sopTab}>
            <h4>🎯 SOP 量产时间预测</h4>
            
            <div className={styles.sopCard}>
              <div className={styles.sopDate}>
                {sopPrediction.predictedDate.toLocaleDateString('zh-CN')}
              </div>
              <div className={styles.sopLabel}>预测量产日期</div>
              
              <div className={styles.sopConfidence}>
                置信度: {sopPrediction.confidence}%
              </div>
            </div>

            {sopPrediction.riskFactors.length > 0 && (
              <div className={styles.sopRisks}>
                <h5>风险因素:</h5>
                <ul>
                  {sopPrediction.riskFactors.map((risk: string, i: number) => (
                    <li key={i}>{risk}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className={styles.sopRecommendation}>
              <strong>建议:</strong> {sopPrediction.recommendation}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
