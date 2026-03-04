# AI增强功能API文档

## 概述

增强版AI服务提供以下核心能力：

1. **智能任务分解** - 将项目目标自动拆解为可执行的任务计划
2. **风险预警分析** - 自动检测项目风险并给出预警
3. **进度预测** - 基于当前进度预测项目完成时间
4. **资源冲突检测** - 检测资源分配冲突

## API端点

### 1. 智能任务分解

**POST** `/api/v2/decompose`

将自然语言描述的项目目标分解为结构化任务。

**请求体：**
```json
{
  "goal": "开发一个电商网站",
  "start_date": "2025-03-01",
  "deadline": "2025-06-01",
  "team_size": 5,
  "complexity": "medium"
}
```

**响应：**
```json
{
  "success": true,
  "message": "成功分解项目为5个阶段，23个任务",
  "phases": [
    {
      "name": "需求分析",
      "description": "收集和分析项目需求",
      "order": 1
    }
  ],
  "tasks": [
    {
      "title": "用户调研",
      "phase": "需求分析",
      "duration_days": 5,
      "priority": "High",
      "start_date": "2025-03-01",
      "end_date": "2025-03-05"
    }
  ],
  "milestones": [
    {
      "title": "需求确认",
      "date_offset_days": 14
    }
  ],
  "estimated_duration_days": 90,
  "confidence": 0.85
}
```

### 2. 风险分析

**POST** `/api/v2/analyze-risks`

分析项目中的潜在风险。

**请求体：**
```json
{
  "tasks": [
    {
      "id": "task-1",
      "title": "API开发",
      "startDate": "2025-03-01",
      "dueDate": "2025-03-10",
      "progress": 30,
      "status": "InProgress",
      "priority": "High",
      "dependencies": []
    }
  ],
  "current_date": "2025-03-08",
  "check_dependencies": true,
  "check_resources": true,
  "check_schedule": true
}
```

**响应：**
```json
{
  "success": true,
  "message": "发现3个风险项",
  "risks": [
    {
      "task_id": "task-1",
      "task_title": "API开发",
      "risk_type": "进度延期",
      "level": "medium",
      "description": "任务进度落后，当前30%但已过去80%时间",
      "suggestion": "增加资源投入或调整范围",
      "impact_days": 2
    }
  ],
  "overall_risk_level": "medium",
  "risk_summary": {
    "critical": 0,
    "high": 1,
    "medium": 2,
    "low": 0
  },
  "recommendations": [
    "优先完成关键路径上的任务",
    "评估是否需要增加人手"
  ]
}
```

### 3. 进度预测

**POST** `/api/v2/predict-schedule`

预测项目完成时间。

**请求体：**
```json
{
  "tasks": [...],
  "current_date": "2025-03-08"
}
```

**响应：**
```json
{
  "success": true,
  "message": "进度预测完成",
  "prediction": {
    "predicted_end_date": "2025-03-25",
    "confidence": 0.75,
    "delay_probability": 0.35,
    "estimated_delay_days": 5,
    "critical_factors": ["存在延期任务"]
  },
  "critical_path": ["task-1", "task-3", "task-5"],
  "bottlenecks": [
    {
      "task_id": "task-3",
      "task_title": "数据库设计",
      "type": "依赖瓶颈",
      "impact": "阻塞4个后续任务"
    }
  ],
  "suggestions": [
    "⚠️ 延期风险中等，建议加快关键路径任务",
    "🎯 发现1个瓶颈任务，优先解决: 数据库设计"
  ]
}
```

### 4. 资源分析

**POST** `/api/v2/analyze-resources`

分析资源分配和冲突。

**请求体：**
```json
{
  "tasks": [
    {
      "id": "task-1",
      "title": "前端开发",
      "assigneeIds": ["张三"],
      "startDate": "2025-03-01",
      "dueDate": "2025-03-10"
    }
  ]
}
```

**响应：**
```json
{
  "success": true,
  "message": "检测到2个资源冲突",
  "conflicts": [
    {
      "type": "人员冲突",
      "resource": "张三",
      "task1": "前端开发",
      "task2": "API开发",
      "overlap_days": 5,
      "severity": "high"
    }
  ],
  "resource_utilization": {
    "张三": 85.0,
    "李四": 45.0
  },
  "suggestions": [
    "🔴 张三工作负载过高(>80%)，建议分担任务"
  ]
}
```

### 5. 统一对话接口

**POST** `/api/v2/chat`

自然语言接口，自动识别意图并调用相应功能。

**请求体：**
```json
{
  "message": "分析一下项目风险",
  "context": {
    "tasks": [...],
    "currentProject": "电商网站"
  }
}
```

**响应：**
```json
{
  "success": true,
  "message": "风险分析完成",
  "intent": "risk_analysis",
  "actions": [],
  "analysis": {
    "overall_risk": "medium",
    "risk_count": 3,
    "recommendations": [...]
  }
}
```

## 意图识别关键词

系统通过关键词自动识别用户意图：

| 意图 | 关键词 | 示例 |
|------|--------|------|
| 任务分解 | 分解、拆解、规划、plan | "帮我分解这个项目" |
| 风险分析 | 风险、预警、分析风险 | "分析下项目风险" |
| 进度预测 | 预测、什么时候完成 | "预测下完成时间" |
| 资源优化 | 资源、冲突、负载 | "检查资源冲突" |

## 启动服务

```bash
cd agent-service
chmod +x start_enhanced.sh
./start_enhanced.sh
```

服务将在 `http://localhost:8000` 启动。

## 环境配置

创建 `.env` 文件：

```env
LLM_API_KEY=your_api_key
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4
# 或
# LLM_PROVIDER=zhipu
# LLM_BASE_URL=https://open.bigmodel.cn/api/paas/v4
# LLM_MODEL=glm-4-flash
```

## 前端集成示例

```typescript
// 智能分解任务
async function decomposeProject(goal: string) {
  const response = await fetch('http://localhost:8000/api/v2/decompose', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      goal,
      start_date: new Date().toISOString().split('T')[0],
      team_size: 3,
      complexity: 'medium'
    })
  });
  return await response.json();
}

// 分析风险
async function analyzeRisks(tasks: Task[]) {
  const response = await fetch('http://localhost:8000/api/v2/analyze-risks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tasks })
  });
  return await response.json();
}
```

## 算法说明

### 关键路径计算 (CPM)

使用拓扑排序和前向/后向遍历计算：
1. 计算每个任务的最早开始/结束时间
2. 计算每个任务的最晚开始/结束时间
3. 总浮动时间为0的任务构成关键路径

### 风险评分

综合考虑以下因素：
- 延期任务比例
- 关键路径上未完成任务
- 资源过载情况
- 进度落后程度

### 进度预测

基于以下模型：
- 历史完成速度（已完成任务的平均速率）
- 剩余工作量估算
- 风险调整系数
- 团队规模因素
