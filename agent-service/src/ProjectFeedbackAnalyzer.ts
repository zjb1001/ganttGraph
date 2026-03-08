/**
 * 项目完整性分析与反馈机制
 * Agent 评估项目计划并给出改进建议
 */

import { ProjectTemplate, TemplateTask } from './GoalDrivenPlanner';
import { ECUDevelopmentTemplate } from './ECUFullLifecycleTemplate';

export interface ProjectFeedback {
  overallScore: number;           // 0-100 综合评分
  completeness: {                 // 完整性评估
    hasRequirementPhase: boolean;
    hasDesignPhase: boolean;
    hasHardwarePhase: boolean;
    hasSoftwarePhase: boolean;
    hasTestingPhase: boolean;
    hasProductionPhase: boolean;
    missingPhases: string[];
  };
  riskAssessment: {               // 风险评估
    criticalRisks: string[];
    suggestions: string[];
  };
  improvements: {                 // 改进建议
    addTasks: string[];
    adjustDuration: { task: string; reason: string }[];
    addDependencies: string[];
  };
  bestPractices: string[];        // 行业最佳实践建议
}

/**
 * 项目反馈分析器
 */
export class ProjectFeedbackAnalyzer {
  private fullLifecycleTemplate = ECUDevelopmentTemplate;
  
  /**
   * 分析项目计划的完整性并给出反馈
   */
  analyzeProject(
    userGoal: string,
    currentTasks: TemplateTask[],
    targetDeadline?: Date
  ): ProjectFeedback {
    const feedback: ProjectFeedback = {
      overallScore: 0,
      completeness: this.checkCompleteness(currentTasks),
      riskAssessment: this.assessRisks(currentTasks, targetDeadline),
      improvements: this.suggestImprovements(currentTasks),
      bestPractices: this.recommendBestPractices(userGoal)
    };
    
    // 计算综合评分
    feedback.overallScore = this.calculateScore(feedback);
    
    return feedback;
  }
  
  /**
   * 检查项目完整性
   */
  private checkCompleteness(tasks: TemplateTask[]) {
    const phases = {
      hasRequirementPhase: tasks.some(t => t.category === '需求阶段'),
      hasDesignPhase: tasks.some(t => t.category === '系统设计'),
      hasHardwarePhase: tasks.some(t => t.category === '硬件开发'),
      hasSoftwarePhase: tasks.some(t => ['MCAL开发', 'BSW开发', '应用开发'].includes(t.category)),
      hasTestingPhase: tasks.some(t => t.category === '测试验证'),
      hasProductionPhase: tasks.some(t => t.category === '量产准备'),
      missingPhases: [] as string[]
    };
    
    // 检查缺失的阶段
    if (!phases.hasRequirementPhase) phases.missingPhases.push('需求分析阶段');
    if (!phases.hasDesignPhase) phases.missingPhases.push('系统设计阶段');
    if (!phases.hasHardwarePhase) phases.missingPhases.push('硬件开发阶段');
    if (!phases.hasSoftwarePhase) phases.missingPhases.push('软件开发阶段');
    if (!phases.hasTestingPhase) phases.missingPhases.push('测试验证阶段');
    if (!phases.hasProductionPhase) phases.missingPhases.push('量产准备阶段');
    
    return phases;
  }
  
  /**
   * 风险评估
   */
  private assessRisks(tasks: TemplateTask[], deadline?: Date) {
    const risks: string[] = [];
    const suggestions: string[] = [];
    
    const totalDays = tasks.reduce((sum, t) => sum + t.duration, 0);
    
    // 检查是否有功能安全相关任务
    const hasSafety = tasks.some(t => 
      t.title.includes('功能安全') || t.description.includes('ASIL')
    );
    if (!hasSafety) {
      risks.push('缺少功能安全开发，汽车ECU必须通过功能安全认证');
      suggestions.push('建议增加HARA分析和功能安全概念阶段');
    }
    
    // 检查测试覆盖
    const testTasks = tasks.filter(t => t.category === '测试验证');
    if (testTasks.length < 3) {
      risks.push('测试验证阶段不完整，可能导致量产问题');
      suggestions.push('建议增加单元测试、HIL测试、EMC测试等');
    }
    
    // 检查截止日期合理性
    if (deadline) {
      const availableDays = Math.ceil(
        (deadline.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
      );
      if (availableDays < totalDays * 0.8) {
        risks.push(`时间紧迫：需要${totalDays}天，但只剩${availableDays}天`);
        suggestions.push('建议延长交付时间或增加人力资源');
      }
    }
    
    // 检查硬件软件协同
    const hasHardware = tasks.some(t => t.category === '硬件开发');
    const hasSoftware = tasks.some(t => ['MCAL开发', 'BSW开发', '应用开发'].includes(t.category));
    if (hasHardware && !hasSoftware) {
      risks.push('有硬件开发但缺少软件开发，系统无法运行');
      suggestions.push('建议增加MCAL/BSW/应用软件开发任务');
    }
    if (!hasHardware && hasSoftware) {
      risks.push('有软件开发但缺少硬件开发，没有运行平台');
      suggestions.push('建议增加硬件设计和PCB开发任务');
    }
    
    return { criticalRisks: risks, suggestions };
  }
  
  /**
   * 改进建议
   */
  private suggestImprovements(currentTasks: TemplateTask[]) {
    const addTasks: string[] = [];
    const adjustDuration: { task: string; reason: string }[] = [];
    const addDependencies: string[] = [];
    
    // 对比完整模板，找出缺失的关键任务
    const currentTitles = currentTasks.map(t => t.title);
    const fullTasks = this.fullLifecycleTemplate.tasks;
    
    // 关键任务必须包含
    const criticalTasks = [
      '系统需求规范(SRS)',
      '功能安全概念阶段',
      '系统架构设计',
      'DFMEA分析',
      'MCAL配置开发',
      '控制算法开发',
      'HIL仿真测试',
      '功能安全实现',
      'PPAP提交'
    ];
    
    criticalTasks.forEach(task => {
      if (!currentTitles.some(t => t.includes(task.replace(/[()]/g, '')))) {
        const fullTask = fullTasks.find(t => t.title.includes(task.split('(')[0]));
        if (fullTask) {
          addTasks.push(`${fullTask.title} (${fullTask.duration}天) - ${fullTask.description}`);
        }
      }
    });
    
    // 检查工期合理性
    const mcalTask = currentTasks.find(t => t.title.includes('MCAL'));
    if (mcalTask && mcalTask.duration < 10) {
      adjustDuration.push({
        task: mcalTask.title,
        reason: 'MCAL配置涉及多个模块，建议至少10-14天'
      });
    }
    
    const testTask = currentTasks.find(t => t.category === '测试验证');
    if (testTask && testTask.duration < 7) {
      adjustDuration.push({
        task: testTask.title,
        reason: '汽车ECU测试验证非常重要，建议充足时间'
      });
    }
    
    return { addTasks, adjustDuration, addDependencies };
  }
  
  /**
   * 最佳实践建议
   */
  private recommendBestPractices(userGoal: string): string[] {
    const practices: string[] = [];
    const lowerGoal = userGoal.toLowerCase();
    
    if (lowerGoal.includes('车身') || lowerGoal.includes(' BCM ')) {
      practices.push('车身控制器建议采用AUTOSAR架构，便于功能扩展');
      practices.push('车身功能多且杂，建议采用模块化SWC设计');
      practices.push('网络管理是车身控制器重点，需仔细设计NM策略');
    }
    
    if (lowerGoal.includes('制动') || lowerGoal.includes('刹车')) {
      practices.push('制动系统属于ASIL-D最高安全等级，必须严格遵循功能安全流程');
      practices.push('建议采用冗余设计和多通道监控');
      practices.push('E2E端到端保护是必须的，防止通信错误');
    }
    
    if (lowerGoal.includes('动力') || lowerGoal.includes('电机')) {
      practices.push('动力系统对实时性要求高，OS配置需特别注意任务调度');
      practices.push('电机控制算法需要充分标定，预留足够标定时间');
    }
    
    practices.push('建议建立完善的变更管理流程，汽车行业需求变更频繁');
    practices.push('提前与供应商沟通，关键元器件交期可能较长');
    practices.push('测试用例建议在设计阶段就开始编写，实现测试驱动开发');
    
    return practices;
  }
  
  /**
   * 计算综合评分
   */
  private calculateScore(feedback: ProjectFeedback): number {
    let score = 100;
    
    // 完整性扣分
    score -= feedback.completeness.missingPhases.length * 10;
    
    // 风险扣分
    score -= feedback.riskAssessment.criticalRisks.length * 15;
    
    // 确保分数在0-100之间
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * 生成反馈报告
   */
  generateReport(feedback: ProjectFeedback): string {
    const lines: string[] = [];
    
    lines.push('╔══════════════════════════════════════════════════════════════╗');
    lines.push('║          项目计划完整性评估报告                              ║');
    lines.push('╚══════════════════════════════════════════════════════════════╝');
    lines.push('');
    
    // 综合评分
    const scoreEmoji = feedback.overallScore >= 80 ? '🟢' : feedback.overallScore >= 60 ? '🟡' : '🔴';
    lines.push(`${scoreEmoji} 综合评分: ${feedback.overallScore}/100`);
    lines.push('');
    
    // 完整性评估
    lines.push('📋 阶段完整性评估:');
    lines.push(`   需求阶段: ${feedback.completeness.hasRequirementPhase ? '✅' : '❌'}`);
    lines.push(`   系统设计: ${feedback.completeness.hasDesignPhase ? '✅' : '❌'}`);
    lines.push(`   硬件开发: ${feedback.completeness.hasHardwarePhase ? '✅' : '❌'}`);
    lines.push(`   软件开发: ${feedback.completeness.hasSoftwarePhase ? '✅' : '❌'}`);
    lines.push(`   测试验证: ${feedback.completeness.hasTestingPhase ? '✅' : '❌'}`);
    lines.push(`   量产准备: ${feedback.completeness.hasProductionPhase ? '✅' : '❌'}`);
    
    if (feedback.completeness.missingPhases.length > 0) {
      lines.push('');
      lines.push('⚠️ 缺失阶段:');
      feedback.completeness.missingPhases.forEach(phase => {
        lines.push(`   - ${phase}`);
      });
    }
    
    // 风险评估
    if (feedback.riskAssessment.criticalRisks.length > 0) {
      lines.push('');
      lines.push('🚨 关键风险:');
      feedback.riskAssessment.criticalRisks.forEach(risk => {
        lines.push(`   • ${risk}`);
      });
      
      lines.push('');
      lines.push('💡 风险缓解建议:');
      feedback.riskAssessment.suggestions.forEach(s => {
        lines.push(`   → ${s}`);
      });
    }
    
    // 改进建议
    if (feedback.improvements.addTasks.length > 0) {
      lines.push('');
      lines.push('➕ 建议增加的任务:');
      feedback.improvements.addTasks.slice(0, 5).forEach(task => {
        lines.push(`   + ${task}`);
      });
      if (feedback.improvements.addTasks.length > 5) {
        lines.push(`   ... 还有 ${feedback.improvements.addTasks.length - 5} 个任务`);
      }
    }
    
    if (feedback.improvements.adjustDuration.length > 0) {
      lines.push('');
      lines.push('⏱️ 建议调整工期:');
      feedback.improvements.adjustDuration.forEach(adj => {
        lines.push(`   ~ ${adj.task}: ${adj.reason}`);
      });
    }
    
    // 最佳实践
    lines.push('');
    lines.push('⭐ 行业最佳实践:');
    feedback.bestPractices.forEach((practice, i) => {
      lines.push(`   ${i + 1}. ${practice}`);
    });
    
    lines.push('');
    lines.push('═══════════════════════════════════════════════════════════════');
    
    return lines.join('\n');
  }
}

// 导出单例
export const feedbackAnalyzer = new ProjectFeedbackAnalyzer();
