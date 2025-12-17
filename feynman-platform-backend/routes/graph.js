const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const KnowledgePoint = require('../models/KnowledgePoint');

console.log('[routes/graph] 图谱路由已加载');

// 健康检查
router.get('/health', (req, res) => {
  res.json({ ok: true, time: Date.now() });
});

async function buildGraph(userId) {
  const kps = await KnowledgePoint.findAll({
    where: { userId },
    attributes: ['id', 'title', 'content', 'status', 'reviewList', 'created_at'],
    order: [['created_at', 'DESC']],
  });

  if (!kps || kps.length === 0) {
    return { nodes: [], links: [] };
  }

  const nodes = kps.map((kp) => {
    const content = (kp.content || '').toString();
    const snippet = content.replace(/<[^>]+>/g, '').slice(0, 120);
    const sizeBase = 20;
    const sizeExtra = Math.min(Math.floor(content.length / 80), 30);
    return {
      id: String(kp.id),
      name: kp.title,
      value: snippet,
      symbolSize: sizeBase + sizeExtra,
      status: kp.status,
      reviewList: kp.reviewList,
      createdAt: kp.created_at,
    };
  });

  const titleToId = new Map();
  for (const kp of kps) {
    if (kp.title) titleToId.set(kp.title, String(kp.id));
  }

  const links = [];
  for (const a of kps) {
    const aId = String(a.id);
    const text = ((a.content || '').toString());
    if (!text) continue;
    for (const [title, bId] of titleToId.entries()) {
      if (String(title) === String(a.title)) continue;
      if (text.includes(title)) {
        links.push({ source: aId, target: bId, label: { show: false, formatter: '引用' } });
      }
    }
  }

  return { nodes, links };
}

// GET /api/graph/knowledge-map
router.get('/knowledge-map', auth, async (req, res) => {
  try {
    console.log('[routes/graph] /knowledge-map 请求 by user', req.user?.id);
    const data = await buildGraph(req.user.id);
    return res.json(data);
  } catch (e) {
    console.error('[graph] knowledge-map 生成失败:', e?.message || e);
    return res.status(500).json({ msg: '生成失败', error: e?.message || String(e) });
  }
});

// 开发无鉴权调试接口
if ((process.env.NODE_ENV || 'development') === 'development') {
  router.get('/knowledge-map-dev', async (req, res) => {
    try {
      const userId = Number(req.query.userId) || 1; // 简单指定或默认1
      const data = await buildGraph(userId);
      return res.json(data);
    } catch (e) {
      return res.status(500).json({ msg: '生成失败', error: e?.message || String(e) });
    }
  });
  console.log('[routes/graph] DEV 无鉴权路由 /knowledge-map-dev 已挂载');
}

module.exports = router;
