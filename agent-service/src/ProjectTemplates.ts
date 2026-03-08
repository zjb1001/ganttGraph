/**
 * 行业项目模板配置
 * 支持汽车、航空、医疗等不同行业的项目特性
 */

export interface IndustryRisk {
  type: 'safety' | 'integration' | 'resource' | 'functional' | 'compliance' | string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  mitigation: string;
  keywords: string[];
}

export interface IndustryKPI {
  name: string;
  target: string;
  unit: 'percentage' | 'time' | 'count' | 'level' | string;
}

// 行业类型
export type IndustryType = 'automotive' | 'aerospace' | 'medical' | 'consumer' | 'industrial';

// 项目模板配置
export interface ProjectTemplate {
  industry: IndustryType;
  name: string;
  description: string;
  
  // 安全等级 (如果适用)
  safetyLevel?: string;
  
  // 关键性能指标
  kpis: IndustryKPI[];
  
  // 强制评审节点
  mandatoryReviews: Array<{
    phase: string;
    gate: string;
    tasks: string[];
    description: string;
  }>;
  
  // 关键路径任务
  criticalPath: string[];
  
  // 高风险任务关键词
  highRiskKeywords: string[];
  
  // 行业特定风险
  industryRisks: IndustryRisk[];
  
  // 历史数据参考
  historicalData: {
    taskType: string;
    estimatedDays: number;
    actualDays: number;
    complexity: number;
    success: boolean;
    delayDays: number;
  }[];
}

// 汽车行业模板 (包含制动系统)
export const AutomotiveTemplate: ProjectTemplate = {
  industry: 'automotive',
  name: '汽车电子项目',
  description: '符合功能安全标准的汽车电子系统开发',
  safetyLevel: 'ASIL-D',
  
  kpis: [
    { name: '系统可用性', target: '≥ 99.99%', unit: 'percentage' },
    { name: '响应时间', target: '≤ 200ms', unit: 'time' },
    { name: '故障容错', target: 'Single fault safe', unit: 'level' }
  ],
  
  mandatoryReviews: [
    { 
      phase: '需求', 
      gate: 'HARA完成', 
      tasks: ['功能安全概念', 'HARA分析'],
      description: '危害分析和风险评估完成'
    },
    { 
      phase: '设计', 
      gate: 'DFMEA完成', 
      tasks: ['DFMEA分析', '架构设计'],
      description: '设计失效模式分析完成'
    },
    { 
      phase: '验证', 
      gate: 'HIL通过', 
      tasks: ['HIL测试'],
      description: '硬件在环测试通过'
    },
    { 
      phase: '确认', 
      gate: '实车验证', 
      tasks: ['实车测试', '功能安全验证'],
      description: '实车功能安全验证完成'
    }
  ],
  
  criticalPath: [
    '功能安全概念',
    '系统架构设计',
    '控制器开发',
    '算法开发',
    'HIL测试',
    '功能安全验证'
  ],
  
  highRiskKeywords: [
    '算法开发',
    '功能安全验证',
    'DFMEA分析',
    '极端工况测试',
    '控制器开发'
  ],
  
  industryRisks: [
    {
      type: 'functional',
      severity: 'critical',
      description: '核心算法直接影响车辆安全',
      mitigation: '增加代码审查轮次，引入形式化验证',
      keywords: ['算法开发', '控制算法']
    },
    {
      type: 'safety',
      severity: 'critical',
      description: '功能安全验证不通过将导致项目失败',
      mitigation: '提前进行预评估，引入第三方审核',
      keywords: ['功能安全验证', 'ASIL']
    },
    {
      type: 'integration',
      severity: 'high',
      description: '硬件设计变更将连锁影响软件',
      mitigation: '硬件冻结前充分验证，预留缓冲时间',
      keywords: ['硬件开发', '控制器', 'PCB']
    }
  ],
  
  historicalData: [
    { taskType: 'MCAL', estimatedDays: 7, actualDays: 8, complexity: 0.6, success: true, delayDays: 1 },
    { taskType: 'ALGO', estimatedDays: 20, actualDays: 28, complexity: 0.8, success: true, delayDays: 8 },
    { taskType: 'HW', estimatedDays: 35, actualDays: 42, complexity: 0.85, success: true, delayDays: 7 },
    { taskType: 'TEST', estimatedDays: 25, actualDays: 32, complexity: 0.75, success: true, delayDays: 7 }
  ]
};

// 航空模板
export const AerospaceTemplate: ProjectTemplate = {
  industry: 'aerospace',
  name: '航空航天项目',
  description: '符合DO-178C/DO-254标准的航电系统开发',
  safetyLevel: 'DAL-A',
  
  kpis: [
    { name: '系统可靠性', target: '≥ 99.9999%', unit: 'percentage' },
    { name: '响应时间', target: '≤ 50ms', unit: 'time' },
    { name: 'MC/DC覆盖率', target: '100%', unit: 'percentage' }
  ],
  
  mandatoryReviews: [
    { phase: '需求', gate: 'SRD评审', tasks: ['系统需求', '安全评估'], description: '系统需求文档评审' },
    { phase: '设计', gate: 'CDR评审', tasks: ['概要设计', '详细设计'], description: '关键设计评审' },
    { phase: '验证', gate: '测试完成', tasks: ['单元测试', '集成测试'], description: '所有测试用例通过' },
    { phase: '确认', gate: '适航认证', tasks: ['适航审查', '飞行测试'], description: '获得适航证书' }
  ],
  
  criticalPath: [
    '系统需求',
    '软件设计',
    '代码实现',
    '单元测试',
    '集成测试',
    '适航认证'
  ],
  
  highRiskKeywords: [
    '适航认证',
    '飞行测试',
    '安全评估',
    '冗余设计'
  ],
  
  industryRisks: [
    {
      type: 'safety',
      severity: 'critical',
      description: '适航认证失败将导致项目终止',
      mitigation: '早期引入适航工程师，分阶段审查',
      keywords: ['适航', '认证']
    }
  ],
  
  historicalData: [
    { taskType: 'REQ', estimatedDays: 30, actualDays: 45, complexity: 0.9, success: true, delayDays: 15 },
    { taskType: 'CODE', estimatedDays: 60, actualDays: 80, complexity: 0.85, success: true, delayDays: 20 }
  ]
};

// 医疗模板
export const MedicalTemplate: ProjectTemplate = {
  industry: 'medical',
  name: '医疗设备项目',
  description: '符合FDA/IEC 62304标准的医疗软件开发',
  safetyLevel: 'Class C',
  
  kpis: [
    { name: '系统安全性', target: '0 严重缺陷', unit: 'count' },
    { name: '代码覆盖率', target: '≥ 90%', unit: 'percentage' }
  ],
  
  mandatoryReviews: [
    { phase: '需求', gate: '需求基线', tasks: ['用户需求', '风险管理'], description: '需求基线建立' },
    { phase: '设计', gate: '设计冻结', tasks: ['架构设计', '详细设计'], description: '设计文档冻结' },
    { phase: '验证', gate: 'V&V完成', tasks: ['验证测试', '确认测试'], description: '验证确认完成' },
    { phase: '确认', gate: 'FDA提交', tasks: ['510k文档', '临床评估'], description: '监管提交' }
  ],
  
  criticalPath: [
    '需求分析',
    '架构设计',
    '软件开发',
    '验证测试',
    '临床评估',
    '监管提交'
  ],
  
  highRiskKeywords: [
    '临床评估',
    'FDA提交',
    '风险管理',
    '生物相容性'
  ],
  
  industryRisks: [
    {
      type: 'regulatory',
      severity: 'critical',
      description: 'FDA审核不通过将延迟上市',
      mitigation: '预提交会议，分阶段审查',
      keywords: ['FDA', '临床', '监管']
    }
  ],
  
  historicalData: [
    { taskType: 'CLINICAL', estimatedDays: 90, actualDays: 120, complexity: 0.8, success: true, delayDays: 30 },
    { taskType: 'FDA', estimatedDays: 180, actualDays: 240, complexity: 0.9, success: false, delayDays: 60 }
  ]
};

// 消费电子产品模板
export const ConsumerTemplate: ProjectTemplate = {
  industry: 'consumer',
  name: '消费电子产品',
  description: '快速迭代的消费电子产品开发',
  
  kpis: [
    { name: '上市时间', target: '≤ 6个月', unit: 'time' },
    { name: '缺陷率', target: '≤ 1%', unit: 'percentage' }
  ],
  
  mandatoryReviews: [
    { phase: '需求', gate: 'PRD评审', tasks: ['产品需求'], description: '产品需求文档评审' },
    { phase: '设计', gate: '原型确认', tasks: ['原型设计', '用户体验'], description: '原型确认' },
    { phase: '验证', gate: '试产通过', tasks: ['功能测试', '可靠性测试'], description: '小批量试产' },
    { phase: '确认', gate: '量产批准', tasks: ['量产测试', '供应链准备'], description: '量产批准' }
  ],
  
  criticalPath: [
    '产品定义',
    '原型开发',
    '工程验证',
    '设计验证',
    '生产验证',
    '量产'
  ],
  
  highRiskKeywords: [
    '供应链',
    '量产',
    '认证测试',
    '用户体验'
  ],
  
  industryRisks: [
    {
      type: 'schedule',
      severity: 'high',
      description: '市场窗口期错过将大幅影响销量',
      mitigation: '关键路径并行化，快速迭代',
      keywords: ['上市', '窗口期']
    }
  ],
  
  historicalData: [
    { taskType: 'PROTOTYPE', estimatedDays: 30, actualDays: 25, complexity: 0.5, success: true, delayDays: -5 },
    { taskType: 'EVT', estimatedDays: 45, actualDays: 50, complexity: 0.6, success: true, delayDays: 5 }
  ]
};

// 工业控制模板
export const IndustrialTemplate: ProjectTemplate = {
  industry: 'industrial',
  name: '工业控制项目',
  description: '符合IEC 61508标准的工业控制系统',
  safetyLevel: 'SIL-3',
  
  kpis: [
    { name: '系统可用性', target: '≥ 99.9%', unit: 'percentage' },
    { name: 'MTBF', target: '≥ 100,000h', unit: 'time' }
  ],
  
  mandatoryReviews: [
    { phase: '需求', gate: 'SRS评审', tasks: ['安全需求', '功能需求'], description: '安全需求规格评审' },
    { phase: '设计', gate: '安全设计评审', tasks: ['安全架构', '冗余设计'], description: '安全设计评审' },
    { phase: '验证', gate: '功能安全测试', tasks: ['安全测试', 'EMC测试'], description: '功能安全验证' },
    { phase: '确认', gate: '现场验收', tasks: ['FAT', 'SAT'], description: '现场验收测试' }
  ],
  
  criticalPath: [
    '需求分析',
    '安全架构',
    '硬件设计',
    '软件实现',
    '安全验证',
    '现场验收'
  ],
  
  highRiskKeywords: [
    '安全功能',
    '冗余设计',
    'EMC测试',
    '现场验收'
  ],
  
  industryRisks: [
    {
      type: 'safety',
      severity: 'critical',
      description: '安全功能失效可能导致严重事故',
      mitigation: '冗余设计，故障注入测试',
      keywords: ['安全功能', '失效']
    }
  ],
  
  historicalData: [
    { taskType: 'SAFETY', estimatedDays: 40, actualDays: 55, complexity: 0.85, success: true, delayDays: 15 },
    { taskType: 'EMC', estimatedDays: 20, actualDays: 30, complexity: 0.7, success: true, delayDays: 10 }
  ]
};

// 模板注册表
export const ProjectTemplates: Record<IndustryType, ProjectTemplate> = {
  automotive: AutomotiveTemplate,
  aerospace: AerospaceTemplate,
  medical: MedicalTemplate,
  consumer: ConsumerTemplate,
  industrial: IndustrialTemplate
};

// 获取模板函数
export function getProjectTemplate(industry: IndustryType): ProjectTemplate {
  return ProjectTemplates[industry] || ConsumerTemplate;
}

// 检测项目行业类型（基于任务名称）
export function detectIndustryType(tasks: Array<{ title: string }>): IndustryType {
  const titles = tasks.map(t => t.title.toLowerCase()).join(' ');
  
  // 汽车行业关键词
  if (titles.includes('asil') || titles.includes('hara') || titles.includes('dfmea') || 
      titles.includes('esc') || titles.includes('abs') || titles.includes('制动') ||
      titles.includes('mcal') || titles.includes('车载')) {
    return 'automotive';
  }
  
  // 航空关键词
  if (titles.includes('适航') || titles.includes('do-178') || titles.includes('飞行') ||
      titles.includes('航电') || titles.includes('dal')) {
    return 'aerospace';
  }
  
  // 医疗关键词
  if (titles.includes('fda') || titles.includes('临床') || titles.includes('医疗') ||
      titles.includes('生物相容') || titles.includes('iec 62304')) {
    return 'medical';
  }
  
  // 工业关键词
  if (titles.includes('sil') || titles.includes('plc') || titles.includes('dcs') ||
      titles.includes('iec 61508') || titles.includes('工业控制')) {
    return 'industrial';
  }
  
  return 'consumer';
}
