# 甘特图 Agent - 自动迭代优化指南

基于 [learn-claude-code](https://github.com/shareAI-lab/learn-claude-code) 思想的渐进式优化方案。

---

## 🎯 核心原则

> **"从简单开始，只在真实使用中发现需要时才增加复杂度"**

### 4个级别 (渐进式)

| 级别 | 名称 | 功能数量 | 说明 |
|------|------|---------|------|
| **Level 1** | 基础对话 | 3个工具 | **必须从这里开始** |
| **Level 2** | 任务规划 | +2个功能 | 多步骤任务失去连贯性时添加 |
| **Level 3** | 上下文管理 | +3个功能 | 对话超过10轮时添加 |
| **Level 4** | 智能增强 | +3个功能 | 需要智能建议时添加 |

---

## 🚀 快速开始

### 1. 查看当前状态

```bash
cd /root/.openclaw/workspace/ganttGraph
python3 scripts/agent_iterator.py
```

### 2. 开发并标记完成

```bash
# 开发完一个功能后标记
python3 scripts/agent_iterator.py complete "实现基础 Agent Loop"
```

### 3. 升级到新级别

```bash
# 当前级别所有功能完成后，自动升级
python3 scripts/agent_iterator.py upgrade
```

---

## 📁 文件结构

```
ganttGraph/
├── src/
│   └── agent/
│       ├── SimpleGanttAgent.ts      ← Level 1 实现
│       └── __tests__/
│           └── agent.iteration.test.ts  ← 测试用例
├── scripts/
│   └── agent_iterator.py            ← 自动迭代管理器
└── AGENT_OPTIMIZATION_PLAN.md       ← 完整优化计划
```

---

## ✅ Level 1 实现清单 (今晚完成)

- [ ] 复制 `SimpleGanttAgent.ts` 到项目
- [ ] 实现基础 Agent Loop
- [ ] 跑通测试用例
- [ ] 标记完成

**成功标准**:
```typescript
// 能正确处理这个输入
const result = await agent.process(
  '创建一个任务叫设计评审，3月10日开始，持续3天',
  context
);
// result.success === true
// context.tasks.length === 1
// context.tasks[0].title === '设计评审'
```

---

## 🔄 迭代工作流程

```
1. 查看当前状态 → python agent_iterator.py
2. 选择待实现功能 → 编码
3. 运行测试 → npm test
4. 标记完成 → python agent_iterator.py complete "xxx"
5. 检查是否可升级 → python agent_iterator.py
6. 升级 → python agent_iterator.py upgrade
7. 重复步骤1
```

---

## 🚫 反模式 (避免)

| ❌ 不要这样 | ✅ 要这样 |
|------------|----------|
| 一上来就实现所有功能 | 先实现3个核心功能 |
| 设计复杂工作流 | 让模型决定流程 |
| 前置加载所有知识 | 按需加载 |
| 硬编码业务逻辑 | 让模型推理 |

---

## 📊 迭代进度追踪

当前状态文件: `.agent_iteration_state.json`

```json
{
  "current_level": 1,
  "completed_features": [],
  "next_features": [],
  "last_update": "2026-03-05T20:30:00"
}
```

---

## 🎓 从 learn-claude-code 学到的

1. **The model IS the agent** - 代码只是运行循环
2. **Capabilities enable** - 提供能力而非预设流程
3. **Trust liberates** - 相信模型的推理能力
4. **Iteration reveals** - 从使用中发现需求

---

**开始迭代**: 运行 `python scripts/agent_iterator.py`
