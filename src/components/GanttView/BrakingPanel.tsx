/**
 * 行业项目分析面板
 * 展示行业特定的安全门控、关键风险、项目预测等
 */

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { predictiveEngine } from '@/agent/PredictiveAnalysisEngine';
import { getProjectTemplate, detectIndustryType, IndustryType } from '@/agent/ProjectTemplates';
import styles from './BrakingPanel.module.css';

export function BrakingPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'gates' | 'risks' | 'sop'>('overview');
  const [industry, setIndustry] = useState<IndustryType>('consumer');
  const [template, setTemplate] = useState<any>(null);
  const [industryRisks, setIndustryRisks] = useState<any[]>([]);
  const [mandatoryReviews, setMandatoryReviews] = useState<any[]>([]);
  const [healthReport, setHealthReport] = useState<any>(null);
  const { tasks, currentProjectId } = useAppStore();

  useEffect(() => {
    if (!isOpen || !currentProjectId) return;
    
    const context = {
      projectId: currentProjectId,
      tasks,
      buckets: []
    };
    
    // 检测行业类型
    const detectedIndustry = detectIndustryType(tasks);
    setIndustry(detectedIndustry);
    
    // 获取行业模板
    const projectTemplate = getProjectTemplate(detectedIndustry);
    setTemplate(projectTemplate);
    
    // 行业特定分析
    setIndustryRisks(predictiveEngine.analyzeIndustryRisks(context));
    setMandatoryReviews(predictiveEngine.checkMandatoryReviews(context));
    setHealthReport(predictiveEngine.generateIndustryReport(context));
  }, [isOpen, tasks, currentProjectId]);

  const getGateStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return '✅';
      case 'in_progress': return '🔄';
      case 'not_started': return '⏳';
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

  const getIndustryIcon = (ind: IndustryType) => {
    const icons: Record<IndustryType, string> = {
      automotive: '🚗',
      aerospace: '✈️',
      medical: '🏥',
      consumer: '📱',
      industrial: '🏭'
    };
    return icons[ind] || '🏭';
  };

  if (!isOpen) {
    return (
      <button 
        className={styles.brakingToggle}
        onClick={() => setIsOpen(true)}
      >
        {getIndustryIcon(industry)} {industry.toUpperCase()}
        {industryRisks.some((r: any) => r.severity === 'critical') && <span className={styles.criticalBadge} />}
      </button>
    );
  }

  return (
    <div className={styles.brakingPanel}>
      <div className={styles.panelHeader}>
        <span>{getIndustryIcon(industry)} 行业项目分析</span>
        {template?.safetyLevel && <span className={styles.asilBadge}>{template.safetyLevel}</span>}
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
          className={activeTab === 'gates' ? styles.active : ''}
          onClick={() => setActiveTab('gates')}
        >
          🛡️ 门控
        </button>
        <button 
          className={activeTab === 'risks' ? styles.active : ''}
          onClick={() => setActiveTab('risks')}
        >
          ⚠️ 风险
        </button>
        <button 
          className={activeTab === 'sop' ? styles.active : ''}
          onClick={() => setActiveTab('sop')}
        >
          🎯 预测
        </button>
      </div>

      <div className={styles.panelContent}>
        {activeTab === 'overview' && healthReport && template && (
          <div className={styles.overviewTab}>
            <div className={styles.industryInfo}>
              <h4>{template.name}</h4>
              <p>{template.description}</p>
            </div>
            
            <div className={styles.kpiGrid}>
              <div className={styles.kpiCard}>
                <div className={styles.kpiValue} style={{ color: getRiskSeverityColor(healthReport.overallHealth.status === 'critical' ? 'critical' : 'low') }}>
                  {healthReport.overallHealth.score}
                </div>
                <div className={styles.kpiLabel}>健康评分</div>
                <div className={styles.kpiStatus}>{healthReport.overallHealth.status}</div>
              </div>
              
              <div className={styles.kpiCard}>
                <div className={styles.kpiValue}>{healthReport.avgOnTimeProbability}%</div>
                <div className={styles.kpiLabel}>平均准时率</div>
              </div>
              
              <div className={styles.kpiCard}>
                <div className={styles.kpiValue}>{industryRisks.filter((r: any) => r.severity === 'critical').length}</div>
                <div className={styles.kpiLabel}>关键风险</div>
              </div>
              
              <div className={styles.kpiCard}>
                <div className={styles.kpiValue}>{mandatoryReviews.filter((g: any) => g.status === 'passed').length}/{mandatoryReviews.length}</div>
                <div className={styles.kpiLabel}>完成门控</div>
              </div>
            </div>

            {template.kpis && (
              <div className={styles.kpiRequirements}>
                <h4>📋 关键性能指标</h4>
                <div className={styles.kpiList}>
                  {template.kpis.map((kpi: any, i: number) => (
                    <div key={i} className={styles.kpiItem}>
                      <span>{kpi.name}</span>
                      <span>{kpi.target}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'gates' && (
          <div className={styles.safetyTab}>
            <h4>🛡️ 强制评审节点</h4>
            <div className={styles.gateList}>
              {mandatoryReviews.map((gate, i) => (
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
                                        gate.status === 'not_started' ? '#e2e8f0' : '#f59e0b'
                      }}
                    />
                  </div>
                  {gate.description && (
                    <div className={styles.gateDescription}>{gate.description}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'risks' && (
          <div className={styles.risksTab}>
            <h4>⚠️ 行业特定风险</h4>
            <div className={styles.riskList}>
              {industryRisks.length === 0 ? (
                <div className={styles.noRisks}>✅ 暂无行业特定风险</div>
              ) : (
                industryRisks.map((risk, i) => (
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
                    <div className={styles.riskTask}>{risk.taskName}</div>
                    <div className={styles.riskDescription}>{risk.description}</div>
                    <div className={styles.riskMitigation}>
                      <strong>缓解措施:</strong> {risk.mitigation}
                    </div>
                  </div>
                ))
              )}
            </div>          
          </div>
        )}

        {activeTab === 'sop' && healthReport && (
          <div className={styles.sopTab}>
            <h4>🎯 项目预测</h4>
            
            <div className={styles.sopCard}>
              <div className={styles.sopLabel}>项目类型</div>
              <div className={styles.sopValue}>{healthReport.industryName}</div>
            </div>

            {healthReport.safetyLevel && (
              <div className={styles.sopCard}>
                <div className={styles.sopLabel}>安全等级</div>
                <div className={styles.sopValue}>{healthReport.safetyLevel}</div>
              </div>
            )}

            <div className={styles.sopStats}>
              <div className={styles.sopStat}>
                <span>高风险任务</span>
                <span>{healthReport.highRiskCount} 个</span>
              </div>
              <div className={styles.sopStat}>
                <span>资源短缺</span>
                <span>{healthReport.resourceShortage?.totalPeople || 0} 人</span>
              </div>
            </div>

            {healthReport.recommendations && (
              <div className={styles.sopRecommendations}>
                <h5>💡 Agent建议</h5>
                <ul>
                  {healthReport.recommendations.slice(0, 3).map((rec: string, i: number) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
