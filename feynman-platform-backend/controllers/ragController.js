// controllers/ragController.js
const fs = require('fs');
const { getRetriever, VECTOR_STORE_PATH } = require('../services/vectorStoreService');
const { simpleChat } = require('./deepseekAiController');

// 提示词构建函数
function buildRAGPrompt(context, question) {
  return (
    `<role>你是一个基于私有知识库进行问答的智能助手。</role>\n` +
    `<instruction>严格依据<context>提供的资料回答<question>。如果资料不足以回答，就明确说“根据知识库，我无法回答这个问题”，不要编造。</instruction>\n\n` +
    `<context>\n${context}\n</context>\n\n` +
    `<question>\n${question}\n</question>\n\n` +
    `<answer>请直接给出最终回答：</answer>`
  );
}

// RAG 问答主逻辑
exports.answerWithRAG = async (req, res) => {
  const { question, returnSources } = req.body || {};
  if (!question || !String(question).trim()) {
    return res.status(400).json({ msg: 'question 为必填' });
  }

  try {
    let docs = [];
    let retrieverAvailable = false;
    try {
      const retriever = await getRetriever(4);
      if (retriever) {
        docs = await retriever.invoke(question);
        retrieverAvailable = true;
      }
    } catch (e) {
      if (process.env.NODE_ENV !== 'test') {
        console.warn('[RAG] 检索器不可用或向量库未初始化：', e?.message || e);
      }
    }

    // 判断是否触发 Fallback
    if (!retrieverAvailable || !docs || docs.length === 0) {
      console.log('[RAG] RAG 未命中，切换到 Fallback 通用模式');
      try {
        const fallbackAnswer = await simpleChat(question);
        const finalAnswer = `以下回答未基于你的知识库，仅作为通用参考：\n\n${fallbackAnswer}`;
        return res.json({
          mode: 'fallback',
          answer: finalAnswer,
          sources: [],
        });
      } catch (fallbackErr) {
        console.error('[RAG-Fallback] 通用问答失败:', fallbackErr?.response?.data || fallbackErr.message);
        return res.status(500).json({ msg: '通用问答模式失败', error: fallbackErr?.response?.data || fallbackErr.message });
      }
    }

    // RAG 模式
    console.log(`[RAG] RAG 命中，检索到 ${docs.length} 个相关片段`);
    const context = docs.map((d, i) => `--- 片段${i + 1} ---\n${d.pageContent}`).join('\n\n');
    const prompt = buildRAGPrompt(context, question);

    // 使用 simpleChat 统一调用 LLM
    const ragAnswer = await simpleChat(prompt, '你是严谨的知识库问答助手。');

    const payload = {
      mode: 'rag',
      answer: ragAnswer.trim(),
      sources: returnSources ? docs.map((d, i) => ({ index: i + 1, content: d.pageContent, metadata: d.metadata || {} })) : [],
    };
    return res.json(payload);

  } catch (err) {
    console.error('[RAG] RAG 主流程失败:', err?.response?.data || err.message);
    return res.status(500).json({ msg: 'RAG 生成失败', error: err?.response?.data || err.message });
  }
};

// ... 保持运维相关的函数不变 ...

// ============ 运维：向量库状态查询 ============ 
exports.vectorStoreStatus = async (req, res) => {
  try {
    const dir = VECTOR_STORE_PATH;
    const exists = fs.existsSync(dir);
    let files = [];
    let retrieverReady = false;
    let error = null;
    if (exists) {
      try {
        files = fs.readdirSync(dir);
      } catch (e) {
        error = e.message;
      }
    }
    try {
      const retriever = await getRetriever(1);
      if (retriever) retrieverReady = true;
    } catch (e) {
      error = e.message || String(e);
    }
    return res.json({ dir, exists, files, retrieverReady, error });
  } catch (e) {
    return res.status(500).json({ msg: '查询失败', error: e?.message || String(e) });
  }
};

// ============ 运维：重建向量库（开发环境） ============ 
exports.rebuildVectorStore = async (req, res) => {
  try {
    const env = (process.env.NODE_ENV || 'development');
    if (env !== 'development') {
      return res.status(403).json({ msg: '仅开发环境允许重建' });
    }
    const { rebuildAllVectors } = require('../services/vectorStoreService');
    const result = await rebuildAllVectors();
    return res.json({ ok: true, ...result });
  } catch (e) {
    return res.status(500).json({ msg: '重建失败', error: e?.message || String(e) });
  }
};