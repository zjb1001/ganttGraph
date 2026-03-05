/**
 * 制动项目专用配置和优化
 * 针对底盘制动系统开发的特定需求
 */

import { Task, GanttContext } from '@/types';
import { predictiveEngine, PredictionResult } from './PredictiveAnalysisEngine';

// ASIL-D 安全等级要求
export interface SafetyRequirement {
  level: 'ASIL-A' | 'ASIL-B' | 'ASIL-C' | 'ASIL-D';
  requirements: string[];
  verificationMethods: string[];
  mandatoryReviews: string[];
}

// 制动项目特定风险
export interface BrakingRisk {
  type: 'functional' | 'safety' | 'performance' | 'integration';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  mitigation: string;
  relatedTasks: string[];
}

// 制动项目配置
export const BRAKING_PROJECT_CONFIG = {
  name: '底盘制动系统开发',
  safetyLevel: 'ASIL-D' as const,
  
  // 关键性能指标
  kpi: {
    brakingDistance: '≤ 40m (100-0 km/h)',
    responseTime: '≤ 200ms',
    availability: '≥ 99.99%',
    faultTolerance: 'Single fault safe'
  },
  
  // 强制评审节点
  mandatoryReviews: [
    { phase: '需求', gate: 'HARA完成', tasks: ['功能安全概念(HARA)'] },
    { phase: '设计', gate: 'DFMEA完成', tasks: ['DFMEA分析', '制动系统架构设计'] },
    { phase: '验证', gate: 'HIL通过', tasks: ['HIL仿真测试'] },
    { phase: '确认', gate: '实车验证', tasks: ['实车制动测试', '功能安全验证'] }
  ],
  
  // 关键路径
  criticalPath: [
    '功能安全概念(HARA)',
    '制动系统架构设计',
    'ESC控制器硬件开发',
    'ESC算法开发',
    'HIL仿真测试',
    '功能安全验证'
  ],
  
  // 高风险任务
  highRiskTasks: [
    'ESC算法开发',
    '功能安全验证',
    'DFMEA分析',
    '极端工况测试'
  ]
};

// 制动项目专用预测引擎
export class BrakingPredictiveEngine {
  
  /**
   * 制动项目专用风险分析
   */
  analyzeBrakingRisks(context: GanttContext): BrakingRisk[] {
    const risks: BrakingRisk[] = [];
    
    // 检查关键路径任务
    for (const task of context.tasks) {
      // ESC算法风险
      if (task.title.includes('ESC算法')) {
        risks.push({
          type: 'functional',
          severity: 'critical',
          description: 'ESC核心算法直接影响车辆稳定性',
          mitigation: '增加代码审查轮次，引入形式化验证',
          relatedTasks: [task.id]
        });
      }
      
      // 功能安全验证风险
      if (task.title.includes('功能安全验证')) {
        risks.push({
          type: 'safety',
          severity: 'critical',
          description: 'ASIL-D验证不通过将导致项目失败',
          mitigation: '提前进行预评估，引入第三方审核',
          relatedTasks: [task.id]
        });
      }
      
      // HARA风险
      if (task.title.includes('HARA')) {
        risks.push({
          type: 'safety',
          severity: 'high',
          description: '危害分析不完整将影响后续设计',
          mitigation: '组织专家评审，参考行业最佳实践',
          relatedTasks: [task.id]
        });
      }
      
      // 硬件开发风险
      if (task.title.includes('硬件') || task.title.includes('控制器')) {
        risks.push({
          type: 'integration',
          severity: 'high',
          description: '硬件设计变更将连锁影响软件',
          mitigation: '硬件冻结前充分验证，预留缓冲时间',
          relatedTasks: [task.id]
        });
      }
    }
    
    return risks;
  }
  
  /**
   * 检查安全门控是否满足
   */
  checkSafetyGates(context: GanttContext): {
    gate: string;
    status: 'passed' | 'in_progress' | 'not_started' | 'failed';
    completion: number;
    blockingTasks: string[];
  }[] {
    const results = [];
    
    for (const review of BRAKING_PROJECT_CONFIG.mandatoryReviews) {
      const relatedTasks = context.tasks.filter(t => 
        review.tasks.some(rt => t.title.includes(rt))
      );
      
      const completedTasks = relatedTasks.filter(t => t.status === 'Completed');
      const completion = relatedTasks.length > 0 
        ? (completedTasks.length / relatedTasks.length) * 100 
        : 0;
      
      let status: 'passed' | 'in_progress' | 'not_started' | 'failed';
      if (completion >= 100) status = 'passed';
      else if (completion > 0) status = 'in_progress';
      else status = 'not_started';
      
      // 检查是否有高风险延期
      const blockingTasks = relatedTasks
        .filter(t => t.status !== 'Completed')
        .filter(t => {
          const prediction = predictiveEngine.predictTaskDelay(t);
          return prediction.onTimeProbability < 50;
        })
        .map(t => t.title);
      
      if (blockingTasks.length > 0) status = 'failed';
      
      results.push({
        gate: `${review.phase} - ${review.gate}`,
        status,
        completion: Math.round(completion),
        blockingTasks
      });
    }
    
    return results;
  }
  
  /**
   * 预测项目 SOP 时间
   */
  predictSOPDate(context: GanttContext): {
    predictedDate: Date;
    confidence: number;
    riskFactors: string[];
    recommendation: string;
  } {
    const milestonePredictions = predictiveEngine.predictMilestones(context);
    const sopMilestone = milestonePredictions.find(m => 
      m.milestone.includes('SOP') || m.milestone.includes('量产')
    );
    
    if (!sopMilestone) {
      return {
        predictedDate: new Date(),
        confidence: 0,
        riskFactors: ['未找到SOP里程碑'],
        recommendation: '请创建SOP里程碑'
      };
    }
    
    // 计算风险因素
    const risks = this.analyzeBrakingRisks(context);
    const criticalRisks = risks.filter(r => r.severity === 'critical');
    const highRisks = risks.filter(r => r.severity === 'high');
    
    const riskFactors: string[] = [];
    if (criticalRisks.length > 0) {
      riskFactors.push(`${criticalRisks.length}个关键风险未解决`);
    }
    if (highRisks.length > 0) {
      riskFactors.push(`${highRisks.length}个高风险项`);
    }
    
    // 计算置信度
    let confidence = sopMilestone.confidence;
    if (criticalRisks.length > 0) confidence -= 20;
    if (highRisks.length > 0) confidence -= 10;
    confidence = Math.max(0, confidence);
    
    // 生成建议
    let recommendation = '';
    if (criticalRisks.length > 0) {
      recommendation = '关键风险严重影响SOP时间，建议立即制定应急预案';
    } else if (confidence < 60) {
      recommendation = 'SOP预测置信度较低，建议增加资源投入';
    } else {
      recommendation = '项目进展良好，按当前节奏推进';
    }
    
    return {
      predictedDate: sopMilestone.predictedDate,
      confidence,
      riskFactors,
      recommendation
    };
  }
  
  /**
   * 生成制动项目专用报告
   */
  generateBrakingReport(context: GanttContext) {
    const baseReport = predictiveEngine.generateHealthReport(context);
    const brakingRisks = this.analyzeBrakingRisks(context);
    const safetyGates = this.checkSafetyGates(context);
    const sopPrediction = this.predictSOPDate(context);
    
    return {
      ...baseReport,
      safetyLevel: BRAKING_PROJECT_CONFIG.safetyLevel,
      brakingSpecific: {
        criticalRisks: brakingRisks.filter(r => r.severity === 'critical'),
        highRisks: brakingRisks.filter(r => r.severity === 'high'),
        safetyGates,
        sopPrediction,
        kpi: BRAKING_PROJECT_CONFIG.kpi
      },
      recommendations: [
        ...baseReport.recommendations,
        ...this.generateBrakingRecommendations(brakingRisks, safetyGates)
      ]
    };
  }
  
  private generateBrakingRecommendations(
    risks: BrakingRisk[],
    gates: ReturnType<typeof this.checkSafetyGates>
  ): string[] {
    const recommendations: string[] = [];
    
    // 关键风险建议
    const criticalRisks = risks.filter(r => r.severity === 'critical');
    if (criticalRisks.length > 0) {
      recommendations.push(`⚠️ 存在 ${criticalRisks.length} 个关键风险，建议立即组织专项评审`);
    }
    
    // 安全门控建议
    const failedGates = gates.filter(g => g.status === 'failed');
    if (failedGates.length > 0) {
      recommendations.push(`🚫 ${failedGates.length} 个安全门控未通过，阻塞后续开发`);
    }
    
    // ASIL-D 建议
    recommendations.push('📋 建议定期进行功能安全审计，确保符合 ASIL-D 要求');
    
    return recommendations;
  }
}

// 导出单例
export const brakingPredictiveEngine = new BrakingPredictiveEngine();
