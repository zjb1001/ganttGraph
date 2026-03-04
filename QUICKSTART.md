# 快速开始指南

## 🚀 启动完整项目（前端 + AI后端）

### 第一步：启动 AI 后端服务

```bash
cd agent-service

# 安装依赖（首次运行）
pip3 install -r requirements.txt

# 启动服务
python3 enhanced_ai_service.py
```

服务启动后，你会看到：
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**保持这个终端运行**，再打开另一个终端启动前端。

---

### 第二步：启动前端

```bash
# 安装依赖（首次运行）
npm install

# 启动开发服务器
npm run dev
```

前端启动后，访问：http://localhost:5173

---

## 🧠 使用 AI 智能分解

1. 在右侧 **AI助手** 面板输入项目需求
2. 点击 **🧩 智能分解** 按钮
3. 等待 AI 生成完整的项目结构

**示例输入：**
```
开发一套完整的整车电子制动系统，包含：
- 主控制器：基于AUTOSAR架构的BCU
- 传感器系统：轮速、踏板位置、压力传感器
- 执行机构：ESC模块、ABS阀体、EPB电机
- 核心功能：ABS、EBD、ESC、EPB、Autohold
- 技术要求：ASIL-D、ISO 26262、响应<200ms
- 开发周期：18个月，团队15人
```

**期望输出：**
- ✅ 7个开发阶段
- ✅ 28个具体任务
- ✅ 完整的依赖关系
- ✅ 关键里程碑

---

## ⚠️ 常见问题

### 问题：AI 只创建了一个任务，没有分解

**原因**：AI 后端服务没有启动

**解决**：
```bash
# 检查服务是否运行
curl http://localhost:8000/

# 如果无响应，重新启动 AI 服务
cd agent-service
python3 enhanced_ai_service.py
```

### 问题：API Key 无效

**解决**：
编辑 `agent-service/.env` 文件：
```env
LLM_API_KEY=你的智谱API_Key
```

获取 Key：https://platform.moonshot.cn/

---

## 📁 项目结构

```
ganttGraph/
├── src/                    # 前端 React 代码
│   └── components/         # UI 组件
├── agent-service/          # AI 后端服务
│   ├── enhanced_ai_service.py  # FastAPI 服务
│   └── .env                    # API Key 配置
├── web-demo/               # 演示截图
└── README.md               # 项目文档
```

---

## 🔗 相关链接

- **GitHub 仓库**: https://github.com/zjb1001/ganttGraph
- **智谱 AI**: https://platform.moonshot.cn/
