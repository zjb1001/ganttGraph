# AI Agent Integration Guide

## Overview

This integration adds an AI-powered assistant to the Gantt Graph application, allowing users to manage tasks and milestones using natural language.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    App.tsx                            │   │
│  │                       │                              │   │
│  │                       ▼                              │   │
│  │              ┌──────────────┐                        │   │
│  │              │ AIAssistant  │ ← Chat UI component    │   │
│  │              └──────────────┘                        │   │
│  │                       │                              │   │
│  │                       ▼                              │   │
│  │              ┌──────────────┐                        │   │
│  │              │  agentApi.ts │ ← API client           │   │
│  │              └──────────────┘                        │   │
│  │                       │                              │   │
│  │                       ▼                              │   │
│  │              ┌──────────────┐                        │   │
│  │              │agentTools.ts │ ← Executes on store    │   │
│  │              └──────────────┘                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │ HTTP                             │
└──────────────────────────┼─────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  Agent Service (Python)                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    FastAPI                            │   │
│  │                       │                              │   │
│  │                       ▼                              │   │
│  │              ┌──────────────┐                        │   │
│  │              │  LLM Client  │ ← Zhipu/OpenAI/etc     │   │
│  │              └──────────────┘                        │   │
│  │                       │                              │   │
│  │                       ▼                              │   │
│  │              ┌──────────────┐                        │   │
│  │              │GanttAgent    │ ← Intent processing    │   │
│  │              └──────────────┘                        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## File Structure

```
ganttGraph/
├── agent-service/           # Backend Python service
│   ├── main.py             # FastAPI app & agent logic
│   ├── requirements.txt    # Python dependencies
│   ├── .env.example        # Environment variables template
│   └── README.md           # Service documentation
│
├── src/
│   ├── components/
│   │   └── AIAssistant/    # Chat UI component
│   │       ├── AIAssistant.tsx
│   │       ├── AIAssistant.css
│   │       └── index.ts
│   │
│   └── utils/
│       ├── agentApi.ts     # API client for agent service
│       └── agentTools.ts   # Action executor for Zustand store
│
└── .env.example            # Frontend environment variables
```

## Setup Instructions

### 1. Backend Service Setup

```bash
cd agent-service

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your LLM API key

# Run the service
python main.py
```

The service will start on `http://localhost:8000`

### 2. Frontend Setup

```bash
# In project root
cp .env.example .env

# Install dependencies (if not already done)
npm install

# Run development server
npm run dev
```

## Usage Examples

### Adding Tasks
```
"添加一个任务叫'API 开发'，下周一开始，持续5天"
"Create a task 'Database Design' starting March 1st for 7 days"
```

### Adding Milestones
```
"添加一个里程碑叫'项目发布'在3月15日"
"Add milestone 'Beta Release' on April 1st"
```

### Updating Tasks
```
"把'API 开发'的进度改成50%"
"Update task 'UI Design' to high priority"
```

### Querying Information
```
"显示所有任务"
"有哪些里程碑？"
"项目概览"
```

## Supported Actions

| Action | Description | Example |
|--------|-------------|---------|
| `add_task` | Create a new task | "Add task 'Review' next Monday" |
| `add_milestone` | Create a milestone | "Add milestone 'Launch' on Mar 15" |
| `update_task` | Update task properties | "Set task progress to 75%" |
| `delete_task` | Delete a task | "Delete task 'Old Task'" |
| `add_bucket` | Create a group | "Add bucket 'Backlog'" |
| `add_dependency` | Add task dependency | "Task B depends on Task A" |
| `query` | Query information | "Show project summary" |

## Configuration

### LLM Provider Configuration

The agent service supports multiple LLM providers:

```bash
# In agent-service/.env

# For Zhipu AI (GLM models)
LLM_PROVIDER=zhipu
ZHIPU_API_KEY=your-key
LLM_MODEL=glm-4-flash

# For OpenAI
LLM_PROVIDER=openai
OPENAI_API_KEY=your-key
LLM_MODEL=gpt-4o-mini

# For DeepSeek
LLM_PROVIDER=deepseek
DEEPSEEK_API_KEY=your-key
LLM_MODEL=deepseek-chat

# For Ollama (local)
LLM_PROVIDER=ollama
LLM_BASE_URL=http://localhost:11434/v1
LLM_MODEL=llama2
```

### Frontend Configuration

```bash
# In .env (project root)
VITE_AGENT_SERVICE_URL=http://localhost:8000
```

## Development

### Testing the Integration

1. **Start the agent service**
   ```bash
   cd agent-service
   python main.py
   ```

2. **Start the frontend**
   ```bash
   npm run dev
   ```

3. **Open the app**
   Navigate to `http://localhost:5173`

4. **Click the AI button** (bottom-right corner)

5. **Try commands like:**
   - "添加一个任务叫'测试'，明天开始，3天"
   - "显示项目概览"
   - "创建里程碑'发布'在下周五"

### Troubleshooting

**Issue: "AI 服务未连接"**
- Ensure agent-service is running on port 8000
- Check that `VITE_AGENT_SERVICE_URL` is correct

**Issue: "Could not process request"**
- Check agent service logs for errors
- Verify LLM API key is configured correctly

**Issue: Tasks not appearing**
- Refresh the page after agent actions
- Check browser console for errors
