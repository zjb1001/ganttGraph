# 🚀 Kimi AI 功能验证指南

## 快速开始

### 1. 配置Kimi API Token

```bash
cd agent-service

# 创建.env文件
cat > .env << 'EOF'
LLM_PROVIDER=kimi
LLM_API_KEY=你的Kimi_API_Key
LLM_BASE_URL=https://api.moonshot.cn/v1
LLM_MODEL=moonshot-v1-8k
PORT=8000
EOF
```

**获取Kimi API Key:**
1. 访问 https://platform.moonshot.cn/
2. 登录并创建API Key
3. 复制Key到上面的配置中

### 2. 启动增强版AI服务

```bash
# 安装依赖
pip install fastapi uvicorn pydantic python-dotenv openai requests

# 启动服务
python3 enhanced_ai_service.py
```

服务将在 http://localhost:8000 启动

### 3. 运行测试脚本

```bash
# 在另一个终端窗口运行
python3 test_ai_features.py
```

## 🧪 测试内容

测试脚本会验证以下功能：

### ✅ 1. 服务健康检查
确认服务正常运行

### ✅ 2. 智能任务分解
输入："开发一个电商网站，包含用户系统、商品管理、购物车、支付功能"

期望输出：
- 自动分解为多个阶段（需求分析、设计、开发、测试等）
- 每个阶段的具体任务
- 任务时间安排
- 置信度评估

### ✅ 3. 风险分析
模拟有风险的任务数据：
- 延期的任务
- 依赖关系
- 进度落后

期望输出：
- 识别延期风险
- 依赖风险
- 给出建议

### ✅ 4. 进度预测
基于任务数据预测：
- 项目完成日期
- 延期概率
- 关键路径
- 瓶颈任务

### ✅ 5. 自然语言对话
测试意图识别：
- "帮我分解开发电商网站的项目" → 触发分解
- "分析一下项目风险" → 触发风险分析
- "预测一下什么时候能完成" → 触发预测

## 📋 手动测试API

### 测试任务分解

```bash
curl -X POST http://localhost:8000/api/v2/decompose \
  -H "Content-Type: application/json" \
  -d '{
    "goal": "开发一个社交媒体App",
    "start_date": "2025-03-01",
    "team_size": 4,
    "complexity": "high"
  }'
```

### 测试风险分析

```bash
curl -X POST http://localhost:8000/api/v2/analyze-risks \
  -H "Content-Type: application/json" \
  -d '{
    "tasks": [
      {
        "id": "task-1",
        "title": "后端API",
        "startDate": "2025-03-01",
        "dueDate": "2025-03-05",
        "progress": 20,
        "status": "InProgress",
        "priority": "High"
      }
    ],
    "current_date": "2025-03-04"
  }'
```

### 测试对话接口

```bash
curl -X POST http://localhost:8000/api/v2/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "帮我规划一个机器学习项目",
    "context": {"currentProject": "ML项目"}
  }'
```

## 🔍 预期效果

### 智能分解示例输出

```json
{
  "success": true,
  "message": "成功分解项目为5个阶段，23个任务",
  "phases": [
    {"name": "需求分析", "description": "收集和分析需求"},
    {"name": "系统设计", "description": "架构和数据库设计"},
    {"name": "开发实现", "description": "前后端开发"},
    {"name": "测试部署", "description": "测试和上线"}
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
  "estimated_duration_days": 90,
  "confidence": 0.85
}
```

### 风险分析示例输出

```json
{
  "success": true,
  "message": "发现3个风险项",
  "risks": [
    {
      "task_id": "task-1",
      "task_title": "API开发",
      "risk_type": "进度延期",
      "level": "high",
      "description": "任务已延期2天，当前进度30%",
      "suggestion": "增加资源投入或调整范围"
    }
  ],
  "overall_risk_level": "medium",
  "recommendations": ["优先完成关键路径任务"]
}
```

## ❓ 常见问题

### Q: API返回401错误？
A: 检查 `.env` 文件中的 `LLM_API_KEY` 是否正确

### Q: 服务启动失败？
A: 检查端口8000是否被占用，可修改 `.env` 中的 `PORT`

### Q: 测试脚本连接失败？
A: 确保服务已启动，且测试脚本中的 `BASE_URL` 正确

### Q: AI响应很慢？
A: 任务分解可能需要10-30秒，取决于模型和任务复杂度

## 📊 验证清单

- [ ] 服务启动成功（http://localhost:8000 可访问）
- [ ] 任务分解返回结构化数据
- [ ] 风险分析识别出潜在风险
- [ ] 进度预测给出合理日期
- [ ] 自然语言意图识别准确

## 🎉 成功标志

如果所有测试通过，你会看到：

```
🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀
Gantt Graph AI 增强功能测试
🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀
...
测试结果汇总
==================================================
✅ 通过 - 服务健康
✅ 通过 - 任务分解
✅ 通过 - 风险分析
✅ 通过 - 进度预测

总计: 4/4 项通过

🎉 所有测试通过! AI增强功能工作正常!
```

祝测试顺利！🎊
