# Gantt Graph - 任务管理甘特图系统

一个功能完整的在线甘特图任务管理系统，支持里程碑管理、任务依赖关系、可视化时间轴等功能。

## ✨ 主要功能

- 📊 **交互式甘特图**：年-月-周三层时间轴结构
- 🏁 **里程碑管理**：独立的里程碑分组和标记
- 🔗 **任务依赖**：可视化任务依赖关系，支持延迟约束
- 📝 **内联编辑**：直接在甘特图中编辑任务名称和日期
- 📤 **导出功能**：导出为高清图片或 PDF 文档
- 💾 **本地存储**：基于 IndexedDB 的本地优先架构
- 🎨 **现代化 UI**：简洁直观的用户界面

## 🚀 快速开始

### 方式一：使用安装脚本（推荐）

**Linux/macOS:**
```bash
bash setup.sh
```

**Windows:**
```cmd
setup.bat
```

### 方式二：手动安装

1. **克隆仓库**
```bash
git clone https://github.com/zjb1001/ganttGraph.git
cd ganttGraph
```

2. **安装依赖**
```bash
npm install
```

3. **启动开发服务器**
```bash
npm run dev
```

4. **打开浏览器**
访问 http://localhost:5173

## 📦 可用命令

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 🎯 使用指南

### 基本操作

- **编辑任务**：点击任务名称进行编辑
- **创建依赖**：按住 Ctrl/Cmd + 点击两个任务
- **删除依赖**：双击依赖连线
- **缩放视图**：使用右上角的 +/- 按钮或适应屏幕按钮
- **折叠/展开**：使用折叠按钮收起或展开所有分组

### 导出功能

点击右上角工具栏的导出按钮：

- 📷 **PNG 图片**：高质量截图，适合屏幕分享
- 🖼️ **JPEG 图片**：压缩图片，文件更小
- 📄 **PDF 文档**：300 DPI 打印质量，适合打印和归档

## 🛠️ 技术栈

- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **Zustand** - 状态管理
- **Dexie.js** - IndexedDB 封装
- **html2canvas** - 截图导出
- **jsPDF** - PDF 生成

## 📁 项目结构

```
ganttGraph/
├── src/
│   ├── components/     # React 组件
│   │   ├── GanttView/  # 甘特图组件
│   │   ├── Dashboard/  # 仪表板
│   │   └── ...
│   ├── store/          # Zustand 状态管理
│   ├── db/             # IndexedDB 数据库
│   ├── types/          # TypeScript 类型定义
│   └── utils/          # 工具函数
├── public/             # 静态资源
├── setup.sh            # Linux/macOS 安装脚本
├── setup.bat           # Windows 安装脚本
└── package.json
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🔗 相关链接

- 在线演示：即将推出
- 问题反馈：https://github.com/zjb1001/ganttGraph/issues
