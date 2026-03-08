# Gantt Graph AI - AI增强版甘特图项目管理工具

<p align="center">
  <img src="web-demo/gantt-screenshot.png" alt="Gantt Graph AI Screenshot" width="100%">
</p>

<p align="center">
  <a href="#架构概览">架构概览</a> •
  <a href="#快速开始">快速开始</a> •
  <a href="#ai-智能助手">AI智能助手</a> •
  <a href="#项目结构">项目结构</a> •
  <a href="#技术栈">技术栈</a> •
  <a href="#测试">测试</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.3-blue?logo=react" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vite-6.2-purple?logo=vite" alt="Vite">
  <img src="https://img.shields.io/badge/Python-3.12-blue?logo=python" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-0.104+-green?logo=fastapi" alt="FastAPI">
  <img src="https://img.shields.io/badge/LLM-多模型支持-orange" alt="LLM">
</p>

---

## 架构概览

全栈 AI 甘特图项目管理工具，采用前后端分离架构：

- **前端**：React 18 + Zustand + Dexie（IndexedDB），提供甘特图/看板/列表多视图
- **后端**：FastAPI + OpenAI SDK，两阶段 AI 处理架构（意图识别 → 内容生成）
- **数据存储**：纯客户端 IndexedDB，无服务端数据库依赖

### 核心设计：两阶段 AI 处理

```
用户输入 → 意图识别(_identify_intent)
              ├── project_plan → TaskDecomposer(LLM驱动) → 多阶段/多任务/里程碑
              └── simple       → 单次LLM调用 → 单个操作(增删改查)
```

- **项目级请求**（规划、计划、项目分解等）：由 `TaskDecomposer` 调用 LLM 自由生成结构化计划，不依赖硬编码模板
- **简单操作**（添加/删除/修改任务）：单次 LLM 调用，直接映射到操作指令

## 快速开始

### 前端

```bash
npm install
npm run dev          # 启动开发服务器 → http://localhost:5173
```

### 后端 AI 服务

```bash
cd agent-service
pip install -r requirements.txt

# 配置 LLM 提供商
cp .env.example .env
# 编辑 .env，填入 API Key

python3 main.py      # 启动 AI 服务 → http://localhost:8000
```

### 一键启动

```bash
bash start.sh        # 同时启动前端 + 后端
```

### 环境配置

编辑 `agent-service/.env`，支持多种 LLM 提供商：

```env
# 智谱 GLM-4
LLM_PROVIDER=zhipu
LLM_API_KEY=your_api_key
LLM_BASE_URL=https://open.bigmodel.cn/api/paas/v4
LLM_MODEL=glm-4-flash

# 或 DeepSeek
# LLM_BASE_URL=https://api.deepseek.com/v1
# LLM_MODEL=deepseek-chat

# 或本地 Ollama
# LLM_BASE_URL=http://localhost:11434/v1
# LLM_MODEL=qwen2.5

PORT=8000
```

## AI 智能助手

### 支持的操作类型

| 类型     | 触发方式                        | 处理流程                     | 示例                         |
| -------- | ------------------------------- | ---------------------------- | ---------------------------- |
| 项目规划 | 含"计划/规划/项目/开发"等关键词 | TaskDecomposer → 多阶段分解  | "制定一个制动控制器开发计划" |
| 任务操作 | 含"添加/删除/修改任务"等关键词  | 单次LLM → 单个操作           | "添加一个任务叫UI设计"       |
| 自由规划 | 任意主题的计划类需求            | TaskDecomposer → LLM自由生成 | "上海周边两日游亲子游计划"   |

### v2 增强接口

后端同时提供 v2 独立分析接口：

| 接口     | 路径                             | 功能                             |
| -------- | -------------------------------- | -------------------------------- |
| 任务分解 | `POST /api/v2/decompose`         | 将目标分解为阶段/任务/里程碑     |
| 风险分析 | `POST /api/v2/analyze-risks`     | 依赖风险、进度风险、资源风险检测 |
| 进度预测 | `POST /api/v2/predict-schedule`  | CPM关键路径计算 + 完成时间预测   |
| 资源分析 | `POST /api/v2/analyze-resources` | 资源冲突检测 + 利用率分析        |

## 项目结构

```
ganttGraph/
├── src/                           # 前端 React 源码
│   ├── components/
│   │   ├── AIAssistant/           # AI 对话助手界面
│   │   ├── GanttView/             # 甘特图视图
│   │   ├── BoardView/             # 看板视图
│   │   ├── ListView/              # 列表视图
│   │   ├── Dashboard/             # 项目仪表盘
│   │   ├── TaskPanel/             # 任务详情面板
│   │   ├── Header/                # 顶部导航
│   │   └── Sidebar/               # 侧边栏
│   ├── store/appStore.ts          # Zustand 状态管理
│   ├── db/index.ts                # Dexie IndexedDB 封装
│   ├── types/index.ts             # TypeScript 类型定义
│   ├── utils/
│   │   ├── agentApi.ts            # v1 API 客户端
│   │   ├── enhancedAgentApi.ts    # v2 增强 API 客户端
│   │   ├── agentTools.ts          # Agent 工具函数
│   │   ├── date.ts                # 日期工具
│   │   ├── colors.ts              # 颜色方案
│   │   └── exportGantt.ts         # PDF/图片导出
│   └── test/                      # 前端单元测试
│
├── agent-service/                 # 后端 AI 服务
│   ├── main.py                    # FastAPI 主服务（两阶段架构）
│   ├── enhanced_ai_service.py     # v2 增强服务（TaskDecomposer/RiskAnalyzer/CPM）
│   ├── requirements.txt           # Python 依赖
│   ├── .env.example               # 环境配置示例
│   ├── src/                       # TypeScript Agent 架构（多级演进）
│   │   ├── SimpleGanttAgent.ts    # Level 1-2: 基础 Agent
│   │   ├── OptimizedGanttAgent.ts # Level 3-4: 优化 Agent
│   │   ├── GoalDrivenPlanner.ts   # Level 5: 目标驱动规划
│   │   ├── TaskPlanner.ts         # 任务规划器
│   │   ├── ContextManager.ts      # 上下文管理
│   │   ├── SpecializedAgents.ts   # 领域专用 Agent
│   │   ├── MultiAgentSystem.ts    # Level 7: 多 Agent 协作
│   │   └── types.ts               # Agent 类型定义
│   └── tests/                     # 后端测试脚本
│
├── web-demo/                      # 静态演示页面
├── vite.config.ts                 # Vite 构建配置
├── vitest.config.ts               # 测试框架配置
├── eslint.config.js               # ESLint 配置
└── tsconfig.json                  # TypeScript 配置
```

## 技术栈

### 前端

| 技术                | 版本 | 用途                           |
| ------------------- | ---- | ------------------------------ |
| React               | 18.3 | UI 框架                        |
| TypeScript          | 5.7  | 类型安全                       |
| Vite                | 6.2  | 构建工具                       |
| Zustand             | 5.0  | 状态管理（persist + devtools） |
| Dexie.js            | 4.0  | IndexedDB 客户端存储           |
| @dnd-kit            | 6.3  | 拖拽交互                       |
| html2canvas + jsPDF | -    | 甘特图导出                     |

### 后端

| 技术       | 版本   | 用途                         |
| ---------- | ------ | ---------------------------- |
| FastAPI    | 0.104+ | Web 框架                     |
| OpenAI SDK | 1.0+   | LLM 统一调用（兼容多提供商） |
| Pydantic   | 2.5+   | 数据模型验证                 |
| uvicorn    | 0.24+  | ASGI 服务器                  |

### 支持的 LLM 提供商

所有兼容 OpenAI 格式的 API 均可接入：

- **智谱 GLM-4** / GLM-4-Flash
- **DeepSeek**
- **Moonshot (Kimi)**
- **本地 Ollama**
- **OpenAI GPT** 系列

## 测试

```bash
# 运行全部测试（154 个测试用例）
npm test

# 运行并生成覆盖率
npm run test:coverage

# UI 测试界面
npm run test:ui
```

测试覆盖：

- 前端：日期工具、Agent 工具函数、增强 API 客户端
- 后端 Agent 架构：多级 Agent 演进测试（Level 1-8）、行业模板测试、全生命周期测试

## 开发

```bash
npm run dev           # 开发服务器
npm run build         # 生产构建
npm run lint          # ESLint 检查
npm test              # 运行测试
```

Git 提交自动触发 Husky pre-commit hook（lint-staged + 测试）。

## 许可证

[MIT License](./LICENSE)

---

<p align="center">
  <a href="https://github.com/zjb1001/ganttGraph">GitHub</a>
</p>
