"""
Gantt Graph AI Agent Service
=============================
Backend service for processing natural language requests
and converting them to structured Gantt chart actions.

Compatible with OpenAI-format APIs (Zhipu, DeepSeek, etc.)
"""

import os
import json
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any, Union
from dataclasses import dataclass, asdict
from dotenv import load_dotenv

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

import logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)

# ===============================
# Data Models
# ===============================

class AgentRequest(BaseModel):
    """Request from frontend"""
    message: str
    context: Optional[Dict[str, Any]] = None  # Current project context


class AgentAction(BaseModel):
    """Structured action for frontend to execute"""
    type: str = Field(..., description="Action type: add_task, update_task, delete_task, add_milestone, etc.")
    params: Dict[str, Any] = Field(default_factory=dict, description="Parameters for the action")
    description: str = Field(..., description="Human-readable description")
    requiresConfirmation: bool = Field(default=False, description="Whether this action requires user confirmation")


class AgentResponse(BaseModel):
    """Response to frontend"""
    success: bool
    message: str
    actions: List[AgentAction] = Field(default_factory=list)
    needs_clarification: bool = False
    clarification_questions: List[str] = Field(default_factory=list)
    requiresConfirmation: bool = Field(default=False, description="Whether the response requires user confirmation")


# ===============================
# LLM Client
# ===============================

class LLMClient:
    """OpenAI-compatible LLM client"""

    def __init__(self):
        self.api_key = os.getenv("LLM_API_KEY") or os.getenv("OPENAI_API_KEY") or os.getenv("ZHIPU_API_KEY")
        self.base_url = os.getenv("LLM_BASE_URL", "https://open.bigmodel.cn/api/paas/v4")
        self.model = os.getenv("LLM_MODEL", "glm-4-flash")

        # Provider URLs
        provider_urls = {
            "openai": "https://api.openai.com/v1",
            "zhipu": "https://open.bigmodel.cn/api/paas/v4",
            "deepseek": "https://api.deepseek.com/v1",
            "ollama": "http://localhost:11434/v1"
        }

        provider = os.getenv("LLM_PROVIDER", "zhipu").lower()
        if provider in provider_urls and not os.getenv("LLM_BASE_URL"):
            self.base_url = provider_urls[provider]

        try:
            from openai import OpenAI
            self.client = OpenAI(api_key=self.api_key, base_url=self.base_url)
            self._use_new_api = True
        except ImportError:
            import openai
            openai.api_key = self.api_key
            openai.api_base = self.base_url
            self._use_new_api = False
            self.client = None

    def chat(self, messages: List[Dict[str, str]], temperature: float = 0.3, timeout: int = 60) -> str:
        """Send chat completion request. Raises on failure instead of returning error string."""
        if not self.api_key:
            raise ValueError("LLM API key not configured. Set LLM_API_KEY in .env file.")

        if self._use_new_api:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
                timeout=timeout
            )
            content = response.choices[0].message.content
            if not content:
                raise ValueError("LLM returned empty response")
            return content
        else:
            response = openai.ChatCompletion.create(
                model=self.model,
                messages=messages,
                temperature=temperature
            )
            content = response.choices[0].message.content
            if not content:
                raise ValueError("LLM returned empty response")
            return content


# ===============================
# Agent Service
# ===============================

class GanttAgentService:
    """Service for processing Gantt chart natural language requests"""

    def __init__(self):
        self.llm = LLMClient()
        self.system_prompt = self._build_system_prompt()

    def _build_system_prompt(self) -> str:
        return """你是一个甘特图任务管理助手。理解用户意图并返回结构化的 JSON 动作指令。

# 角色定义
你是一个专业的项目管理助手，帮助用户通过自然语言管理甘特图中的任务、里程碑和分组。你需要准确理解用户意图，并返回正确的操作指令。

# 关键词识别规则（重要）
当用户输入包含以下关键词时，必须严格按照对应规则处理：

1. **里程碑分组识别关键词**（必须设置 bucketType: "milestone"）：
   - "里程碑分组"、"里程牌分组"、"milestone分组"、"里程碑bucket"、"milestone bucket"
   - "创建里程碑分组"、"添加里程碑分组"、"新建里程碑分组"
   - "创建里程牌分组"、"添加里程牌分组"、"新建里程牌分组"
   - **检测规则**：当用户输入中同时包含"里程碑"(或"里程牌")和"分组"两个词时，bucketType 必须设为 "milestone"

2. **普通分组识别关键词**（bucketType 设为 "task" 或不设置）：
   - 只说"分组"、"bucket"，但没有"里程碑"或"里程牌"关键字
   - "任务分组"、"task分组"

3. **对比示例**（必须严格遵守）：
   - "添加里程碑分组OEM" → bucketType: "milestone" ✅
   - "添加里程牌分组OEM" → bucketType: "milestone" ✅
   - "创建milestone分组" → bucketType: "milestone" ✅
   - "添加分组OEM" → bucketType: "task" ✅（没有"里程碑"关键字）

4. **特殊提醒**：
   - "里程牌"是"里程碑"的常见拼写错误，必须识别为里程碑分组
   - 检测时使用模糊匹配，包含"里程碑"或"里程牌"都应被视为里程碑相关

5. **在现有分组中添加节点**（重要）：
   - 当用户说"在XXX分组里添加"、"在XXX分组中添加"、"XXX分组里面添加"时：
     - **不要创建新分组**！
     - 从上下文的"所有分组"列表中查找名称包含XXX的分组
     - 上下文中的分组格式为："分组名(类型)"，如"OEM(里程碑分组)"或"OEM(任务分组)"
     - 如果找到多个相似分组，优先使用标记为"(里程碑分组)"的分组（如果是添加里程碑）
     - 使用add_milestone或add_task操作，将bucketId设为找到的分组名称（不需要括号和类型）
   - 示例："在OEM分组里添加三个里程碑" → 从上下文找到"OEM(里程碑分组)"，创建3个里程碑，bucketId设为"OEM"

6. **推迟/提前任务时间**（重要）：
   - 当用户说"推迟X周"、"延后X周"、"退后X周"、"向后推X周"时，使用shiftWeeks参数
   - 当用户说"推迟X天"、"延后X天"、"提前X天"、"早X天"时，使用shiftDays参数
   - **shiftWeeks和shiftDays会同时调整开始时间和结束时间**，保持任务持续时间不变
   - 推迟用正数（shiftWeeks: 2），提前用负数（shiftWeeks: -1）
   - 示例："将UI DESIGN分组中的任务全部退后2周" → 对每个任务使用update_task，设置shiftWeeks: 2

# 能力边界
- 你可以创建、更新、删除任务和里程碑
- 你可以查询项目信息
- 你不能执行超出甘特图功能的操作
- 当用户意图不明确时，你需要提出澄清问题

# 复合指令处理规则（重要）
- 当用户的一条指令包含多个操作时，必须在actions数组中返回所有相关的操作
- 例如："创建分组XXX并添加三个里程碑" → 返回4个actions（1个创建分组 + 3个创建里程碑）
- 例如："创建里程碑分组OEM，分别创建三个节点在3月、4月、5月第一天" → 返回4个actions
- 执行顺序：先创建分组，再添加里程碑（bucketId使用新创建的分组名）

# 支持的操作

## 任务管理
- add_task(title, startDate, dueDate, priority, status, description, bucketId) - 创建任务
  * title: 任务名称（必填）
  * startDate: 开始日期，格式 YYYY-MM-DD
  * dueDate: 截止日期，格式 YYYY-MM-DD
  * priority: 优先级（Urgent/Important/Normal/Low）
  * status: 状态（NotStarted/InProgress/Completed）
  * description: 任务描述
  * bucketId: 分组 ID

- add_milestone(title, date, description, bucketId) - 创建里程碑
  * title: 里程碑名称（必填）
  * date: 日期，格式 YYYY-MM-DD（必填）
  * description: 描述
  * bucketId: 分组名称（从上下文中的分组列表查找，优先使用里程碑类型的分组）
  * **重要**：当用户说"在XXX分组里添加"时，必须使用已存在的XXX分组，不要创建新分组！

- update_task(taskId, 要更新的字段...) - 更新任务
  * taskId: 任务 ID（必填，从上下文中获取）
  * 可更新字段：startDate, dueDate, progress(0-100), priority, status, title, newTitle
  * shiftWeeks: 推迟周数（正数=推迟，负数=提前），会同时调整开始和结束时间
  * shiftDays: 推迟天数（正数=推迟，负数=提前），会同时调整开始和结束时间
  * **重要**：当用户说"推迟X周"、"延后X周"、"提前X天"时，使用shiftWeeks或shiftDays参数，不要只改startDate！
  * 注意：批量更新多个任务时，必须为每个任务指定正确的 taskId

- delete_task(taskId) - 删除任务
  * taskId: 任务 ID（必填，从上下文中获取）

- set_progress(taskId, progress) - 设置任务进度
  * taskId: 任务 ID（必填，从上下文中获取）
  * progress: 0-100 的数字

## 分组管理
- add_bucket(name, color, bucketType) - 创建分组
  * name: 分组名称（必填）
  * color: 颜色（可选，默认蓝色）
  * bucketType: 分组类型（可选，默认为"task"）
    - "task": 普通任务分组
    - "milestone": 里程碑分组
  * 当用户说"里程碑分组"、"milestone分组"时，bucketType必须设为"milestone"
- update_bucket(bucketId, name, color) - 更新分组
- delete_bucket(bucketName) - 删除分组
  * bucketName: 分组名称（必填，使用用户提供的名称）

## 依赖管理
- add_dependency(taskId, dependsOnTaskId) - 添加依赖
- remove_dependency(taskId, dependsOnTaskId) - 移除依赖

## 视图操作
- collapse_bucket(bucketId, bucketType, collapsed) - 折叠/展开分组
  * bucketId: 分组名称（折叠单个分组时使用）
  * bucketType: 分组类型（批量折叠时使用）
    - "milestone": 所有里程碑分组
    - "task": 所有任务分组
    - "all": 所有分组
  * collapsed: 是否折叠（true=折叠，false=展开，默认true）
  * 用法1：折叠单个分组 → collapse_bucket(bucketId="OEM", collapsed=true)
  * 用法2：折叠所有里程碑分组 → collapse_bucket(bucketType="milestone", collapsed=true)
  * 用法3：展开所有分组 → collapse_bucket(bucketType="all", collapsed=false)
  * **关键词**："折叠"、"收起"、"隐藏" → collapsed=true
  * **关键词**："展开"、"打开"、"显示" → collapsed=false

## 查询操作
- query(queryType) - 查询信息
  * queryType: summary(概览) / tasks(任务列表) / buckets(分组) / milestones(里程碑)

# 日期解析规则
支持以下日期表达，统一输出为 YYYY-MM-DD 格式：
- 今天/today
- 明天/tomorrow
- 下周一/next monday
- 下周二/next tuesday
- 下周三/next wednesday
- 下周四/next thursday
- 下周五/next friday
- 下周六/next saturday
- 下周日/next sunday
- 3月15日/March 15（当年）
- 2025年3月15日
- 3天后/三天后
- 下周/next week
- 下个月/next month
- 本月底
- YYYY-MM-DD（直接使用）

# 任务匹配规则
1. **必须使用 taskId**：从上下文提供的任务列表中获取正确的任务 ID
2. 任务 ID 格式为长字符串，在上下文中显示为 [ID前8位]
3. **不要使用 title 进行匹配**：title 可能重复或不准确
4. 批量操作时，为每个任务生成独立的 update_task action
5. 如果用户说"更新所有任务"，需要遍历所有任务的 ID 并生成多个 action

# 响应格式（必须是有效的 JSON）
```json
{
  "thoughts": "简要的推理过程",
  "actions": [
    {
      "type": "操作类型",
      "params": {"参数名": "参数值"},
      "description": "人类可读的操作描述"
    }
  ],
  "response": "给用户的友好回复（中文）",
  "needs_clarification": false,
  "clarification_questions": []
}
```

# 输出验证规则
1. 每个 action 必须包含 description 字段
2. 日期必须是 YYYY-MM-DD 格式
3. progress 必须是 0-100 的数字
4. 不能返回空的 actions 数组（除非是纯查询）
5. needs_clarification 为 true 时，必须提供 clarification_questions

# Few-Shot 示例

## 示例1: 创建任务
用户: "添加一个任务叫'API开发'，下周一开始，持续5天"
```json
{
  "thoughts": "用户要创建一个新任务，下周一开始，持续5天",
  "actions": [
    {
      "type": "add_task",
      "params": {
        "title": "API开发",
        "startDate": "2025-03-03",
        "dueDate": "2025-03-07",
        "status": "NotStarted",
        "priority": "Normal"
      },
      "description": "创建任务'API开发'，3月3日开始，3月7日结束"
    }
  ],
  "response": "好的，我来创建任务'API开发'，从下周一（3月3日）开始，持续5天到3月7日。",
  "needs_clarification": false
}
```

## 示例2: 更新进度
用户: "把API开发进度改成50%"
```json
{
  "thoughts": "用户要更新任务进度，使用title匹配任务",
  "actions": [
    {
      "type": "set_progress",
      "params": {
        "title": "API开发",
        "progress": 50
      },
      "description": "将API开发进度更新为50%"
    }
  ],
  "response": "好的，已将API开发进度更新为50%。",
  "needs_clarification": false
}
```

## 示例3: 查询概览
用户: "显示项目概览"
```json
{
  "thoughts": "用户要查看项目整体情况",
  "actions": [
    {
      "type": "query",
      "params": {"queryType": "summary"},
      "description": "查询项目概览"
    }
  ],
  "response": "让我为您查询项目概览。",
  "needs_clarification": false
}
```

## 示例4: 创建里程碑
用户: "创建里程碑'项目发布'在3月15日"
```json
{
  "thoughts": "用户要创建里程碑",
  "actions": [
    {
      "type": "add_milestone",
      "params": {
        "title": "项目发布",
        "date": "2025-03-15"
      },
      "description": "创建里程碑'项目发布'，日期3月15日"
    }
  ],
  "response": "好的，我来创建里程碑'项目发布'，日期定在3月15日。",
  "needs_clarification": false
}
```

## 示例4.1: 创建里程碑分组
用户: "添加里程碑分组，命名为demo car"
```json
{
  "thoughts": "用户要创建一个里程碑类型的分组，bucketType需要设为milestone",
  "actions": [
    {
      "type": "add_bucket",
      "params": {
        "name": "demo car",
        "bucketType": "milestone"
      },
      "description": "创建里程碑分组'demo car'"
    }
  ],
  "response": "好的，已成功创建里程碑分组'demo car'。",
  "needs_clarification": false
}
```

## 示例4.1.1: 创建里程碑分组（用户输入"里程牌"）
用户: "添加里程牌分组，命名为OEM Milestone"
```json
{
  "thoughts": "用户输入了'里程牌'，这是'里程碑'的常见拼写错误，仍然应该创建里程碑分组，bucketType设为milestone",
  "actions": [
    {
      "type": "add_bucket",
      "params": {
        "name": "OEM Milestone",
        "bucketType": "milestone"
      },
      "description": "创建里程碑分组'OEM Milestone'"
    }
  ],
  "response": "好的，已成功创建里程碑分组'OEM Milestone'。",
  "needs_clarification": false
}
```

## 示例4.1.2: 在现有里程碑分组中添加多个里程碑
用户: "在OEM里程碑分组里面添加三个节点：1. EP 3月1号 2. PTO 5月1号 3. SOP 8月30号"
```json
{
  "thoughts": "用户要在已存在的'OEM'里程碑分组中添加三个里程碑节点。从上下文的'所有分组'列表中找到标记为'(里程碑分组)'的'OEM'分组，然后创建三个里程碑，都指定到该分组。注意：上下文中的分组会显示类型，如'OEM(里程碑分组)'或'OEM(任务分组)'",
  "actions": [
    {
      "type": "add_milestone",
      "params": {
        "title": "EP",
        "date": "2025-03-01",
        "bucketId": "OEM"
      },
      "description": "在OEM分组中创建里程碑EP，3月1日"
    },
    {
      "type": "add_milestone",
      "params": {
        "title": "PTO",
        "date": "2025-05-01",
        "bucketId": "OEM"
      },
      "description": "在OEM分组中创建里程碑PTO，5月1日"
    },
    {
      "type": "add_milestone",
      "params": {
        "title": "SOP",
        "date": "2025-08-30",
        "bucketId": "OEM"
      },
      "description": "在OEM分组中创建里程碑SOP，8月30日"
    }
  ],
  "response": "好的，我已在OEM里程碑分组中添加了三个里程碑：EP(3月1日)、PTO(5月1日)、SOP(8月30日)。",
  "needs_clarification": false
}
```

## 示例4.1.3: 创建里程碑分组并同时添加多个里程碑（一条指令多步操作）
用户: "创建一个里程碑分组OEM，分别创建三个节点在3月、4月、5月第一天，节点命名为月份名字"
```json
{
  "thoughts": "用户的指令包含两个动作：1)创建里程碑分组'OEM'，2)在该分组中添加三个里程碑(3月、4月、5月的第一天，命名为月份)。需要返回4个actions：1个创建分组，3个创建里程碑",
  "actions": [
    {
      "type": "add_bucket",
      "params": {
        "name": "OEM",
        "bucketType": "milestone"
      },
      "description": "创建里程碑分组'OEM'"
    },
    {
      "type": "add_milestone",
      "params": {
        "title": "3月",
        "date": "2025-03-01",
        "bucketId": "OEM"
      },
      "description": "在OEM分组中创建里程碑'3月'，3月1日"
    },
    {
      "type": "add_milestone",
      "params": {
        "title": "4月",
        "date": "2025-04-01",
        "bucketId": "OEM"
      },
      "description": "在OEM分组中创建里程碑'4月'，4月1日"
    },
    {
      "type": "add_milestone",
      "params": {
        "title": "5月",
        "date": "2025-05-01",
        "bucketId": "OEM"
      },
      "description": "在OEM分组中创建里程碑'5月'，5月1日"
    }
  ],
  "response": "好的，我来创建里程碑分组'OEM'，并在其中添加三个里程碑：3月(3月1日)、4月(4月1日)、5月(5月1日)。",
  "needs_clarification": false,
  "requiresConfirmation": false
}
```

## 示例4.2: 删除分组
用户: "删除 demo car 分组"
```json
{
  "thoughts": "用户要删除名为'demo car'的分组",
  "actions": [
    {
      "type": "delete_bucket",
      "params": {
        "bucketName": "demo car"
      },
      "description": "删除分组'demo car'",
      "requiresConfirmation": true
    }
  ],
  "response": "我将删除分组'demo car'，请确认。",
  "needs_clarification": false
}
```

## 示例4.3: 推迟分组中所有任务的时间（重要）
用户: "将 UI DESIGN 分组中的任务，全部退后2周开始"
```json
{
  "thoughts": "用户要将'UI DESIGN'分组中的所有任务推迟2周。从上下文中找到该分组的所有任务，使用shiftWeeks参数同时调整开始和结束时间",
  "actions": [
    {
      "type": "update_task",
      "params": {
        "taskId": "task_ui_001",
        "shiftWeeks": 2
      },
      "description": "将'UI Design'任务推迟2周"
    },
    {
      "type": "update_task",
      "params": {
        "taskId": "task_frontend_001",
        "shiftWeeks": 2
      },
      "description": "将'前端开发'任务推迟2周"
    }
  ],
  "response": "好的，我将UI Design分组中的所有任务推迟2周，开始时间和结束时间都会相应调整。",
  "needs_clarification": false
}
```

## 示例5: 任务不明确时
用户: "把开发进度改成50%"（有多个类似任务）
```json
{
  "thoughts": "有多个相似任务，需要用户确认",
  "actions": [],
  "response": "我找到多个相似的任务，请问您要更新哪一个？",
  "needs_clarification": true,
  "clarification_questions": [
    "1. API开发",
    "2. 前端开发",
    "3. 后端开发"
  ]
}
```

## 示例6: 添加依赖
用户: "让测试任务依赖于开发任务"
```json
{
  "thoughts": "用户要添加任务依赖关系",
  "actions": [
    {
      "type": "add_dependency",
      "params": {
        "taskId": "测试",
        "dependsOnTaskId": "开发"
      },
      "description": "添加依赖：测试依赖于开发"
    }
  ],
  "response": "好的，我来设置测试任务依赖于开发任务。",
  "needs_clarification": false
}
```

## 示例7: 删除任务（需要确认）
用户: "删除旧任务"
```json
{
  "thoughts": "用户要删除任务，这是危险操作",
  "actions": [
    {
      "type": "delete_task",
      "params": {
        "taskId": "task_abc123"
      },
      "description": "删除任务'旧任务'",
      "requiresConfirmation": true
    }
  ],
  "response": "我将删除任务'旧任务'，请确认。",
  "needs_clarification": false
}
```

## 示例8: 批量更新所有任务
用户: "将所有任务的名称更新为英文"
```json
{
  "thoughts": "用户要批量更新所有任务名称为英文",
  "actions": [
    {
      "type": "update_task",
      "params": {
        "taskId": "task_001",
        "title": "Requirement Analysis"
      },
      "description": "将'需求分析'更新为'Requirement Analysis'"
    },
    {
      "type": "update_task",
      "params": {
        "taskId": "task_002",
        "title": "UI Design"
      },
      "description": "将'UI 设计'更新为'UI Design'"
    },
    {
      "type": "update_task",
      "params": {
        "taskId": "task_003",
        "title": "Frontend Development"
      },
      "description": "将'前端开发'更新为'Frontend Development'"
    }
  ],
  "response": "我将把所有任务的名称更新为英文。",
  "needs_clarification": false
}
```

## 示例9: 折叠里程碑分组
用户: "将里程碑分组折叠起来"
```json
{
  "thoughts": "用户要折叠所有里程碑类型的分组，使用collapse_bucket操作，bucketType设为milestone",
  "actions": [
    {
      "type": "collapse_bucket",
      "params": {
        "bucketType": "milestone",
        "collapsed": true
      },
      "description": "折叠所有里程碑分组"
    }
  ],
  "response": "好的，已将所有里程碑分组折叠起来。",
  "needs_clarification": false
}
```

## 示例10: 展开所有分组
用户: "展开所有分组"
```json
{
  "thoughts": "用户要展开所有分组，使用collapse_bucket操作，bucketType设为all，collapsed设为false",
  "actions": [
    {
      "type": "collapse_bucket",
      "params": {
        "bucketType": "all",
        "collapsed": false
      },
      "description": "展开所有分组"
    }
  ],
  "response": "好的，已展开所有分组。",
  "needs_clarification": false
}
```

## 示例11: 折叠单个分组
用户: "把OEM分组收起来"
```json
{
  "thoughts": "用户要折叠名为OEM的单个分组，使用collapse_bucket操作，指定bucketId",
  "actions": [
    {
      "type": "collapse_bucket",
      "params": {
        "bucketId": "OEM",
        "collapsed": true
      },
      "description": "折叠OEM分组"
    }
  ],
  "response": "好的，已将OEM分组折叠。",
  "needs_clarification": false
}
```

# 重要提醒
1. 始终用中文回复
2. 每个 action 必须有 description
3. 日期格式必须是 YYYY-MM-DD
4. 危险操作（delete_*）需要在 action 中标记 requiresConfirmation: true
5. 当意图不明确时，使用 needs_clarification 请求澄清
6. **批量操作必须使用正确的 taskId**：从上下文任务列表中复制完整的任务 ID
"""

    def _calculate_date(self, date_expression: str, reference_date: datetime = None) -> Optional[str]:
        """Calculate date from natural language expression"""
        if reference_date is None:
            reference_date = datetime.now()

        date_expr = date_expression.lower().strip()

        # Today
        if date_expr in ["今天", "today"]:
            return reference_date.strftime("%Y-%m-%d")

        # Tomorrow
        if date_expr in ["明天", "tomorrow"]:
            return (reference_date + timedelta(days=1)).strftime("%Y-%m-%d")

        # Next weekday
        weekday_map = {
            "下周一": 0, "next monday": 0,
            "下周二": 1, "next tuesday": 1,
            "下周三": 2, "next wednesday": 2,
            "下周四": 3, "next thursday": 3,
            "下周五": 4, "next friday": 4,
            "下周六": 5, "next saturday": 5,
            "下周日": 6, "next sunday": 6,
        }
        for key, weekday in weekday_map.items():
            if date_expr == key:
                days_ahead = weekday - reference_date.weekday()
                if days_ahead <= 0:
                    days_ahead += 7
                return (reference_date + timedelta(days=days_ahead)).strftime("%Y-%m-%d")

        # Next week (next Monday)
        if date_expr in ["下周", "next week"]:
            days_ahead = 0 - reference_date.weekday() + 7
            if reference_date.weekday() == 0:
                days_ahead = 7
            return (reference_date + timedelta(days=days_ahead)).strftime("%Y-%m-%d")

        # Next month (first day of next month)
        if date_expr in ["下个月", "next month"]:
            if reference_date.month == 12:
                next_month = datetime(reference_date.year + 1, 1, 1)
            else:
                next_month = datetime(reference_date.year, reference_date.month + 1, 1)
            return next_month.strftime("%Y-%m-%d")

        # End of this month
        if date_expr in ["本月底", "月底", "end of month"]:
            if reference_date.month == 12:
                next_month = datetime(reference_date.year + 1, 1, 1)
            else:
                next_month = datetime(reference_date.year, reference_date.month + 1, 1)
            return (next_month - timedelta(days=1)).strftime("%Y-%m-%d")

        # X天后 / X days later
        import re
        days_match = re.search(r'(\d+)\s*(天|日)\s*(后|later)', date_expr)
        if days_match:
            days = int(days_match.group(1))
            return (reference_date + timedelta(days=days)).strftime("%Y-%m-%d")

        # Try to parse YYYY-MM-DD directly
        try:
            datetime.strptime(date_expr, "%Y-%m-%d")
            return date_expr
        except:
            pass

        # Try to parse YYYY年MM月DD日
        try:
            parsed = datetime.strptime(date_expr, "%Y年%m月%d日")
            return parsed.strftime("%Y-%m-%d")
        except:
            pass

        # Try to parse MM月DD日 (current year)
        try:
            parsed = datetime.strptime(date_expr, "%m月%d日")
            year = reference_date.year
            parsed_with_year = datetime(year, parsed.month, parsed.day)
            return parsed_with_year.strftime("%Y-%m-%d")
        except:
            pass

        # Try to parse March 15 / Mar 15 format
        try:
            month_names = {
                "january": 1, "jan": 1,
                "february": 2, "feb": 2,
                "march": 3, "mar": 3,
                "april": 4, "apr": 4,
                "may": 5,
                "june": 6, "jun": 6,
                "july": 7, "jul": 7,
                "august": 8, "aug": 8,
                "september": 9, "sep": 9, "sept": 9,
                "october": 10, "oct": 10,
                "november": 11, "nov": 11,
                "december": 12, "dec": 12
            }
            for name, month in month_names.items():
                if name in date_expr:
                    day_match = re.search(r'(\d{1,2})', date_expr)
                    if day_match:
                        day = int(day_match.group(1))
                        parsed = datetime(reference_date.year, month, day)
                        return parsed.strftime("%Y-%m-%d")
        except:
            pass

        return None

    def process(self, request: AgentRequest, current_date: datetime = None) -> AgentResponse:
        """Process natural language request"""

        # Build context-aware prompt with full task list grouped by bucket
        context_info = ""
        user_message_lower = request.message.lower()

        if request.context:
            if request.context.get("currentProject"):
                context_info += f"\n项目名称: {request.context['currentProject']}"

            # Get buckets for grouping
            buckets_dict = {}
            if request.context.get("buckets"):
                for b in request.context['buckets']:
                    bucket_id = b.get('id') if isinstance(b, dict) else getattr(b, 'id', None)
                    bucket_name = b.get('name') if isinstance(b, dict) else getattr(b, 'name', None)
                    if bucket_id:
                        buckets_dict[bucket_id] = bucket_name or bucket_id

            # Determine what info to include based on user intent
            include_dependencies = any(kw in user_message_lower for kw in ["依赖", "dependency", "depends", "前置", "后置"])
            include_progress = any(kw in user_message_lower for kw in ["进度", "progress", "完成", "percent", "%"])
            include_status = any(kw in user_message_lower for kw in ["状态", "status", "完成", "未开始", "进行中"])
            include_description = any(kw in user_message_lower for kw in ["描述", "description", "详情"])

            # Group tasks by bucket with enhanced info
            if request.context.get("tasks"):
                tasks = request.context['tasks']
                tasks_by_bucket = {}

                # Use all tasks but smart limit per bucket
                for t in tasks:
                    bucket_id = t.get('bucketId', 'unknown')
                    bucket_name = buckets_dict.get(bucket_id, '未分组')
                    if bucket_name not in tasks_by_bucket:
                        tasks_by_bucket[bucket_name] = []

                    # Build task info string
                    task_info = f"  • [{t.get('id', 'unknown')[:8]}] {t.get('title', 'Unknown')}"

                    # Add status info
                    if include_status or include_progress:
                        status = t.get('status', 'Unknown')
                        progress = t.get('progress', t.get('completedPercent', 0))
                        task_info += f" - {status} ({progress}%)"

                    # Add dates
                    start_date = t.get('startDate') or t.get('startDateTime')
                    due_date = t.get('dueDate') or t.get('dueDateTime')
                    if start_date and due_date:
                        task_info += f" [{start_date} ~ {due_date}]"

                    # Add priority if relevant
                    if t.get('priority') and t.get('priority') != 'Normal':
                        task_info += f" [{t.get('priority')}]"

                    # Add description if requested
                    if include_description and t.get('description'):
                        desc = t.get('description', '')[:50]
                        task_info += f" - {desc}..."

                    tasks_by_bucket[bucket_name].append(task_info)

                # Format context with grouped tasks
                context_info += f"\n\n任务统计: 共 {len(tasks)} 个任务"
                context_info += "\n\n任务分组情况:"
                for bucket_name, task_items in tasks_by_bucket.items():
                    context_info += f"\n【{bucket_name}】"
                    if task_items:
                        # Show more tasks per bucket for better matching
                        max_tasks = 10 if len(tasks) > 50 else 15
                        context_info += "\n" + "\n".join(task_items[:max_tasks])
                        if len(task_items) > max_tasks:
                            context_info += f"\n  ... 还有 {len(task_items) - max_tasks} 个任务"
                    else:
                        context_info += "\n  (无任务)"

            # Also list available buckets with types
            if request.context.get("buckets"):
                bucket_list = []
                for b in request.context['buckets']:
                    bucket_name = b.get('name') if isinstance(b, dict) else getattr(b, 'name', 'Unknown')
                    bucket_type = b.get('bucketType', 'task') if isinstance(b, dict) else getattr(b, 'bucketType', 'task')
                    type_label = '里程碑分组' if bucket_type == 'milestone' else '任务分组'
                    bucket_list.append(f"{bucket_name}({type_label})")
                context_info += f"\n\n所有分组: {', '.join(bucket_list)}"

        ref_date = current_date or datetime.now()
        today = ref_date.strftime('%Y-%m-%d (%A)')
        current_year = ref_date.strftime('%Y')
        messages = [
            {"role": "system", "content": self.system_prompt.replace('2025-', f'{current_year}-')},
            {"role": "user", "content": f"今天日期: {today}\n当前年份: {current_year}{context_info}\n\n用户输入: {request.message}"}
        ]

        try:
            response_text = self.llm.chat(messages)
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"LLM call failed: {e}")
            return AgentResponse(
                success=False,
                message=f"AI 服务调用失败: {str(e)}",
                actions=[],
                needs_clarification=False
            )

        # Parse response
        try:
            # Extract JSON from response (handle markdown code blocks)
            json_str = response_text
            if "```json" in response_text:
                json_str = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                json_str = response_text.split("```")[1].split("```")[0].strip()

            # Remove JSON comments (// ...) before parsing
            import re
            # Remove single-line comments (// ...) but not inside strings
            json_str = re.sub(r'//.*?(?=\n|$)', '', json_str)
            # Remove multi-line comments (/* ... */)
            json_str = re.sub(r'/\*.*?\*/', '', json_str, flags=re.DOTALL)

            result = json.loads(json_str)

            actions = []
            dangerous_actions = ["delete_task", "delete_bucket", "remove_dependency"]
            response_requires_confirmation = False

            for action_data in result.get("actions", []):
                # Ensure description field exists
                if "description" not in action_data:
                    action_type = action_data.get("type", "unknown")
                    action_data["description"] = f"执行操作: {action_type}"

                # Auto-mark dangerous operations
                action_type = action_data.get("type", "")
                if action_type in dangerous_actions:
                    action_data["requiresConfirmation"] = True
                    response_requires_confirmation = True

                actions.append(AgentAction(**action_data))

            # Batch operations also require confirmation
            if len(actions) > 1:
                response_requires_confirmation = True

            return AgentResponse(
                success=True,
                message=result.get("response", "Processed successfully"),
                actions=actions,
                needs_clarification=result.get("needs_clarification", False),
                clarification_questions=result.get("clarification_questions", []),
                requiresConfirmation=response_requires_confirmation or result.get("requiresConfirmation", False)
            )

        except json.JSONDecodeError as e:
            import logging
            logging.getLogger(__name__).error(f"JSON parse failed: {e}\nRaw response: {response_text}")
            # Try to extract a plain-text response as fallback
            fallback_msg = response_text.strip()
            if len(fallback_msg) > 500:
                fallback_msg = fallback_msg[:500] + "..."
            return AgentResponse(
                success=False,
                message=f"AI 返回了非结构化内容，请重新描述需求。\n\nAI 原始回复: {fallback_msg}",
                actions=[],
                needs_clarification=True,
                clarification_questions=["请换一种方式描述您的需求，例如：'添加一个任务叫XXX，明天开始，持续3天'"]
            )
        except Exception as e:
            import logging
            import traceback
            logging.getLogger(__name__).error(f"Process error: {traceback.format_exc()}")
            return AgentResponse(
                success=False,
                message=f"处理请求时出错: {str(e)}",
                actions=[],
                needs_clarification=True,
                clarification_questions=["请尝试重新描述您的需求"]
            )


# ===============================
# FastAPI App
# ===============================

app = FastAPI(title="Gantt Graph AI Agent Service")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Agent service instance
agent_service = GanttAgentService()


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "Gantt Graph AI Agent Service",
        "version": "1.0.0",
        "status": "running",
        "llm_config": {
            "provider": os.getenv("LLM_PROVIDER", "zhipu"),
            "base_url": agent_service.llm.base_url,
            "model": agent_service.llm.model,
            "configured": bool(agent_service.llm.api_key)
        }
    }


@app.post("/api/chat", response_model=AgentResponse)
async def chat(request: AgentRequest):
    """Process natural language chat request"""
    import logging
    logger = logging.getLogger(__name__)

    # Input validation
    if not request.message or not request.message.strip():
        return AgentResponse(
            success=False,
            message="请输入您的指令",
            actions=[],
            needs_clarification=True,
            clarification_questions=["请描述您想要执行的操作"]
        )

    if len(request.message) > 2000:
        return AgentResponse(
            success=False,
            message="输入内容过长，请简化您的指令（最多2000字）",
            actions=[],
            needs_clarification=True
        )

    try:
        logger.info(f"Received request: {request.message[:100]}")
        response = agent_service.process(request)
        logger.info(f"Response success: {response.success}, actions: {len(response.actions)}")
        return response
    except Exception as e:
        import traceback
        logger.error(f"Error processing request: {str(e)}")
        logger.error(traceback.format_exc())
        return AgentResponse(
            success=False,
            message=f"服务内部错误: {str(e)}",
            actions=[],
            needs_clarification=False
        )


@app.get("/api/health")
async def health():
    """Health check"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
