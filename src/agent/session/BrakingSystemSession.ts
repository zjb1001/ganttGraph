/**
 * Agent 会话过程记录 - 制动系统项目
 * 展示 Agent 如何处理用户请求
 */

export interface AgentSessionLog {
  timestamp: string;
  turn: number;
  userInput: string;
  intentRecognition: {
    detectedKeywords: string[];
    matchedTool: string;
    confidence: 'high' | 'medium' | 'low';
  };
  toolExecution: {
    toolName: string;
    params: any;
    executionTime: number;
    result: any;
  };
  agentResponse: string;
  contextUpdates: string[];
}

// 制动系统项目完整会话记录
export const brakingSystemSession: AgentSessionLog[] = [
  {
    timestamp: '2026-03-05T21:58:00Z',
    turn: 1,
    userInput: '创建任务PORT模块配置，持续3天',
    intentRecognition: {
      detectedKeywords: ['创建', '任务', 'PORT', '3天'],
      matchedTool: 'create_task',
      confidence: 'high'
    },
    toolExecution: {
      toolName: 'create_task',
      params: {
        title: 'PORT模块配置',
        duration: 3,
        startDate: '2026-03-05'
      },
      executionTime: 5,
      result: {
        id: 'task_1772718651493',
        title: 'PORT模块配置',
        status: 'NotStarted'
      }
    },
    agentResponse: 'create_task 完成',
    contextUpdates: ['tasks.length: 0 → 1', 'Added task: PORT模块配置']
  },
  {
    timestamp: '2026-03-05T21:58:01Z',
    turn: 2,
    userInput: '创建任务DIO数字IO驱动，持续2天',
    intentRecognition: {
      detectedKeywords: ['创建', '任务', 'DIO', '2天'],
      matchedTool: 'create_task',
      confidence: 'high'
    },
    toolExecution: {
      toolName: 'create_task',
      params: {
        title: 'DIO数字IO驱动',
        duration: 2,
        startDate: '2026-03-05'
      },
      executionTime: 3,
      result: {
        id: 'task_1772718651494',
        title: 'DIO数字IO驱动',
        status: 'NotStarted'
      }
    },
    agentResponse: 'create_task 完成',
    contextUpdates: ['tasks.length: 1 → 2', 'Added task: DIO数字IO驱动']
  },
  {
    timestamp: '2026-03-05T21:58:02Z',
    turn: 3,
    userInput: '创建任务ADC模数转换，持续5天',
    intentRecognition: {
      detectedKeywords: ['创建', '任务', 'ADC', '5天'],
      matchedTool: 'create_task',
      confidence: 'high'
    },
    toolExecution: {
      toolName: 'create_task',
      params: {
        title: 'ADC模数转换',
        duration: 5,
        startDate: '2026-03-05'
      },
      executionTime: 4,
      result: {
        id: 'task_1772718651495',
        title: 'ADC模数转换',
        status: 'NotStarted'
      }
    },
    agentResponse: 'create_task 完成',
    contextUpdates: ['tasks.length: 2 → 3', 'Added task: ADC模数转换']
  },
  // ... 继续创建其他14个任务
  {
    timestamp: '2026-03-05T21:58:20Z',
    turn: 18,
    userInput: '设置依赖关系: DIO依赖PORT, ADC依赖PORT',
    intentRecognition: {
      detectedKeywords: ['依赖', '关系'],
      matchedTool: 'analyze_dependencies',
      confidence: 'medium'
    },
    toolExecution: {
      toolName: 'manual_dependency_setup',
      params: {
        dependencies: [
          { task: 1, deps: [0] },
          { task: 2, deps: [0] }
        ]
      },
      executionTime: 10,
      result: { success: true, depsCount: 2 }
    },
    agentResponse: '依赖关系设置完成',
    contextUpdates: [
      'task[1].dependencies = [task_1772718651493]',
      'task[2].dependencies = [task_1772718651493]'
    ]
  },
  {
    timestamp: '2026-03-05T21:58:30Z',
    turn: 19,
    userInput: '自动排期从2026-04-01开始',
    intentRecognition: {
      detectedKeywords: ['自动', '排期', '2026-04-01'],
      matchedTool: 'auto_schedule',
      confidence: 'high'
    },
    toolExecution: {
      toolName: 'auto_schedule',
      params: {
        startDate: '2026-04-01'
      },
      executionTime: 50,
      result: {
        totalDuration: 15,
        criticalPath: ['task_1772718651509'],
        scheduledTasks: 17
      }
    },
    agentResponse: 'auto_schedule 完成',
    contextUpdates: [
      'All tasks scheduled',
      'Critical path identified: 1 task',
      'Project duration: 15 days'
    ]
  },
  {
    timestamp: '2026-03-05T21:58:35Z',
    turn: 20,
    userInput: '保存项目',
    intentRecognition: {
      detectedKeywords: ['保存', '项目'],
      matchedTool: 'save_project',
      confidence: 'high'
    },
    toolExecution: {
      toolName: 'save_project',
      params: {},
      executionTime: 20,
      result: {
        projectId: 'braking_system_2026',
        savedAt: '2026-03-05T21:58:35Z',
        tasksCount: 17
      }
    },
    agentResponse: '项目已保存',
    contextUpdates: [
      'Project saved to localStorage',
      'History recorded: 20 turns'
    ]
  },
  {
    timestamp: '2026-03-05T21:58:40Z',
    turn: 21,
    userInput: '全面风险评估',
    intentRecognition: {
      detectedKeywords: ['全面', '风险', '评估'],
      matchedTool: 'assess_risks',
      confidence: 'high'
    },
    toolExecution: {
      toolName: 'assess_risks',
      params: {},
      executionTime: 100,
      result: {
        overallRisk: 'critical',
        riskScore: 100,
        delayRisks: [
          { taskName: 'PORT模块配置', probability: 0.9 },
          { taskName: 'DIO数字IO驱动', probability: 0.6 },
          { taskName: 'ADC模数转换', probability: 0.6 }
        ],
        mitigation: [
          { description: '为「PORT模块配置」增加缓冲时间或并行处理' }
        ]
      }
    },
    agentResponse: '风险评估完成',
    contextUpdates: [
      'Risk level: CRITICAL',
      '7 tasks identified at risk',
      '1 mitigation action generated'
    ]
  },
  {
    timestamp: '2026-03-05T21:58:45Z',
    turn: 22,
    userInput: '获取智能建议',
    intentRecognition: {
      detectedKeywords: ['获取', '智能', '建议'],
      matchedTool: 'get_suggestions',
      confidence: 'high'
    },
    toolExecution: {
      toolName: 'get_suggestions',
      params: {},
      executionTime: 80,
      result: {
        suggestions: [
          {
            category: 'dependency',
            priority: 'medium',
            title: '简化依赖链',
            description: '检测到过长的依赖链，可能存在优化空间'
          }
        ]
      }
    },
    agentResponse: '智能建议已生成',
    contextUpdates: [
      '1 optimization suggestion generated',
      'Category: dependency optimization'
    ]
  }
];

// 会话统计
export const sessionStats = {
  totalTurns: 22,
  userInputs: 17,      // 创建任务 × 17
  systemCommands: 5,   // 依赖设置、排期、保存、风险评估、建议
  toolsUsed: [
    { name: 'create_task', count: 17 },
    { name: 'auto_schedule', count: 1 },
    { name: 'save_project', count: 1 },
    { name: 'assess_risks', count: 1 },
    { name: 'get_suggestions', count: 1 }
  ],
  avgResponseTime: 25, // ms
  contextUpdates: 45
};

// 意图识别流程示例
export const intentRecognitionFlow = `
用户输入: "创建任务PORT模块配置，持续3天"

【Step 1: 关键词检测】
  - 匹配到 "创建" → 触发创建意图
  - 匹配到 "任务" → 确认操作对象
  - 匹配到 "PORT模块配置" → 提取任务名称
  - 匹配到 "3天" → 提取持续时间

【Step 2: 工具选择】
  - 候选工具: create_task, update_task, read_tasks
  - 置信度计算: create_task = 0.95 (high)
  - 选择: create_task

【Step 3: 参数提取】
  - title: "PORT模块配置"
  - duration: 3
  - startDate: "2026-03-05" (默认今天)
  
【Step 4: 执行】
  - 调用 TaskPlanner.createTask()
  - 生成唯一ID: task_1772718651493
  - 更新 context.tasks
  
【Step 5: 响应】
  - 返回: "create_task 完成"
  - 记录历史
`;

// Agent 决策树
export const agentDecisionTree = `
GanttAgent.process(userMessage)
│
├─ 1. 多轮对话检查
│   └─ 是否有 pending question?
│      ├─ 是 → 处理多轮响应
│      └─ 否 → 继续
│
├─ 2. 记录用户输入
│   └─ ConversationMemory.addTurn('user', message)
│
├─ 3. 意图识别 (understandIntent)
│   └─ 关键词匹配
│      ├─ "创建/新建/添加" → create_task
│      ├─ "更新/修改" → update_task
│      ├─ "依赖/关系" → analyze_dependencies
│      ├─ "排期/调度" → auto_schedule
│      ├─ "风险" → check_risks / assess_risks
│      ├─ "保存" → save_project
│      ├─ "建议" → get_suggestions
│      └─ 默认 → read_tasks
│
├─ 4. 工具执行
│   └─ selectedTool.execute(params, context)
│      ├─ 成功 → 返回结果
│      └─ 失败 → 抛出错误
│
├─ 5. 记录 Agent 响应
│   └─ ConversationMemory.addTurn('agent', response)
│
└─ 6. 返回 Action
    └─ { success, message, data }
`;

// 输出完整会话记录
export function printSessionLog() {
  console.log('='.repeat(80));
  console.log('🤖 AGENT 会话过程记录 - 制动系统项目');
  console.log('='.repeat(80));
  
  brakingSystemSession.forEach(log => {
    console.log(`\n【Turn ${log.turn}】${log.timestamp}`);
    console.log(`用户: "${log.userInput}"`);
    console.log(`意图: ${log.intentRecognition.matchedTool} (置信度: ${log.intentRecognition.confidence})`);
    console.log(`关键词: [${log.intentRecognition.detectedKeywords.join(', ')}]`);
    console.log(`执行: ${log.toolExecution.toolName} (${log.toolExecution.executionTime}ms)`);
    console.log(`Agent: "${log.agentResponse}"`);
    console.log(`更新: ${log.contextUpdates.join(', ')}`);
  });
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 会话统计');
  console.log('='.repeat(80));
  console.log(`总轮数: ${sessionStats.totalTurns}`);
  console.log(`用户输入: ${sessionStats.userInputs}`);
  console.log(`系统命令: ${sessionStats.systemCommands}`);
  console.log(`平均响应: ${sessionStats.avgResponseTime}ms`);
  console.log('\n工具使用统计:');
  sessionStats.toolsUsed.forEach(tool => {
    console.log(`  - ${tool.name}: ${tool.count}次`);
  });
  
  console.log('\n' + '='.repeat(80));
  console.log(intentRecognitionFlow);
  console.log('\n' + '='.repeat(80));
  console.log(agentDecisionTree);
  console.log('='.repeat(80));
}

// 如果直接运行此文件，打印会话记录
if (require.main === module) {
  printSessionLog();
}
