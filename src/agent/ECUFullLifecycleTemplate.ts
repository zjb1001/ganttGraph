/**
 * 完整的汽车ECU开发流程模板
 * 从需求分析到量产的全生命周期
 */

import { ProjectTemplate, TemplateTask } from './GoalDrivenPlanner';

export const ECUDevelopmentTemplate: ProjectTemplate = {
  id: 'ecu_full_lifecycle',
  name: '汽车ECU完整开发流程',
  description: '从需求分析到量产的全生命周期开发（车身控制器/制动系统/动力系统等）',
  keywords: [
    'ECU', '控制器', '车身', '制动', '动力', '整车', '电子', '嵌入式',
    'AUTOSAR', '需求', '开发', '量产', '验证'
  ],
  tasks: [
    // ========== Phase 1: 需求与概念阶段 (4-6周) ==========
    {
      title: '市场需求分析',
      duration: 5,
      description: '竞品分析、用户需求调研、功能定义',
      category: '需求阶段'
    },
    {
      title: '系统需求规范(SRS)',
      duration: 7,
      description: '编写系统需求规范文档，定义功能/性能/安全需求',
      category: '需求阶段'
    },
    {
      title: '功能安全概念阶段',
      duration: 10,
      description: 'HARA分析、功能安全概念(FSC)、ASIL等级确定',
      category: '需求阶段'
    },
    {
      title: '网络安全概念阶段',
      duration: 5,
      description: 'TARA分析、网络安全概念、威胁评估',
      category: '需求阶段'
    },
    
    // ========== Phase 2: 系统设计阶段 (6-8周) ==========
    {
      title: '系统架构设计',
      duration: 10,
      description: '系统框图、接口定义、信号列表、电源架构',
      category: '系统设计'
    },
    {
      title: '硬件需求规范(HRS)',
      duration: 5,
      description: '硬件功能需求、电气特性、环境要求',
      category: '系统设计'
    },
    {
      title: '软件需求规范(SWRS)',
      duration: 7,
      description: '软件功能需求、接口需求、时序要求',
      category: '系统设计'
    },
    {
      title: 'DFMEA分析',
      duration: 5,
      description: '设计失效模式与影响分析、改进措施',
      category: '系统设计'
    },
    
    // ========== Phase 3: 硬件开发阶段 (12-16周) ==========
    {
      title: '元器件选型',
      duration: 7,
      description: 'MCU选型、电源芯片、收发器、传感器评估',
      category: '硬件开发'
    },
    {
      title: '原理图设计',
      duration: 10,
      description: '电路原理图设计、关键电路仿真',
      category: '硬件开发'
    },
    {
      title: 'PCB布局设计',
      duration: 10,
      description: 'PCB Layout、信号完整性分析、EMC预设计',
      category: '硬件开发'
    },
    {
      title: 'PCB制板与贴片',
      duration: 14,
      description: 'PCB打样、BOM采购、SMT贴片',
      category: '硬件开发'
    },
    {
      title: '硬件单元测试',
      duration: 7,
      description: '电源测试、信号测试、EMC预测试',
      category: '硬件开发'
    },
    
    // ========== Phase 4: 基础软件开发 (8-10周) ==========
    {
      title: 'MCAL配置开发',
      duration: 14,
      description: 'PORT/DIO/ADC/PWM/CAN/LIN/GPT/WDG/FLS配置',
      category: 'MCAL开发'
    },
    {
      title: '操作系统配置',
      duration: 7,
      description: 'OS任务配置、调度策略、资源分配',
      category: 'BSW开发'
    },
    {
      title: '通信协议栈',
      duration: 10,
      description: 'CAN/LIN/Ethernet协议栈配置、网络管理',
      category: 'BSW开发'
    },
    {
      title: '存储与诊断',
      duration: 7,
      description: 'NVRAM配置、DEM/DCM诊断服务',
      category: 'BSW开发'
    },
    {
      title: 'RTE接口生成',
      duration: 5,
      description: 'ARXML配置、RTE代码生成',
      category: 'BSW开发'
    },
    
    // ========== Phase 5: 应用软件开发 (10-12周) ==========
    {
      title: '应用架构设计',
      duration: 7,
      description: 'SWC划分、接口设计、状态机设计',
      category: '应用开发'
    },
    {
      title: '设备驱动开发',
      duration: 10,
      description: '传感器驱动、执行器驱动、IO抽象层',
      category: '应用开发'
    },
    {
      title: '控制算法开发',
      duration: 14,
      description: '控制策略、算法实现、参数标定接口',
      category: '应用开发'
    },
    {
      title: '诊断与标定',
      duration: 7,
      description: 'UDS服务、DID配置、XCP标定',
      category: '应用开发'
    },
    {
      title: '功能安全实现',
      duration: 10,
      description: 'E2E保护、安全监控、冗余设计',
      category: '应用开发'
    },
    
    // ========== Phase 6: 测试验证阶段 (8-10周) ==========
    {
      title: '软件单元测试',
      duration: 10,
      description: 'CANTATA测试、覆盖率分析、静态代码分析',
      category: '测试验证'
    },
    {
      title: 'HIL仿真测试',
      duration: 14,
      description: '硬件在环测试、故障注入、边界条件测试',
      category: '测试验证'
    },
    {
      title: '系统集成测试',
      duration: 10,
      description: '功能测试、通信测试、时序测试',
      category: '测试验证'
    },
    {
      title: '实车功能验证',
      duration: 14,
      description: '实车测试、极端工况验证、用户体验评估',
      category: '测试验证'
    },
    {
      title: 'EMC与环境测试',
      duration: 10,
      description: 'EMC测试、高低温测试、振动测试',
      category: '测试验证'
    },
    
    // ========== Phase 7: 量产准备阶段 (6-8周) ==========
    {
      title: '生产文件归档',
      duration: 5,
      description: 'BOM定版、工艺文件、测试规范',
      category: '量产准备'
    },
    {
      title: '产线测试开发',
      duration: 7,
      description: 'EOL测试程序、产线工装开发',
      category: '量产准备'
    },
    {
      title: '供应商审核',
      duration: 5,
      description: 'PCB厂商审核、元器件供应商确认',
      category: '量产准备'
    },
    {
      title: 'PPAP提交',
      duration: 10,
      description: '生产件批准程序、客户审核',
      category: '量产准备'
    },
    {
      title: '小批量试产',
      duration: 14,
      description: '小批量生产、良率评估、问题改进',
      category: '量产准备'
    }
  ],
  defaultDependencies: [
    // 需求阶段内部依赖
    { from: 1, to: 0 }, { from: 2, to: 1 }, { from: 3, to: 1 },
    
    // 系统设计依赖需求
    { from: 4, to: 2 }, { from: 5, to: 4 }, { from: 6, to: 4 }, { from: 7, to: 4 },
    
    // 硬件开发依赖系统设计
    { from: 8, to: 5 }, { from: 9, to: 8 }, { from: 10, to: 9 }, 
    { from: 11, to: 10 }, { from: 12, to: 11 },
    
    // MCAL开发依赖硬件就绪
    { from: 13, to: 12 },
    
    // BSW开发依赖MCAL
    { from: 14, to: 13 }, { from: 15, to: 13 }, { from: 16, to: 13 }, { from: 17, to: 13 },
    
    // 应用开发依赖BSW
    { from: 18, to: 17 }, { from: 19, to: 18 }, { from: 20, to: 19 },
    { from: 21, to: 20 }, { from: 22, to: 20 },
    
    // 测试依赖开发完成
    { from: 23, to: 22 }, { from: 24, to: 23 }, { from: 25, to: 24 },
    { from: 26, to: 25 }, { from: 27, to: 26 },
    
    // 量产准备依赖测试通过
    { from: 28, to: 27 }, { from: 29, to: 28 }, { from: 30, to: 28 },
    { from: 31, to: 30 }, { from: 32, to: 31 }
  ]
};

// 扩展模板库
export const ExtendedTemplates = [
  ECUDevelopmentTemplate
];
