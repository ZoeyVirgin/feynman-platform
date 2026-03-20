# Feynman-Platform：一站式 AI 知识管理与学习平台

Feynman-Platform 是一个深度集成 AI 能力的现代化学习与知识管理平台，其核心灵感源于“费曼学习法”。平台通过提供从知识输入、关联、可视化到模拟教学、智能问答和自我评测的全链路工具，帮助用户构建真正属于自己的、可理解、可应用、可传授的知识体系。

项目采用前后端分离架构，前端基于 `React` 构建，后端由 `Express` 驱动，并深度整合了基于 `RAG` (检索增强生成) 的对话式 AI 助手能力。

- **前端位置**：`feynman-platform-frontend`
- **后端位置**：`feynman-platform-backend`

---

## ✨ 核心功能 (Core Features)

平台围绕“学、练、测、用”四个环节，提供了一系列强大且智能的功能：

#### 1. 智能知识库管理
- **知识点增删改查**: 提供稳定高效的知识点管理功能。
- **富文本编辑**: 内置 `react-quill` 编辑器，支持图文混排、代码块、公式等复杂内容格式。
- **优雅的交互体验**: 
  - **骨架屏加载**: 首页加载知识点时显示骨架屏，提升感知性能。
  - **列表动画**: 知识点卡片在删除时拥有流畅的淡出和重排动画。
  - **点击动效**: 主要操作按钮拥有即时的点击反馈动效。

#### 2. 费曼学习法实践
- **录音与语音转文字**: 用户可以像“教给别人”一样，用语音录制对知识点的理解，系统自动将语音转换为文字。
- **AI 文本润色与评价**: 针对用户口述转化的文本，调用 AI 进行一键润色、总结，并从多个维度给出智能评价。

#### 3. 对话式 AI 助手
- **多对话管理**: 支持创建和管理多个独立的对话窗口。
- **RAG 增强问答**: 基于私有知识库进行检索增强生成，AI 助手能够精准回答与库内知识相关的问题，并提供参考来源。
- **动画与交互优化**: 对话采用流式输出，并辅以精心设计的加载动画和交互效果。

#### 4. 智能评测系统
- **AI 自动出题**: AI 可根据单个或多个知识点内容，自动生成多种题型（选择题、判断题、简答题）的测验。
- **组件化设计**: 测评卡片被重构为可复用的 `QuizCard` 组件，提升了代码的可维护性。

#### 5. 多维知识可视化
- **2D 知识图谱**: 使用 `ECharts` 动态展示知识点之间的关联关系。
- **3D 关系图谱**: 借助 `Three.js` 将知识图谱在三维空间中进行渲染。
- **3D 地球可视化**: 集成 `Cesium` 框架，可将具有地理位置属性的知识点标注在虚拟地球上。

#### 6. 健壮的全局反馈机制
- **全局错误捕获**: 基于 `axios` 拦截器实现，自动捕获所有 API 请求错误。
- **非阻塞式 Toast 通知**: 任何后端错误或网络异常都会以右上角 Toast 弹窗的形式友好地提示用户，不中断操作流，且支持进入与退出动画。

## 🛠️ 技术栈 (Tech Stack)

- **前端**: `Vite`, `React`, `React Router`, `Axios`, `React-Quill`, `Ant Design`
- **可视化**: `ECharts`, `Three.js`, `Cesium`
- **动画**: `Framer Motion`
- **后端**: `Node.js`, `Express`, `Sequelize`, `MySQL`, `JWT` (JSON Web Token)
- **AI & RAG**: `LangChain.js`, `hnswlib-node` (向量存储与检索), `DeepSeek API`, `Baidu Ernie API`

## 🚀 快速启动 (Getting Started)

#### 1. 启动后端服务
```bash
# 1. 进入后端目录
cd feynman-platform-backend

# 2. 安装依赖
npm install

# 3. 配置环境变量
#    - 复制 .env.example 为 .env
#    - 在 .env 文件中填入数据库配置、JWT_SECRET 及 AI 服务商的 API Key

# 4. 启动开发服务器 (默认端口 4500)
npm run dev
```

#### 2. 启动前端应用
```bash
# 1. 进入前端目录
cd feynman-platform-frontend

# 2. 安装依赖
npm install

# 3. 启动开发服务器 (默认端口 5173)
npm run dev
```

## 🔧 开发与部署

#### 关键代码入口
- **前端**
  - **应用入口**: `src/main.jsx`, `src/App.jsx`
  - **API 请求与全局错误处理**: `src/api/axios.js`
  - **全局通知**: `src/context/ToastContext.jsx`
  - **核心页面**: `src/pages/` 目录下
  - **Vite 代理**: `vite.config.js` 中配置 `/api` 代理。
- **后端**
  - **服务入口**: `index.js`
  - **核心路由**: `routes/` 目录下
  - **RAG 服务**: `services/vectorStoreService.js`

#### 生产部署
- **前端打包**: 在 `feynman-platform-frontend` 目录执行 `npm run build`。
- **推荐方案**: 使用 Nginx 或类似网关进行反向代理，将 `/api` 路径的请求反向代理到后端服务。

## 🔮 可扩展方向 (Future Directions)

- **知识图谱增强**: 为图谱增加更丰富的交互功能，如侧边栏预览、关系高亮、力导向布局优化等。
- **多人协作**: 支持多用户共同维护和学习知识库。
- **跨平台客户端**: 使用 `Tauri` 或 `Electron` 将应用打包为桌面端。
- **AI Agent 工作流**: 探索基于 LangGraph 的复杂 AI Agent，实现自动化知识整理与关联。
