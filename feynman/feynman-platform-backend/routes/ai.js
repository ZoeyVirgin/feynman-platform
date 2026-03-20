// routes/ai.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  generateQuestion,
  gradeAnswer,
} = require('../controllers/deepseekAiController');
const { answerWithRAG, vectorStoreStatus, rebuildVectorStore } = require('../controllers/ragController');

console.log('[routes/ai] AI 路由已加载');

// 生成题目（支持单选或简答，默认单选）
router.post('/generate-question', auth, generateQuestion);

// 评测答案（用于简答题，或可统一由后端判分）
router.post('/grade-answer', auth, gradeAnswer);

// RAG 私有知识库问答
router.post('/rag-qa', auth, answerWithRAG);
// 便于浏览器直接调试（GET /api/ai/rag-qa?q=你的问题&sources=true）
router.get('/rag-qa', auth, (req, res) => {
  try {
    req.body = { question: req.query.q || '', returnSources: String(req.query.sources).toLowerCase() === 'true' };
    return answerWithRAG(req, res);
  } catch (e) {
    return res.status(500).json({ msg: '调试路由失败', error: e?.message });
  }
});
console.log('[routes/ai] RAG /rag-qa 路由已挂载');

// 开发期：无鉴权调试路由（仅在 development 生效）
if ((process.env.NODE_ENV || 'development') === 'development') {
  router.get('/rag-qa-dev', async (req, res) => {
    try {
      req.body = { question: req.query.q || '', returnSources: String(req.query.sources).toLowerCase() === 'true' };
      return answerWithRAG(req, res);
    } catch (e) {
      return res.status(500).json({ msg: '调试路由失败', error: e?.message });
    }
  });
  router.get('/vector-store/rebuild-dev', async (req, res) => rebuildVectorStore(req, res));
  console.log('[routes/ai] DEV 无鉴权调试路由 /rag-qa-dev 已挂载');
  console.log('[routes/ai] DEV 无鉴权重建路由 /vector-store/rebuild-dev 已挂载');
}

// 运维：向量库状态 & 重建（需要鉴权）
router.get('/vector-store/status', auth, vectorStoreStatus);
router.post('/vector-store/rebuild', auth, rebuildVectorStore);

// 健康检查（用于快速确认路由是否挂载成功）
router.get('/health', (req, res) => {
  res.json({ ok: true, time: Date.now() });
});

module.exports = router;

