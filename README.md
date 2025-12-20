# Feynman Platform（前后端分离）

一个基于 React + Express 的学习与知识平台，支持知识点管理、知识图谱可视化、3D 展示（Three.js/Cesium），以及基于 RAG 的 AI 助手能力。

## 目录结构
- feynman-platform-frontend：前端（Vite + React）
- feynman-platform-backend：后端（Express + Sequelize + MySQL）
- 笔记：课程/文档资料

## 主要功能
- 知识点管理：增删改查，富文本编辑（react-quill）
- 知识图谱：ECharts（2D 图）、Three.js（3D 空间）、Cesium（3D 地球）
- AI 助手（RAG）：向量库状态/重建、问答与参考来源展示

## 技术栈
- 前端：Vite、React、axios、react-quill、echarts、three、cesium
- 后端：Node.js、Express、Sequelize、MySQL、JWT、LangChain（RAG）、hnswlib-node

## 前后端通信约定
- 接口统一前缀：/api
- 鉴权：请求头 x-auth-token；支持刷新令牌 /api/users/refresh
- Cookie：withCredentials=true（用于 refresh）
- 开发联调：前端通过 Vite 代理将 /api 转发到后端 http://localhost:4500，避免浏览器 CORS

## 开发启动
1) 启动后端
- 目录：feynman-platform-backend
- 命令：
  - npm run dev（开发）或 npm start（生产）
- 默认端口：4500

2) 启动前端
- 目录：feynman-platform-frontend
- 命令：
  - npm run dev
- 默认端口：5173（被占用会自动递增）

## 关键代码入口
- 前端
  - 入口：index.html、src/main.jsx、src/App.jsx
  - API：src/api/axios.js（baseURL=/api；刷新令牌走 /users/refresh；withCredentials:true）
  - 主要页面：
    - DashboardPage.jsx（概览/列表）
    - KnowledgePointFormPage.jsx（知识点表单，react-quill）
    - GraphPage.jsx（知识图谱 ECharts）
    - ThreeJSPage.jsx（3D 空间）
    - CesiumPage.jsx（3D 地球）
    - AgentPage.jsx（AI 助手/RAG）
  - 代理：vite.config.js（server.proxy 将 /api -> http://localhost:4500）
- 后端
  - 入口：index.js（CORS、路由注册、数据库初始化、RAG 启动检查）
  - 路由：routes/（users、knowledge、knowledgePoints、graph、ai、audio）
  - RAG/向量库：services/vectorStoreService.js
  - 配置：config/database.js、.env（JWT_SECRET、数据库等）
  - CORS：开发环境放开；生产通过 CORS_ORIGINS 白名单（支持多源）

## 环境变量（后端）
- JWT_SECRET：JWT 签名密钥
- 数据库连接：请在 config/database.js 或 .env 中配置
- CORS_ORIGINS（生产可选）：允许的前端来源，逗号分隔

## 生产部署建议
- 使用网关/Nginx：
  - 同域不同路径部署（/ 为前端静态、/api 反向代理后端）
  - 或开启后端 CORS_ORIGINS 白名单
- 前端打包：feynman-platform-frontend 执行 npm run build（产物在 dist/）

## 二次开发提示
- 新接口：在后端 routes/ 新增并在 index.js 注册；前端统一通过 /api 调用
- 避免在前端直接写后端源地址（http://localhost:4500），统一使用相对路径 /api/**
- 涉及会话/刷新令牌的接口需保持 withCredentials:true

---
如需将前端端口固定为 5173，可在 vite.config.js 中设置：
- server.port = 5173
- server.strictPort = true

