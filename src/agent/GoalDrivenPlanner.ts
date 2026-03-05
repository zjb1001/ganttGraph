/**
 * Level 5: 目标驱动自主规划
 * 基于已有项目案例，自动生成项目计划
 */

import { Task } from '@/types';

// 项目模板库
export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  tasks: TemplateTask[];
  defaultDependencies: { from: number; to: number }[];
}

export interface TemplateTask {
  title: string;
  duration: number;
  description: string;
  category: string;
}

// 基于已有案例的模板库
export const ProjectTemplates: ProjectTemplate[] = [
  {
    id: 'renovation',
    name: '装修改造项目',
    description: '旧房翻新、新房装修等装饰工程',
    keywords: ['装修', '改造', '翻新', '房子', '设计', '施工'],
    tasks: [
      { title: '设计方案确定', duration: 5, description: '确定装修风格和设计方案', category: '设计' },
      { title: '拆除旧装修', duration: 3, description: '拆除原有装修结构', category: '施工' },
      { title: '水电改造', duration: 7, description: '水管电线重新布线', category: '隐蔽工程' },
      { title: '防水处理', duration: 3, description: '卫生间厨房防水施工', category: '隐蔽工程' },
      { title: '瓦工铺砖', duration: 5, description: '地砖墙砖铺贴', category: '施工' },
      { title: '木工制作', duration: 7, description: '吊顶、柜子制作', category: '施工' },
      { title: '油漆涂刷', duration: 5, description: '墙面顶面油漆', category: '施工' },
      { title: '安装橱柜', duration: 2, description: '厨房橱柜安装', category: '安装' },
      { title: '灯具安装', duration: 1, description: '灯具开关面板安装', category: '安装' },
      { title: '清洁验收', duration: 2, description: '全屋清洁和验收', category: '收尾' }
    ],
    defaultDependencies: [
      { from: 1, to: 0 }, { from: 2, to: 1 }, { from: 3, to: 2 },
      { from: 4, to: 3 }, { from: 5, to: 4 }, { from: 6, to: 5 },
      { from: 7, to: 6 }, { from: 8, to: 6 }, { from: 9, to: 7 }
    ]
  },
  {
    id: 'autosar_mcal',
    name: 'AUTOSAR MCAL开发',
    description: '汽车电子基础软件开发',
    keywords: ['MCAL', 'AUTOSAR', '制动', '车身', '控制器', '嵌入式'],
    tasks: [
      { title: 'PORT模块配置', duration: 3, description: 'GPIO引脚配置', category: '基础驱动' },
      { title: 'DIO数字IO驱动', duration: 2, description: '数字输入输出驱动', category: '基础驱动' },
      { title: 'ADC模数转换', duration: 5, description: '模拟信号采集', category: '基础驱动' },
      { title: 'PWM脉宽调制', duration: 4, description: 'PWM信号输出', category: '基础驱动' },
      { title: 'ICU输入捕获', duration: 3, description: '信号捕获测量', category: '基础驱动' },
      { title: 'CAN通信驱动', duration: 7, description: 'CAN总线通信', category: '通信' },
      { title: 'LIN通信驱动', duration: 5, description: 'LIN总线通信', category: '通信' },
      { title: 'GPT通用定时器', duration: 3, description: '定时器配置', category: '系统' },
      { title: 'WDG看门狗', duration: 2, description: '安全监控', category: '系统' },
      { title: 'FLS Flash驱动', duration: 4, description: '数据存储', category: '系统' },
      { title: '应用算法开发', duration: 15, description: '控制算法实现', category: '应用' },
      { title: 'HIL仿真测试', duration: 10, description: '硬件在环测试', category: '测试' },
      { title: '实车标定测试', duration: 15, description: '实际车辆测试', category: '测试' }
    ],
    defaultDependencies: [
      { from: 1, to: 0 }, { from: 2, to: 0 }, { from: 3, to: 0 },
      { from: 4, to: 0 }, { from: 5, to: 1 }, { from: 6, to: 1 },
      { from: 7, to: 0 }, { from: 8, to: 0 }, { from: 9, to: 0 },
      { from: 10, to: 2 }, { from: 10, to: 5 }, { from: 11, to: 10 },
      { from: 12, to: 11 }
    ]
  },
  {
    id: 'expo_event',
    name: '会展活动策划',
    description: '展览、会议、活动策划执行',
    keywords: ['会展', '展览', '活动', '展会', '会议', '策划'],
    tasks: [
      { title: '展馆租赁确认', duration: 7, description: '确定展馆面积和位置', category: '场地' },
      { title: '参展商招募', duration: 30, description: '邀请参展商和赞助商', category: '招商' },
      { title: '展位设计规划', duration: 14, description: '展位布局和动线设计', category: '设计' },
      { title: '宣传推广方案', duration: 21, description: '线上线下推广', category: '市场' },
      { title: '票务系统搭建', duration: 10, description: '购票验票系统', category: '系统' },
      { title: '物流运输安排', duration: 7, description: '展品运输仓储', category: '物流' },
      { title: '现场搭建施工', duration: 5, description: '展台搭建装饰', category: '执行' },
      { title: '嘉宾邀请确认', duration: 14, description: '重要嘉宾邀请', category: '公关' },
      { title: '开幕式筹备', duration: 3, description: '开幕式流程彩排', category: '执行' }
    ],
    defaultDependencies: [
      { from: 1, to: 0 }, { from: 2, to: 0 }, { from: 4, to: 2 },
      { from: 5, to: 2 }, { from: 6, to: 2 }, { from: 8, to: 7 }
    ]
  }
];

/**
 * 目标驱动规划引擎
 */
export class GoalDrivenPlanner {
  private templates = ProjectTemplates;
  
  /**
   * 分析用户目标，识别项目类型
   */
  analyzeGoal(goal: string): {
    type: string;
    confidence: number;
    matchedKeywords: string[];
  } {
    const lowerGoal = goal.toLowerCase();
    const results = this.templates.map(template => {
      const matched = template.keywords.filter(k => lowerGoal.includes(k));
      const confidence = matched.length / template.keywords.length;
      return {
        type: template.id,
        name: template.name,
        confidence,
        matchedKeywords: matched
      };
    });
    
    // 按置信度排序
    results.sort((a, b) => b.confidence - a.confidence);
    
    return {
      type: results[0]?.type || 'custom',
      confidence: results[0]?.confidence || 0,
      matchedKeywords: results[0]?.matchedKeywords || []
    };
  }
  
  /**
   * 基于目标生成项目计划
   */
  generateProject(
    goal: string,
    deadline?: Date,
    customizations?: { skipTasks?: string[]; extraTasks?: TemplateTask[] }
  ): {
    template: ProjectTemplate;
    tasks: TemplateTask[];
    dependencies: { from: number; to: number }[];
    estimatedDuration: number;
    riskLevel: 'low' | 'medium' | 'high';
    recommendations: string[];
  } {
    // 1. 识别项目类型
    const analysis = this.analyzeGoal(goal);
    const template = this.templates.find(t => t.id === analysis.type) || this.templates[0];
    
    // 2. 复制任务列表
    let tasks = [...template.tasks];
    
    // 3. 应用自定义
    if (customizations?.skipTasks) {
      tasks = tasks.filter(t => !customizations.skipTasks?.includes(t.title));
    }
    if (customizations?.extraTasks) {
      tasks.push(...customizations.extraTasks);
    }
    
    // 4. 计算工期
    const estimatedDuration = tasks.reduce((sum, t) => sum + t.duration, 0);
    
    // 5. 根据截止日期调整 (如果提供)
    if (deadline) {
      const availableDays = Math.ceil(
        (deadline.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
      );
      if (availableDays < estimatedDuration) {
        // 需要压缩工期
        tasks = this.compressSchedule(tasks, availableDays);
      }
    }
    
    // 6. 评估风险
    const riskLevel = this.assessRisk(tasks, deadline);
    
    // 7. 生成建议
    const recommendations = this.generateRecommendations(tasks, analysis.type);
    
    return {
      template,
      tasks,
      dependencies: template.defaultDependencies,
      estimatedDuration,
      riskLevel,
      recommendations
    };
  }
  
  /**
   * 压缩工期
   */
  private compressSchedule(tasks: TemplateTask[], targetDays: number): TemplateTask[] {
    const currentDays = tasks.reduce((sum, t) => sum + t.duration, 0);
    const ratio = targetDays / currentDays;
    
    return tasks.map(t => ({
      ...t,
      duration: Math.max(1, Math.ceil(t.duration * ratio))
    }));
  }
  
  /**
   * 风险评估
   */
  private assessRisk(
    tasks: TemplateTask[],
    deadline?: Date
  ): 'low' | 'medium' | 'high' {
    let riskScore = 0;
    
    // 任务数量风险
    if (tasks.length > 15) riskScore += 20;
    if (tasks.length > 20) riskScore += 20;
    
    // 工期风险
    const totalDays = tasks.reduce((sum, t) => sum + t.duration, 0);
    if (totalDays > 60) riskScore += 20;
    
    // 截止日期的紧迫性
    if (deadline) {
      const daysUntil = Math.ceil(
        (deadline.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
      );
      if (daysUntil < totalDays * 0.8) riskScore += 30;
    }
    
    if (riskScore > 50) return 'high';
    if (riskScore > 30) return 'medium';
    return 'low';
  }
  
  /**
   * 生成建议
   */
  private generateRecommendations(tasks: TemplateTask[], type: string): string[] {
    const recommendations: string[] = [];
    
    // 基于任务类型给出建议
    const criticalCategories = ['隐蔽工程', '基础驱动', '场地'];
    const criticalTasks = tasks.filter(t => criticalCategories.includes(t.category));
    
    if (criticalTasks.length > 0) {
      recommendations.push(
        `${criticalTasks[0].category}是项目基础，建议优先安排并预留缓冲时间`
      );
    }
    
    // 并行建议
    const parallelTasks = tasks.filter(t => 
      !criticalCategories.includes(t.category)
    );
    if (parallelTasks.length >= 3) {
      recommendations.push(
        `检测到${parallelTasks.length}个可并行任务，建议安排并行执行以缩短工期`
      );
    }
    
    return recommendations;
  }
  
  /**
   * 生成项目摘要报告
   */
  generateReport(plan: ReturnType<typeof this.generateProject>): string {
    const lines: string[] = [];
    
    lines.push('📋 项目计划概览');
    lines.push('');
    lines.push(`项目类型: ${plan.template.name}`);
    lines.push(`任务数量: ${plan.tasks.length} 个`);
    lines.push(`预计工期: ${plan.estimatedDuration} 天`);
    lines.push(`风险等级: ${plan.riskLevel.toUpperCase()}`);
    lines.push('');
    lines.push('📊 任务清单:');
    
    const categories = [...new Set(plan.tasks.map(t => t.category))];
    categories.forEach(cat => {
      lines.push(`\n【${cat}】`);
      plan.tasks
        .filter(t => t.category === cat)
        .forEach((t, i) => {
          lines.push(`  ${i + 1}. ${t.title} (${t.duration}天)`);
          lines.push(`     ${t.description}`);
        });
    });
    
    lines.push('');
    lines.push('💡 建议:');
    plan.recommendations.forEach((r, i) => {
      lines.push(`  ${i + 1}. ${r}`);
    });
    
    return lines.join('\n');
  }
}

// 导出单例
export const goalPlanner = new GoalDrivenPlanner();
