const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// 读取知识点配置
const jsonPath = path.join(__dirname, '..', 'config', 'knowledge.json');

function loadFacts() {
  try {
    const raw = fs.readFileSync(jsonPath, 'utf-8');
    const data = JSON.parse(raw);
    let facts = Array.isArray(data) ? data : Array.isArray(data?.facts) ? data.facts : [];
    facts = facts.filter((f) => f && (f.enabled !== false) && typeof f.text === 'string' && f.text.trim());
    return facts;
  } catch (e) {
    console.error('读取 knowledge.json 失败:', e.message);
    return [];
  }
}

function pickRandom(arr, n = 1) {
  if (!Array.isArray(arr) || arr.length === 0) return [];
  const shuffled = arr.slice().sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.max(0, Math.min(n, arr.length)));
}

// GET /api/knowledge/random -> 返回单条
router.get('/random', (req, res) => {
  const facts = loadFacts();
  if (facts.length === 0) return res.status(404).json({ msg: 'No knowledge available' });
  const [item] = pickRandom(facts, 1);
  res.json(item);
});

// GET /api/knowledge?limit=N -> 返回多条（默认5）
router.get('/', (req, res) => {
  const facts = loadFacts();
  if (facts.length === 0) return res.json([]);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 5));
  res.json(pickRandom(facts, limit));
});

module.exports = router;




