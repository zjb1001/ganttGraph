# 快速开始指南

## 启动完整项目（前端 + AI后端）

### 方式一：一键启动

```bash
bash start.sh
```

### 方式二：分步启动

**第一步：启动 AI 后端服务**

```bash
cd agent-service

# 安装依赖（首次运行）
pip3 install -r requirements.txt

# 配置 LLM（首次运行）
cp .env.example .env
# 编辑 .env，填入你的 API Key

# 启动服务
python3 main.py
```

服务启动后，你会看到：

```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**保持这个终端运行**，再打开另一个终端启动前端。

**第二步：启动前端**

```bash
npm install    # 首次运行
npm run dev    # → http://localhost:5173
```

---

## 使用 AI 助手

在右侧 AI 助手面板中输入自然语言需求，系统会自动识别意图：

**项目级规划**（自动分解为多阶段、多任务）：

```
制定一个制动控制器开发计划
```

```
上海周边两日游亲子游计划
```

**简单操作**（直接执行单个操作）：

```
添加一个任务叫UI设计
```

```
把任务A的进度改为80%
```

---

## 环境配置

编辑 `agent-service/.env`，支持多种 LLM：

```env
# 智谱 GLM-4（推荐）
LLM_PROVIDER=zhipu
LLM_API_KEY=your_api_key
LLM_BASE_URL=https://open.bigmodel.cn/api/paas/v4
LLM_MODEL=glm-4-flash

# 或 DeepSeek
# LLM_BASE_URL=https://api.deepseek.com/v1
# LLM_MODEL=deepseek-chat

# 或本地 Ollama（无需 API Key）
# LLM_BASE_URL=http://localhost:11434/v1
# LLM_MODEL=qwen2.5

PORT=8000
```

---

## 常见问题

### AI 只创建了单个任务，没有分解

后端服务未启动。检查并重启：

```bash
curl http://localhost:8000/
cd agent-service && python3 main.py
```

### API 返回认证错误

检查 `agent-service/.env` 中的 `LLM_API_KEY` 是否正确。

### 端口被占用

修改 `agent-service/.env` 中的 `PORT`，或终止占用该端口的进程。

---

## 相关链接

- **GitHub**: https://github.com/zjb1001/ganttGraph
