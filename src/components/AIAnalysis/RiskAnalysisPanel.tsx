import React from 'react';
import styles from './RiskAnalysisPanel.module.css';
import type { Risk, RiskAnalysisResponse } from '@/utils/enhancedAgentApi';
import { getRiskLevelColor, getRiskLevelText } from '@/utils/enhancedAgentApi';

interface RiskAnalysisPanelProps {
  result: RiskAnalysisResponse | null;
  loading?: boolean;
  onRefresh?: () => void;
}

export const RiskAnalysisPanel: React.FC<RiskAnalysisPanelProps> = ({
  result,
  loading,
  onRefresh
}) => {
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>正在分析项目风险...🔍</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <p>点击分析按钮检查项目风险</p>
          {onRefresh && (
            <button onClick={onRefresh} className={styles.button}>
              开始分析
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!result.success) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>❌ {result.message}</p>
        </div>
      </div>
    );
  }

  const { risks, overall_risk_level, risk_summary, recommendations } = result;

  return (
    <div className={styles.container}>
      {/* 总体风险等级 */}
      <div className={styles.header}>
        <div className={styles.riskLevel} style={{ 
          backgroundColor: getRiskLevelColor(overall_risk_level) 
        }}>
          <span>整体风险: {getRiskLevelText(overall_risk_level)}</span>
        </div>
        <button onClick={onRefresh} className={styles.refreshButton}>
          🔄 重新分析
        </button>
      </div>

      {/* 风险统计 */}
      <div className={styles.stats}>
        <RiskStat count={risk_summary.critical} label="严重" color="#ff0000" />
        <RiskStat count={risk_summary.high} label="高" color="#ff6600" />
        <RiskStat count={risk_summary.medium} label="中" color="#ffcc00" />
        <RiskStat count={risk_summary.low} label="低" color="#66ccff" />
      </div>

      {/* 风险列表 */}
      <div className={styles.risksList}>
        <h4>⚠️ 风险详情 ({risks.length})</h4>
        {risks.length === 0 ? (
          <p className={styles.noRisks}>🎉 未发现明显风险</p>
        ) : (
          risks.map((risk, index) => (
            <RiskItem key={index} risk={risk} />
          ))
        )}
      </div>

      {/* 建议 */}
      {recommendations.length > 0 && (
        <div className={styles.recommendations}>
          <h4>💡 建议措施</h4>
          <ul>
            {recommendations.map((rec, index) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const RiskStat: React.FC<{ count: number; label: string; color: string }> = ({
  count,
  label,
  color
}) => (
  <div className={styles.stat} style={{ borderColor: color }}>
    <span className={styles.statCount} style={{ color }}>{count}</span>
    <span className={styles.statLabel}>{label}</span>
  </div>
);

const RiskItem: React.FC<{ risk: Risk }> = ({ risk }) => (
  <div className={styles.riskItem}>
    <div className={styles.riskHeader}>
      <span 
        className={styles.riskLevelBadge}
        style={{ backgroundColor: getRiskLevelColor(risk.level) }}
      >
        {getRiskLevelText(risk.level)}
      </span>
      <span className={styles.riskType}>{risk.risk_type}</span>
      {risk.impact_days > 0 && (
        <span className={styles.impact}>影响: {risk.impact_days}天</span>
      )}
    </div>
    <p className={styles.riskTitle}>📋 {risk.task_title || '项目整体'}</p>
    <p className={styles.riskDesc}>{risk.description}</p>
    <div className={styles.suggestion}>
      <strong>💡 建议:</strong> {risk.suggestion}
    </div>
  </div>
);
