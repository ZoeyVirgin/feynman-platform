# Feynman-Platform：一站式 AI 知识管理与学习平台

Feynman-Platform 是一个深度集成 AI 能力的现代化学习与知识管理平台，其核心灵感源于“费曼学习法”。平台通过提供从知识输入、关联、可视化到模拟教学、智能问答和自我评测的全链路工具，帮助用户构建真正属于自己的、可理解、可应用、可传授的知识体系。

项目采用前后端分离架构，前端基于 `React` 构建，后端由 `Express` 驱动，并深度整合了基于 `RAG` (检索增强生成) 的对话式 AI 助手能力。

- **前端位置**：`@feynman-platform-frontend`
- **后端位置**：`@feynman-platform-backend`

---

## ✨ 核心功能 (Core Features)

平台围绕“学、练、测、用”四个环节，提供了一系列强大且智能的功能：

#### 1. 智能知识库管理
- **知识点增删改查**: 提供稳定高效的知识点管理功能。
- **富文本编辑**: 内置 `react-quill` 编辑器，支持图文混排、代码块、公式等复杂内容格式，让知识记录更直观。
- **UI 优化**: 简洁、现代且响应式的用户界面，提升跨设备使用体验。

#### 2. 费曼学习法实践
- **录音与语音转文字**: 用户可以像“教给别人”一样，用语音录制对知识点的理解，系统自动将语音转换为文字，完成费曼学习法的关键一步。
- **AI 文本润色与评价**: 针对用户口述转化的文本，调用 AI 进行一键润色、总结，并从多个维度（如清晰度、准确性）给出智能评价和改进建议。

#### 3. 对话式 AI 助手
- **多对话管理**: 支持创建和管理多个独立的对话窗口，方便用户针对不同主题或知识点进行并行的探索式学习。
- **RAG 增强问答**: 基于私有知识库进行检索增强生成，AI 助手能够精准回答与库内知识相关的问题，并提供参考来源，确保答案的可靠性与可追溯性。
- **动画与交互优化**: 对话采用流式输出，并辅以精心设计的加载动画和交互效果，提升对话体验的流畅与自然感。

#### 4. 智能评测系统
- **AI 自动出题**: AI 可根据单个知识点内容，自动生成多种题型（如选择题、判断题、简答题）的测验，帮助用户检验掌握程度。
- **批量智能测评**: 支持一键对多个知识点进行批量出题，形成综合试卷，提供更全面的能力评估。

#### 5. 多维知识可视化
- **2D 知识图谱**: 使用 `ECharts` 动态展示知识点之间的关联关系，构建清晰的知识网络。
- **3D 关系图谱**: 借助 `Three.js` 将知识图谱在三维空间中进行渲染，提供更具沉浸感的探索体验。
- **3D 地球可视化**: 集成 `Cesium` 框架，可将具有地理位置属性的知识点标注在虚拟地球上，适用于特定领域的知识展示。

## 🛠️ 技术栈 (Tech Stack)

- **前端**: `Vite`, `React`, `React Router`, `Axios`, `React-Quill`, `ECharts`, `Three.js`, `Cesium`, `Ant Design`
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
  - **API 请求**: `src/api/axios.js` (统一配置 `baseURL` 和 `withCredentials`)
  - **核心页面**: `src/pages/` 目录下，如 `AgentPage.jsx` (AI助手), `FeynmanRecordPage.jsx` (费曼录音), `QuizPage.jsx` (智能测验) 等。
  - **Vite 代理**: `vite.config.js` 中配置 `/api` 代理，解决开发环境跨域问题。
- **后端**
  - **服务入口**: `index.js` (中间件、路由、数据库和 RAG 服务初始化)
  - **核心路由**: `routes/` 目录下，按功能模块划分。
  - **RAG 服务**: `services/vectorStoreService.js` (向量数据库的核心操作)
  - **配置**: `config/database.js` 和 `.env` 文件。

#### 环境变量（后端 `.env`）
- `JWT_SECRET`: JWT 签名密钥，用于用户认证。
- `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`: 数据库连接信息。
- `DEEPSEEK_API_KEY`, `BAIDU_ERNIE_API_KEY`, `BAIDU_ERNIE_SECRET_KEY`: AI 模型服务商的凭证。
- `CORS_ORIGINS` (生产环境): 允许跨域访问的前端域名，多个用逗号分隔。

#### 生产部署
- **前端打包**: 在 `feynman-platform-frontend` 目录执行 `npm run build`，产物位于 `dist/` 目录。
- **推荐方案**: 使用 Nginx 或类似网关进行反向代理。
  - 将前端静态资源（`dist/` 目录内容）部署在根路径 `/`。
  - 将 `/api` 路径的请求反向代理到后端服务 (如 `http://localhost:4500`)。
  - 此方案可避免跨域问题，且结构清晰。

## 🔮 可扩展方向 (Future Directions)

- **知识图谱增强**: 引入图数据库（如 Neo4j），实现更复杂的图查询与分析。
- **多人协作**: 支持多用户共同维护和学习知识库。
- **跨平台客户端**: 使用 `Tauri` 或 `Electron` 将应用打包为桌面端，提升本地化体验。
- **AI Agent 工作流**: 探索基于 LangGraph 或类似框架的复杂 AI Agent，实现自动化知识整理、总结和关联。
