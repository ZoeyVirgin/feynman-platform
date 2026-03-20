// services/vectorStoreService.js
// 本地向量库（HNSWLib）+ 千帆 Embedding 封装（兼容 v2 环境变量）
const path = require('path');
const fs = require('fs');
const os = require('os');
const axios = require('axios');

function pickVectorDir() {
  // 允许通过环境变量自定义目录，优先使用 ASCII 路径，避免 Windows 下原生库处理非 ASCII 路径出错
  let dir = process.env.VECTOR_STORE_DIR || path.join(__dirname, '../vector_store');
  const hasNonAscii = /[^\x00-\x7F]/.test(dir);
  if (hasNonAscii && !process.env.VECTOR_STORE_DIR) {
    // 回退到临时目录（ASCII 路径）
    dir = path.join(os.tmpdir(), 'feynman_vector_store');
  }
  return dir;
}
const VECTOR_STORE_PATH = pickVectorDir();

// 由于本项目使用 CommonJS，而 langchain 多为 ESM，采用动态导入避免报错
let cached = {
  HNSWLib: null,
  MemoryVectorStore: null,
  BaiduQianfanEmbeddings: null,
  RecursiveCharacterTextSplitter: null,
  embeddings: null,
  textSplitter: null,
  memoryStore: null,
  useMemory: false,
};

// 自定义：千帆 v2 Embeddings 适配器（实现 LangChain Embeddings 接口）
class QianfanV2Embeddings {
  constructor(opts = {}) {
    this.apiKey = opts.apiKey;
    this.endpoint = opts.endpoint || 'https://qianfan.baidubce.com/v2/embeddings';
    this.model = opts.model || 'embedding-v1';
    this.timeout = Number(opts.timeout || 30000);
  }
  async embedDocuments(texts) {
    const batches = Array.isArray(texts) ? texts : [texts];
    const res = await axios.post(
      this.endpoint,
      { input: batches, model: this.model },
      { headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' }, timeout: this.timeout }
    );
    // 期望返回 data: [{ embedding: number[] }, ...]
    const arr = res?.data?.data || res?.data?.results || [];
    return arr.map((item) => item.embedding || item.vector || []);
  }
  async embedQuery(text) {
    const [vec] = await this.embedDocuments([String(text || '')]);
    return vec || [];
  }
}

async function ensureDeps() {
  if (!cached.HNSWLib) cached.HNSWLib = (await import('@langchain/community/vectorstores/hnswlib')).HNSWLib;
  // MemoryVectorStore 延迟在 ensureMemoryStore 中按需导入，避免不同版本子路径不兼容
  if (!cached.BaiduQianfanEmbeddings) cached.BaiduQianfanEmbeddings = (await import('@langchain/baidu-qianfan')).BaiduQianfanEmbeddings;
  if (!cached.RecursiveCharacterTextSplitter) cached.RecursiveCharacterTextSplitter = (await import('@langchain/textsplitters')).RecursiveCharacterTextSplitter;

  if (!cached.embeddings) {
    // 优先使用 v2 环境变量
    const provider = process.env.EMBEDDINGS_PROVIDER || 'qianfan';
    const v2Key = process.env.QIANFAN_V2_API_KEY;
    const v2Endpoint = process.env.QIANFAN_V2_EMBEDDING_ENDPOINT;
    const v2Model = process.env.QIANFAN_V2_MODEL;
    const v2Timeout = process.env.QIANFAN_V2_TIMEOUT_MS;

    if (provider && v2Key && v2Endpoint) {
      cached.embeddings = new QianfanV2Embeddings({
        apiKey: v2Key,
        endpoint: v2Endpoint,
        model: v2Model || 'embedding-v1',
        timeout: v2Timeout || 30000,
      });
    } else {
      // 退回到 langchain 官方适配（需 QIANFAN_API_KEY / QIANFAN_SECRET_KEY）
      const cfg = process.env.QIANFAN_SECRET_KEY
        ? { baiduApiKey: process.env.QIANFAN_API_KEY, baiduApiSecret: process.env.QIANFAN_SECRET_KEY }
        : { baiduApiKey: process.env.QIANFAN_API_KEY };
      cached.embeddings = new cached.BaiduQianfanEmbeddings(cfg);
    }
  }

  if (!cached.textSplitter) {
    cached.textSplitter = new cached.RecursiveCharacterTextSplitter({
      chunkSize: Number(process.env.RAG_CHUNK_SIZE || 500),
      chunkOverlap: Number(process.env.RAG_CHUNK_OVERLAP || 50),
    });
  }

  // 兜底开关（在 HNSW 不可用时主动使用内存向量库）
  const fallbackEnv = String(process.env.RAG_FALLBACK_MEMORY || '').toLowerCase();
  // 强制禁用内存回退，避免因不同版本的 langchain 子路径导致导入失败
  cached.useMemory = false;
  // 如需显式启用内存回退，请将上一行改为根据 fallbackEnv 判断

  return cached;
}

function ensureVectorDir() {
  if (!fs.existsSync(VECTOR_STORE_PATH)) {
    fs.mkdirSync(VECTOR_STORE_PATH, { recursive: true });
  }
}

function getId(obj) {
  return String(obj?.id ?? obj?._id ?? obj?.knowledgePointId ?? 'unknown');
}

async function ensureMemoryStore() {
  throw new Error('MemoryVectorStore 已禁用（为避免子路径导出不兼容导致启动失败）。请使用 HNSWLib 或显式在代码中启用内存回退后再试。');
}

// 向量入库（新增或更新时调用，采用“追加”策略）
async function addKnowledgePointToStore(knowledgePoint) {
  try {
    const { HNSWLib, embeddings, textSplitter } = await ensureDeps();
    const kpId = getId(knowledgePoint);
    console.log(`[RAG] 为知识点 ${kpId} 进行索引...`);

    const content = String(knowledgePoint?.content || '').trim();
    if (!content) {
      console.warn('[RAG] 知识点内容为空，跳过索引');
      return false;
    }

    const docs = await textSplitter.createDocuments([content], [{ knowledgePointId: kpId }]);
    console.log(`[RAG] 文本被切分为 ${docs.length} 个块`);

    // 兜底：内存向量库
    if (cached.useMemory) {
      const mem = await ensureMemoryStore();
      await mem.addDocuments(docs);
      console.log('[RAG] 已向内存向量库追加文档');
      return true;
    }

    ensureVectorDir();

    let vectorStore;
    try {
      vectorStore = await HNSWLib.load(VECTOR_STORE_PATH, embeddings);
      await vectorStore.addDocuments(docs);
      console.log('[RAG] 已向现有向量库追加文档');
    } catch (e) {
      console.log('[RAG] 未发现向量库，创建新的库...');
      vectorStore = await HNSWLib.fromDocuments(docs, embeddings);
    }

    await vectorStore.save(VECTOR_STORE_PATH);
    console.log(`[RAG] 向量库已保存 -> ${VECTOR_STORE_PATH}`);
    return true;
  } catch (err) {
    console.error('[RAG] 添加到向量库失败:', err?.response?.data || err.message);
    return false;
  }
}

async function getRetriever(k = 4) {
  const { HNSWLib, embeddings } = await ensureDeps();

  // 兜底：若指定使用内存库
  if (cached.useMemory) {
    const mem = await ensureMemoryStore();
    return mem.asRetriever(k);
  }

  // 正常：从磁盘加载 HNSW 库
  try {
    const store = await HNSWLib.load(VECTOR_STORE_PATH, embeddings);
    return store.asRetriever(k);
  } catch (e) {
    // HNSW 加载失败：按策略走内存库
    const autoFallback = String(process.env.RAG_AUTO_FALLBACK || 'false').toLowerCase();
    const allowAuto = autoFallback === 'true' || autoFallback === '1' || autoFallback === 'yes';
    if (cached.useMemory || allowAuto) {
      const mem = await ensureMemoryStore();
      return mem.asRetriever(k);
    }
    throw e;
  }
}

async function queryVectorStore(query, k = 4) {
  try {
    const retriever = await getRetriever(k);
    return await retriever.invoke(query);
  } catch (error) {
    if (error?.message?.includes('No such file or directory') || error?.message?.includes('failed to open file')) {
      // 如果 HNSW 读取失败且允许兜底，返回空/或使用内存库
      try {
        if (!cached.useMemory) {
          // 自动降级：仅在未显式关闭时启用
          const autoFallback = String(process.env.RAG_AUTO_FALLBACK || 'true').toLowerCase();
          if (autoFallback === 'true' || autoFallback === '1' || autoFallback === 'yes') {
            cached.useMemory = true;
            const mem = await ensureMemoryStore();
            return await mem.asRetriever(k).invoke(query);
          }
        }
      } catch (_) {}
      return [];
    }
    throw error;
  }
}

async function clearVectorStoreDir() {
  try {
    const dir = VECTOR_STORE_PATH;
    // 重置内存库（如果启用）
    if (cached.memoryStore) {
      try { cached.memoryStore = null; } catch (_) {}
    }
    if (fs.existsSync(dir)) {
      for (const f of fs.readdirSync(dir)) {
        try { fs.unlinkSync(path.join(dir, f)); } catch (_) {}
      }
    } else {
      try { fs.mkdirSync(dir, { recursive: true }); } catch (_) {}
    }
    return true;
  } catch (_) {
    return false;
  }
}

async function rebuildAllVectors() {
  const KnowledgePoint = require('../models/KnowledgePoint');
  await clearVectorStoreDir();
  const kps = await KnowledgePoint.findAll({ attributes: ['id', 'content'] });
  let count = 0;
  for (const kp of kps) {
    if (kp.content && String(kp.content).trim()) {
      await addKnowledgePointToStore(kp);
      count += 1;
    }
  }
  return { rebuilt: count, dir: VECTOR_STORE_PATH };
}

module.exports = { VECTOR_STORE_PATH, addKnowledgePointToStore, getRetriever, queryVectorStore, clearVectorStoreDir, rebuildAllVectors };
