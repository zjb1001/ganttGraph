/**
 * AI Assistant Panel with explicit action buttons
 * Provides quick access to AI features: decompose, analyze, predict
 */

import { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { 
  decomposeProject, 
  analyzeProjectRisks, 
  predictSchedule, 
  type DecomposeResponse,
  type RiskAnalysisResponse,
  type SchedulePredictionResponse 
} from '@/utils/enhancedAgentApi';
import './AIAssistantPanel.css';

export function AIAssistantPanel() {
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [decomposeResult, setDecomposeResult] = useState<DecomposeResponse | null>(null);
  const [riskResult, setRiskResult] = useState<RiskAnalysisResponse | null>(null);
  const [predictResult, setPredictResult] = useState<SchedulePredictionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'decompose' | 'risk' | 'predict' | null>(null);

  const { tasks, currentProjectId, addTask, addBucket, buckets } = useAppStore();

  const handleDecompose = async () => {
    if (!inputValue.trim()) {
      setError('请输入项目需求');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setDecomposeResult(null);
    setRiskResult(null);
    setPredictResult(null);
    setActiveTab('decompose');

    try {
      const response = await decomposeProject(inputValue);

      if (response.success && response.tasks) {
        setDecomposeResult(response);
        
        // Add tasks to project
        if (currentProjectId) {
          // Create buckets for phases
          const phaseBuckets = new Map<string, string>();
          
          for (const task of response.tasks) {
            // Create bucket if not exists
            if (!phaseBuckets.has(task.phase)) {
              const existingBucket = buckets.find(b => b.name === task.phase);
              if (existingBucket) {
                phaseBuckets.set(task.phase, existingBucket.id);
              } else {
                const newBucket = await addBucket({
                  name: task.phase,
                  order: phaseBuckets.size,
                });
                phaseBuckets.set(task.phase, newBucket.id);
              }
            }

            // Add task
            await addTask({
              title: task.title,
              startDateTime: new Date(task.start_date),
              dueDateTime: new Date(task.end_date),
              priority: task.priority === 'Urgent' ? 'Urgent' : 
                       task.priority === 'Important' ? 'Important' : 
                       task.priority === 'Low' ? 'Low' : 'Normal',
              status: 'NotStarted',
              bucketId: phaseBuckets.get(task.phase) || buckets[0]?.id || '',
              projectId: currentProjectId,
              order: 0,
              taskType: 'task',
              assigneeIds: [],
              labelIds: [],
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
    if (tasks.length === 0) {
      setError('当前项目没有任务可分析');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setDecomposeResult(null);
    setRiskResult(null);
    setPredictResult(null);
    setActiveTab('risk');

    try {
      const response = await analyzeProjectRisks(tasks);
      
      if (response.success) {
        setRiskResult(response);
      } else {
        setError(response.message || '分析失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '请求失败');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePredict = async () => {
    if (tasks.length === 0) {
      setError('当前项目没有任务可预测');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setDecomposeResult(null);
    setRiskResult(null);
    setPredictResult(null);
    setActiveTab('predict');

    try {
      const response = await predictSchedule(tasks);
      
      if (response.success) {
        setPredictResult(response);
      } else {
        setError(response.message || '预测失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '请求失败');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="ai-assistant-panel">
      <div className="ai-panel-header">
        <span className="ai-icon">🤖</span>
        <h3>AI 智能助手</h3>
        <span className="ai-model">智谱 GLM-4</span>
      </div>

      <div className="ai-input-section">
        <textarea
          className="ai-textarea"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="输入项目需求，AI将自动分解为任务计划...&#10;例如：开发一套完整的整车电子制动系统，包含ABS、EBD、ESC功能，ASIL-D安全等级，18个月完成"
          rows={4}
          disabled={isProcessing}
        />
      </div>

      <div className="ai-actions-section">
        <button 
          className="ai-btn ai-btn-primary" 
          onClick={handleDecompose}
          disabled={isProcessing}
        >
          {isProcessing && activeTab === 'decompose' ? '⏳ 处理中...' : '🧩 智能分解'}
        </button>
        <button 
          className="ai-btn ai-btn-secondary" 
          onClick={handleAnalyzeRisks}
          disabled={isProcessing || tasks.length === 0}
        >
          {isProcessing && activeTab === 'risk' ? '⏳ 分析中...' : '⚠️ 风险分析'}
        </button>
        <button 
          className="ai-btn ai-btn-secondary" 
          onClick={handlePredict}
          disabled={isProcessing || tasks.length === 0}
        >
          {isProcessing && activeTab === 'predict' ? '⏳ 预测中...' : '🔮 进度预测'}
        </button>
      </div>

      {error && (
        <div className="ai-error">
          ❌ {error}
        </div>
      )}

      {decomposeResult && activeTab === 'decompose' && (
        <div className="ai-result">
          <div className="ai-result-header">
            ✅ {decomposeResult.message}
          </div>
          {decomposeResult.tasks && decomposeResult.tasks.length > 0 && (
            <div className="ai-result-stats">
              <div className="ai-stat">
                <span className="ai-stat-value">{decomposeResult.phases?.length || 0}</span>
                <span className="ai-stat-label">阶段</span>
              </div>
              <div className="ai-stat">
                <span className="ai-stat-value">{decomposeResult.tasks.length}</span>
                <span className="ai-stat-label">任务</span>
              </div>
              <div className="ai-stat">
                <span className="ai-stat-value">{decomposeResult.estimated_duration_days}</span>
                <span className="ai-stat-label">工期(天)</span>
              </div>
              <div className="ai-stat">
                <span className="ai-stat-value">{Math.round(decomposeResult.confidence * 100)}%</span>
                <span className="ai-stat-label">置信度</span>
              </div>
            </div>
          )}
        </div>
      )}

      {riskResult && activeTab === 'risk' && (
        <div className="ai-result">
          <div className="ai-result-header">
            ⚠️ {riskResult.message}
          </div>
          <div className="ai-result-stats">
            <div className="ai-stat">
              <span className="ai-stat-value" style={{color: '#c62828'}}>{riskResult.risk_summary?.critical || 0}</span>
              <span className="ai-stat-label">严重</span>
            </div>
            <div className="ai-stat">
              <span className="ai-stat-value" style={{color: '#ef6c00'}}>{riskResult.risk_summary?.high || 0}</span>
              <span className="ai-stat-label">高风险</span>
            </div>
            <div className="ai-stat">
              <span className="ai-stat-value">{riskResult.risks?.length || 0}</span>
              <span className="ai-stat-label">总风险数</span>
            </div>
          </div>
        </div>
      )}

      {predictResult && predictResult.prediction && activeTab === 'predict' && (
        <div className="ai-result">
          <div className="ai-result-header">
            🔮 进度预测结果
          </div>
          <div className="ai-result-stats">
            <div className="ai-stat">
              <span className="ai-stat-value">{predictResult.prediction.predicted_end_date}</span>
              <span className="ai-stat-label">预计完成</span>
            </div>
            <div className="ai-stat">
              <span className="ai-stat-value">{Math.round(predictResult.prediction.confidence * 100)}%</span>
              <span className="ai-stat-label">置信度</span>
            </div>
            <div className="ai-stat">
              <span className="ai-stat-value" style={{color: '#ef6c00'}}>{Math.round(predictResult.prediction.delay_probability * 100)}%</span>
              <span className="ai-stat-label">延期概率</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
